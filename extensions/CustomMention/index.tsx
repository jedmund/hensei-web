import { mergeAttributes, Node } from '@tiptap/core'
import Mention from '@tiptap/extension-mention'

export default Mention.extend({
  renderHTML({ node, HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(
        {
          href: `https://gbf.wiki/${node.attrs.id.name.en}`,
          target: '_blank',
        },
        { 'data-type': this.name },
        { 'data-element': node.attrs.id.element.slug },
        { tabindex: -1 },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      this.options.renderLabel?.({
        options: this.options,
        node,
        suggestion: null,
      }) || '',
    ]
  },
})
