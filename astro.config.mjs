// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

import vercel from '@astrojs/vercel';
// https://astro.build/config
export default defineConfig({
  
  site: 'https://www.innovaquest.ai',
  image: {
    domains: ["https://images.ctfassets.net"],
  },
  integrations: [
  tailwind(),
  sitemap()
],
  output: "server",
  adapter: vercel(),
});
