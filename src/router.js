const { Router } = require("express");

const router = Router();

// Middlewares

// Controllers
const AuthController = require("./controllers/auth");
const AboutController = require("./controllers/about");
const PermissionController = require("./controllers/permission");

router.use("/auth", AuthController);
router.use("/", AboutController);
router.use("/perms", PermissionController);

module.exports = router;
