<script lang="ts">
	/**
	 * Image picker for uploads sent as multipart files (stickers, event
	 * banners): a preview, a choose button and a hidden file input. Same
	 * pattern as the awakening image field, without base64 encoding.
	 */
	import Button from '$lib/components/ui/Button.svelte'
	import { getHostedImageUrl } from '$lib/utils/images'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		/** Current image URL, if any */
		currentUrl?: string | null | undefined
		/** Accepted MIME types */
		accept?: string[]
		/** Max file size in bytes */
		maxBytes?: number
		/** Preview box size; banners use a wide preview */
		variant?: 'square' | 'banner'
		hint?: string
		onSelect: (file: File) => void
	}

	let {
		currentUrl,
		accept = ['image/png', 'image/webp'],
		maxBytes = 2 * 1024 * 1024,
		variant = 'square',
		hint,
		onSelect
	}: Props = $props()

	let inputEl = $state<HTMLInputElement>()
	let preview = $state<string | null>(null)
	let error = $state<string | null>(null)

	$effect(() => {
		const url = preview
		return () => {
			if (url) URL.revokeObjectURL(url)
		}
	})

	function handleChange(e: Event) {
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		input.value = ''
		if (!file) return
		if (!accept.includes(file.type)) {
			error = m.db_image_error_type()
			return
		}
		if (file.size > maxBytes) {
			error = m.db_image_error_size()
			return
		}
		error = null
		preview = URL.createObjectURL(file)
		onSelect(file)
	}

	const shown = $derived(preview ?? getHostedImageUrl(currentUrl))
</script>

<div class="image-field">
	<div class="preview {variant}">
		{#if shown}
			<img src={shown} alt="" />
		{/if}
	</div>
	<div class="actions">
		<Button variant="secondary" size="small" onclick={() => inputEl?.click()}>
			{shown ? m.db_image_change() : m.db_image_upload()}
		</Button>
		{#if hint}<p class="hint">{hint}</p>{/if}
		{#if error}<p class="error">{error}</p>{/if}
	</div>
	<input bind:this={inputEl} type="file" accept={accept.join(',')} onchange={handleChange} hidden />
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.image-field {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		flex-wrap: wrap;
	}

	.preview {
		background: var(--input-bound-bg);
		border-radius: layout.$item-corner;
		overflow: hidden;
		flex-shrink: 0;

		&.square {
			width: 64px;
			height: 64px;
		}

		&.banner {
			width: 240px;
			height: 80px;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}

		&.banner img {
			object-fit: cover;
		}
	}

	.actions {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: spacing.$unit-half;
	}

	.hint,
	.error {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.error {
		color: var(--text-error, #dc2626);
	}
</style>
