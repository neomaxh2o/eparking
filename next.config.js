/** @type {import('next').NextConfig} */
const nextConfig = {
  webpackDevMiddleware: {
    watchOptions: {
      ignored: /(?:^|[\\/\\\\])(?:\.openclaw|logs|tmp|\.git)(?:[\\/\\\\]|$)/,
    },
  },
};

module.exports = nextConfig;
