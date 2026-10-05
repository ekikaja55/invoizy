import { getActiveCatalog } from '$lib/server/db/queries/order';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const catalog = await getActiveCatalog();

  const productCategories = catalog.filter((c) => !c.isShipping);
  const shippingCategory = catalog.find((c) => c.isShipping) ?? null;

  return { productCategories, shippingCategory };
};
