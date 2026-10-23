import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";
import prisma from "../prisma/prisma-client.js";
import { AppError } from "./errorHandler.js";
import { logger } from "../utils/logger.js";
import { Cookie, DeviceProps } from "../utils/types/graphqltypes/user.type.js";
import { deviceConfig } from "../utils/dummy.js";

export const errorHandler = (
  message: string,
  code: string,
  status: number,
  error?: Error,
) => {
  // logger.debug(error.code, "====== om errpr jandler");

  throw new GraphQLError(message, {
    extensions: {
      code,
      status,
      message,
      stack: error?.stack ? error?.stack : null,
    },
  });
};

export const validateToken = async (context: {
  request: { cookieStore: { get: (arg0: string) => any } };
}) => {
  let payload;
  const cookie = await context.request.cookieStore?.get("accessToken");
  if (!cookie)
    throw new AppError({
      message: "No Access Token",
      status: 401,
      code: "FORBIDDEN",
    });
  const accessToken = cookie.value;
  payload = jwt.verify(accessToken, process.env.JWT_SECRET ?? "");

  if (typeof payload === "string" || !("userId" in payload)) {
    throw new Error("Invalid token payload");
  }

  const exists = await prisma.$queryRaw<DeviceProps[]>`
    SELECT session_id FROM devices WHERE user_id = ${payload.userId} AND device_id = ${payload.device_id} AND session_id = ${payload.session_id}`;

  if (exists[0].session_id !== payload.session_id) {
    throw new AppError({
      message: "Invalid session Token is revoked Login Again",
      status: 401,
      code: "FORBIDDEN",
    });
  }

  return payload;
};

export const validateCookie = async (token: string | Cookie) => {
  let payload;
  try {
    let cookie;
    if (typeof token !== "string") {
      cookie = token.value;
    } else {
      cookie = token;
    }

    if (!cookie) throw new Error("No Access token");

    // const accessToken = token;
    // eslint-disable-next-line no-undef
    payload = jwt.verify(cookie, process.env.JWT_SECRET ?? "");

    if (typeof payload === "string" || !("userId" in payload)) {
      throw new Error("Invalid token payload");
    }

    const exists = await prisma.$queryRaw<
      DeviceProps[]
    >`SELECT session_id FROM devices WHERE user_id = ${payload.userId} AND device_id = ${payload.device_id} AND session_id = ${payload.session_id}`;

    if (exists[0].session_id !== payload.session_id) {
      throw new AppError({
        message: "Invalid session Token is revoked Login Again",
        status: 401,
        code: "FORBIDDEN",
      });
    }
  } catch (err) {
    if (err instanceof Error)
      if (err.name === "TokenExpiredError")
        throw new AppError({
          message: err.message,
          status: 401,
          code: "FORBIDDEN",
        });

    throw err;
  }

  return payload;
};

export const generateTokens = <T>(
  id: number,
  email: string,
  device_id: string,
  values: T = {} as T,
) => {
  const accessToken = jwt.sign(
    {
      userId: id,
      device_id,
      email,
      ...values,
    },
    process.env.JWT_SECRET ?? "",
    {
      expiresIn: "15m",
    },
  );

  // logger.log(values, "values data in generate token");

  const refreshToken = jwt.sign(
    {
      userId: id,
      device_id,
      email,
      ...values,
    },
    process.env.REFRESH_SECRET ?? "",
    {
      expiresIn: "7d",
    },
  );

  return { accessToken, refreshToken };
};
