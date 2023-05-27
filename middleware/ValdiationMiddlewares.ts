import { body, oneOf } from "express-validator";

export const required = (field: string, message?: string) => {
  return body(field, message || "Обязательное поле")
    .trim()
    .notEmpty();
};

export const requiredOr = (fields: string[], message?: string) => {
  return oneOf(
    fields.map((field) => body(field).trim().notEmpty()),
    message || "Не заполнено хотя бы одно поле"
  );
};
