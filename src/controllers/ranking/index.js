const { Router } = require("express");

const { PrismaClient } = require("@prisma/client");
const Auth = require("../../models/Auth");
const { isTokenValid } = require("../../helpers/token-helper");

const router = Router();
const prisma = new PrismaClient();

router.get("/getRanking", async (req, res) => {
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

  try {
    await prisma.$connect();

    const ranking = await prisma.users.findMany({
      orderBy: {
        points: "desc",
      },
      select: {
        id: true,
        nickname: true,
        points: true,
        positions: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 10,
    });

    return res.status(200).json(ranking);
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Erro interno", error: e.toString(), ranking: [] });
  } finally {
    prisma.$disconnect();
  }
});

module.exports = router;
