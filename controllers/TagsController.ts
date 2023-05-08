import { Request, Response } from 'express';
import TagModel from '../models/Tag';
import PostModel from '../models/Post';
import TagDTO from '../dtos/TagDTO';

class TagsController {
  async getTags(req: Request, res: Response) {
    try {
      const tags = await TagModel.find();

      const canDeleteEdits: boolean[] = []
      for (let i = 0; i < tags.length; i++) {
        const post = await PostModel.findOne({ tags: { $in: tags[i].id } });
        canDeleteEdits.push(!post);
      }

      const tagsDTOS = tags.map((it, i) => new TagDTO({ ...it.toObject(), canDeleteEdit: canDeleteEdits[i] }));

      return res.json(tagsDTOS);
    } catch (e) {
      console.log(e);
      return res.status(403).json({ message: 'Нету доступа' });
    }
  }
}

export default new TagsController();
