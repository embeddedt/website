import { getCollection } from "astro:content";

export async function getBlogPostsInOrder() {
    const posts = (await getCollection('blog')).sort(
        (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
    );
    return posts;
}

export async function getAllBlogTags() {
    const posts = await getCollection("blog");
    const tagMap = new Map<string, number>();
    for (const post of posts) {
        if (post.data.tags) {
            for (const tag of post.data.tags) {
                const prevCount = tagMap.get(tag) ?? 0;
                tagMap.set(tag, prevCount + 1);
            }
        }
    }
    const tagList = Array.from(tagMap.entries()).map(e => ({
        name: e[0],
        count: e[1]
    }));
    tagList.sort((a, b) => {
        const diff = b.count - a.count;
        if (diff != 0) {
            return diff;
        }
        return a.name.localeCompare(b.name);
    });
    return tagList;
}