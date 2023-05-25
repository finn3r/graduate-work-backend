import { Request, Response } from "express";
import PostModel, { PostStatus } from "../models/Post";
import PostDTO from "../dtos/PostDTO";
import fs from "fs";
import { v4 } from "uuid";
import { getVideoDurationInSeconds } from "get-video-duration";
import { validationResult } from "express-validator";

class PostsController {
  async getPosts(req: Request, res: Response) {
    try {
      const posts = await PostModel.find({ status: PostStatus.ACTIVE })
        .populate([
          {
            path: "user",
            populate: {
              path: "roles",
            },
          },
        ])
        .exec();
      const postsDTOS = posts.map((it) => new PostDTO(it));

      return res.json(postsDTOS);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async createPost(req: Request, res: Response) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Ошибка при создании", errors });
    }

    const file = (req as any).file;

    try {
      const { title, description, shortDescription } = req.body;

      const user = (req as any).user;

      const videoDuration = await getVideoDurationInSeconds(file.path);

      const fileName = user.id;
      const fileExtension = file.originalname.split(".").pop();
      const newFileName = `${v4()}.${fileName}.${fileExtension}`;
      const newFilePath = `videos/${newFileName}`;
      const videoUrl = `http://${req.headers.host}/videos/${newFileName}`;

      if (videoDuration > 30) {
        fs.unlinkSync(file.path);
        return res
          .status(400)
          .json({ error: "Длительность видео не должна привышать 30 секунд" });
      }

      fs.renameSync(file.path, newFilePath);

      const post = new PostModel({
        title,
        description,
        shortDescription,
        videoUrl,
        user: user.id,
      });
      await post.save();

      return res.json({ success: true, videoUrl });
    } catch (err) {
      console.error(err);
      fs.unlinkSync(file.path);
      res.status(500).json({ error: "Failed to upload video" });
    }
  }
}

export default new PostsController();
