const express = require("express");
const router = express.Router();
const db = require("../db/dbConnection");
const authMiddleware = require("../middleware/authMiddleware");


router.get("/random-word", authMiddleware, async (req, res, next) => {
  try {
    const random = Math.random();
    let difficulty;

    if (random < 0.6) difficulty = 1; 
    else if (random < 0.9) difficulty = 2;
    else difficulty = 3;

    const [word] = await db.query(
      `SELECT * FROM ingilizce_kelimeler WHERE zorluk = ? ORDER BY RAND() LIMIT 1`,
      { replacements: [difficulty], type: db.QueryTypes.SELECT }
    );

    if (!word) {
      return res.status(404).json({ mesaj: "Kelime bulunamadı" });
    }

    res.json({ id: word.id, english_word: word.ingilizce });
  } catch (error) {
    console.error("Hata oluştu:", error);
    next(error);
  }
});

router.post("/check-answer", authMiddleware, async (req, res, next) => {
  try {
    const { wordId, answer } = req.body;

    if (!wordId) {
      return res.status(400).json({ mesaj: "Kelime ID'si eksik" });
    }

    console.log("Gönderilen wordId:", wordId);
    console.log("Gönderilen answer:", answer);

    const [word] = await db.query(
      `SELECT * FROM ingilizce_kelimeler WHERE id = ?`,
      { replacements: [wordId], type: db.QueryTypes.SELECT }
    );

    if (!word) {
      return res.status(404).json({ mesaj: "Kelime bulunamadı" });
    }

    console.log("Veritabanından alınan kelime:", word);


    if (word.türkçe.trim().toLowerCase() === answer.trim().toLowerCase()) {

      const [existingRecord] = await db.query(
        `SELECT * FROM kullanici_kelime_puanlari WHERE kullanici_id = ? AND kelime_id = ?`,
        { replacements: [req.user._id, wordId], type: db.QueryTypes.SELECT }
      );

      if (existingRecord) {
 
        await db.query(
          `UPDATE kullanici_kelime_puanlari SET puan = puan + 5 WHERE id = ?`,
          { replacements: [existingRecord.id], type: db.QueryTypes.UPDATE }
        );
      } else {

        const kelimePuan = word.puan || 0;


        await db.query(
          `INSERT INTO kullanici_kelime_puanlari (kullanici_id, kelime_id, puan) VALUES (?, ?, ?)`,
          {
            replacements: [req.user._id, wordId, kelimePuan + 5],
            type: db.QueryTypes.INSERT,
          }
        );
      }
    } else {

      const [existingRecord] = await db.query(
        `SELECT * FROM kullanici_kelime_puanlari WHERE kullanici_id = ? AND kelime_id = ?`,
        { replacements: [req.user._id, wordId], type: db.QueryTypes.SELECT }
      );

      if (existingRecord) {

        await db.query(
          `UPDATE kullanici_kelime_puanlari SET puan = puan - 5 WHERE id = ?`,
          { replacements: [existingRecord.id], type: db.QueryTypes.UPDATE }
        );
      } else {

        const kelimePuan = word.puan || 0;


        await db.query(
          `INSERT INTO kullanici_kelime_puanlari (kullanici_id, kelime_id, puan) VALUES (?, ?, ?)`,
          {
            replacements: [req.user._id, wordId, kelimePuan - 5],
            type: db.QueryTypes.INSERT,
          }
        );
      }
    }


    const [totalScore] = await db.query(
      `SELECT SUM(puan) AS toplamPuan FROM kullanici_kelime_puanlari WHERE kullanici_id = ?`,
      { replacements: [req.user._id], type: db.QueryTypes.SELECT }
    );

    return res.json({
      dogru: word.türkçe.trim().toLowerCase() === answer.trim().toLowerCase(),
      yeniPuan: totalScore.toplamPuan,
    });
  } catch (error) {
    console.error("Hata oluştu:", error);
    next(error);
  }
});

module.exports = router;
