import { GraphQLSchemaWithContext, YogaInitialContext } from "graphql-yoga";
import { mediaProps, userProps } from "../../types.js";
import type { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
export interface chatArgumentProps {
  member_id: number;
  url: string;
  chat_id: number;
  user_id: number;
}

export interface chatInputProps {
  input: {
    member_ids: number[];
    groupName: string;
    profile_pic: string | null;
    chat_ids: number[];
    reciever_ids: number[];
    content: string | null;
    media: mediaProps[];
    message_ids: number[];
    delete_type: "everyone" | "onlyme";
    reaction_id: number;
    cursor: number | null;
    limit: number;
  };
}

export interface createChatGqlProp {
  parent: unknown;
  data: chatInputProps;
  ctx: {
    user: userProps;
  };
}

// export interface ctxProps {

//   res: Response;
// }

export interface ctxProps extends YogaInitialContext {
  req: Request;
  res: Response;
  user: userProps | JwtPayload;
}

export interface wallpaperProps {
  url: string;
}

export type ChatResponseType =
  | "Emojis"
  | "SingleChat"
  | "newChat"
  | "AllChats"
  | "members"
  | "Wallpaper";
