const bcrypt = require("bcrypt");
const createError = require("http-errors");
const User = require("../models/userModel");

const passwordMiddleware = async (req, res, next) => {
  const { email, sifre } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw createError(400, "Girilen email / şifre hatalı");
    }
    if (user.isActive === false) {
      throw createError(400, "Hesabınız aktif değil.");
    }
    if (user.email_active === false) {
      throw createError(400, "E-posta doğrulaması yapılmamış.");
    }

    const sifreKontrol = await bcrypt.compare(sifre, user.sifre);
    if (!sifreKontrol) {
      throw createError(400, "Girilen email / şifre hatalı");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = passwordMiddleware;