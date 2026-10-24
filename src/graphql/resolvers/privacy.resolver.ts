import prisma from "../../prisma/prisma-client.js";
import { AppError } from "../../lib/errorHandler.js";
import { validateToken } from "../../lib/tokenvalidator.js";
import { asyncGraphqlAPIHandeler } from "../../lib/util.js";
import { logger } from "../../utils/logger.js";
import {
  updatePrivacySettingsMutation,
  updatePrivacyUsersMutation,
} from "../controllers/Privacy/privacy.mutation.js";
import {
  getPrivacUsersQuery,
  getPrivacySettingsQuery,
} from "../controllers/Privacy/privacy.query.js";

export const privacyResolvers = {
  Query: {
    getPrivacySettings: getPrivacySettingsQuery,
    getPrivacyUsers: getPrivacUsersQuery,
  },
  Mutation: {
    updatePrivacySettings: updatePrivacySettingsMutation,
    updatePrivacyUsers: updatePrivacyUsersMutation,
  },
};
