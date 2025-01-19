const { Router } = require("express");

const router = Router();

// Middlewares

// Controllers
const AuthController = require("./controllers/auth");
const AboutController = require("./controllers/about");
const PermissionController = require("./controllers/permission");
const HabboController = require("./controllers/habbo");
const HighlightController = require("./controllers/highlights");
const RankingController = require("./controllers/ranking");

router.use("/auth", AuthController);
router.use("/", AboutController);
router.use("/perms", PermissionController);
router.use("/habbo", HabboController);
router.use("/highlights", HighlightController);
router.use("/ranking", RankingController);

module.exports = router;
