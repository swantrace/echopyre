import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { PolarisProvider, QueryProvider } from "../components/providers";
import "@shopify/polaris/build/esm/styles.css";

const AppBridgeProvider = dynamic(
  () => import("../components/providers/AppBridgeProvider"),
  { ssr: false }
);

const NavigationMenu = dynamic(
  () =>
    import("@shopify/app-bridge-react").then(
      ({ NavigationMenu }) => NavigationMenu
    ),
  { ssr: false }
);

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <PolarisProvider>
      <AppBridgeProvider>
        <QueryProvider>
          <NavigationMenu
            navigationLinks={[
              {
                label: "Page name",
                destination: "/pagename",
              },
            ]}
          />
          <Component {...pageProps} />
        </QueryProvider>
      </AppBridgeProvider>
    </PolarisProvider>
  );
};

export default MyApp;
