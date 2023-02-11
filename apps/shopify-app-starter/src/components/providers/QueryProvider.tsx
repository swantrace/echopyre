import { ReactNode, useCallback, useMemo } from "react";
import type { QueryFunctionContext } from "@tanstack/react-query";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticatedFetch } from "@shopify/app-bridge-utils";
import { DataType } from "@shopify/shopify-api";

export type ReactQueryMeta =
  | {
      api: "rest";
      method: "get" | "post" | "put" | "delete";
      path: string;
      data?: { [key: string]: unknown } | string;
      query?: { [key: string]: string | number };
      type?: DataType;
      extraHeaders?: { [key: string]: string | number };
      tries?: number;
      withExtensions?: never;
    }
  | {
      api: "graphql";
      data: { query: string; variables: { [key: string]: unknown } } | string;
      query?: { [key: string]: string | number };
      extraHeaders?: { [key: string]: string | number };
      tries?: number;
      withExtensions?: boolean;
    };

const checkHeadersForReauthorization = (headers: any, app: any) => {
  if (headers.get("X-Shopify-API-Request-Failure-Reauthorize") === "1") {
    const authUrlHeader =
      headers.get("X-Shopify-API-Request-Failure-Reauthorize-Url") ||
      `/api/auth`;

    const redirect = Redirect.create(app);
    redirect.dispatch(
      Redirect.Action.REMOTE,
      authUrlHeader.startsWith("/")
        ? `https://${window.location.host}${authUrlHeader}`
        : authUrlHeader
    );
  }
};

const sendRequest = async ({
  fetch,
  api,
  withExtensions,
  others,
  app,
}: {
  fetch: Function;
  api: "rest" | "graphql";
  withExtensions: boolean | never;
  others: any;
  app: any;
}) => {
  const rawResponse = await fetch(`/api/${api}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(others),
  });
  const response = await rawResponse.json();
  checkHeadersForReauthorization(rawResponse.headers, app);
  if (response.error) {
    throw new Error(response.error);
  } else {
    return api === "graphql" && withExtensions === false
      ? response.data
      : response;
  }
};

const createDefaultQueryFn =
  (fetchFunction: Function, app: any) =>
  async ({ meta }: QueryFunctionContext) => {
    const { api, withExtensions = false, ...others } = meta as ReactQueryMeta;
    return await sendRequest({
      fetch: fetchFunction,
      api,
      withExtensions,
      others,
      app,
    });
  };

const createDefaultMutationFn =
  (fetchFunction: Function, app: any) => async (variables: any) => {
    const {
      api,
      withExtensions = false,
      ...others
    } = variables as ReactQueryMeta;
    return await sendRequest({
      fetch: fetchFunction,
      api,
      withExtensions,
      others,
      app,
    });
  };

const QueryProvider = ({ children }: { children: ReactNode }) => {
  const app = useAppBridge();
  const fetchFunction = useMemo(
    () => authenticatedFetch(app),
    [app, authenticatedFetch]
  );
  const cachedDefaultQueryFn = useMemo(
    () => createDefaultQueryFn(fetchFunction, app),
    [fetchFunction, app]
  );
  const cachedDefaultMutationFn = useMemo(
    () => createDefaultMutationFn(fetchFunction, app),
    [fetchFunction, app]
  );
  const client = new QueryClient({
    queryCache: new QueryCache(),
    mutationCache: new MutationCache(),
    defaultOptions: {
      queries: {
        queryFn: cachedDefaultQueryFn,
        retry: false,
      },
      mutations: {
        mutationFn: cachedDefaultMutationFn,
        retry: false,
      },
    },
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

export default QueryProvider;
