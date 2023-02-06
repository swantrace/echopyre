import type { NextApiRequest, NextApiResponse } from "next";
import type Express from "express";
import { createRouter, expressWrapper } from "next-connect";
import express from "express";
import shopify from "../../lib/shopify";
import productCreator from "../../lib/product-creator";
import GDPRWebhookHandlers from "../../lib/gdpr";

// to do: figure out if PORT is useful
// const PORT = parseInt(
//   process.env.BACKEND_PORT || process.env.PORT || "3000",
//   10
// );

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
router.use(expressWrapper(express.json()));
router.get(
  "/api/products/count",
  expressWrapper(async (_req, res) => {
    const countData = await shopify.api.rest.Product.count({
      session: (res as unknown as Express.Response).locals.shopify.session,
    });
    res.status(200).send(countData);
  })
);
router.get(
  "/api/products/create",
  expressWrapper(async (_req, res) => {
    let status = 200;
    let error = null;

    try {
      await productCreator(
        (res as unknown as Express.Response).locals.shopify.session
      );
    } catch (e: any) {
      console.log(`Failed to process products/create: ${e.message}`);
      status = 500;
      error = e.message;
    }
    res.status(status).send({ success: status === 200, error });
  })
);
// to do: use middleware to protect frontend pages
// shopify.ensureInstalledOnShop()

// create a handler from router with custom
// onError and onNoMatch
export default router.handler({
  onError: (err: any, req, res) => {
    console.error(err.stack);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
});
