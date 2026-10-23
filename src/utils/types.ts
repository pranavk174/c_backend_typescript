import { Socket } from "socket.io";

import type { GraphQLResolveInfo } from "graphql";
import { GraphQLSchemaWithContext } from "graphql-yoga";

export type asyncGraphQlMethodsType<T> = (
  parent: unknown,
  input: T,
  context: ctxProps,
  info: GraphQLResolveInfo,
) => Promise<unknown>;

export interface userProps {
  name: string;
  userId: number;
  profile_pic?: string | null;
  mobile: string;
  cover_pic?: string | null;
  bio?: string;
  email: string;
  device_id: string;
}
export interface socketInterface extends Socket {
  user: userProps;
}

export interface callbackError {
  message: string;
}

export interface socketCallback<T> {
  message?: string;
  status?: number;
  success: boolean;
  data?: T;
  error?: string;
}

export type SocketMethod<T, R> = (
  socket: socketInterface,
  payload: userProps,
  data: T,
  callback: (data: socketCallback<R>) => void,
) => Promise<void | socketCallback<T | R>>;

export type asyncMethodsType<T, R> = (data: T) => Promise<R>;

import { GraphQLError } from "graphql";
import { ctxProps } from "./types/graphqltypes/chat.type.js";
import { JwtPayload } from "jsonwebtoken";

export interface AppErrorOptions {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  cause?: Error | null;
}

export interface functionCallProps<T> {
  socket: socketInterface;
  payload: userProps;
  data: T;
  callback: socketCallback<T>;
}

export interface SendMessageData {
  content: string;
  id: number;
  media: mediaProps[];
  chat_ids: number[];
  client_msg_id: string;
  reciever_ids: number[];
  chat_type?: string;
  message_ids: number[];
  react_id?: number;
  chat_id?: number;
  reciever_id?: number;
  like: boolean;
  reaction_id: number;
}

export interface chatProps {
  id: number;
  chat_type: "private" | "group";
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
  deleted_at: Date | null;
}

export interface AllchatProps extends chatProps {
  user_id: number;
  isOnline: boolean;
  last_message_at: Date;
}

export interface allgroupChatProps extends chatProps {
  name: string;
  chat_id: number;
  last_message_at: Date;
}

export interface messageProps {
  id: number;
  chat_id: number;
  sender_id: number;
  is_deleted?: boolean;
  created_at: Date;
  seen_users?: number[];
  content?: string;
}

export interface ReactionRow {
  react_id: number;
}

export interface MessageReaction {
  message_reaction_id: number;
  message_id: number;
  reaction_id: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface chat_memberProps {
  chat_id: number;
  member_id: number;
}

// export interface SendMessageData {
//   message: messageProps;
// }

export interface socketResponse {
  message?: messageProps;
  message_ids?: number[];
}

export interface AttachmentProps extends mediaProps {
  id: number;
  message_id: number;
}

export interface mediaProps {
  url: string;
  file_type: string;
  file_name: string;
  file_size: number;
}
