import { Request, Response } from "express";
import PostModel, { PostStatus } from "../models/Post";
import PostDTO from "../dtos/PostDTO";
import fs from "fs";
import { v4 } from "uuid";
import { validationResult } from "express-validator";
import ApiError from "../errors/ApiError";
import UserModel, { UserStatus } from "../models/User";

class PostsController {
  async getPosts(req: Request, res: Response) {
    try {
      let posts;
      const { user_id = "" } = req.query;
      const user = (req as any).user;
      if (user_id) {
        posts = await PostModel.find({
          user: user_id,
          ...(user.id === user_id ? {} : { status: PostStatus.ACTIVE }),
        })
          .populate([
            {
              path: "user",
              populate: {
                path: "roles",
              },
            },
          ])
          .sort({ createdAt: "desc" })
          .exec();
      } else {
        const users = await UserModel.find(
          {
            $and: [{ email: { $not: new RegExp(user.email) } }],
            status: { $not: new RegExp(UserStatus.BANNED) },
          },
          "_id"
        ).exec();
        posts = await PostModel.find({
          user: { $in: users },
          status: PostStatus.ACTIVE,
        })
          .populate([
            {
              path: "user",
              populate: {
                path: "roles",
              },
            },
          ])
          .sort({ createdAt: "desc" })
          .exec();
      }
      const postsDTOS = posts.map((it) => new PostDTO(it));

      return res.json(postsDTOS);
    } catch (e) {
      console.log(e);
      return ApiError.internal(res, "Server error");
    }
  }

  async createPost(req: Request, res: Response) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return ApiError.badRequest(res, "Ошибка при создании", errors);
    }

    const file = (req as any).file;

    try {
      const { text } = req.body;
      let newFilePath: string;
      let attached: string | undefined;
      const user = (req as any).user;

      if (file) {
        const fileName = user.id;
        const fileExtension = file.originalname.split(".").pop();
        const newFileName = `${v4()}.${fileName}.${fileExtension}`;
        newFilePath = `attachedData/${newFileName}`;
        attached = `http://${req.headers.host}/attachedData/${newFileName}`;
        fs.renameSync(file.path, newFilePath);
      }

      const post = new PostModel({
        text,
        attached,
        user: user.id,
      });
      await post.save();

      return res.json({ message: "Пост успешно опубликован" });
    } catch (err) {
      console.error(err);
      fs.unlinkSync(file.path);
      ApiError.internal(res, "Failed to publish the post");
    }
  }

  async deletePost(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const post = await PostModel.findOne({ _id: id, user: user.id });

      if (!post) {
        return ApiError.badRequest(res, "Пост не найден");
      }

      await post.remove();

      return res.json({ message: "Пост успешно удален" });
    } catch (e) {
      console.log(e);
      return ApiError.internal(res, "Server error");
    }
  }

  async editPost(req: Request, res: Response) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Ошибка при создании", errors });
    }

    try {
      const { text } = req.body;

      const { id } = req.params;

      const user = (req as any).user;

      const post = await PostModel.findOne({
        _id: id,
        user: user.id,
        status: PostStatus.ACTIVE,
      })
        .populate([
          {
            path: "user",
            populate: {
              path: "roles",
            },
          },
        ])
        .exec();

      if (!post) {
        return ApiError.badRequest(res, "Пост не найден");
      }

      post.text = text || post.text;

      await post.save();

      return res.json(new PostDTO(post));
    } catch (err) {
      console.error(err);
      ApiError.internal(res, "Server error");
    }
  }
}

export default new PostsController();
