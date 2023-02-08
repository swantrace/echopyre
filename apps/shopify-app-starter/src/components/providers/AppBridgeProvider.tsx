import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Provider } from "@shopify/app-bridge-react";
import { Banner, Layout, Page } from "@shopify/polaris";
import { useRouter } from "next/router";

declare global {
  interface Window {
    __SHOPIFY_DEV_HOST: string;
  }
}

const AppBridgeProvider = ({ children }: { children: ReactNode }) => {
  const { asPath, replace: nextRouterReplace } = useRouter();

  const routerConfig = useMemo(() => {
    const { pathname, search, hash } = new URL(`https://anything${asPath}`);
    return {
      history: {
        replace: (path: string) =>
          nextRouterReplace(path) as unknown as (path: string) => void,
      },
      location: {
        pathname,
        search,
        hash,
      },
    };
  }, [asPath, nextRouterReplace]);

  const [appBridgeConfig] = useState<{
    host: string;
    apiKey: string;
    forceRedirect: boolean;
  }>(() => {
    const host =
      new URLSearchParams(routerConfig.location.search).get("host") ||
      window.__SHOPIFY_DEV_HOST;

    window.__SHOPIFY_DEV_HOST = host;

    return {
      host,
      apiKey: process.env.SHOPIFY_API_KEY!,
      forceRedirect: true,
    };
  });

  if (!process.env.SHOPIFY_API_KEY || !appBridgeConfig.host) {
    const bannerProps = !process.env.SHOPIFY_API_KEY
      ? {
          title: "Missing Shopify API Key",
          children: (
            <>
              Your app is running without the SHOPIFY_API_KEY environment
              variable. Please ensure that it is set when running or building
              your React app.
            </>
          ),
        }
      : {
          title: "Missing host query argument",
          children: (
            <>
              Your app can only load if the URL has a <b>host</b> argument.
              Please ensure that it is set, or access your app using the
              Partners Dashboard <b>Test your app</b> feature
            </>
          ),
        };

    return (
      <Page narrowWidth>
        <Layout>
          <Layout.Section>
            <div style={{ marginTop: "100px" }}>
              <Banner {...bannerProps} status="critical" />
            </div>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Provider config={appBridgeConfig} router={routerConfig}>
      {children}
    </Provider>
  );
};

export default AppBridgeProvider;
