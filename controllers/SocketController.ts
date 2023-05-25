import ws from "ws";
import DialogController from "./DialogController";
import jwt from "jsonwebtoken";
import { config } from "../config";
import * as WebSocket from "ws";
import Dialog from "../models/Dialog";
import WSError from "../errors/WSError";
import UserDTO from "../dtos/UserDTO";
import Message from "../models/Message";
import MessageDTO from "../dtos/MessageDTO";

export enum MessageEvents {
  CONNECTION = "connection",
  MESSAGE = "message",
  READ_MESSAGE = "readMessage",
  ERROR = "error",
  DELETE_MESSAGE = "deleteMessage",
}

export interface IMessageWithoutId {
  text: string;
  dialogId: string;
  event: MessageEvents;
}

export interface IBaseMessage {
  token: string;
  event: MessageEvents;
  fromAdmin?: boolean;
}

export interface IReadMessageDTO extends IBaseMessage {
  messageId: string;
}

export interface ISocket {
  id: string;
  dialogs: string[];
}

const checkUser = (token: string): UserDTO => {
  try {
    if (!token) {
      throw WSError.unauthorized();
    }

    const decodedData: any = jwt.verify(token, config.secret);

    return decodedData;
  } catch (e) {
    throw WSError.unauthorized();
  }
};

export const wss = new ws.Server(
  {
    port: 4000,
  },
  () => console.log(`Websocket was started on port: ${4000}`)
);

export const broadCastMessage = <T>(id: string, message: T) => {
  wss.clients.forEach((client: any) => {
    if (client.id === id) {
      client.send(JSON.stringify(message));
    }

    if (client.dialogs?.includes(id)) {
      client.send(JSON.stringify(message));
    }
  });
};

const getDialogsIds = async (userId: string, fromAdmin?: boolean) => {
  const dialogs = await Dialog.find({ users: userId });
  return dialogs.map((it) => it.id);
};

export const implementDialogIdIF = async (
  dialogId: string,
  currentUserId: string,
  message: string
) => {
  const dialogs = await Dialog.find({ users: currentUserId });
  const needDialog = dialogs.find((it) =>
    Boolean(it.users.find((it) => it.toString() !== currentUserId))
  );
  const secondUser = needDialog?.users
    .find((it) => it.toString() !== currentUserId)
    ?.toString();

  if (secondUser) {
    let client: any;
    let currentClient: any;
    wss.clients.forEach((it: any) => {
      if (it.id === secondUser) {
        client = it;
      }

      if (it.id === currentUserId) {
        currentClient = it;
      }
    });

    if (client) {
      client.dialogs = [...(client.dialogs || []), dialogId];
      client.send(message);
    }
    if (currentClient && currentClient) {
      currentClient.dialogs = [...(currentClient.dialogs || []), dialogId];
    }
  }
};

const readMessage = async (data: IReadMessageDTO) => {
  await Message.findByIdAndUpdate(data.messageId, {
    read: true,
  });
};

const deleteMessage = async (data: IReadMessageDTO, userId: string) => {
  const message = await Message.findOne({ _id: data.messageId, user: userId });

  if (!message) {
    throw WSError.badRequest("Сообщение не найдено");
  }

  await message.remove();

  const dialog = await Dialog.findOne({ messages: data.messageId });

  if (dialog) {
    dialog.messages = dialog.messages.filter(
      (it) => it.toString() !== data.messageId
    );
    await dialog.save();
    const lastMessage = await Message.findById(
      dialog.messages[dialog.messages.length - 1].toString()
    )
      .populate("user")
      .exec();

    return {
      event: MessageEvents.DELETE_MESSAGE,
      messageId: data.messageId,
      lastMessage: new MessageDTO(lastMessage),
      dialogId: dialog._id.toString(),
    };
  }

  return {
    event: MessageEvents.DELETE_MESSAGE,
    messageId: data.messageId,
  };
};

wss.on("connection", async (ws: WebSocket & ISocket) => {
  ws.on("error", console.error);

  ws.on(MessageEvents.MESSAGE, async (message: string) => {
    try {
      const { token, event, fromAdmin } = JSON.parse(message) as IBaseMessage;

      const decodedData: any = checkUser(token);
      let dataMessage;

      switch (event) {
        case MessageEvents.MESSAGE:
          dataMessage = JSON.parse(message) as IMessageWithoutId;
          const msgFromDB = (await DialogController.createMessage({
            ...dataMessage,
            user: decodedData,
          })) as any;

          broadCastMessage(dataMessage.dialogId, {
            ...msgFromDB,
            event: MessageEvents.MESSAGE,
          });
          break;
        case MessageEvents.CONNECTION:
          ws.id = decodedData.id;
          const ids = await getDialogsIds(ws.id, fromAdmin);
          ws.dialogs = ids || [];
          broadCastMessage(ws.id, { text: "Success" });
          break;
        case MessageEvents.READ_MESSAGE:
          dataMessage = JSON.parse(message) as IReadMessageDTO;
          await readMessage(dataMessage);
          break;
        case MessageEvents.DELETE_MESSAGE:
          dataMessage = JSON.parse(message) as IReadMessageDTO;
          const res = await deleteMessage(dataMessage, decodedData.id);
          if (res.dialogId) {
            broadCastMessage(res.dialogId, res);
          }
          break;
      }
    } catch (e) {
      if (e instanceof WSError) {
        broadCastMessage(ws.id, {
          event: e.event,
          message: e.message,
          status: e.status,
        });
      } else {
        broadCastMessage(ws.id, {
          event: MessageEvents.ERROR,
          message: "Server error",
          status: 500,
        });
      }
    }
  });
});
