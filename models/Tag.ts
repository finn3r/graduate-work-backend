import { model, Schema } from 'mongoose';

const Tag = new Schema({
  value: {
    type: String,
    unique: true,
    required: true,
  },
});

export default model('tags', Tag);
