const { Router } = require("express");

const router = Router();

router.get("/", async (req, res) => {
  return res.json({
    message: "API do System RHC",
    version: "1.0.0",
    lastUpdated: "2025-01-19",
    contact: "mbiazotto.contato@gmail.com",
  });
});

module.exports = router;
