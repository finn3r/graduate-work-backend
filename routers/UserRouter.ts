import { Router } from "express";
import UsersController from "../controllers/UsersController";
import { authMiddleware } from "../middleware/AuthMiddleware";
import multer from "multer";
import { body } from "express-validator";
import { required } from "../middleware/ValdiationMiddlewares";

const upload = multer({ dest: "avatars/" });

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
  upload.single("photo"),
  authMiddleware,
  UsersController.uploadAvatar
);
router.post(
  "/modelAvatar",
  upload.single("model"),
  authMiddleware,
  UsersController.uploadAvatar
);

export default router;
