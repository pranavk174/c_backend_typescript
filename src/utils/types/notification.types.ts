import { Seen } from "./base.type.js";

export interface notificationInputProps {
  notification_ids: number[];
}

export interface seenNotificationSocketResponse {
  updated: number;
  ignored: number;
  alreadySeen?: number | undefined;
}

export interface Notification {
  notification_id: number;
  reference_id: number | null;
  notification_type: "new_message" | "story_like" | "post_like" | "follow";
  name: string;
  message: string | unknown;
  metadata?: Record<string, unknown> | null;
  profile_pic: string;
  created_at?: Date;
  color?: string;
}

export interface Seen_notification extends Seen {
  notification_id: number;
}
