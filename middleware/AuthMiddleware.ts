import e, { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserStatus } from '../models/User';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    next();
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Пользователь не авторизован' })
    }

    const decodedData = jwt.verify(token, config.secret);

    if ((decodedData as any).status === UserStatus.BANNED) {
      return res.status(401).json({ message: 'Пользователь заблокирован' })
    }

    (req as any).user = decodedData;

    next();
  } catch (e) {
    console.log(e);
    return res.status(401).json({ message: 'Пользователь не авторизован' })
  }
}

export { authMiddleware };
