import { Router } from "express";
import AuthController from "../controllers/AuthController";
import { required } from "../middleware/ValdiationMiddlewares";

const router = Router();

router.post(
  "/registration",
  [
    required("email").isEmail(),
    required("firstName"),
    required("lastName"),
    required("password").isLength({ min: 4, max: 30 }),
  ],
  AuthController.registration
);
router.post(
  "/login",
  [required("email"), required("password")],
  AuthController.login
);
router.post("/refresh", AuthController.refreshToken);

export default router;
