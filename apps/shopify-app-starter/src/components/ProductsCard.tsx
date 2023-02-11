import type { ReactQueryMeta } from "./providers/QueryProvider";
import { useState } from "react";
import { Card, TextContainer, Text } from "@shopify/polaris";
import { Toast } from "@shopify/app-bridge-react";
import { useMutation, useQuery } from "@tanstack/react-query";

const ADJECTIVES = [
  "autumn",
  "hidden",
  "bitter",
  "misty",
  "silent",
  "empty",
  "dry",
  "dark",
  "summer",
  "icy",
  "delicate",
  "quiet",
  "white",
  "cool",
  "spring",
  "winter",
  "patient",
  "twilight",
  "dawn",
  "crimson",
  "wispy",
  "weathered",
  "blue",
  "billowing",
  "broken",
  "cold",
  "damp",
  "falling",
  "frosty",
  "green",
  "long",
];

const NOUNS = [
  "waterfall",
  "river",
  "breeze",
  "moon",
  "rain",
  "wind",
  "sea",
  "morning",
  "snow",
  "lake",
  "sunset",
  "pine",
  "shadow",
  "leaf",
  "dawn",
  "glitter",
  "forest",
  "hill",
  "cloud",
  "meadow",
  "sun",
  "glade",
  "bird",
  "brook",
  "butterfly",
  "bush",
  "dew",
  "dust",
  "field",
  "fire",
  "flower",
];

export function randomTitle() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective} ${noun}`;
}

export function randomPrice() {
  return Math.round((Math.random() * 10 + Number.EPSILON) * 100) / 100;
}

const productsCountMeta: ReactQueryMeta = {
  api: "rest",
  method: "get",
  path: "products/count",
};

const productsQueryMeta: ReactQueryMeta = {
  api: "graphql",
  data: `{
    products (first: 10) {
      edges {
        node {
          id
          title
          descriptionHtml
        }
      }
    }
    shop {
      email
    }
  }`,
};

export function ProductsCard() {
  const emptyToastProps = { content: "", error: false };
  const [isLoading, setIsLoading] = useState(true);
  const [toastProps, setToastProps] = useState(emptyToastProps);

  const {
    data,
    error: productCountError,
    refetch: refetchProductCount,
    isLoading: isLoadingCount,
    isRefetching: isRefetchingCount,
  } = useQuery({
    queryKey: ["rest", "product", "count"],
    meta: productsCountMeta,
    initialData: {
      count: 0,
    },
    onSuccess: () => {
      setIsLoading(false);
    },
  });

  const { data: products, error: productsError } = useQuery({
    queryKey: ["graphql", "products"],
    meta: productsQueryMeta,
  });

  const { error: createProductsError, mutate: createProducts } = useMutation<
    any,
    any,
    ReactQueryMeta
  >({
    onMutate: async () => {
      setIsLoading(true);
    },
    onSuccess: async () => {
      await refetchProductCount();
      setToastProps({ content: "5 products created!", error: false });
    },
    onError: async () => {
      setIsLoading(false);
      setToastProps({
        content: "There was an error creating products",
        error: true,
      });
    },
  });

  const toastMarkup = toastProps.content && !isRefetchingCount && (
    <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
  );

  const handlePopulate = async () => {
    for (let i = 0; i < 5; i++) {
      createProducts({
        api: "rest",
        method: "post",
        path: "products",
        data: {
          product: {
            title: `${randomTitle()}`,
            variants: [{ price: randomPrice() }],
          },
        },
      });
    }
  };

  return (
    <>
      {toastMarkup}
      <Card
        title="Product Counter"
        sectioned
        primaryFooterAction={{
          content: "Populate 5 products",
          onAction: handlePopulate,
          loading: isLoading,
        }}
      >
        <TextContainer spacing="loose">
          <p>
            Sample products are created with a default title and price. You can
            remove them at any time.
          </p>
          <Text variant="headingMd" as="h4">
            TOTAL PRODUCTS
            <Text variant="headingXl" as="p">
              <Text variant="bodyMd" as="span" fontWeight="semibold">
                {isLoadingCount ? "-" : data.count}
              </Text>
            </Text>
          </Text>
        </TextContainer>
      </Card>
    </>
  );
}
