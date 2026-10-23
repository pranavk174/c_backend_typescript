import {
  getSockets,
  isReceiverInRoom,
  chatSocketIds,
  notificationSocketIds,
} from "../../utils/socket.helper.js";
import { notificationNamespace } from "../../index.js";

import prisma from "../../prisma/prisma-client.js";
import {
  checkMessageExists,
  chekUserExists,
  checkChatExists,
  findMessage,
} from "../../lib/helpers.js";

import { logger } from "../../utils/logger.js";

import { asyncSocketAPIHandeler } from "../../lib/util.js";
import {
  AttachmentProps,
  chatProps,
  mediaProps,
  messageProps,
  MessageReaction,
  ReactionRow,
  SendMessageData,
  socketResponse,
  userProps,
} from "../../utils/types.js";

import {
  socketCallback,
  socketInterface,
} from "../../utils/types/base.type.js";

import { Notification } from "@/utils/types/notification.types.js";
import {
  REFETCH_CHATS,
  NEW_NOTIFICATION,
  NEW_MESSAGE_ALERT,
  ERROR,
  NEW_MESSAGE,
  MESSAGE_REACTION,
  MESSAGE_SEEN,
  EDIT_MESSAGE,
  START_TYPING,
  STOP_TYPING,
} from "@/utils/events.js";
export const sendMessage = asyncSocketAPIHandeler(
  async (
    socket: socketInterface,
    payload: userProps,
    data: SendMessageData,
    callback: (data: socketCallback<socketResponse>) => void,
  ) => {
    logger.debug(data, "new messageeeeee");

    const { content, media, chat_ids, client_msg_id, reciever_ids, chat_type } =
      data;
    if (
      (!content && !media) ||
      (chat_ids &&
        chat_ids.length < 1 &&
        reciever_ids &&
        reciever_ids.length < 1)
    ) {
      throw new Error("data is not available bro");
      // return callback({
      //   message: "Data is missing...",
      //   status: 400,
      //   success: false,
      // });
    }

    // if(reciever_ids && reciever_ids.incldes(payload.userID))

    let chatId;
    let chat_id;
    if (chat_ids && chat_ids.length > 0) {
      chatId = chat_ids[0];
      chat_id = chat_ids[0];
    }
    logger.debug(reciever_ids, "type dataaa...", chat_ids);

    if (chat_type === "private") {
      if (!chat_id) {
        const reciever_id = reciever_ids[0];
        const reciever = await chekUserExists(prisma, reciever_ids);

        if (reciever.length < 1) {
          return callback({
            message: "Reciever Does not exists",
            status: 404,
            success: false,
          });
        }
        // const memeberExists = await checkMemeberExists(prisma, reciever_ids);

        const chatExists = await checkChatExists(
          prisma,
          payload.userId,
          reciever_ids,
        );

        if (chatExists.length < 1) {
          const data: chatProps[] = await prisma.$queryRaw`
        
        insert into chat (chat_type) values('private')  RETURNING id;


        `;

          chatId = data[0].id;

          await prisma.$queryRaw`
        
        insert into chat_member (member_id ,chat_id ) values(${payload.userId},${chatId}),(${reciever_id},${chatId})
        
        `;
        } else {
          chatId = chatExists[0].chat_id;
        }
      }
    }

    if (!chatId) {
      return callback({
        message: "chatId is mising",
        status: 400,
        success: false,
      });
    }

    if (client_msg_id) {
      const existing = await findMessage(payload.userId, client_msg_id, chatId);

      logger.debug(existing, "exisiting merssage");
      if (existing)
        return callback({ success: true, data: { message: existing[0] } });
    }

    let addMessage: messageProps[] = await prisma.$queryRaw`
        
        insert into message (content,sender_id ,created_at ,chat_id,client_msg_id )  values(${content},${payload.userId},${new Date()},${chat_id ?? chatId},${client_msg_id}) returning *
        
        `;

    if (media && media.length > 0) {
      const addMedia: AttachmentProps[][] = await Promise.all(
        media.map((m) => {
          return prisma.$queryRaw<AttachmentProps[]>`

        insert into attachment (message_id,url,file_type,file_name,file_size) values(${addMessage[0].id},${m.url},${m.file_type.toLowerCase()},${m.file_name},${m.file_size}) returning *

        `;
        }),
      );

      addMessage = addMessage.map((msg) => ({
        ...msg,
        preview: addMedia[0][0].url,
      }));
    }

    // ISO string → milliseconds
    const ms = new Date(addMessage[0].created_at).getTime();
    addMessage[0] = {
      ...addMessage[0],
      created_at: new Date(ms),
      seen_users: [],
    };

    reciever_ids.forEach(async (reciever_id) => {
      const receiverInRoom = isReceiverInRoom(socket, reciever_id, chat_ids[0]);
      logger.debug("Receiver room mein hai:", receiverInRoom);
      // logger.debug(`chat:${chat_ids[0]}`, "chat id room id");
      if (receiverInRoom) {
        socket.to(`chat:${chat_ids[0]}`).emit(REFETCH_CHATS, addMessage);
      } else {
        const receiverSocketId = chatSocketIds.get(String(reciever_id));
        const notificationRecieverSocketId = notificationSocketIds.get(
          String(reciever_id),
        );
        const existing = await prisma.block.findFirst({
          where: {
            unblocked_at: null,
            OR: [
              {
                user_id: payload.userId,
                blocked_user_id: reciever_id,
              },
              {
                user_id: reciever_id,
                blocked_user_id: payload.userId,
              },
            ],
          },
        });

        logger.debug(existing, "existing block dataaa");
        if (!existing || !existing.blocked) {
          const res: Notification[] = await prisma.$queryRaw<Notification[]>`
      
      insert into notification (reciever_id,sender_id ,notification_type,metadata) values(
        ${reciever_id},${payload.userId},'new_message',   ${JSON.stringify({
          message: `You have a new Message From ${payload.name}`,
        })}::jsonb

      
      
      ) returning *
      
      
      `;

          const notification = {
            notification_id: res[0].notification_id,
            notification_type: res[0].notification_type,
            name: payload.name,
            message: res[0].metadata?.message,
            time: res[0].created_at,
            avatar: payload.profile_pic,
            color: "#25D366",
          };

          // logger.debug(
          //   notification,
          //   "notification dataaa",
          //   notificationRecieverSocketId,
          // );

          notificationNamespace
            .to(notificationRecieverSocketId)
            .emit(NEW_NOTIFICATION, notification);
          socket.to(receiverSocketId).emit(NEW_MESSAGE_ALERT, {
            chat_id: addMessage[0].chat_id,
            chat_type: "private",
            user_id: payload.userId,
            name: payload.name,
            blocked: false,
            cover_pic: payload.cover_pic,
            profile_pic: payload.profile_pic,
            bio: payload.bio,
            email: payload.email,
            mobile: payload.mobile,
            last_message_id: addMessage[0].id,
            unread_count: addMessage.length,
            last_message: addMessage[0].content,
            last_message_at: addMessage[0].created_at,
          });
        }
      }
    });

    // logger.debug(addMessage, "chatiddddd");
    // socket.emit(REFETCH_CHATS, addMessage);

    // const chatData = await

    return callback({
      success: true,
      error: "Message sent Successfully",
      status: 201,
      data: {
        message: addMessage[0],
      },
    });
  },
);

