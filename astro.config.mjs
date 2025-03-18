// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  image: {
    domains: ["https://images.ctfassets.net"],
  },
  integrations: [tailwind()],
  output: "server",
 adapter: node({
  mode: 'standalone',
  }),
});