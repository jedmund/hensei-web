/** @type {import('next').NextConfig} */
const path = require('path')

module.exports = {reactStrictMode: true,
  sassOptions: {
    prependData: '@import "variables";',
    includePaths: [path.join(__dirname, 'styles')],
  },
  webpack(config) {
    config.module.rules[2].oneOf.forEach((one) => {
      if (!`${one.issuer?.and}`.includes('_app')) return;
      one.issuer.and = [path.resolve(__dirname)];
    });
    return config;
  },
};

