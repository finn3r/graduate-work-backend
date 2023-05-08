import { model, Schema } from "mongoose";

export enum UserStatus {
  ACTIVE = "ACTIVE",
  BANNED = "BANNED",
}

const User = new Schema(
  {
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    phone: {
      type: String,
    },
    isConfirmedEmail: {
      type: Boolean,
      default: false,
    },
    status: { type: String, default: UserStatus.ACTIVE },
    roles: [{ type: Schema.Types.ObjectId, ref: "roles" }],
    avatar: {
      type: String,
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);

export default model("users", User);
