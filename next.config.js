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
        destination: '/new',
      },
      {
        source: '/characters',
        destination: '/new',
      },
      {
        source: '/summons',
        destination: '/new',
      },
      {
        source: '/weapons',
        destination: '/new',
      },
      {
        source: '/updates',
        destination: '/about',
      },
      {
        source: '/roadmap',
        destination: '/about',
      },
      {
        source: '/p/:shortcode/preview',
        destination: '/api/preview/:shortcode',
      },
      {
        source: '/p/:shortcode/characters',
        destination: '/p/:shortcode',
      },
      {
        source: '/p/:shortcode/weapons',
        destination: '/p/:shortcode',
      },
      {
        source: '/p/:shortcode/summons',
        destination: '/p/:shortcode',
      },
      {
        source: '/p/:shortcode/:garbage',
        destination: '/p/:shortcode',
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/transfer/version',
        destination:
          'https://raw.githubusercontent.com/Vazkii/hensei-transfer/main/version',
        permanent: true,
      },
    ]
  },
  webpack(config) {
    // Set up alias for styles
    config.resolve.alias = {
      ...config.resolve.alias,
      '@styles': path.resolve(__dirname, 'styles'),
    }

    // Set up rules for SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    // Disable CSS modules
    // config.module.rules[2].oneOf.forEach((one) => {
    //   if (!`${one.issuer?.and}`.includes('_app')) return
    //   one.issuer.and = [path.resolve(__dirname)]
    // })

    return config
  },
}
