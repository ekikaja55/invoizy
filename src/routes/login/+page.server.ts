import type { PageServerLoad } from "./$types";
import {logger } from "$lib/server/logger";
import { redirect } from "@sveltejs/kit";
export const load: PageServerLoad = async (event) => {
  logger.debug("TEST PAGE SERVER LOGIIN - Isi user", event.locals.user);
  if (event.locals.user) throw redirect(303, "/admin");
  return {}
}
