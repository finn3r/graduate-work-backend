import { model, Schema } from "mongoose";

export enum PostStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  BANNED = "BANNED",
}

const Post = new Schema(
  {
    text: {
      type: String,
    },
    attached: {
      type: String,
    },
    status: {
      type: String,
      default: PostStatus.ACTIVE,
    },
    user: { type: Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true }
);

export default model("posts", Post);
