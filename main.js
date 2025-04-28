const express = require("express");
const hataMiddleware = require("./middleware/hataMiddleware");
const wordRouter = require("./routers/wordRouter");
const cors = require("cors");
const userRouter = require("./routers/userRouter");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(wordRouter);
app.use(userRouter);
app.use(hataMiddleware);

app.listen(3000, () => {
  console.log("3000 portu dinleniyor");
});
