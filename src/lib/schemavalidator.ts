import { logger } from "@/utils/logger.js";
import { z } from "zod";
import { AppError } from "./errorHandler.js";

const schemas = {
  string: z.string().min(1, "Field is required"),

  number: z.string().regex(/^\d+$/, "Only numbers are allowed"),
  otp: z
    .string()
    .regex(/^\d+$/, "OTP must contain only numbers")
    .length(6, "OTP must be exactly 6 digits"),

  email: z.email("Invalid email"),

  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
};

export const inputValidate = (value: string, type: keyof typeof schemas) => {
  const schema = schemas[type];

  if (!schema) {
    throw new AppError({
      message: `Validation type "${type}" not found`,
      status: 400,
      code: "INPUT_ERROR",
    });
  }

  const resp = schema.parse(value);
  logger.debug(resp, "res p");
  return resp;
};
