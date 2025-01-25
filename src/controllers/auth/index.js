const { Router } = require("express");

const jose = require("jose");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { SALT_ROUNDS } = require("../../constants");
const { AUTH_SECRET } = require("../../constants");

const Auth = require("../../models/Auth");

const router = Router();
const prisma = new PrismaClient();

router.post("/login", async (req, res) => {
  const { nickname, password } = req.body;

  if (!nickname || !password) {
    return res
      .status(400)
      .json({ message: "Nickname e senha são obrigatórios" });
  }

  try {
    await prisma.$connect();

    const user = await prisma.users.findFirst({
      where: {
        nickname,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Senha inválida" });
    }

    if (!user.active) {
      return res.status(401).json({
        message:
          "Esse usuário está desativado. Entre em contato com a fundação.",
        active: false,
      });
    }

    const token = await new jose.SignJWT({
      _id: user.id,
      email: user.email,
      nickname: user.nickname,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(AUTH_SECRET);

    const oneDay = 3600 * 1000 * 24;
    const expiresAt = new Date(Date.now() + oneDay);

    return res.status(200).json({
      message: "Usuário autenticado!",
      token,
      expiresAt,
      nickname: user.nickname,
    });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Oops! Algo deu errado.", error: e.toString() });
  } finally {
    await prisma.$disconnect();
  }
});

router.post("/register", async (req, res) => {
  const { nickname, email, password } = req.body;

  if (!nickname || !email || !password) {
    return res
      .status(400)
      .json({ message: "Nickname, email e senha são obrigatórios" });
  }

  try {
    await prisma.$connect();

    const user = await prisma.users.findFirst({
      where: {
        OR: [
          {
            nickname: {
              equals: nickname,
            },
          },
          {
            email: {
              equals: email,
            },
          },
        ],
      },
    });

    if (user) {
      return res
        .status(400)
        .json({ message: "Nickname e/ou email já cadastrados" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const position = await prisma.positions.findFirst({
      orderBy: {
        weight: "asc",
      },
    });

    await prisma.users.create({
      data: {
        nickname,
        email,
        password: hashedPassword,
        active: false,
        positionId: position.id,
        points: 0,
        createdAt: new Date().toISOString(),
      },
    });

    await prisma.logs.create({
      data: {
        type: "CADASTRO",
        createdBy: nickname,
        nickname,
        createdAt: new Date().toISOString(),
        observation:
          "Esse foi o dia em que você se cadastrou no system! Seja bem-vindo! :)",
      },
    });

    return res
      .status(201)
      .json({ message: "Sua conta foi criada com sucesso!" });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Oops! Algo deu errado.", error: e.toString() });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
