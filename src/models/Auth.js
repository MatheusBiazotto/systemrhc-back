const jose = require("jose");
const { AUTH_SECRET } = require("../constants");

class Auth {
  getAccessTokenFromHeaders(headers) {
    const auth = headers["authorization"];

    if (!auth || !auth.startsWith("Bearer ")) return null;

    const parts = auth.split(" ");

    if (parts.length !== 2) return null;

    return parts[1];
  }

  async verifyToken(token) {
    const verifyResponse = await jose
      .jwtVerify(token, AUTH_SECRET)
      .then((result) => {
        return {
          ok: true,
          message: "Token verificado com sucesso",
          payload: result.payload,
        };
      })
      .catch((error) => {
        return {
          ok: false,
          message: "Token inválido",
        };
      });

    return verifyResponse;
  }
}

module.exports = Auth;
