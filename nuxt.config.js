export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'solana-ico',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  // build: {
  //   babel: {
  //     presets({ isServer }) {
  //       return [
  //         [
  //           '@babel/preset-env',
  //           {
  //             targets: isServer
  //               ? { node: '12' } // Or whatever Node version you're targeting
  //               : '> 0.25%, not dead',
  //             useBuiltIns: 'entry',
  //             corejs: 3,
  //           },
  //         ],
  //       ]
  //     },
  //   },
  //   extend(config) {
  //     config.module.rules.push({
  //       test: /\.js$/,
  //       exclude: /node_modules\/(?!@solana\/web3\.js)/, // Add solana/web3.js to this line
  //       loader: 'babel-loader',
  //     })
  //   },
  // },
  build: {
    transpile: [
      '@solana/web3.js',
      'rpc-websockets',
      '@noble',
      '@solana/spl-token-metadata',
      '@solana/spl-token',
      '@solana/codecs-data-structures',
      '@solana',
    ],
  },
}
