import { GraphqlResponseObject } from "@/utils/types/base.type.js";
import {
  createStoryMutation,
  deleteStoryMutation,
  forwardStoryMutation,
  likeStoryMutation,
  replyToStoryMutation,
  seenStoryMutation,
} from "../controllers/Story/story.mutation.js";
import {
  getAllStoriesQuery,
  getStoryByIdQuery,
} from "../controllers/Story/story.query.js";
import { StoryResponseType } from "@/utils/types/graphqltypes/story.type.js";

const Storyresolver = {
  storyResponseData: {
    __resolveType(obj: GraphqlResponseObject<StoryResponseType>) {
      // multiple stories
      if (obj.stories) {
        return "StoriesData";
      }
      // single story — check key existence since text_data can be null
      if ("id" in obj) {
        return "StoryData";
      }
      return null;
    },
  },
  Query: {
    getStoryById: getStoryByIdQuery,
    getAllStories: getAllStoriesQuery,
  },
  Mutation: {
    createStory: createStoryMutation,
    likeStory: likeStoryMutation,
    seenStory: seenStoryMutation,
    replyToStory: replyToStoryMutation,
    forwardStory: forwardStoryMutation,
    deleteStory: deleteStoryMutation,
  },
};

export default Storyresolver;
