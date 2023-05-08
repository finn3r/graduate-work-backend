import { model, Schema } from 'mongoose';

const Dialog = new Schema({
  message: [{ type: Schema.Types.ObjectId, ref: 'messages' }],
  users: [{ type: Schema.Types.ObjectId, ref: 'users' }],
});

export default model('dialogs', Dialog);
