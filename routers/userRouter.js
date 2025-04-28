const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const createError = require("http-errors");
const bcrypt = require("bcrypt");
const authMiddleware = require("../middleware/authMiddleware");
const passwordMiddleware = require("../middleware/passwordMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const db = require("../db/dbConnection");


router.get(
  "/getAllUsers",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res, next) => {
    try {
      const tumUserlar = await User.findAll();
      const usersWithoutPassword = tumUserlar.map((user) => {
        const userObject = user.toJSON();
        delete userObject.sifre;
        return userObject;
      });
      res.json(usersWithoutPassword);
    } catch (error) {
      next(createError(400, error));
    }
  }
);


router.get(
  "/getUser/:id",
  authMiddleware,
  roleMiddleware(["admin", "user"]),
  async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        throw createError(404, "Kullanıcı bulunamadı");
      }
      const userObject = user.toJSON();
      delete userObject.sifre;
      res.json(userObject);
    } catch (error) {
      next(createError(400, error));
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    const sonuc = await User.destroy({ where: { id: req.params.id } });
    if (sonuc) {
      res.json({
        mesaj: "id'si : " + req.params.id + " olan kullanıcı silindi",
      });
    } else {
      throw createError(404, "silinecek kullanıcı bulunamadı");
    }
  } catch (error) {
    next(createError(400, error));
  }
});

router.patch("/:id", async (req, res, next) => {
  if (req.body.hasOwnProperty("sifre")) {
    req.body.sifre = await bcrypt.hash(req.body.sifre, 10);
  }

  const { error, value } = User.joiValidationForUpdate(req.body);
  if (error) {
    return next(createError(400, error));
  } else {
    try {
      const sonuc = await User.update(req.body, {
        where: { id: req.params.id },
        returning: true,
        plain: true,
      });
      if (sonuc) {
        const updatedUser = sonuc[1].toJSON();
        delete updatedUser.sifre;
        return res.json(updatedUser);
      } else {
        return res
          .status(404)
          .json({ mesaj: "güncellenecek kullanıcı bulunamadı" });
      }
    } catch (error) {
      next(createError(400, error));
    }
  }
});

router.post("/register", async (req, res, next) => {
  try {

    const existingUserName = await User.findOne({
      where: { userName: req.body.userName },
    });
    if (existingUserName) {
      throw createError(400, "Bu kullanıcı adı zaten kullanılıyor.");
    }

    const existingEmail = await User.findOne({
      where: { email: req.body.email },
    });
    if (existingEmail) {
      throw createError(400, "Bu email zaten kullanılıyor.");
    }


    const hashedPassword = await bcrypt.hash(req.body.sifre, 10);
    const eklenecekUser = await User.create({
      isim: req.body.isim,
      userName: req.body.userName,
      email: req.body.email,
      sifre: hashedPassword,
      isActive: true,
      email_active: true,
    });


    const userRole = await Role.findOne({ where: { name: "user" } });
    if (!userRole) {
      throw createError(400, "User rolü bulunamadı.");
    }
    await eklenecekUser.addRole(userRole);


    const token = await eklenecekUser.generateToken();


    const userObject = eklenecekUser.toJSON();
    delete userObject.sifre;
    delete userObject.createdAt;
    delete userObject.updatedAt;


    res.status(201).json({ user: userObject, token });
  } catch (error) {
    next(error);
    console.log("user kaydederken hata: " + error);
  }
});

router.post("/login", passwordMiddleware, async (req, res, next) => {
  try {
    const token = await req.user.generateToken();
    const userObject = req.user.toJSON();
    delete userObject.sifre;
    delete userObject.createdAt;
    delete userObject.updatedAt;


    const roles = await req.user.getRoles();
    const roleNames = roles.map((role) => role.name);

    res.status(200).json({
      user: { userName: userObject.userName, role: roleNames },
      token,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/addAdmin", async (req, res, next) => {
  try {
    // Admin rolünü alın
    const adminRole = await Role.findOne({ where: { name: "admin" } });
    if (!adminRole) {
      throw createError(400, "Admin rolü bulunamadı.");
    }

    // Yeni kullanıcı oluştur
    const hashedPassword = await bcrypt.hash(req.body.sifre, 10);
    const adminUser = await User.create({
      isim: req.body.isim,
      userName: req.body.userName,
      email: req.body.email,
      sifre: hashedPassword,
      isActive: true,
      email_active: true,
    });


    await adminUser.addRole(adminRole);

    const adminUserWithRoles = await User.findByPk(adminUser.id, {
      include: { model: Role, through: { attributes: [] } },
    });


    const token = await adminUserWithRoles.generateToken();
    console.log("Admin için oluşturulan token:", token);

    res
      .status(201)
      .json({ mesaj: "Admin kullanıcı başarıyla eklendi.", token });
  } catch (error) {
    next(error);
  }
});

router.post("/add-word", authMiddleware, async (req, res, next) => {
  try {
    const { englishWord, turkishWord, puan, zorluk } = req.body;

    if (!englishWord || !turkishWord || !puan || !zorluk) {
      return res.status(400).json({ mesaj: "Tüm alanlar doldurulmalıdır" });
    }


    await db.query(
      `INSERT INTO ingilizce_kelimeler (ingilizce, türkçe, puan, zorluk) VALUES (?, ?, ?, ?)`,
      {
        replacements: [englishWord, turkishWord, puan, zorluk],
        type: db.QueryTypes.INSERT,
      }
    );

    res.status(201).json({ mesaj: "Kelime başarıyla eklendi" });
  } catch (error) {
    console.error("Hata oluştu:", error);
    next(error);
  }
});

router.get("/verify-admin", authMiddleware, async (req, res, next) => {
  try {
    const roles = await req.user.getRoles();
    const isAdmin = roles.some((role) => role.name === "admin");

    if (!isAdmin) {
      return res.status(403).json({ mesaj: "Yetkisiz erişim" });
    }

    res.status(200).json({ mesaj: "Admin doğrulandı" });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", authMiddleware, async (req, res, next) => {
  try {

    req.user.token = null;
    await req.user.save();

    res.status(200).json({ mesaj: "Başarıyla çıkış yapıldı" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
