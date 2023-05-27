import { body } from "express-validator";

export const required = (field: string, message?: string) => {
  return body(field, message || "Обязательное поле")
    .trim()
    .notEmpty();
};

export const requiredOr = (fields: string[], message?: string) => {
  return body(fields, message || "Не заполнено хотя бы одно поле")
    .trim()
    .custom((fields) =>
      fields.reduce((i = 0, field: string) => (field ? i++ : i))
    );
};
