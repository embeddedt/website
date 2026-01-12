import { getCollection } from "astro:content";

export async function getBlogPostsInOrder() {
    const posts = (await getCollection('blog')).sort(
        (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
    );
    return posts;
}

export async function getAllBlogTags() {
    const posts = await getCollection("blog");
    const tags = [...new Set(posts.map((post) => (post.data.tags ?? [])).flat())];
    tags.sort();
    return tags;
}