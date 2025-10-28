import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://startspooling.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/verify',
          '/verify/*',
          '/welcome',
          '/welcome/*',
          '/api/',
          '/api/*',
        ],
      },
      // Block AI training bots (optional - uncomment if you want to block them)
      // {
      //   userAgent: 'GPTBot',
      //   disallow: '/',
      // },
      // {
      //   userAgent: 'CCBot',
      //   disallow: '/',
      // },
      // {
      //   userAgent: 'anthropic-ai',
      //   disallow: '/',
      // },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
