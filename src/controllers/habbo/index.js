const { Router } = require("express");

const axios = require("axios");
const router = Router();
const Auth = require("../../models/Auth");
const { isTokenValid } = require("../../helpers/token-helper");

router.post("/getAvatars", async (req, res) => {
  const { nicks } = req.body;
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

  if (!nicks) {
    return res.status(400).json({ message: "Nicknames faltantes" });
  }

  const avatarsList = [];

  for (const nick of nicks) {
    const avatars = await axios.get(
      `https://habbo.com.br/api/public/users?name=${nick}`
    );
    const data = {
      nickname: avatars.data.name,
      avatar: avatars.data.figureString,
    };

    avatarsList.push(data);
  }

  return res.status(200).json(avatarsList);
});

module.exports = router;
