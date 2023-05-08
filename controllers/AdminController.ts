import { Request, Response } from "express";
import RoleModel from "../models/Role";
import RoleDTO from "../dtos/RoleDTO";
import { validationResult } from "express-validator";
import UserModel, { UserStatus } from "../models/User";
import TagModel from "../models/Tag";
import PostModel, { PostStatus } from "../models/Post";
import bcrypt from "bcryptjs";
import UserDTO from "../dtos/UserDTO";
import TokenService from "../services/TokenService";
import TagDTO from "../dtos/TagDTO";
import PostDTO from "../dtos/PostDTO";

class AdminController {
  async getRoles(req: Request, res: Response) {
    try {
      const roles = await RoleModel.find();
      const canDeleteEdits: boolean[] = [];
      for (let i = 0; i < roles.length; i++) {
        const user = await UserModel.findOne({ roles: { $in: roles[i].id } });
        canDeleteEdits.push(!user);
      }
      const roleDTOS = roles.map((it, i) => {
        return new RoleDTO({
          ...it.toObject(),
          canDeleteEdit: canDeleteEdits[i],
        });
      });

      return res.json(roleDTOS);
    } catch (e) {
      console.log(e);
      return res.status(403).json({ message: "Нету доступа" });
    }
  }

  async createTag(req: Request, res: Response) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Ошибка при создании", errors });
      }

      const { value } = req.body;
      const candidate = await TagModel.findOne({ value });

      if (candidate) {
        return res
          .status(400)
          .json({ message: "Тег с таким именем уже существует" });
      }

      const tag = new TagModel({ value });
      await tag.save();

      return res.status(200).json(new TagDTO(tag));
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Create error" });
    }
  }

  async createRole(req: Request, res: Response) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Ошибка при создании", errors });
      }

      const { value } = req.body;
      const candidate = await RoleModel.findOne({ value });

      if (candidate) {
        return res
          .status(400)
          .json({ message: "Роль с таким именем уже существует" });
      }

      const role = new RoleModel({ value });
      await role.save();

      return res.status(200).json(new RoleDTO(role));
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Create error" });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Ошибка при авторизации", errors });
      }

      const { email, password } = req.body;

      const candidate = await UserModel.findOne({ email: email.toLowerCase() })
        .populate<{ roles: RoleDTO[] }>("roles")
        .exec();

      if (!candidate) {
        return res.status(400).json({ message: "Введенны неверные параметры" });
      }

      if (candidate.status === UserStatus.BANNED) {
        return res.status(401).json({ message: "Пользователь заблокирован" });
      }

      const validPassword = bcrypt.compareSync(password, candidate.password);

      if (!validPassword) {
        return res.status(400).json({ message: "Введенны неверные параметры" });
      }

      if (!candidate.roles.map((it) => it.value).includes("ADMIN")) {
        return res.status(400).json({ message: "Введенны неверные параметры" });
      }

      const userDTO = new UserDTO(candidate);

      const tokens = TokenService.generateTokens({ ...userDTO });

      res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Login error" });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Ошибка при создании", errors });
      }

      const { email, password, firstName, lastName, phone, roles } = req.body;

      const candidate = await UserModel.findOne({ email: email.toLowerCase() });
      const userRole = await RoleModel.findOne({ value: "USER" });

      if (candidate) {
        return res
          .status(400)
          .json({ message: "Пользователь с таким именем уже существует" });
      }

      const hashPassword = bcrypt.hashSync(password, 7);

      const user = new UserModel({
        email: email.toLowerCase(),
        password: hashPassword,
        firstName,
        lastName,
        phone,
        roles: roles.length ? roles : [userRole?._id],
      });
      await user.save();

      return res.json(new UserDTO(user));
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Create error" });
    }
  }

  async updateTag(req: Request, res: Response) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Ошибка при обновлении", errors });
      }
      const { value } = req.body;
      const { id } = req.params;
      const candidate = await TagModel.findOne({ _id: id });

      if (!candidate) {
        return res.status(400).json({ message: "Тег с таким id не найден" });
      }

      const post = await PostModel.findOne({ tags: { $in: id } });

      if (!post) {
        candidate.value = value;
        await candidate.save();

        return res.status(200).json(candidate);
      } else {
        res.status(400).json({ message: "Тег используется в постах" });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Create error" });
    }
  }

  async deleteTag(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const post = await PostModel.findOne({ tags: { $in: id } });

      if (!post) {
        await TagModel.findOneAndDelete({ _id: id });
        return res.status(200).json({ success: true });
      } else {
        res.status(400).json({ message: "Тег используется в постах" });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Delete error" });
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Ошибка при обновлении", errors });
      }

      const { value } = req.body;
      const { id } = req.params;
      const candidate = await RoleModel.findOne({ _id: id });

      if (!candidate) {
        return res.status(400).json({ message: "Роль с таким id не найден" });
      }

      const user = await UserModel.findOne({ roles: { $in: id } });

      if (!user) {
        candidate.value = value;
        await candidate.save();

        return res.status(200).json(candidate);
      } else {
        res.status(400).json({ message: "Роль используется у пользователей" });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Update error" });
    }
  }

  async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await UserModel.findOne({ roles: { $in: id } });

      if (!user) {
        await RoleModel.findOneAndDelete({ _id: id });
        return res.status(200).json({ success: true });
      } else {
        res.status(400).json({ message: "Роль используется у пользователей" });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Delete error" });
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const users = await UserModel.find({
        email: { $not: new RegExp(user.email) },
      })
        .populate("roles")
        .exec();
      const userDTOS = users.map((it) => new UserDTO(it));

      return res.json(userDTOS);
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Users error" });
    }
  }

  async getPosts(req: Request, res: Response) {
    try {
      const posts = await PostModel.find()
        .populate([
          {
            path: "user",
            populate: {
              path: "roles",
            },
          },
          { path: "tags" },
        ])
        .exec();

      const postsDTOS = posts.map((it) => new PostDTO(it));
      return res.json(postsDTOS);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async banUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await UserModel.findOne({ _id: id });

      if (!user) {
        return res.status(400).json({ message: "Пользователь не найден" });
      }

      const posts = await PostModel.find({ user: id });

      if (posts) {
        posts.forEach((post) => {
          post.status = PostStatus.BANNED;
          post.save();
        });
      }

      user.status = UserStatus.BANNED;
      await user.save();

      return res
        .status(200)
        .json({ message: "Пользователь успешно заблокирован" });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Ban error" });
    }
  }

  async unbanUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await UserModel.findOne({ _id: id });

      if (!user) {
        return res.status(400).json({ message: "Пользователь не найден" });
      }

      const posts = await PostModel.find({ user: id });

      if (posts) {
        posts.forEach((post) => {
          post.status = PostStatus.ACTIVE;
          post.save();
        });
      }

      user.status = UserStatus.ACTIVE;
      await user.save();

      return res
        .status(200)
        .json({ message: "Пользователь успешно разблокирован" });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Unban error" });
    }
  }

  async banPost(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const post = await PostModel.findOne({ _id: id });

      if (!post) {
        return res.status(400).json({ message: "Пост не найден" });
      }

      post.status = PostStatus.BANNED;
      await post.save();

      return res.status(200).json({ message: "Пост успешно заблокирован" });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Ban error" });
    }
  }

  async unbanPost(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const post = await PostModel.findOne({ _id: id });

      if (!post) {
        return res.status(400).json({ message: "Пост не найден" });
      }

      post.status = PostStatus.ACTIVE;
      await post.save();

      return res.status(200).json({ message: "Пост успешно разблокирован" });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Unban error" });
    }
  }
}

export default new AdminController();