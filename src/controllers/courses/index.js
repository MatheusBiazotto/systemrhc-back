const { Router } = require("express");
const { PrismaClient } = require("@prisma/client");

const Auth = require("../../models/Auth");
const { isTokenValid } = require("../../helpers/token-helper");

const router = Router();
const prisma = new PrismaClient();

router.post("/getCourses", async (req, res) => {
  const { userId } = req.body;
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

  if (!userId) {
    return res.status(400).json({ message: "ID do usuário é obrigatório." });
  }

  try {
    await prisma.$connect();

    const permissions = await prisma.user_permissions.findMany({
      where: {
        userId,
      },
      include: {
        permissions: true,
      },
    });

    const permsIds = permissions.map((perm) => perm.permissionId);

    const courses = await prisma.courses.findMany({
      where: {
        permissionId: {
          in: permsIds,
        },
      },
    });

    return res.status(200).json(courses);
  } catch (e) {
    return res.status(500).json({
      message: "Oops! Algo deu errado.",
      error: e.toString(),
      courses: [],
    });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
