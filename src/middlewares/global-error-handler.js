async function globalErrorHandler(req, res, next) {
  try {
    await next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Oops! Algo deu errado." });
  }
}

module.exports = globalErrorHandler;
