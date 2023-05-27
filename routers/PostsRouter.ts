import { Router } from "express";
import PostsController from "../controllers/PostsController";
import { authMiddleware } from "../middleware/AuthMiddleware";
import bodyParser from "body-parser";
import multer from "multer";
import { requiredOr } from "../middleware/ValdiationMiddlewares";

const router = Router();

const upload = multer({ dest: "attachedData/" });

router.post(
  "/create",
  upload.single("attached"),
  bodyParser.urlencoded({ extended: true }),
  authMiddleware,
  [requiredOr(["text", "attached"])],
  PostsController.createPost
);
router.get("/", authMiddleware, PostsController.getPosts);

export default router;
