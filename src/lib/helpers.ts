import { createPubSub } from "graphql-yoga";
import bcrypt from "bcrypt";
import { Prisma, PrismaClient } from "@prisma/client";

import { JwtPayload } from "jsonwebtoken";
import prisma from "../../prisma/prisma-client.js";
import { logger } from "@/utils/logger.js";
import {
  messageProps,
  userProps,
  chat_memberProps,
  chatProps,
} from "@/utils/types.js";
import { OtpData } from "@/utils/types/graphqltypes/user.type.js";
import { BadRequestError, AppError } from "./errorHandler.js";
import { asyncHandeler } from "./util.js";
import { chatSocketIds } from "@/utils/socket.helper.js";
export const checkMessageExists = async (
  prisma: PrismaClient,
  message_ids: number[],
) => {
  const data = await prisma.$queryRaw<messageProps[]>`

    SELECT id,chat_id,sender_id,is_deleted
    FROM message

    WHERE id = ANY(${message_ids})
    AND is_deleted = false

  `;

  logger.log(message_ids, "data length and messaged idssss", data);

  if (data.length !== message_ids.length) {
    throw new BadRequestError("Some messages do not exist or are deleted");
  }

  return data;
};

export const filterUnseenMessage = async (message_ids: number[]) => {
  if (message_ids.length < 1) {
    throw new Error("Message id is missing");
  }

  const unseen = await prisma.$queryRaw`
  
  SELECT input.id AS missing_message_id
  FROM unnest(${message_ids}::int[]) AS input(id)
  WHERE NOT EXISTS (
    SELECT 1
    FROM message m
    WHERE m.id = input.id
  )

  
  `;
};

export const findMessage = async (
  sender_id: number,
  client_msg_id: string,
  chat_id: number,
): Promise<messageProps[] | null> => {
  const data: messageProps[] = await prisma.$queryRaw`

    SELECT id,chat_id,sender_id,is_deleted
    FROM message

    WHERE client_msg_id = ${client_msg_id}
    AND sender_id = ${sender_id}
    AND chat_id = ${chat_id}
    AND is_deleted = false

  `;

  logger.log(client_msg_id, "data length and messaged idssss", data);
  if (data.length === 0) {
    return null;
  }
  return data;
};

export const chekUserExists = async (prisma: PrismaClient, users: number[]) => {
  const data = await prisma.$queryRaw<userProps[]>`
    
    
    select id from users where id = ANY(${users}) and account_status = 'active'
    `;
  if (data.length !== users.length) {
    throw new BadRequestError("Some Uers does nnot Exists or has been deleted");
  }

  logger.debug(data);

  return data;
};

export const checkMemeberExists = async (
  prisma: PrismaClient,
  chat_id: number,
  user_id: number,
): Promise<chat_memberProps[]> => {
  // logger.debug(chat_id, user_id, "======");
  const data = await prisma.$queryRaw<chat_memberProps[]>`

    SELECT member_id
    FROM chat_member

    WHERE chat_id = ${chat_id}
    AND member_id = ${user_id}

  `;

  return data;
};

export const checkChatExists = async (
  prisma: PrismaClient,
  user_id: number,
  members: number[],
): Promise<chat_memberProps[]> => {
  // logger.debug(user_id, "===========", members);
  const data = await prisma.$queryRaw<chat_memberProps[]>`
    

    
    SELECT chat_id
FROM chat_member

GROUP BY chat_id

HAVING
    ARRAY_AGG(DISTINCT member_id ORDER BY member_id)
    =
    ${[user_id, ...members]};
    
    `;

  return data;
};

export const createChat = asyncHandeler<
  {
    payload: userProps | JwtPayload;
    reciever_id: number[];
    chat_type?: "private" | "group";
    prisma: Prisma.TransactionClient;
  },
  chatProps[]
>(
  async ({
    payload,
    reciever_id,
    chat_type = "private",
    prisma,
  }): Promise<chatProps[]> => {
    let result;
    if (chat_type === "group") {
      const created = await prisma.$queryRaw<chatProps[]>`
      
      insert into chat (chat_type) values('group') returning id ;
      
      `;

      const members = [
        ...reciever_id.map(
          (id) => Prisma.sql` (${created[0].id}, ${id} , 'member') `,
        ),
        Prisma.sql`  (${created[0].id} , ${payload.userId} , 'admin')
      `,
      ];

      await prisma.$queryRaw`
      insert into chat_member (chat_id , member_id , role) values ${Prisma.join(members)}
      `;

      result = created;

      return created;
    } else {
      const data = await prisma.$queryRaw<chatProps[]>`
          
          insert into chat (chat_type) values(${chat_type})  RETURNING id;


          `;

      const chatId = data[0].id;

      await prisma.$queryRaw`
          
          insert into chat_member (member_id ,chat_id ) values(${payload.userId},${chatId}),(${reciever_id},${chatId})
          
          `;
      result = data;
      return data;
    }
  },
);

export const chekOTP = async (otp: string, record: OtpData) => {
  if (!record.otp) {
    throw new AppError({
      message: "OTP not found",
      status: 404,
      code: "OTP_ERROR",
    });
  }
  const isMatch = await bcrypt.compare(String(otp), record.otp);
  if (!isMatch) {
    throw new AppError({
      message: "Invalid OTP",
      status: 400,
      code: "OTP_ERROR",
    });
    // throw new Error("Invalid Otp");
  }

  const isExpired = new Date(record.expires_at) < new Date();
  if (isExpired) {
    throw new AppError({
      message: "Expired OTP",
      status: 400,
      code: "OTP_ERROR",
    });
  }
  return true;
};

export const getSockets = (member: string) => {
  const receiverSocketId = chatSocketIds.get(String(member));
  return receiverSocketId;
};

export const pubsub = createPubSub();

export const allowedOrigins = [
  "http://localhost:3001",
  "http://localhost:3000",
  "https://cfrontend-one.vercel.app",
  "https://chat-application-frontend.vercel.app",
  "https://admin.socket.io",
  process.env.FRONTEND_URL,
];
