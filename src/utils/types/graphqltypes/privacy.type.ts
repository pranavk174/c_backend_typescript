export interface privacyArgumentProps {
  privacy_type: PrivacyType;
  entity_type: PrivacyField;
  privacy_id: number;
}

export enum PrivacyField {
  PROFILE_PHOTO = "profile_photo",
  STATUS = "status",
  STORY = "story",
  ONLINE = "online",
  LAST_SEEN = "last_seen",
}

export interface privacyInputProps {
  input: {
    users: number[];
    privacy_id: number;
  };
}

export enum PrivacyType {
  EVERYONE = "everyone",
  CONTACTS = "contacts",
  ONLY_SHARE_WITH = "only_share_with",
  CONTACTS_EXCEPT = "contacts_except",
}
