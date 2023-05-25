import { model, Schema } from "mongoose";

const Message = new Schema(
  {
    text: { type: Schema.Types.String, required: true },
    event: { type: Schema.Types.String, required: true },
    photoUrl: { type: Schema.Types.String },
    read: { type: Schema.Types.Boolean, default: false },
    user: { type: Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true }
);

export default model("messages", Message);
