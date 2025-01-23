const { Router } = require("express");
const { PrismaClient } = require("@prisma/client");
const Auth = require("../../models/Auth");
const { isTokenValid } = require("../../helpers/token-helper");

const router = Router();
const prisma = new PrismaClient();

router.get("/getPositions", async (req, res) => {
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

    const positions = await prisma.positions.findMany({
      orderBy: {
        weight: "desc",
      },
    });

    return res.status(200).json(positions);
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Erro interno", error: e.toString(), positions: [] });
  } finally {
    prisma.$disconnect();
  }
});

router.post("/hire", async (req, res) => {
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

  const { nickname, positionId, userId, motivo } = req.body;

  if (!nickname || !positionId || !userId || !motivo) {
    return res.status(400).json({ message: "Dados inválidos." });
  }

  try {
    await prisma.$connect();

    const position = await prisma.positions.findUnique({
      where: {
        id: positionId,
      },
    });

    if (!position) {
      return res.status(404).json({ message: "Cargo não encontrado." });
    }

    const user = await prisma.users.findFirst({
      where: {
        nickname,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Nickname de funcionário não encontrado ou não cadastrado.",
      });
    }

    await prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        positionId: position.id,
      },
    });

    return res.status(200).json({
      message: `Funcionário contratado para ${position.name} com sucesso.`,
    });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Oops! Algo deu errado.", error: e.toString() });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