export const replyMessage = asyncSocketAPIHandeler(
  async (
    socket: socketInterface,
    payload: userProps,
    data: SendMessageData,
    callback: (data: socketCallback<socketResponse>) => void,
  ) => {
    logger.debug(data, "new reply messageeeeee");

    const { message_ids, chat_ids, content, media, reciever_ids } = data;
    if (message_ids?.length !== 1 || (!content && !media)) {
      socket.emit(ERROR, "Data is Missing");
      return callback({
        message: "Data is missing...",
        status: 400,
        success: false,
      });
    }

    const messageData = await checkMessageExists(prisma, message_ids);

    // const memeberdata = await checkMemeberExists(
    //   prisma,
    //   messageData[0].chat_id,
    //   payload.userId,
    // );

    const message_id = message_ids[0];
    // if (messageData.length < 1) {
    //   throw new Error("Message not Found");
    // }

    let updated: messageProps[] = await prisma.$queryRaw`
    insert into message (content,sender_id, reply_to_message_id ,chat_id) values(${content},${payload.userId},${message_id} , ${messageData[0].chat_id}) returning *
    
    `;

    if (!updated) {
      throw new Error("Message reply Failed");
    }

    if (media && media.length > 0) {
      const addMedia: AttachmentProps[][] = await Promise.all(
        media.map((m) => {
          return prisma.$queryRaw<AttachmentProps[]>`

      insert into attachment (message_id,url,file_type,file_name,file_size) values(${updated[0].id},${m.url},${m.file_type.toLowerCase()},${m.file_name},${m.file_size}) returning *

      `;
        }),
      );

      if (!addMedia) {
        throw new Error();
      }

      updated = updated.map((msg) => ({
        ...msg,
        preview: addMedia[0][0].url,
      }));
    }
    // logger.debug(updated, "dadasdsdsad");

    const receiverSocketId = getSockets(reciever_ids[0]);
    if (receiverSocketId) {
      // logger.debug(
      //   "yes condition....................",
      //   chatSocketIds,
      //   receiverSocketId,
      // );
      socket.to(`chat:${chat_ids[0]}`).emit(NEW_MESSAGE, updated);
    }

    socket.to(`chat:${chat_ids[0]}`).emit(REFETCH_CHATS, updated);

    return callback({
      message: "Message Replied successfully",
      status: 201,
      success: true,
    });
  },
);

