import { Router } from 'express';
import DialogController  from '../controllers/DialogController';
import { authMiddleware }  from '../middleware/AuthMiddleware';
import { required } from '../middleware/ValdiationMiddlewares';

const router = Router();

router.get('/', authMiddleware, DialogController.getDialogs);
router.get('/:dialogId', authMiddleware, DialogController.getDialogInfo);
router.post(
  '/create',
  authMiddleware,
  [
    required('userId'),
    required('text'),
  ],
  DialogController.createDialogByRequest
);

export default router;
