import { body } from 'express-validator';

export const required = (field: string, message?: string) => {
  return body(field, message || 'Обязательное поле').trim().notEmpty();
}
