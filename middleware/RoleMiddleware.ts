import e, { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import RoleDTO from '../dtos/RoleDTO';

const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
      next();
    }

    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({message: 'Пользователь не авторизован'})
      }

      const decodedData = jwt.verify(token, config.secret);

      let hasRole = false;

      (decodedData as any).roles.forEach((role: RoleDTO) => {
        if (roles.includes(role.value)) {
          hasRole = true;
        }
      });

      if (!hasRole) {
        return res.status(403).json({ message: 'У вас нет доступа' })
      }

      next();
    } catch (e) {
      console.log(e);
      return res.status(401).json({message: 'Пользователь не авторизован'})
    }
  }
}

export { roleMiddleware };
