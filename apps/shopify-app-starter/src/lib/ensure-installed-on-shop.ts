import type { NextApiRequest, NextApiResponse } from "next";
import type { NodeRouter } from "next-connect/dist/types/node";
import { expressWrapper } from "next-connect";
import shopify from "./shopify";
import convertRequestAndResponseToExpressMiddleware from "./get-serverside-props-express-connector";

export default function ensureInstalledOnShop(
  req: any,
  res: any,
  router: NodeRouter<NextApiRequest, NextApiResponse<any>>,
  fn: Function
) {
  router
    .use(convertRequestAndResponseToExpressMiddleware)
    .use(expressWrapper<any, any>(shopify.ensureInstalledOnShop()))
    .get(fn as any);
  // @ts-ignore
  return router.run(req, res);
}
