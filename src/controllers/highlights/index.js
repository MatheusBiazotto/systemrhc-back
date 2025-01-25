const { Router } = require("express");
const { PrismaClient } = require("@prisma/client");
const Auth = require("../../models/Auth");
const { isTokenValid } = require("../../helpers/token-helper");

const router = Router();
const prisma = new PrismaClient();

router.post("/getHighlights", async (req, res) => {
  const { startsAt, endsAt } = req.body;
  const auth = new Auth();
  const tokenValue = await auth.getAccessTokenFromHeaders(req.headers);
  const signatureValidation = await auth.verifyToken(tokenValue);

  if (!tokenValue || !signatureValidation.ok) {
    return res
      .status(401)
      .json({ message: "Token não encontrado ou inválido." });
  }

  const sessionValidation = await isTokenValid(tokenValue);
  if (!sessionValidation) {
    return res.status(401).json({ message: "Token inválido e/ou expirado." });
  }

  if (!startsAt) {
    return res.status(400).json({ message: "Data de início é obrigatória" });
  }

  try {
    await prisma.$connect();

    const highlights = await prisma.weekly_highlights.findMany({
      where: {
        startsAt: {
          lte: startsAt,
        },
      },
      include: {
        users: true,
      },
    });

    return res.status(200).json(highlights);
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Erro interno", error: e.toString(), highlights: [] });
  } finally {
    prisma.$disconnect();
  }
});

module.exports = router;
