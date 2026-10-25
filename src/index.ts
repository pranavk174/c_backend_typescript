import "dotenv/config";
import "./cron.js";
import "./cronjobs/dbcleaner.js";
import { yoga } from "./graphql/endpoints.js";
// import { Server } from "socket.io";
import express from "express";
import { logger } from "./utils/logger.js";
import prisma from "../prisma/prisma-client.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Request, Response } from "express";
import { instrument } from "@socket.io/admin-ui";

// import http from "http";

import { socketAuthMiddleware } from "./middlewares/auth.js";
import { chatSockets } from "./Sockets/chatNameSpaces.js";
import { allowedOrigins } from "./lib/helpers.js";
import { socketServer } from "./Sockets/Socketserver.js";

import { NotificationSocket } from "./Sockets/NotificationsNamespace.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adminUiPath = path.join(
  __dirname,
  "../node_modules/@socket.io/admin-ui/ui/dist",
);
// import { authMiddleware } from "./middlewares/auth.js";
const app = express();
// const server = http.createServer(app);

export const { io, server } = socketServer(app);
app.use(cookieParser());

// this CORS feature is only for request coming from the borwser
app.use(
  cors({
    origin: (origin, callback) => {
      // mobile apps/postman/server-side requests
      if (!origin) {
        // return callback(new Error("CORS not allowed"));
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        logger.debug("error in  cors", allowedOrigins, origin);
        // callback(new Error("CORS not allowed")); // comment this code if the request is coming from the node server
        // callback(null, true); // comment this code if request  comming from Browser
      }
    },

    credentials: true,
  }),
);
app.use(express.json());

app.use(
  "/admin",
  express.static(adminUiPath, {
    index: false,
  }),
);

app.get("/admin", (req, res) => {
  res.sendFile(path.join(adminUiPath, "index.html"));
});

// io.use(socketAuthMiddleware);

export const chatNamespace = io.of("/chat");
export const notificationNamespace = io.of("/notification");

instrument(io, {
  auth: false,
  namespaceName: "/admin",
});

chatNamespace.use(socketAuthMiddleware);
notificationNamespace.use(socketAuthMiddleware);

chatNamespace.on("connection", chatSockets);

notificationNamespace.on("connection", NotificationSocket);

app.get("/health", async (req, res) => {
  try {
    // Agar DB check karna ho
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({
      status: "error",
    });
  }
});

app.use("/graphql", (req, res, next) => {
  const handler = yoga as unknown as (
    request: Request,
    response: Response,
    next: express.NextFunction,
  ) => void | Promise<void>;

  return handler(req, res, next);
});
server.listen(process.env.PORT, () => {
  logger.debug("Server + Socket.IO started on port:", process.env.PORT);
});
