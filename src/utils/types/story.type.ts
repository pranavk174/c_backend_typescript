import { Seen } from "./base.type.js";

export interface storySocketResponse {}

export interface StorySeen extends Seen {
  story_id: number;
  profile_pic?: string | null;
  name?: string;
}
