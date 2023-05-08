import { model, Schema } from 'mongoose';

const Role = new Schema({
  value: {
    type: String,
    unique: true,
    required: true,
    default: 'USER',
  },
});

export default model('roles', Role);
