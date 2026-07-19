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
      script: [
        {
          key: 'theme-init',
          innerHTML: `(function(){try{var saved=localStorage.getItem('tim-blues-theme');var theme=saved==='dark'||saved==='light'?saved:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',theme==='dark'?'#111412':'#f5f4ef');}catch(e){}})();`,
          tagPosition: 'head',
        },
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
