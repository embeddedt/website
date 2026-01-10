import { getCollection, type CollectionEntry } from 'astro:content';
import rss, { type RSSFeedItem } from '@astrojs/rss';
import { SITE_DESCRIPTION } from '../../consts';
import type { APIContext } from 'astro';

function createRssItem(post: CollectionEntry<'blog'>): RSSFeedItem {
	return {
		title: post.data.title,
		description: post.data.description,
		pubDate: post.data.pubDate,
		content: post.rendered?.html,
		categories: post.data.tags,
		link: `/blog/${post.id}/`
	};
}

export async function GET(context: APIContext) {
	const posts = await getCollection('blog');
	return rss({
		title: "embeddedt's blog",
		description: SITE_DESCRIPTION,
		site: context.site!!,
		items: posts.map(createRssItem),
	});
}
