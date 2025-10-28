/**
 * Site Configuration
 * 
 * Centralized configuration for the StartSpooling application.
 * This includes site metadata, URLs, and email addresses used throughout the app.
 */

export const siteConfig = {
  name: "StartSpooling",
  description: "Your builds, documented.",
  url: process.env.NEXT_PUBLIC_SITE_URL,
  ogImage: "/og-image.png",
  links: {
    twitter: "https://twitter.com/startspooling",
    github: "https://github.com/startspooling",
    discord: "https://discord.gg/startspooling",
  },
  fromEmail: "verify@startspooling.com",
  supportEmail: "support@startspooling.com",
} as const;

export type SiteConfig = typeof siteConfig;
