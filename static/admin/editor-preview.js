// source = https://github.com/decaporg/decap-cms/issues/1279
import Markdown from 'https://esm.sh/react-markdown@9?bundle'
import remarkMath from 'https://esm.sh/remark-math@6?bundle'
import rehypeMathjax from 'https://esm.sh/rehype-mathjax@5?bundle'
import rehypeRaw from 'https://esm.sh/rehype-raw@7?bundle'

import collections from '/admin/collections.js'

const { h, createClass } = window;

const PostPreview = createClass({
  render: function() {
    const { entry, getAsset } = this.props;

    let body = entry.getIn(['data', 'body']) || "";

    // {{< img >}} shortcode styling
    body = body.replace(/{{<\s*img\s+([^>]+)\s*>}}/g, (match, attrs) => {
        attrs = attrs.trim();
        const srcMatch = attrs.match(/src\s*=\s*"?([^\s"]+)"?/);
        const classMatch = attrs.match(/class\s*=\s*"?([^\s"]+)"?/);

        const src = srcMatch ? srcMatch[1] : "";
        const className = classMatch ? classMatch[1] : "";

        const classStr = className ? `class="${className}"` : "";

        return `<img src="${src}" ${classStr} style="max-width: 100%; display: inline-block; vertical-align: middle; margin: 0 4px;" />`;
      }
    );

    // {{< img-grid >}} shortcode styling
    body = body.replace(/{{<\s*img-grid\s*>}}\s*([\s\S]*?)\s*{{<\s*\/img-grid\s*>}}/gs,
      (match, content) => {
        return `<div class="container-fluid" style="width:50%; height:auto;">
            <div class="d-flex justify-content-center" style="width: 100%">
                ${content}
              </div>
          </div>`;
    });

    // {{< youtube >}} shortcode styling
    body = body.replace(/{{<\s*youtube\s+([^>]+)\s*>}}/g, (match, attrs) => {
        attrs = attrs.trim();
        let id = "";
        let start = "";

        const idMatch = attrs.match(/id\s*=\s*"?([^\s"]+)"?/);
        const startMatch = attrs.match(/start\s*=\s*"?(\d+)"?/);

        if (idMatch) {
          id = idMatch[1];
          start = startMatch ? startMatch[1] : "";
        } else {
          const parts = attrs.split(/\s+/);
          id = parts[0] || "";
          start = parts[1] || "";
        }

        const startParam = start ? `?start=${start}` : "";

        return `<div style="margin: 16px 0;">
        <iframe width="100%" height="500" src="https://www.youtube.com/embed/${id}${startParam}" frameborder="0" allowfullscreen style="border-radius: 8px; display: block;">
        </iframe></div>`;
      }
    );

    // {{< callout >}} shortcode styling
    body = body.replace(/{{<\s*callout\s+context\s*=\s*"(\S+)"\s+title\s*=\s*"([\s\S]+?)"\s+icon\s*=\s*"(\S+)"\s*>}}([\s\S]+?){{<\s*\/callout\s*>}}/gs,
      (match, context, title, icon, content) => {
        return `<div class="callout callout-${context} d-flex flex-row mt-4 mb-4 pt-4 pe-4 pb-2 ps-3" data-bs-theme="light">
            <div class="callout-content">
              <div class="callout-title" style="font-weight: bold; margin-bottom: 8px;">${title}</div>
              <div class="callout-body">${content}</div>
            </div>
          </div>`;
    });

    return h('div', {
      className: 'content td-content',
      style: { padding: '30px', lineHeight: '1.6' }
    },
      h(Markdown, {
        children: body,
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeMathjax, rehypeRaw]
      })
    );
  }
});

collections.forEach(name => {
  CMS.registerPreviewTemplate(name, PostPreview);
});

