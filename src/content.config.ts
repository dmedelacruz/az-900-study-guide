import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const sections = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/sections' }),
  schema: z.object({
    title: z.string(),
    domain: z.number().int().positive(),
    section: z.string(),
    order: z.number(),
    description: z.string(),
    lastVerified: z.string().date().optional(),
    microsoftLearnUrl: z.string().optional(),
  }),
});

export const collections = { sections };
