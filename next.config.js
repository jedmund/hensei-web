/** @type {import('next').NextConfig} */
const path = require('path')
const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    prependData: '@import "variables";',
    includePaths: [path.join(__dirname, 'styles')],
  },
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
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg'),
    )

    if (fileLoaderRule) {
      config.module.rules.push(
        // Reapply the existing rule, but only for svg imports ending in ?url
        {
          ...fileLoaderRule,
          test: /\.svg$/i,
          resourceQuery: /url/, // *.svg?url
        },
        // Convert all other *.svg imports to React components
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          resourceQuery: { not: /url/ }, // exclude if *.svg?url
          use: ['@svgr/webpack'],
        },
      )

      // Modify the file loader rule to ignore *.svg, since we have it handled now.
      fileLoaderRule.exclude = /\.svg$/i
    } else {
      // If no file loader rule exists, just add our SVG handler
      config.module.rules.push({
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
      })
    }

    // Disable CSS modules
    // config.module.rules[2].oneOf.forEach((one) => {
    //   if (!`${one.issuer?.and}`.includes('_app')) return
    //   one.issuer.and = [path.resolve(__dirname)]
    // })

    return config
  },
}

module.exports = withNextIntl(nextConfig)
