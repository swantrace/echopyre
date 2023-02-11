import type { NextApiRequest, NextApiResponse } from "next";
import type Express from "express";
import { DataType, GraphqlQueryError } from "@shopify/shopify-api";
import { createRouter, expressWrapper } from "next-connect";
import shopify from "../../lib/shopify";
import GDPRWebhookHandlers from "../../lib/gdpr";

export interface HeaderParams {
  [key: string]: string | number | string[];
}

export declare type QueryParams =
  | string
  | number
  | string[]
  | number[]
  | {
      [key: string]: QueryParams;
    };

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use((req, res, next) => {
  //@ts-ignore
  res.locals = {};
  next();
});

router.get(
  shopify.config.auth.path,
  expressWrapper<any, any>(shopify.auth.begin())
);

router.get(
  shopify.config.auth.callbackPath,
  expressWrapper<any, any>(shopify.auth.callback()),
  expressWrapper<any, any>(shopify.redirectToShopifyOrAppRoot())
);

router.post(
  shopify.config.webhooks.path,
  ...shopify
    .processWebhooks({
      webhookHandlers: GDPRWebhookHandlers,
    })
    .map((handler) => expressWrapper<any, any>(handler))
);
// All endpoints after this point will require an active session
router.use(
  "/api/*",
  expressWrapper<any, any>(shopify.validateAuthenticatedSession())
);

router.post(
  "/api/graphql",
  expressWrapper(async (req, res) => {
    const session = (res as unknown as Express.Response).locals.shopify.session;
    const client = new shopify.api.clients.Graphql({ session });
    const { data, query = {}, extraHeaders = {}, tries = 1 } = req.body;

    try {
      const { body } = await client.query({
        data,
        query,
        extraHeaders,
        tries,
      });

      res.status(200).send(body);
    } catch (e: any) {
      if (e instanceof GraphqlQueryError) {
        res
          .status((e.response?.code as number) ?? 500)
          .send({ error: (e.response?.errors as Error[])?.[0]?.message });
      } else {
        res.status(500).send({ error: e.message });
      }
    }
  })
);

router.post(
  "/api/rest",
  expressWrapper(async (req, res) => {
    const session = (res as unknown as Express.Response).locals.shopify.session;
    const client = new shopify.api.clients.Rest({ session });

    const {
      method,
      path,
      data = {},
      type = DataType.JSON,
      query = {},
      extraHeaders = {},
      tries = 1,
    }: {
      method: "get" | "post" | "put" | "delete";
      path: string;
      data?: any;
      type?: DataType;
      query?: {
        [key: string]: QueryParams;
      };
      extraHeaders?: HeaderParams;
      tries?: number;
    } = req.body;

    try {
      const { body } = await client[method]({
        path,
        data,
        type,
        query,
        extraHeaders,
        tries,
      });

      (res as unknown as Express.Response).send(body);
    } catch (e: any) {
      (res as unknown as Express.Response)
        .status(e.response?.code ?? 500)
        .send({
          error:
            Object.entries(e.response?.body?.errors ?? {})
              .map(([key, value]) => `${key}: ${value}`)
              .join("; ") ||
            e.message ||
            "unknown error",
        });
    }
  })
);

export default router.handler({
  onError: (err: any, req, res) => {
    console.error(err.stack);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
});
