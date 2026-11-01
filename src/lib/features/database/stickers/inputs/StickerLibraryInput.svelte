<script lang="ts">
	// Picks one of the game's stickers to take the images from. Sent with the
	// form as library_id; on the create form it also suggests a slug and the
	// caption as the meaning, keeping anything already typed.
	import type { InputProps } from '$lib/features/database/schema/inputs/types'
	import type { LibrarySticker, Sticker } from '$lib/types/api/sticker'
	import StickerLibraryPicker from './StickerLibraryPicker.svelte'

	let { field, form, record }: InputProps = $props()

	const selected = $derived((form.values[field.key] as number | null | undefined) ?? null)
	const stickerId = $derived((record as Sticker | null)?.id)

	function pick(entry: LibrarySticker) {
		form.set(field.key, entry.id)
		if (form.mode !== 'create') return
		const slug = (form.values.slug as string | undefined) ?? ''
		if (!slug.trim()) form.set('slug', `stamp-${entry.id}`)
		const meaning = (form.values.meaning ?? {}) as { en?: string; ja?: string }
		if (!meaning.en?.trim()) form.set('meaning', { ...meaning, en: entry.label })
	}
</script>

<StickerLibraryPicker {selected} {stickerId} onSelect={pick} />
