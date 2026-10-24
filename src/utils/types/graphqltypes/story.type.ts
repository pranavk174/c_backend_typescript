export interface storyArgumentProps {
  id: number;
  content: string;
}

export enum ForwardType {
  PRIVATE = "private",
  GROUP = "group",
}

export interface ForwardTargetInput {
  type: ForwardType;
  recipientId: number;
  chatId?: number;
}

export interface storyInputProps {
  input: {
    content: string;
    text_data: string;
    message_ids: number[];
    id: number;
    like: boolean;
    reaction_id: number;
    storyId: number;
    message?: string | null;
    targets: ForwardTargetInput[];
  };
}

export interface Story {
  id: number;
  user_id: number;
  text_data?: string | null;
  content?: string | null;
  created_at: string;
  name: string;
  profile_pic?: string | null;
  likes_count: bigint;
  expires_at: string;
  seen: boolean;
  liked: boolean;
}

export interface Interactions {
  id: number;
  name: string;
  seen: boolean;
  liked: boolean;
  seen_at: string;
  liked_at?: string | null;
  profile_pic?: string | null;
}

export interface StoryContent {
  id: number;
  text_data: string | null;
  content: string | null;
  created_at: Date;
  seen?: boolean | null;
  liked?: boolean | null;
  interactions?: Interactions[] | null;
}

export interface UserStories {
  user_id: number;
  name: string;
  profile_pic?: string | null;
  stories?: StoryContent[] | null;
}

export interface StoryData {
  story?: UserStories | null;
}

export interface StoriesData {
  stories: UserStories[];
}

export interface StoryProps {
  id: number;
  user_id: number;
  content: string;
  created_at: Date;
  expires_at: Date;
  is_deleted: boolean;
  text_data: string | null;
  seen?: boolean;
  liked?: boolean;
}

export interface storyResponseProps {
  id: number;
  user_id: number;
  content: string | null;
  text_data: string | null;
  created_at: Date;
  expires_at: Date;
  is_deleted: boolean;
  interactions: Interactions[];
  name: string | null;
  profile_pic: string | null;

  stories: Story[];
  liked: boolean;
  seen: boolean;
}

export interface GroupedStoryContent {
  id: number;
  text_data: string | null;
  seen: boolean;
  liked: boolean;
  content: string | null;
  created_at: Date;
}

export interface GroupedUserStories {
  user_id: number;
  name: string | null;
  profile_pic: string | null;
  isOwn: boolean;
  stories: GroupedStoryContent[];
}

export interface UserStoriess {
  user_id: number;
  name: string | null;
  profile_pic: string | null;
  isOwn: boolean;
  stories: StoryContent[];
}

export interface GroupedStories {
  [user_id: number]: GroupedUserStories;
}

export interface GroupedUserStoriess {
  [user_id: number]: UserStoriess;
}

export type StoryResponseType = "StoriesData" | "StoryData";
