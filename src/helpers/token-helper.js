const jose = require("jose");

const { AUTH_SECRET } = require("../constants");

async function isTokenValid(token) {
  try {
    const response = await jose.jwtVerify(token, AUTH_SECRET);

    const isExpired = response.payload.exp * 1000 < Date.now();

    return !isExpired;
  } catch (error) {
    console.log("Erro ao verificar o token:", error);
    return false;
  }
}

module.exports = { isTokenValid };
