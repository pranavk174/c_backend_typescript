import prisma from "../../../prisma/prisma-client.js";
import { asyncSocketAPIHandeler } from "../../lib/util.js";
import {
  NEW_NOTIFICATION,
  STORY_LIKE,
  STORY_SEEN,
} from "../../utils/events.js";
import { logger } from "../../utils/logger.js";
import { notificationNamespace } from "../../index.js";
import {
  createNotification,
  getSocketmembers,
  getSockets,
  onlineUsers,
  chatSocketIds,
  getNotificationSockets,
} from "../../utils/socket.helper.js";
import {
  socketCallback,
  socketInterface,
} from "../../utils/types/base.type.js";
import {
  chat_memberProps,
  chatProps,
  SendMessageData,
  socketResponse,
  userProps,
} from "../../utils/types.js";
import { StorySeen } from "../../utils/types/story.type.js";
import { message } from "@prisma/client";

const { story, story_likes, chat, chat_member } = prisma;
export const replyStory = asyncSocketAPIHandeler<
  SendMessageData,
  socketResponse<"message", message[]>
>(
  async (
    socket: socketInterface,
    payload: userProps,
    data: SendMessageData,
    callback: (
      data: socketCallback<socketResponse<"message", message[]>>,
    ) => void,
  ) => {
    const { id, content } = data;
    logger.debug(payload, "payloadddddd");
    const storyData = await story.findFirst({
      where: { id: id, is_deleted: false },
    });
    if (!storyData) {
      return callback({
        message: "Story not found",
        status: 404,
        success: false,
      });
    }

    const chatid: chat_memberProps[] = await prisma.$queryRaw`
        select chat_id from chat_member where member_id in (${payload.userId}, ${storyData.user_id}) GROUP BY chat_id
HAVING COUNT(DISTINCT member_id) = 2;
        
        `;

    // logger.debug(chatid, "chatdataaaaaaa", storyData);

    let reply: message[];
    if (!chatid || chatid.length === 0) {
      const chatData = await chat.create({
        data: {
          chat_type: "private",
          created_at: new Date(),
        },
      });

      await chat_member.createMany({
        data: [
          {
            chat_id: chatData.id,
            member_id: payload.userId,
            joined_at: new Date(),
          },
          {
            chat_id: chatData.id,
            member_id: storyData.user_id,
            joined_at: new Date(),
          },
        ],
      });

      reply = await prisma.$queryRaw`
insert into message (
chat_id ,sender_id ,content ,story_id, created_at) values(${chatData.id} , ${payload.userId} , ${content}, ${storyData.id}, NOW()
)

          `;
    } else {
      reply = await prisma.$queryRaw<message[]>`
insert into message (
chat_id ,sender_id ,content ,story_id, created_at) values(${chatid[0].chat_id} , ${payload.userId} , ${content}, ${storyData.id}, NOW()
)
  `;
    }

    const notification = await createNotification(
      storyData.user_id,
      payload,
      "new_message",
      `${payload.name} have Replied to your Story`,
    );

    const receiverSocketId = chatSocketIds.get(String(storyData.user_id));
    socket
      .to(receiverSocketId)
      .emit(NEW_NOTIFICATION, notification?.notification);

    // const reply = await prisma.chat_member.

    return callback({
      message: "Reply added successfully",
      status: 201,
      success: true,
      data: {
        message: reply,
      },
    });
  },
);

export const seenStory = asyncSocketAPIHandeler(
  async (
    socket: socketInterface,
    payload: userProps,
    data: SendMessageData,
    callback: (data: socketCallback<socketResponse>) => void,
  ) => {
    const { id } = data;
    // logger.debug(payload, "payload data");

    const storyData = await story.findFirst({
      where: { id: id, is_deleted: false },
    });
    if (!storyData) {
      return callback({
        message: "Story not found",
        status: 404,
        success: false,
      });
    }
    if (storyData.user_id === payload.userId) {
      return callback({
        message: "You cannot mark your own story as seen",
        status: 400,
        success: false,
      });
    }

    const seenData: StorySeen[] = await prisma.$queryRaw`
        
        select user_id from story_seen where story_id = ${id} and user_id = ${payload.userId};
        
        `;

    // logger.debug(seenData, "seenDataaaa....");

    if (seenData.length > 0) {
      return callback({
        message: "Story already marked as seen",
        status: 400,
        success: false,
      });
    }

    // Mark the story as seen by creating an entry in a hypothetical "story_views" table
    const seen: StorySeen = await prisma.story_seen.create({
      data: {
        story_id: id,
        user_id: payload.userId,
        seen_at: new Date(),
      },
    });

    const receiverSocketId = getSockets(storyData.user_id);
    const res = getSocketmembers(storyData.user_id);
    logger.debug(
      receiverSocketId,
      res,
      "receiver socket idddddd",

      onlineUsers,
      chatSocketIds,
    );

    seen.profile_pic = payload.profile_pic;
    seen.name = payload.name;
    socket
      .to(receiverSocketId)
      .emit(STORY_SEEN, seen, (response: socketResponse) => {
        logger.debug("emitted datat in responseeee");
      });

    return callback({
      message: "Story marked as seen",
      status: 200,
      success: true,
    });
  },
);
export const likeStory = asyncSocketAPIHandeler<
  SendMessageData,
  socketResponse<"message", string>
>(
  async (
    socket: socketInterface,
    payload: userProps,
    data: SendMessageData,
    callback: (data: socketCallback<socketResponse<"message", string>>) => void,
  ) => {
    const { id, like, reaction_id } = data;
    if (!id || like === null || like === undefined) {
      return {
        message: "Like value is required",
        status: 400,
        success: false,
      };
    }

    const storyData = await story.findFirst({
      where: { id: id, is_deleted: false },
    });
    if (!storyData) {
      return callback({
        message: "Story not found",
        status: 404,
        success: false,
      });
    }

    if (storyData.user_id === payload.userId) {
      return callback({
        message: "You cannot like your own story",
        status: 400,
        success: false,
      });
    }

    const liked = await story_likes.upsert({
      where: {
        story_id_user_id: {
          story_id: id,
          user_id: payload.userId,
        },
      },
      update: {
        liked: like,
        created_at: new Date(),
        reaction_id: like === true ? reaction_id : null, // only set reaction_id if it's a like
      },
      create: {
        story_id: id,
        user_id: payload.userId,
        reaction_id: like === true ? reaction_id : null,
        liked: true,
        created_at: new Date(),
      },
    });

    if (!liked) {
      throw new Error("Failed to like the story");
    }

    const receiverSocketId = getSockets(storyData.user_id);

    const res = getSocketmembers(storyData.user_id);
    logger.debug(liked, "likeddd");

    // seen.profile_pic = payload.profile_pic;
    // seen.name = payload.name;

    socket
      .to(receiverSocketId)
      .emit(STORY_LIKE, liked, (response: socketResponse) => {
        logger.debug("emitted datat in responseeee", response);
      });

    if (like) {
      const notification = await createNotification(
        storyData.user_id,
        payload,
        "story_like",
        `${payload.name} liked your story`,
        storyData.id,
      );
      const notificationRecieverSocketId = getNotificationSockets(
        storyData.user_id,
      );

      logger.debug(notificationRecieverSocketId, "notifcation socket id");

      notificationNamespace
        .to(notificationRecieverSocketId)
        .emit(NEW_NOTIFICATION, notification?.notification);
    }

    return callback({
      data: {
        message: `Story ${like === true ? "liked" : "unliked"} successfully`,
      },
      status: 200,
      success: true,
    });
  },
);
