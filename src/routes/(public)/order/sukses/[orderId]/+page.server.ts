import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  return { orderId: params.orderId };
};
