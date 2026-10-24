/* eslint-disable no-undef */
import nodemailer from "nodemailer";

import { logger } from "./logger.js";
import { AppError } from "../lib/errorHandler.js";
import { isMailError } from "./types.js";
// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Accept self-signed or invalid certificates
    rejectUnauthorized: false,
  },
});

export const sendMail = async (email: string, otp: string) => {
  try {
    logger.debug(
      { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      "credentialsss",
    );
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER, // sender address
      to: email, // list of recipients
      subject: "Hello", // subject line
      text: `Hello world?  ${otp}`, // plain text body
      html: `<b>Hello world?  ${otp}</b>`, // HTML body
    });

    if (info.messageId) {
      return true;
    }

    return false;
  } catch (err: unknown) {
    logger.debug(err, "error in send mail......");

    if (isMailError(err)) {
      switch (err.code) {
        case "ECONNECTION":
        case "ETIMEDOUT":
        case "EAUTH":
          throw new AppError({
            message: err.message,
            status: 500,
            code: err.code,
          });

        case "EENVELOPE":
          throw new AppError({
            message: err.message,
            status: 500,
            code: err.code,
            details: err.rejected,
          });

        default:
          throw new AppError({
            message: err.message,
            status: 500,
            code: err.code,
            details: err.rejected,
          });
      }
    }

    // Agar error standard Error hai, lekin mail error nahi hai
    if (err instanceof Error) {
      throw new AppError({
        message: err.message,
        status: 500,
      });
    }

    throw new AppError({
      message: "An unknown error occurred while sending mail",
      status: 500,
    });
  }
};
