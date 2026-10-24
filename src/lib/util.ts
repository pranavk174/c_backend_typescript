/* eslint-disable no-undef */
import { GraphQLResolveInfo } from "graphql";
import { ERROR } from "../utils/events.js";
import { logger } from "../utils/logger.js";
import {
  asyncGraphQlMethodsType,
  asyncMethodsType,
  callbackError,
  SendMessageData,
  socketCallback,
  socketInterface,
  SocketMethod,
  userProps,
} from "../utils/types.js";
import { AppError } from "./errorHandler.js";
import bcrypt from "bcrypt";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { ctxProps } from "../utils/types/graphqltypes/chat.type.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import jwt from "jsonwebtoken";

const { TokenExpiredError } = jwt;
import { ZodError } from "zod";

export const isDev = process.env.NODE_ENV !== "production";
export const asyncGraphqlAPIHandeler =
  <T>(resolver: asyncGraphQlMethodsType<T>) =>
  async (
    parent: unknown,
    input: T,
    context: ctxProps,
    info: GraphQLResolveInfo,
  ): Promise<unknown> => {
    try {
      const response = await resolver(parent, input, context, info);
      // logger.info(response, "response in dataa")
      return response;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError) {
        logger.debug(error, "error classs nhi");
        logger.debug(error.cause, "errro .code");
        throw new AppError({
          message: error.message,
          status: 500,
          code: isDev ? error.code : "DB_ERROR",
          // detail: error.issues[0],
        });
      }
      if (error instanceof ReferenceError) {
        const message = isDev ? error.message : "Something went Wrong";
        const code = isDev ? "INTERNAL_ERROR" : "VARIABLE_ERROR";
        throw new AppError({
          message,
          status: 500,
          code,
          details: error.stack,
        });
      }
      if (error instanceof TypeError) {
        throw new AppError({
          message: error.message,
          status: 500,
          code: "USER_NOT_FOUND_ERROR",
        });
      }
      if (error instanceof ZodError) {
        logger.debug(error.issues[0].message, "error in zod ");
        throw new AppError({
          message: error.issues[0].message,
          status: 400,
          code: "INPUT_VALIDATION_ERROR",
          details: error.issues[0],
        });
      }
      if (error instanceof TokenExpiredError) {
        throw new AppError({
          message: error.message,
          status: 401,
          code: "TOKEN_EXPIRED",
          cause: error,
          // detail: error.issues[0],
        });
      }

      // if (error.consumedPoints >= 6) {
      //   logger.debug(error, "in get userssssssss", error.name);
      //   const retryAfter = Math.ceil(error.msBeforeNext / 1000 / 60);
      //   throw new AppError({
      //     message: `Too many requests. Try again after ${retryAfter} Minutes.`,
      //     code: error.code ?? "RATE_LIMIT_ERROR",
      //     status: 429,
      //     cause: error,
      //     details: {
      //       retryAfter,
      //     },
      //   });
      // }
      // throw error;
      if (error instanceof Error) {
        // logger.debug(error.cause, "errro .code in instance")
        throw new AppError({
          message: "Something Went Wrong",
          code: "INTERNAL_SERVER_ERROR",
          status: 500,
          cause: error,
        });
      }

      // return errorHandler(error.message, "INTERNAL_SERVER_ERROR", 500);
    }
  };

export const asyncHandeler =
  <T, R>(method: asyncMethodsType<T, R>) =>
  async (data: T): Promise<R> => {
    try {
      return await method(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error";

      logger.debug(message, "error in handler");
      throw error;
    }
  };

export const asyncSocketAPIHandeler =
  <T, R>(method: SocketMethod<T, R>) =>
  async (
    socket: socketInterface,
    payload: userProps,
    data: T,
    callback: (data: socketCallback<R>) => void,
  ) => {
    try {
      return await method(socket, payload, data, callback);
    } catch (error) {
      logger.debug(error);
      const message =
        error instanceof Error ? error.message : "Internal server error";

      socket.emit(ERROR, message);
      return callback({
        success: false,
        error: message,
        status: 500,
      });
    }
  };

export const otpGenrator = async () => {
  const SALT_ROUNDS = 10;
  const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  const otp = Math.floor(100000 + Math.random() * 900000);
  logger.debug(otp, "OTP");
  // generated OTP

  const hashedOtp = await bcrypt.hash(otp.toString(), SALT_ROUNDS);

  return { hashedOtp, otp, expires_at };
};

export const ApiLimiter = new RateLimiterMemory({
  points: 5, // Max 5 requests
  duration: 600, // 10 minutes
});
