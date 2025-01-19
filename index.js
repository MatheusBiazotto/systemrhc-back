const express = require("express");

const app = express();

const router = require("./src/router");
const globalErrorHandler = require("./src/middlewares/global-error-handler");

app.use((req, res, next) => {
  res.set("Cache-Control", "public, max-age=300, s-maxage=600");
  next();
});

app.use(express.json());
app.use("/api", router);
app.use(globalErrorHandler);

app.listen(process.env.PORT, async () => {
  console.log(`API executando em http://localhost:${process.env.PORT}/api`);
});

module.exports = app;
