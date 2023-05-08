import express from 'express';
import mongoose from 'mongoose';
import AuthRouter from './routers/AuthRouter';
import AdminRouter from './routers/AdminRouter';
import UserRouter from './routers/UserRouter';
import TagsRouter from './routers/TagsRouter';
import PostsRouter from './routers/PostsRouter';
import { config } from './config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDoc from './swagger.json';

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors({
  credentials: true,
  origin: (requestOrigin, callback) => {
    if ([process.env.CLIENT_URL, process.env.BUILD_CLIENT_URL].includes(requestOrigin)) {
      callback(null, true)
    } else {
      callback(null, true)
    }
  }
}));
app.use(express.json());
app.use(cookieParser());
app.use('/auth', AuthRouter);
app.use('/admin', AdminRouter);
app.use('/users', UserRouter);
app.use('/tags', TagsRouter);
app.use('/posts', PostsRouter);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc))
app.use('/avatars', express.static('avatars'));
app.use('/videos', express.static('videos'));

const start = async () => {
  try {
    await mongoose.connect(config.dbUrl)
    app.listen(PORT, () => {
      console.log(`server started on port ${PORT}`)
    });
  } catch (e) {
    console.log(e);
  }
}

start();
