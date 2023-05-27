import e, { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import UserModel, { UserStatus } from "../models/User";
import ApiError from "../errors/ApiError";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "OPTIONS") {
    next();
  }

  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return ApiError.unauthorized(res, "Пользователь не авторизован");
    }

    const decodedData: any = jwt.verify(token, config.secret);

    const user = await UserModel.findOne({ _id: decodedData.id }).exec();

    if (!user) {
      return ApiError.unauthorized(res, "Пользователь не авторизован");
    }

    if (user.status === UserStatus.BANNED) {
      return ApiError.unauthorized(res, "Пользователь заблокирован");
    }

    (req as any).user = decodedData;

    next();
  } catch (e) {
    console.log(e);
    return ApiError.unauthorized(res, "Пользователь не авторизован");
  }
};

export { authMiddleware };
