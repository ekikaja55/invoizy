import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  return { orderId: params.orderId, token: url.searchParams.get('token') };
};
