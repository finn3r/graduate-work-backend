import { Request, Response } from "express";
import Dialog from "../models/Dialog";
import UserModel from "../models/User";
import {
  broadCastMessage,
  implementDialogIdIF,
  MessageEvents,
} from "./SocketController";
import Message from "../models/Message";
import MessageDTO from "../dtos/MessageDTO";
import DialogDTO, { DialogListDTO } from "../dtos/DialogDTO";
import UserDTO from "../dtos/UserDTO";
import WSError from "../errors/WSError";
import { validationResult } from "express-validator";
import ApiError from "../errors/ApiError";

export interface IDialogCreate {
  text: string;
  userId: string;
  user: UserDTO;
}

export interface IMessageCreate {
  text: string;
  dialogId: string;
  user: UserDTO;
  event: MessageEvents;
}

class DialogController {
  async createMessage(message: IMessageCreate): Promise<MessageDTO> {
    const { text, user, event, dialogId } = message;

    const dialog = await Dialog.findById(dialogId);

    if (!dialog) {
      throw WSError.badRequest("Диалог не найден");
    }

    const dbMessage = await Message.create({
      text,
      user: user.id,
      event,
      read: false,
    });

    dialog.messages = [...(dialog.messages || []), dbMessage._id];
    await dialog.save();

    return new MessageDTO({ ...dbMessage.toObject(), dialogId, user });
  }

  async getDialogInfo(req: Request, res: Response) {
    try {
      const { dialogId } = req.params;
      const user = (req as any).user;
      const dialog = await Dialog.findOne({ users: user.id, _id: dialogId })
        .populate<any>([
          {
            path: "messages",
            populate: {
              path: "user",
            },
          },
          { path: "users" },
        ])
        .exec();

      if (!dialog) {
        return ApiError.badRequest(res, "Диалог не найден");
      }

      await Promise.all(
        dialog.messages
          .filter((it: any) => !it.read && it.user._id.toString() !== user.id)
          .map(async (it: any) => {
            it.read = true;
            await it.save();
          })
      );

      return res.json(new DialogDTO(dialog));
    } catch (e) {
      console.log(e);
      return ApiError.internal(res, "Server error");
    }
  }

  async getDialogs(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const dialogs = await Dialog.find({ users: user.id })
        .populate([
          {
            path: "messages",
            populate: {
              path: "user",
            },
          },
          { path: "users" },
        ])
        .exec();
      return res.json(
        (dialogs || [])
          .map(
            (it) =>
              new DialogListDTO({
                ...it.toObject(),
                user: it.users.find((it) => it._id.toString() !== user.id),
                lastMessage: it.messages[it.messages.length - 1],
                unreadableMessages: it.messages.filter((it: any) => {
                  return !it.read && it.user._id.toString() !== user.id;
                }).length,
              })
          )
          .sort(
            (a, b) =>
              Date.parse(b.lastMessage?.updatedAt || "") -
              Date.parse(a.lastMessage?.updatedAt || "")
          )
      );
    } catch (e) {
      console.log(e);
      return ApiError.internal(res, "Server error");
    }
  }

  async createDialogByRequest(req: Request, res: Response) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return ApiError.badRequest(res, "Ошибка при создание диалогов", errors);
      }

      const { userId, text } = req.body;
      const { user } = req as any;

      const teammate = await UserModel.findById(userId);

      if (!teammate) {
        return res.status(400).json({ message: "Пользователь не найден" });
      }

      const candidateDialog = await Dialog.findOne({
        users: { $all: [userId, user.id] },
      });

      if (candidateDialog) {
        const message = await Message.create({
          text,
          user: user.id,
          event: MessageEvents.MESSAGE,
          read: false,
        });

        candidateDialog.messages = [...candidateDialog.messages, message._id];

        await candidateDialog.save();

        const msg = new MessageDTO({
          ...message.toObject(),
          user,
          dialogId: candidateDialog._id.toString(),
        });

        broadCastMessage(candidateDialog._id.toString(), {
          ...msg,
          event: MessageEvents.MESSAGE,
        });

        return res.json(
          new DialogDTO({
            ...candidateDialog.toObject(),
            users: [user, teammate],
            messages: [
              {
                ...message.toObject(),
                user,
              },
            ],
          })
        );
      } else {
        const message = await Message.create({
          text,
          user: user.id,
          event: MessageEvents.MESSAGE,
          read: false,
        });

        const dialog = new Dialog({ messages: [], users: [userId, user.id] });

        await dialog.save();

        dialog.messages = [message._id];

        await dialog.save();

        await implementDialogIdIF(
          dialog._id.toString(),
          user.id,
          JSON.stringify({
            ...message.toObject(),
            user,
            dialogId: dialog._id.toString(),
          })
        );

        return res.json(
          new DialogDTO({
            ...dialog.toObject(),
            users: [user, teammate],
            messages: [
              {
                ...message.toObject(),
                user,
              },
            ],
          })
        );
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Server error" });
    }
  }
}

export default new DialogController();
