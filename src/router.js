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
const PositionsController = require("./controllers/positions");
const CoursesController = require("./controllers/courses");
const ClassesController = require("./controllers/classes");

router.use("/auth", AuthController);
router.use("/", AboutController);
router.use("/perms", PermissionController);
router.use("/habbo", HabboController);
router.use("/highlights", HighlightController);
router.use("/ranking", RankingController);
router.use("/positions", PositionsController);
router.use("/courses", CoursesController);
router.use("/classes", ClassesController);

module.exports = router;
