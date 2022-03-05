/** @type {import('next').NextConfig} */
const path = require('path')
const { i18n } = require('./next-i18next.config')

module.exports = {
  reactStrictMode: true,
  sassOptions: {
    prependData: '@import "variables";',
    includePaths: [path.join(__dirname, 'styles')],
  },
  i18n,
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/new'
      }
    ]
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"]
    });
    config.module.rules[2].oneOf.forEach((one) => {
      if (!`${one.issuer?.and}`.includes('_app')) return;
      one.issuer.and = [path.resolve(__dirname)];
    });
    return config;
  },
};
