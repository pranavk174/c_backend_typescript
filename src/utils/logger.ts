/* eslint-disable no-undef */
type LoggerArgs = unknown[];

export const logger = {
  error: (...args: LoggerArgs): void => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ERROR]", ...args);
    }
  },

  warn: (...args: LoggerArgs): void => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[WARN]", ...args);
    }
  },

  info: (...args: LoggerArgs): void => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[INFO]", ...args);
    }
  },

  debug: (...args: LoggerArgs): void => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[DEBUG]", ...args);
    }
  },

  log: (...args: LoggerArgs): void => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[log]", ...args);
    }
  },
};
