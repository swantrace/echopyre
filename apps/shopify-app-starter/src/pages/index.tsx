import type { NextApiRequest, NextApiResponse, GetServerSideProps } from "next";
import { createRouter } from "next-connect";
import { Button } from "ui";
import ensureInstalledOnShop from "../lib/ensure-installed-on-shop";

export default function Web({ method }: { method: string }) {
  console.log(method);
  return (
    <div>
      <h1>Web!</h1>
      <Button />
    </div>
  );
}

// @ts-ignore
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, res } = context;

  const router = createRouter<NextApiRequest, NextApiResponse>();
  return ensureInstalledOnShop(req, res, router, async () => {
    return { props: { method: "get" } };
  });
};
