import { logger } from "$lib/server/logger";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  logger.info("Masuk layout server root")
  if (!event.locals.user) {
    logger.info("User Null")
    return {
      data: null,
    }
  }
  logger.info("Ada data user")
  return {
    data:event.locals.user
  }
}
