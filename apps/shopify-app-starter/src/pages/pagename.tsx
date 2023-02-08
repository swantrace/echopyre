import type { NextApiRequest, NextApiResponse, GetServerSideProps } from "next";
import { Card, Page, Layout, TextContainer, Text } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { createRouter } from "next-connect";
import ensureInstalledOnShop from "../lib/ensure-installed-on-shop";
export default function PageName() {
  return (
    <Page>
      <TitleBar
        title="Page name"
        primaryAction={{
          content: "Primary action",
          onAction: () => console.log("Primary action"),
        }}
        secondaryActions={[
          {
            content: "Secondary action",
            onAction: () => console.log("Secondary action"),
          },
        ]}
      />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Text variant="headingMd" as="h2">
              Heading
            </Text>
            <TextContainer>
              <p>Body</p>
            </TextContainer>
          </Card>
          <Card sectioned>
            <Text variant="headingMd" as="h2">
              Heading
            </Text>
            <TextContainer>
              <p>Body</p>
            </TextContainer>
          </Card>
        </Layout.Section>
        <Layout.Section secondary>
          <Card sectioned>
            <Text variant="headingMd" as="h2">
              Heading
            </Text>
            <TextContainer>
              <p>Body</p>
            </TextContainer>
          </Card>
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
