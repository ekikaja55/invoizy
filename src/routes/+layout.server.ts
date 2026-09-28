// src/routes/+layout.server.ts
import { logger } from "$lib/server/logger";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  logger.info("Masuk layout server root");
  
  if (!event.locals.user) {
    logger.info("User Null");
    return {
      user: null
    };
  }

  logger.info("Ada data user");
  return {
    user: event.locals.user
  };
};