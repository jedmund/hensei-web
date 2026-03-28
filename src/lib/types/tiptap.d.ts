/* eslint-disable @typescript-eslint/no-explicit-any */
import '@tiptap/core'

declare module '@tiptap/core' {
	interface Storage {
		searchAndReplace: {
			searchTerm: string
			replaceTerm: string
			results: Range[]
			lastSearchTerm: string
			caseSensitive: boolean
			lastCaseSensitive: boolean
			resultIndex: number
			lastResultIndex: number
		}
		slashCommand: {
			rect: {
				width: number
				height: number
				left: number
				top: number
				right: number
				bottom: number
			}
		}
		[key: string]: any
	}
}
