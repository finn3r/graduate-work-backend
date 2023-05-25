import DefaultDTO from "./DefaultDTO";
import UserDTO from "./UserDTO";
import { PostStatus } from "../models/Post";

class PostDTO extends DefaultDTO {
  title: string;
  description: string;
  shortDescription: string;
  updatedAt: string;
  createdAt: string;
  user: UserDTO;
  status: PostStatus;
  videoUrl: string;

  constructor(model: any) {
    super(model);
    this.title = model.title;
    this.videoUrl = model.videoUrl;
    this.status = model.status;
    this.description = model.description;
    this.updatedAt = model.updatedAt;
    this.createdAt = model.createdAt;
    this.shortDescription = model.shortDescription;
    this.user = new UserDTO(model.user);
    this.user = new UserDTO(model.user);
  }
}

export default PostDTO;
