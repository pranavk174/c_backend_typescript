import { ServerResponse } from "node:http";

export interface userInputProps {
  input: {
    email: string;
    otp: string;
    device_id: string;
    ip_address: string;
    location: string;
    device_name: string;
  };
}

export interface userArgumentProps {
  email: string;
}

export interface CookieOptions {
  domain?: string;
  encode?: (value: string) => string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  secure?: boolean;
  sameSite?: boolean | "lax" | "strict" | "none";
  priority?: "low" | "medium" | "high";
  signed?: boolean;
  partitioned?: boolean;
}

export interface CustomResponse extends ServerResponse {
  cookie(name: string, value: string, options?: CookieOptions): this;
}

// ==================== ENUMS ====================

export enum Theme {
  DARK = "dark",
  LIGHT = "light",
}

export enum AccountStatus {
  DELETE = "delete",
  DELETE_UPPER = "DELETE",
  SUSPEND = "suspend",
  SUSPEND_UPPER = "SUSPEND",
}

// ==================== INTERFACES ====================

export interface Email {
  email: string;
}

export interface Otp extends Email {
  otp: string;
}

export interface User extends Email {
  name: string;
  id: number;
  user_name: string;
  bio: string | null;
  mobile: string;
  profile_pic: string | null;
  chat_id: number | null;
  cover_pic: string | null;
  theme?: Theme;
}

export interface Users {
  items: User[];
}

export interface userInputs {
  fname: string;
  lname: string;
  user_name: string;
  email: string;
  bio?: string | null;
  mobile: string;
  profile_pic?: string | null;
  cover_pic?: string | null;
}

export interface UserInput {
  input: userInputs;
}

export interface UpdateUserInput {
  name?: string;
  bio?: string;
  cover_pic?: string;
  profile_pic?: string;
  theme?: Theme;
}

export interface VerifyOtpData {
  email: string;
  id: number;
  is_verified: boolean | null;
}

export interface PersonalizationInput {
  theme?: Theme | null;
}

export interface VerifyOtpInput {
  device_id: string;
  ip_address: string;
  location: string;
  device_name: string;
  email: string;
  mobile?: string | null;
  otp: string;
}

export interface DeviceProps {
  login_id: number;
  device_id: string;
  device_name: string;
  user_id: number;
  created_at: Date;
  ip_address: string;
  location: string;
  refresh_token: string;
  expires_at: Date;
  last_login: Date;
  logged_out_at: Date | null;
  session_id: string;
}

export interface BlockUserInput {
  blocked_user_id: number;
  reason?: string | null;
}

// ==================== RESPONSE TYPES ====================

export interface ApiResponse {
  message: string;
  status: number;
  success: boolean | null;
  data: ResponseData | null;
  error: string | null;
}

export type ResponseData = Users | User | VerifyOtpData;

// ==================== GRAPHQL API RESPONSE ====================

export interface UserApiResponse {
  message: string;
  status: number;
  success: boolean | null;
  data: ResponseData | null;
  error: string | null;
}

export interface Cookie {
  name: string;
  value: string;
}

export interface OtpData {
  otp_id: number | null;
  email: string;
  otp: string;
  created_at: Date;
  expires_at: Date;
}
