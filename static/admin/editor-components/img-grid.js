CMS.registerEditorComponent({
  id: "img-grid",
  label: "Image Grid",
  fields: [
    { name: 'body', label: 'Images', widget: 'markdown' }
  ],

  pattern: /{{<\s*img-grid\s*>}}\s*([\s\S]*?)\s*{{<\s*\/img-grid\s*>}}/s,

  fromBlock: function(match) {
    return {
      body: match[1]
    };
  },

  toBlock: function(data) {
    return `{{< img-grid >}}\n${data.body}\n{{< /img-grid >}}`;
  },
});