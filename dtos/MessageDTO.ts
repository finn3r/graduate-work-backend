import DefaultDTO from './DefaultDTO';
import { UserCommentDto } from './UserDTO';

class DefaultMessageDTO extends DefaultDTO {
  text: string;
  updatedAt: string;
  createdAt: string;
  read: boolean;
  user: UserCommentDto;

  constructor(model: any) {
    super(model);

    this.text = model.text;
    this.updatedAt = model.updatedAt;
    this.createdAt = model.createdAt;
    this.read = model.read;
    this.user = new UserCommentDto(model.user);
  }
}

class MessageDTO extends DefaultMessageDTO {
  dialogId: string;

  constructor(model: any) {
    super(model);

    this.dialogId = model.dialogId;
  }
}

export class ComplaintMessageDTO extends DefaultMessageDTO {
  complaintId: string

  constructor(model: any) {
    super(model);

    this.complaintId = model.complaintId;
  }
}

export default MessageDTO;
