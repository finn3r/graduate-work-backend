import { Request, Response } from "express";
import UserModel, { UserStatus } from "../models/User";
import RoleModel from "../models/Role";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import TokenService from "../services/TokenService";
import UserDTO from "../dtos/UserDTO";
import jwt, { Jwt } from "jsonwebtoken";
import { config } from "../config";
import ApiError from "../errors/ApiError";

class AuthController {
  async registration(req: Request, res: Response) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return ApiError.badRequest(res, "Ошибка при регистрации", errors);
      }

      const { email, password, firstName, lastName } = req.body;
      const candidate = await UserModel.findOne({ email: email.toLowerCase() });

      if (candidate) {
        return ApiError.badRequest(
          res,
          "Пользователь с таким именем уже существует"
        );
      }

      const hashPassword = bcrypt.hashSync(password, 7);

      const userRole = await RoleModel.findOne({ value: "USER" });

      const user = await UserModel.create({
        email: email.toLowerCase(),
        firstName,
        lastName,
        password: hashPassword,
        roles: [userRole?._id],
      });

      await user.save();

      const userDTO = new UserDTO({ ...user.toObject(), roles: [userRole] });

      const tokens = TokenService.generateTokens({ ...userDTO });

      res.json(tokens);
    } catch (e) {
      console.log(e);
      ApiError.internal(res, "Registration error");
    }
  }

  async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return ApiError.badRequest(res, "Ошибка при авторизации", errors);
      }

      const { email, password } = req.body;

      const candidate = await UserModel.findOne({ email: email.toLowerCase() })
        .populate("roles")
        .exec();

      if (!candidate) {
        return ApiError.badRequest(res, "Введенны неверные параметры");
      }

      if (candidate.status === UserStatus.BANNED) {
        return ApiError.unauthorized(res, "Пользователь заблокирован");
      }

      const validPassword = bcrypt.compareSync(password, candidate.password);

      if (!validPassword) {
        return ApiError.badRequest(res, "Введенны неверные параметры");
      }

      const userDTO = new UserDTO(candidate);

      const tokens = TokenService.generateTokens({ ...userDTO });

      res.json(tokens);
    } catch (e) {
      console.log(e);
      ApiError.internal(res, "Login error");
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ApiError.unauthorized(res, "Пользователь не авторизован");
      }

      const decodedData = jwt.verify(refreshToken, config.refreshSecret);

      if (typeof decodedData !== "string") {
        const { iat, exp, ...data } = decodedData;
        const newTokens = TokenService.generateTokens(data);

        return res.json(newTokens);
      }
    } catch (e) {
      console.log(e);
      return ApiError.unauthorized(res, "Пользователь не авторизован");
    }
  }
}

export default new AuthController();
