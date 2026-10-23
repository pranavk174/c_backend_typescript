import type { GraphQLResolveInfo } from "graphql";
import { GraphQLSchemaWithContext } from "graphql-yoga";
import { userProps } from "../types.js";
import { Socket } from "socket.io";
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

export interface socketInterface extends Socket {
  user: userProps;
}

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
