import type { NextApiRequest, NextApiResponse } from "next";
import type { AppProps } from "next/app";
import App from "next/app";
import { createRouter, expressWrapper } from "next-connect";

const MyApp = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
};

// @ts-ignore
MyApp.getInitialProps = async (context: any) => {
  // const { req, res } = context;
  // if (req && res) {
  //   const router = createRouter<NextApiRequest, NextApiResponse>();
  //   const fs = await import("fs");
  //   const shopify = await import("../lib/shopify");
  //   // @ts-ignore
  //   router.use(expressWrapper<any, any>(shopify.ensureInstalledOnShop()));
  //   await router.run(req, res);
  // }
  const ctx = await App.getInitialProps(context);
  return ctx;
};

export default MyApp;
