import { logger } from "../../utils/logger.js";

import { getNotificationQUery } from "../controllers/Notification/notification.query.js";
import { seenNotificationMutation } from "../controllers/Notification/notification.mutation.js";
import { GraphqlResponseObject } from "@/utils/types/base.type.js";
import { NotificationResponseType } from "@/utils/types/graphqltypes/notification.type.js";
export const notificationResolver = {
  ResponseData: {
    __resolverType(obj: GraphqlResponseObject<NotificationResponseType>) {
      logger.debug(obj, "object dataaaa notificationssssss");
      if (obj._responseType === "notifications") {
        return "notifications";
      }
      if (obj._responseType === "notification") {
        return "notification";
      }
      return null;
    },
  },
  Query: {
    getNotification: getNotificationQUery,
  },
  Mutation: {
    seenNotification: seenNotificationMutation,
  },
  Resolver: {},
};
