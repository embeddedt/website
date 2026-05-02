import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const makeLocalDate = (str: string) => {
	const date = new Date(str);
	if (!str.includes("T")) {
		// Make the date roughly 9am in Eastern time
		date.setUTCHours(14);
		date.setUTCMinutes(0);
		date.setUTCSeconds(0);
	}
	return date;
}

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.string().transform(makeLocalDate),
			updatedDate: z.string().transform(makeLocalDate).optional(),
			heroImage: image().optional(),
			tags: z.array(z.string()).optional()
		}),
});


const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			name: z.string(),
			summary: z.string(),
			link: z.string().optional(),
			role: z.enum(["author", "contributor"]),
			logo: image().optional(),
			banner: image().optional()
		}),
});

export const collections = { blog, projects };
