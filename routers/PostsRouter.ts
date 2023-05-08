import { Router } from 'express';
import PostsController  from '../controllers/PostsController';
import { authMiddleware } from '../middleware/AuthMiddleware';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import { v4 } from 'uuid';
import { body } from 'express-validator';
import { required } from '../middleware/ValdiationMiddlewares';

const router = Router();

const upload = multer({ dest: 'videos/' });

router.post(
  '/create',
  upload.single('video'),
  bodyParser.urlencoded({ extended: true }),
  authMiddleware,
  [
    required('title'),
    required('description'),
    required('shortDescription'),
  ],
  PostsController.createPost
);
router.get('/', PostsController.getPosts);

export default router;
