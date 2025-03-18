// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

import vercel from '@astrojs/vercel';
// https://astro.build/config
export default defineConfig({
  image: {
    domains: ["https://images.ctfassets.net"],
  },
  integrations: [tailwind()],
  output: "server",
  adapter: vercel(),
});