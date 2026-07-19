const siteBaseUrl = process.env.NUXT_APP_BASE_URL || '/'

export default defineNuxtConfig({
  compatibilityDate: '2026-07-10',
  devtools: { enabled: true },
  ssr: true,
  css: ['~/assets/css/main.css'],
  app: {
    baseURL: siteBaseUrl,
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: 'Tim 的 Blues 练习记录',
      meta: [
        {
          name: 'description',
          content: 'Tim 的 Blues 吉他练习档案：日志、曲目录音与 8 周进度证据。',
        },
        { name: 'theme-color', content: '#f5f4ef' },
        { name: 'color-scheme', content: 'light' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: `${siteBaseUrl}favicon.svg` },
        { rel: 'preconnect', href: 'https://raw.githubusercontent.com' },
      ],
    },
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: true,
    },
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
})
