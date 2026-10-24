export interface chatArgumentProps {
  member_id: number;
  url: string;
}

export interface notificationInputProps {
  input: {
    notification_ids: number[];
  };
}

export type NotificationResponseType = "notifications" | "notification";
