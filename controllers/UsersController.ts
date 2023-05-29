import { Request, Response } from "express";
import UserModel, { UserStatus } from "../models/User";
import UserDTO from "../dtos/UserDTO";
import jwt from "jsonwebtoken";
import { config } from "../config";
import fs from "fs";
import { v4 } from "uuid";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import ApiError from "../errors/ApiError";
import { PostStatus } from "../models/Post";

class UsersController {
  async getUsers(req: Request, res: Response) {
    try {
      const { search = "", id = "" } = req.query;
      const user = (req as any).user;
      const users = await UserModel.find({
        email: { $not: new RegExp(user.email) },
        $or: [
          { firstName: new RegExp(String(search).split(" ").join("|"), "i") },
          { lastName: new RegExp(String(search).split(" ").join("|"), "i") },
        ],
        ...(id ? { _id: id } : {}),
        status: { $not: new RegExp(UserStatus.BANNED) },
      })
        .populate("roles")
        .exec();
      const userDTOS = users.map((it) => new UserDTO(it));

      return res.json(userDTOS);
    } catch (e) {
      console.log(e);
      ApiError.internal(res, "Users error");
    }
  }

  async getMe(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return ApiError.unauthorized(res, "Пользователь не авторизован");
      }

      const decodedData = jwt.verify(token, config.secret);

      const user = await UserModel.findOne({ _id: (decodedData as any).id })
        .populate("roles")
        .exec();

      return res.json(new UserDTO(user));
    } catch (e) {
      console.log(e);
      return ApiError.internal(res, "Пользователь не авторизован");
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return ApiError.badRequest(res, "Ошибка при смене пароля", errors);
      }

      const { password, newPassword } = req.body;

      const user = (req as any).user;

      const candidate = await UserModel.findOne({ email: user.email });

      if (!candidate) {
        return ApiError.badRequest(res, "Пользователь не найден");
      }

      if (candidate.status === UserStatus.BANNED) {
        return ApiError.unauthorized(res, "Пользователь заблокирован");
      }

      const validPassword = bcrypt.compareSync(password, candidate.password);

      if (!validPassword) {
        return ApiError.badRequest(res, "Введенны неверные параметры");
      }

      const hashPassword = bcrypt.hashSync(newPassword, 7);

      candidate.password = hashPassword;
      await candidate.save();

      return res.json({ message: "Пароль успешно изменен!" });
    } catch (e) {
      console.log(e);
      return ApiError.internal(res, "Server error");
    }
  }

  async changeInfo(req: Request, res: Response) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return ApiError.badRequest(res, "Ошибка при смене информации", errors);
      }

      const { firstName, lastName } = req.body;

      const user = (req as any).user;

      const candidate = await UserModel.findOne({ email: user.email })
        .populate("roles")
        .exec();

      if (!candidate) {
        return ApiError.badRequest(res, "Пользователь не найден");
      }

      if (candidate.status === UserStatus.BANNED) {
        return ApiError.unauthorized(res, "Пользователь заблокирован");
      }

      candidate.firstName = firstName;
      candidate.lastName = lastName;
      await candidate.save();

      return res.json({
        message: "Информация успешно изменена!",
        user: new UserDTO(candidate),
      });
    } catch (e) {
      console.log(e);
      return ApiError.internal(res, "Server error");
    }
  }

  async uploadAvatar(req: Request, res: Response) {
    const file = (req as any).file;
    const user = (req as any).user;
    if (!file) {
      return ApiError.badRequest(res, "Нет аватара для загрузки");
    }
    const fileName = user.id;
    const fileExtension = file.originalname.split(".").pop();
    const newFileName = `${v4()}.${fileName}.${fileExtension}`;
    const newFilePath = `avatars/${newFileName}`;
    const publicUrl = `http://${req.headers.host}/avatars/${newFileName}`;

    const userFromDB = await UserModel.findOne({ _id: user.id });

    if (userFromDB) {
      if (userFromDB.avatar) {
        fs.unlinkSync(
          userFromDB.avatar?.replace(`http://${req.headers.host}/`, "")
        );
      }
      userFromDB.avatar = publicUrl;
      await userFromDB.save();
    }

    fs.renameSync(file.path, newFilePath);

    return res.status(200).send({ message: "Фото обновлено", url: publicUrl });
  }
}

export default new UsersController();
