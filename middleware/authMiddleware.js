const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const createError = require("http-errors");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ mesaj: "Authorization başlığı eksik" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded; // Kullanıcı bilgilerini req.user'a ekle
    next();
  } catch (error) {
    res.status(401).json({ mesaj: "Yetkilendirme hatası" });
  }
};

module.exports = auth;
