import { InputRule } from '@tiptap/core'
import { InlineMath } from '@tiptap/extension-mathematics'

export const InlineMathReplacer = InlineMath.extend({
	name: 'inlineMathReplacer',
	addInputRules() {
		return [
			new InputRule({
				find: /\$\$([^$]+)\$\$$/,
				handler: ({ state, range, match }) => {
					const latex = match[1]
					if (!latex) return
					const { tr } = state
					tr.delete(range.from, range.to)
					tr.insert(range.from, state.schema.nodes.inlineMath!.create({ latex }))
				}
			})
		]
	}
})
