import type {Root} from 'hast';
import {headingRank} from 'hast-util-heading-rank';
import {SKIP, visit} from 'unist-util-visit'

export default function rehypeScrollToTopHeadingLink() {
    return function (tree: Root) {
        visit(tree, 'element', function (node, index, parent) {
            if (headingRank(node)) {
                node.children.push({
                    type: 'element',
                    tagName: 'a',
                    properties: { class: 'toc-scroll-to-top', href: '#blog-post-table-of-contents' },
                    children: [{
                        type: "text",
                        value: "⤴"
                    }]
                });
                return [SKIP]
            }
        })
    }
}

export function tocCustomizer(tree: Root) {
    visit(tree, 'element', function (node, index, parent) {
        if (node.tagName == "nav") {
            node.properties.id = "blog-post-table-of-contents";
            node.children.unshift({
                type: 'element',
                tagName: 'span',
                properties: { class: "toc-title" },
                children: [{
                    type: "text",
                    value: "Table of contents"
                }]
            });
            return [SKIP]
        }
    })
}