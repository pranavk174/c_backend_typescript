// import prisma from "../../../prisma/prisma-client";
import { userProps } from "@/utils/types.js";
import prisma from "../../../prisma/prisma-client.js";

export const updateLastSeen = async (payload: userProps) => {
  const CURRENT_TIMESTAMP = Date.now();
  try {
    const update = await prisma.$queryRaw`
        
        INSERT INTO user_presence (
            updated_at,
            last_seen,
            user_id
            )
            
            -- VALUES (
            -- ${CURRENT_TIMESTAMP},
            -- ${CURRENT_TIMESTAMP},
            -- ${payload.userId}
            -- )
            
            ON CONFLICT (user_id)
            
            DO UPDATE
            SET 
            last_seen = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP returning *;

        
        `;
  } catch (error) {
    return {};
  }
};
