module.exports = {
  reactStrictMode: true,
  transpilePackages: ["ui", "database"],
  env: {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  },
};
