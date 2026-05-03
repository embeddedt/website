// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import icon from 'astro-icon';
import rehypeToc from 'rehype-toc';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeScrollToTopHeadingLink, { tocCustomizer } from './src/lib/scroll-to-top-heading-links';

// https://astro.build/config
export default defineConfig({
    site: 'https://www.embeddedt.com',
    integrations: [mdx(), sitemap(), icon()],
    markdown: {
        rehypePlugins: [
            rehypeHeadingIds,
            [rehypeToc, {
                customizeTOC: tocCustomizer
            }],
            rehypeScrollToTopHeadingLink
        ]
    }
});