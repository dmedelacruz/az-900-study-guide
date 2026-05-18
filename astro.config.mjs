import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://dmedelacruz.github.io',
  base: '/az-900-study-guide',
  integrations: [tailwind()],
});
