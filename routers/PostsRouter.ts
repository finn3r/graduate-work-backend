import { Router } from "express";
import PostsController from "../controllers/PostsController";
import { authMiddleware } from "../middleware/AuthMiddleware";
import bodyParser from "body-parser";
import multer from "multer";

const router = Router();

const upload = multer({ dest: "attachedData/" });

router.post(
  "/create",
  upload.single("attached"),
  bodyParser.urlencoded({ extended: true }),
  authMiddleware,
  PostsController.createPost
);
router.get("/", authMiddleware, PostsController.getPosts);
router.put("/:id", authMiddleware, PostsController.editPost);
router.delete("/:id", authMiddleware, PostsController.deletePost);

export default router;