export const reactMessage = asyncSocketAPIHandeler(
  async (
    socket: socketInterface,
    payload: userProps,
    data: SendMessageData,
    callback: (data: socketCallback<socketResponse>) => void,
  ) => {
    const { message_ids, chat_ids, reciever_ids, react_id: reaction_id } = data;
    // logger.debug(data, "dataaaaaa");
    if (message_ids.length < 1 || !reaction_id) {
      socket.emit(ERROR, "data is missing");

      return callback({
        message: "data is Missing",
        success: false,
        status: 400,
      });
    }

    const message_id = message_ids[0];

    const [messaseData, reactionData] = await Promise.all([
      checkMessageExists(prisma, message_ids),
      prisma.$queryRaw<ReactionRow[]>`
      
      select react_id from reaction where react_id = ${reaction_id}

      `,
    ]);

    if (messaseData.length < 1 || reactionData.length < 1) {
      throw new Error("Message or Reaction doesnt exists or has been deleted");
    }

    const updated: MessageReaction[] = await prisma.$queryRaw`
    
    INSERT INTO message_reaction (
message_id,
reaction_id,
user_id
)

VALUES (
${message_id},
${reaction_id},
${payload.userId}
)

ON CONFLICT (message_id, user_id)

DO UPDATE
SET 
reaction_id = EXCLUDED.reaction_id,
updated_at = CURRENT_TIMESTAMP returning *;
    
    
    `;

    if (!updated) {
      throw new Error("Reaction Failed");
    }

    // logger.debug(updated, "updated reaction");

    const receiverSocketId = getSockets(reciever_ids[0]);
    if (receiverSocketId) {
      // logger.debug(
      //   "yes condition....................",
      //   chatSocketIds,
      //   receiverSocketId,
      // );
      socket.to(`chat:${chat_ids[0]}`).emit(MESSAGE_REACTION, {
        message_id: updated[0].message_id,
        react_id: updated[0].reaction_id,
        user_id: updated[0].user_id,
      });
    }
    // socket.emit(MESSAGE_REACTION, updated[0]);

    return callback({
      message: "Successfully Reacted Message",
      status: 201,
      success: true,
    });
  },
);

