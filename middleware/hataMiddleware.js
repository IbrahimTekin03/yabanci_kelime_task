const hataYakalayici = (err, req, res, next) => {
  console.log(err);
  res.json({ hataKodu: err.statusCode, mesaj: err.message });
};

module.exports = hataYakalayici;
