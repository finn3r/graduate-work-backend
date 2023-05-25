import DefaultDTO from './DefaultDTO';
import { UserCommentDto } from './UserDTO';
import MessageDTO from './MessageDTO';

class DialogDTO extends DefaultDTO {
  users: UserCommentDto[];
  messages: MessageDTO[];

  constructor(model: any) {
    super(model);
    this.users = model.users.map((it: any) => new UserCommentDto(it))
    this.messages = model.messages.map((it: any) => new MessageDTO({ ...('toObject' in it ? it.toObject() : it), dialogId: this.id }))
  }
}

export class DialogListDTO extends DefaultDTO {
  user: UserCommentDto;
  unreadableMessages: boolean;
  lastMessage?: MessageDTO;

  constructor(model: any) {
    super(model);
    this.user = new UserCommentDto(model.user)
    this.unreadableMessages = model.unreadableMessages;
    this.lastMessage = model.lastMessage ? new MessageDTO({ ...model.lastMessage.toObject(), dialogId: this.id }) : undefined;
  }
}

export default DialogDTO;
