// source = https://github.com/decaporg/decap-cms/issues/1279
import Markdown from 'https://esm.sh/react-markdown@9?bundle'
import remarkMath from 'https://esm.sh/remark-math@6?bundle'
import rehypeMathjax from 'https://esm.sh/rehype-mathjax@5?bundle'
import collections from '/admin/collections.js'

const { h, createClass } = window;

const PostPreview = createClass({
  render: function() {
    const body = this.props.entry.getIn(['data', 'body']) || "";

    return h('div', {
      style: { padding: '20px', lineHeight: '1.6' }
    },
      h(Markdown, {
        children: body,
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeMathjax]
      })
    );
  }
});

collections.forEach(name => {
  CMS.registerPreviewTemplate(name, PostPreview);
});

