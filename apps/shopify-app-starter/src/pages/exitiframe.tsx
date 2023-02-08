import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge, Loading } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ExitIframe() {
  const app = useAppBridge();
  const { asPath } = useRouter();

  useEffect(() => {
    const { search } = new URL(`https://anything${asPath}`);
    if (!!app && !!search) {
      const params = new URLSearchParams(search);
      const redirectUri = params.get("redirectUri");
      const url = new URL(decodeURIComponent(redirectUri ?? ""));

      if (url.hostname === location.hostname) {
        const redirect = Redirect.create(app);
        redirect.dispatch(
          Redirect.Action.REMOTE,
          decodeURIComponent(redirectUri ?? "")
        );
      }
    }
  }, [app, asPath]);

  return <Loading />;
}
