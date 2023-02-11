import type { NextApiRequest, NextApiResponse, GetServerSideProps } from "next";
import { createRouter } from "next-connect";
import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Stack,
  Link,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { ProductsCard } from "../components/ProductsCard";
import ensureInstalledOnShop from "../lib/ensure-installed-on-shop";

export default function Web({ url }: { url: string }) {
  console.log(url);
  return (
    <Page narrowWidth>
      <TitleBar title="App name" primaryAction={undefined} />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack
              wrap={false}
              spacing="extraTight"
              distribution="trailing"
              alignment="center"
            >
              <Stack.Item fill>
                <TextContainer spacing="loose">
                  <Text variant="headingMd" as="h2">
                    Nice work on building a Shopify app 🎉
                  </Text>
                  <p>
                    Your app is ready to explore! It contains everything you
                    need to get started including the{" "}
                    <Link
                      url="https://polaris.shopify.com/"
                      external={"true" as unknown as boolean}
                    >
                      Polaris design system
                    </Link>
                    ,{" "}
                    <Link
                      url="https://shopify.dev/api/admin-graphql"
                      external={"true" as unknown as boolean}
                    >
                      Shopify Admin API
                    </Link>
                    , and{" "}
                    <Link
                      url="https://shopify.dev/apps/tools/app-bridge"
                      external={"true" as unknown as boolean}
                    >
                      App Bridge
                    </Link>{" "}
                    UI library and components.
                  </p>
                  <p>
                    Ready to go? Start populating your app with some sample
                    products to view and test in your store.{" "}
                  </p>
                  <p>
                    Learn more about building out your app in{" "}
                    <Link
                      url="https://shopify.dev/apps/getting-started/add-functionality"
                      external={"true" as unknown as boolean}
                    >
                      this Shopify tutorial
                    </Link>{" "}
                    📚{" "}
                  </p>
                </TextContainer>
              </Stack.Item>
              <Stack.Item>
                <div style={{ padding: "0 20px" }}>
                  <Image
                    source="/images/home-trophy.png"
                    alt="Nice work on building a Shopify app"
                    width={120}
                  />
                </div>
              </Stack.Item>
            </Stack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <ProductsCard />
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// @ts-ignore
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, res } = context;
  if (new URLSearchParams(req.url?.split("?")?.[1])?.get("shop")) {
    const router = createRouter<NextApiRequest, NextApiResponse>();
    return ensureInstalledOnShop(req, res, router, async () => {
      return { props: { url: req.url } };
    });
  }
  return { props: {} };
};