export const seenMessage = asyncSocketAPIHandeler(
  async (
    socket: socketInterface,
    payload: userProps,
    data: SendMessageData,
    callback: (data: socketCallback<socketResponse>) => void,
  ) => {
    const { message_ids, chat_id, reciever_id } = data;
    // logger.debug(data, "dataaaaaaaaaaa");
    if (message_ids && message_ids.length < 1) {
      return callback({
        message: "Message id is Missing",
        status: 400,
        success: false,
      });
    }

    await checkMessageExists(prisma, message_ids);

    // logger.debug(message_ids, "message idsss.");

    const seen = await prisma.seen_message.createManyAndReturn({
      data: message_ids.map((m) => ({
        message_id: m,
        user_id: payload.userId,
      })),
      skipDuplicates: true,
    });

    if (!seen) {
      throw new Error("Error in message seen");
    }

    const receiverSocketId = getSockets(reciever_id);
    if (receiverSocketId) {
      // logger.debug(
      //   "yes condition....................",
      //   chatSocketIds,
      //   receiverSocketId,
      // );

      const data = seen.map((d) => ({
        message_id: d.message_id,
        seen_user: d.user_id,
        seen_at: d.seen_at,
      }));

      // logger.debug(data, "dartaaa vent");
      // socket.to(receiverSocketId).emit(MESSAGE_SEEN, data);
      socket.to(`chat:${chat_id}`).emit(MESSAGE_SEEN, data);
    }

    // logger.debug(seen, "seend messagesssss");

    return callback({
      message: "Successfully Seen message",
      status: 201,
      success: true,
      data: {
        message_ids,
      },
    });
  },
);

export const editMessage = asyncSocketAPIHandeler(
  async (
    socket: socketInterface,
    payload: userProps,
    data: SendMessageData,
    callback: (data: socketCallback<socketResponse>) => void,
  ) => {
    logger.debug(data, "seen dataaa");
    const { message_ids, content, chat_id } = data;
    if (message_ids.length < 1 || !content) {
      return callback({
        message: "Data is missing",
        success: false,
        status: 400,
      });
    }

    const message_id = message_ids[0];

    const messageData: messageProps[] = await prisma.$queryRaw<messageProps[]>`
        
        select id,content,sender_id from message where id = ${message_id} and is_deleted = false limit 1
        
        `;

    // logger.debug(messageData, "message dataaa.");

    if (messageData.length < 1) {
      throw new Error("This message does not exist or has been deleted");
    }

    if (messageData[0].sender_id !== payload.userId) {
      throw new Error("You can only edit your message!");
    }

    const [editMessage, updateMessage] = await Promise.all([
      prisma.$queryRaw`

          insert into edit_message (message_id ,content ,old_content) values(${message_id},${content},${messageData[0].content})

          `,
      prisma.$queryRaw<messageProps[]>`

UPDATE message
SET 
    content = ${content},
    is_edited = true
WHERE id = ${message_id}    returning *

`,
    ]);

    if (!editMessage || !updateMessage) {
      throw new Error("Error in Updating");
    }

    // logger.debug(
    //   "yes condition....................",
    //   chatSocketIds,
    //   receiverSocketId,
    // );

    const datas = updateMessage.map((d) => ({
      id: d.id,
      content: d.content,
      is_edited: true,
    }));

    logger.debug(datas, "dartaaa vent");
    // socket.to(receiverSocketId).emit(MESSAGE_SEEN, data);
    socket.to(`chat:${chat_id}`).emit(EDIT_MESSAGE, datas[0]);
    // }
    return callback({
      message: "Message Edited successfully",
      status: 201,
      success: true,
      data: {
        message: updateMessage[0],
      },
    });
  },
);

export const sendTypingEvent = asyncSocketAPIHandeler(
  async (
    socket: socketInterface,
    payload: userProps,
    data: SendMessageData,
    callback: (data: socketCallback<socketResponse>) => void,
    typing: boolean,
  ) => {
    logger.debug(data, "new messageeeeee");
    const { reciever_ids, chat_id } = data;

    if (!data) {
      return callback({
        message: "Data is missing...",
        status: 400,
        success: false,
      });
    }

    // if(reciever_ids && reciever_ids.incldes(payload.userID))

    reciever_ids.forEach(async (reciever_id) => {
      const receiverInRoom = isReceiverInRoom(socket, reciever_id, chat_id);
      logger.debug(
        typing,
        "Receiver room mein hai type send kro:",
        receiverInRoom,
      );
      // logger.debug(`chat:${chat_ids[0]}`, "chat id room id");
      if (receiverInRoom) {
        // Receiver room mein hai — room pe emit karo

        socket
          .to(`chat:${chat_id}`)
          .emit(typing ? START_TYPING : STOP_TYPING, typing);
      }

      // logger.debug(
      //   notification,
      //   "notification dataaa",
      //   notificationRecieverSocketId,
      // );
    });

    // logger.debug(addMessage, "chatiddddd");
    // socket.emit(REFETCH_CHATS, addMessage);

    // const chatData = await
  },
);
