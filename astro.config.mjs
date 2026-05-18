import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://dmedelacruz.github.io',
  base: '/az-900-study-guide',
  integrations: [tailwind({ applyBaseStyles: false }), mdx()],
});
