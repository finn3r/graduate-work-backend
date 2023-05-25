import { MessageEvents } from '../controllers/SocketController';

class WSError extends Error {
  public message: string;
  public event: MessageEvents;
  public status: number;

  constructor(status: number, message: string) {
    super();
    this.status = status;
    this.message = message;
    this.event = MessageEvents.ERROR;
  }

  static badRequest(message: string) {
    return new WSError(400, message)
  }

  static unauthorized() {
    return new WSError(401, 'Не авторизован')
  }
}

export default WSError;
