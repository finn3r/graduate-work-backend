import DefaultDTO from "./DefaultDTO";
import UserDTO from "./UserDTO";
import { PostStatus } from "../models/Post";

class PostDTO extends DefaultDTO {
  text: string;
  attached: string;
  user: UserDTO;
  status: PostStatus;

  constructor(model: any) {
    super(model);
    this.text = model.text;
    this.attached = model.attached;
    this.status = model.status;
    this.user = new UserDTO(model.user);
  }
}

export default PostDTO;
