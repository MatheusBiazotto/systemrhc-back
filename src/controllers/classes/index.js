const { Router } = require("express");
const { PrismaClient } = require("@prisma/client");

const Auth = require("../../models/Auth");
const { isTokenValid } = require("../../helpers/token-helper");

const router = Router();
const prisma = new PrismaClient();

router.post("/postClass", async (req, res) => {
  const { nicks, courseId, userId, observation } = req.body;
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

  if (!nicks || !courseId || !userId || !observation) {
    return res.status(400).json({ message: "Dados faltantes" });
  }

  if (typeof nicks !== "object") {
    return res
      .status(400)
      .json({ message: "Nicknames inválidos. Deve ser um array." });
  }

  try {
    const course = await prisma.courses.findFirst({
      where: {
        id: courseId,
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Aula não encontrada." });
    }

    await prisma.classes.create({
      data: {
        courseId: course.id,
        nickname: nicks.toString(),
        createdBy: userId,
        createdAt: new Date().toISOString(),
        observation,
      },
    });

    for (const nick of nicks) {
      await prisma.logs.create({
        data: {
          courseId: course.id,
          type: "AULA - " + course.name,
          createdBy: userId,
          nickname: nick,
          observation,
        },
      });
    }

    return res.status(200).json({ message: "Aula postada com sucesso!" });
  } catch (e) {
    return res.status(500).json({
      message: "Oops! Algo deu errado.",
      error: e.toString(),
    });
  } finally {
    prisma.$disconnect();
  }
});

router.put("/updateClass", async (req, res) => {
  const { classId, courseId, userId, observation, nicks, data } = req.body;
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

  if (!classId || !nicks || !courseId || !userId || !observation || !data) {
    return res.status(400).json({ message: "Dados faltantes" });
  }

  if (typeof nicks !== "object") {
    return res
      .status(400)
      .json({ message: "Nicknames inválidos. Deve ser um array." });
  }

  try {
    const course = await prisma.courses.findFirst({
      where: {
        id: courseId,
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Aula não encontrada." });
    }

    await prisma.classes.update({
      where: {
        id: classId,
      },
      data: {
        courseId: course.id,
        nickname: nicks.toString(),
        createdBy: userId,
        createdAt: new Date(data).toISOString(),
        observation,
      },
    });

    return res.status(200).json({ message: "Aula atualizada com sucesso!" });
  } catch (e) {
    return res.status(500).json({
      message: "Oops! Algo deu errado.",
      error: e.toString(),
    });
  } finally {
    prisma.$disconnect();
  }
});

router.delete("/deleteClass", async (req, res) => {
  const { classId, userId } = req.body;
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

  if (!classId || !userId) {
    return res.status(400).json({ message: "Dados faltantes" });
  }

  try {
    await prisma.$connect();

    await prisma.classes.delete({
      where: {
        id: classId,
        createdBy: userId,
      },
    });

    return res.status(200).json({ message: "Aula deletada com sucesso!" });
  } catch (e) {
    return res.status(500).json({
      message: "Oops! Algo deu errado.",
      error: e.toString(),
    });
  } finally {
    prisma.$disconnect();
  }
});

router.post("/getMyClasses", async (req, res) => {
  const { userId, offset } = req.body;
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
    return res.status(400).json({ message: "ID de usuário é obrigatório." });
  }

  try {
    await prisma.$connect();

    const totalClasses = await prisma.classes.count({
      where: {
        createdBy: userId,
      },
    });

    console.log(offset);

    const classes = await prisma.classes.findMany({
      where: {
        createdBy: userId,
      },
      include: {
        courses: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      skip: offset ? offset : 0,
    });

    return res.status(200).json({ classes, total: totalClasses });
  } catch (e) {
    return res.status(500).json({
      message: "Oops! Algo deu errado.",
      error: e.toString(),
      classes: [],
    });
  } finally {
    prisma.$disconnect();
  }
});

module.exports = router;
