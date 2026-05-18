import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const sections = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/sections' }),
  schema: z.object({
    title: z.string(),
    domain: z.number().int().min(1).max(3),
    section: z.string().regex(/^\d+\.\d+$/, 'section must match pattern like "1.1" or "2.3"'),
    order: z.number().int().positive(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    lastVerified: z.string().date().optional(),
    microsoftLearnUrl: z.string().url().optional(),
  }),
});

export const collections = { sections };
