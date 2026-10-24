import type { GraphQLResolveInfo } from "graphql";
import { GraphQLSchemaWithContext } from "graphql-yoga";
import { userProps } from "../types.js";
import { Socket } from "socket.io";
import { JwtPayload } from "jsonwebtoken";
export type asyncGraphQlMethodsType<T> = (
  parent: unknown,
  input: T,
  context: userProps,
  info: GraphQLResolveInfo,
) => Promise<unknown>;

export interface socketCallback<T> {
  message?: string;
  status?: number;
  success: boolean;
  data?: T;
  error?: string;
}

export interface SocketData {
  user: userProps | JwtPayload;
}

interface CustomEvents {
  [event: string]: (...args: any[]) => void;
}
export type socketInterface = Socket<
  CustomEvents,
  CustomEvents,
  CustomEvents,
  SocketData
>;

export type SocketMethod<T, R> = (
  socket: socketInterface,
  payload: userProps,
  data: T,
  callback: (data: socketCallback<R>) => void,
) => Promise<void | socketCallback<T | R>>;

export type asyncMethodsType<T> = (data: T) => Promise<void>;

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

export interface Seen {
  seen_id: number;
  user_id: number;
  seen_at: Date;
}

export interface GraphqlResponseObject<T> {
  _responseType: T;
  [key: string]: unknown;
}
