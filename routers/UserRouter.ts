import { Router } from "express";
import UsersController from "../controllers/UsersController";
import { authMiddleware } from "../middleware/AuthMiddleware";
import multer from "multer";
import { required } from "../middleware/ValdiationMiddlewares";

const uploadAvatar = multer({ dest: "avatars/" });
const uploadModelAvatar = multer({ dest: "modelAvatars/" });

const router = Router();

router.get("/", authMiddleware, UsersController.getUsers);
router.get("/me", authMiddleware, UsersController.getMe);
router.post(
  "/change/password",
  authMiddleware,
  [required("password"), required("newPassword").isLength({ min: 4, max: 30 })],
  UsersController.changePassword
);
router.post(
  "/change/info",
  authMiddleware,
  [required("firstName"), required("lastName")],
  UsersController.changeInfo
);
router.post(
  "/avatar",
  uploadAvatar.single("photo"),
  authMiddleware,
  UsersController.uploadAvatar
);
router.post(
  "/modelAvatar",
  uploadModelAvatar.single("model"),
  authMiddleware,
  UsersController.uploadModelAvatar
);

export default router;
