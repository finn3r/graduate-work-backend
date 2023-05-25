import { Router } from "express";
import { body } from "express-validator";
import AdminController from "../controllers/AdminController";
import { authMiddleware } from "../middleware/AuthMiddleware";
import { roleMiddleware } from "../middleware/RoleMiddleware";
import { required } from "../middleware/ValdiationMiddlewares";

const router = Router();

router.post(
  "/login",
  [required("email"), required("password")],
  AdminController.login
);
router.get(
  "/roles",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  AdminController.getRoles
);
router.get(
  "/posts",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  AdminController.getPosts
);
router.post(
  "/users/create",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  [
    required("email").isEmail(),
    required("password").isLength({ min: 4, max: 30 }),
    required("firstName"),
    required("lastName"),
  ],
  AdminController.createUser
);
router.get(
  "/users",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  AdminController.getUsers
);
router.post(
  "/roles/create",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  [required("value")],
  AdminController.createRole
);
router.delete(
  "/roles/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  AdminController.deleteRole
);
router.put(
  "/roles/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  [required("value")],
  AdminController.updateRole
);
router.post(
  "/users/ban/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  AdminController.banUser
);
router.post(
  "/users/unban/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  AdminController.unbanUser
);
router.post(
  "/posts/ban/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  AdminController.banPost
);
router.post(
  "/posts/unban/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  AdminController.unbanPost
);

export default router;
