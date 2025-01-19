const { Router } = require("express");

const { PrismaClient } = require("@prisma/client");
const Auth = require("../../models/Auth");
const { isTokenValid } = require("../../helpers/token-helper");

const router = Router();
const prisma = new PrismaClient();

router.post("/getPermissions", async (req, res) => {
  const auth = new Auth();
  const { userId } = req.body;
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
    return res.status(400).json({ message: "ID de usuário é obrigatório." });
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
    const departsIds = permissions.map((perm) => perm.permissions.idDepart);

    const permissionsList = [];

    const departs = await prisma.departments.findMany({
      where: {
        id: {
          in: departsIds,
        },
      },
    });

    departs.forEach((depart) => {
      permissionsList.push({
        id: depart.id,
        name: depart.name,
        link: depart.link,
        icon: depart.icon,
        permissions: permissions
          .filter((perm) => perm.permissions.idDepart === depart.id)
          .map((perm) => perm.permissions.name),
      });
    });

    return res.status(200).json(permissionsList);
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Oops! Algo deu errrado.", error: e.toString() });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
