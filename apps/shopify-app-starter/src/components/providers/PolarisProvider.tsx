import type { ReactNode } from "react";
import type { LinkLikeComponentProps } from "@shopify/polaris/build/ts/latest/src/utilities/link";
import { AppProvider } from "@shopify/polaris";
import translations from "@shopify/polaris/locales/en.json";
import NextLink from "next/link";

const Link = ({ children, href, ref, ...rest }: LinkLikeComponentProps) => {
  return (
    <NextLink
      {...rest}
      href={href ?? ""}
      ref={typeof ref === "string" ? null : ref}
    >
      {children}
    </NextLink>
  );
};

const PolarisProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AppProvider i18n={translations} linkComponent={Link}>
      {children}
    </AppProvider>
  );
};

export default PolarisProvider;
