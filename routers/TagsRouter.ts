import { Router } from 'express';
import TagsController  from '../controllers/TagsController';
import { authMiddleware }  from '../middleware/AuthMiddleware';

const router = Router();

router.get('/', authMiddleware, TagsController.getTags);

export default router;
