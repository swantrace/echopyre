import type { BillingConfig } from "@shopify/shopify-api/lib/billing/types";
import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-01";
import SupabaseSessionStorage from "./session-storage";

const billingConfig: BillingConfig = {
  "My Shopify One-Time Charge": {
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};
// to do: DB_PATH, billingConfig should be passed to a library in packages

// to do: shopify should be exported from library
export const config = {
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    billing: billingConfig, // or replace with billingConfig above to enable example billing
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage: new SupabaseSessionStorage(),
};

const shopify = shopifyApp(config);

export default shopify;
