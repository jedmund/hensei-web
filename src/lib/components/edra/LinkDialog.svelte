<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import { linkDialogState } from '$lib/stores/linkDialog.svelte'
	import * as m from '$lib/paraglide/messages'

	let url = $state('')
	let linkText = $state('')
	let userEditedText = $state(false)
	let ogTitle = $state<string | null>(null)
	let ogImage = $state<string | null>(null)
	let isLoading = $state(false)

	$effect(() => {
		if (linkDialogState.open) {
			url = linkDialogState.initialUrl
			linkText = linkDialogState.initialText
			userEditedText = false
			ogTitle = null
			ogImage = null
		}
	})

	// Auto-fill link text with og:title when no selection and user hasn't edited
	$effect(() => {
		if (ogTitle && !linkDialogState.hasSelection && !userEditedText) {
			linkText = ogTitle
		}
	})

	// Debounced OG fetch when URL changes
	$effect(() => {
		const current = url.trim()
		ogTitle = null
		ogImage = null

		if (!current) return

		let valid: URL
		try {
			valid = new URL(current)
		} catch {
			return
		}
		if (!['http:', 'https:'].includes(valid.protocol)) return

		isLoading = true
		const controller = new AbortController()
		const timer = setTimeout(() => {
			fetch(`/api/og?url=${encodeURIComponent(current)}`, { signal: controller.signal })
				.then((res) => (res.ok ? res.json() : null))
				.then((data) => {
					if (data) {
						ogTitle = data.title ?? null
						ogImage = data.image ?? null
					}
				})
				.catch(() => {})
				.finally(() => {
					isLoading = false
				})
		}, 400)

		return () => {
			clearTimeout(timer)
			controller.abort()
			isLoading = false
		}
	})

	function handleTextInput() {
		userEditedText = true
	}

	function handleInsert() {
		if (url.trim()) {
			const text = linkText.trim()
			if (text && !linkDialogState.hasSelection) {
				// No selection: insert new linked text
				linkDialogState.apply(url.trim(), text)
			} else if (text && linkDialogState.hasSelection && text !== linkDialogState.initialText) {
				// Selection changed: delete selection and insert new linked text
				linkDialogState.apply(url.trim(), text)
			} else {
				// Selection unchanged: wrap with link
				linkDialogState.apply(url.trim())
			}
			url = ''
			linkText = ''
		}
	}

	function handleCancel() {
		linkDialogState.close()
		url = ''
		linkText = ''
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleInsert()
		}
	}

	const showPreview = $derived(!isLoading && (ogTitle || ogImage))
</script>

<Dialog bind:open={linkDialogState.open} hideClose>
	<div class="link-dialog">
		<h3 class="title">{m.editor_link_dialog_title()}</h3>
		<Input
			type="url"
			placeholder="https://..."
			bind:value={url}
			contained
			fullWidth
			onkeydown={handleKeydown}
		/>
		<Input
			type="text"
			placeholder={m.editor_link_text()}
			bind:value={linkText}
			contained
			fullWidth
			handleInput={handleTextInput}
			onkeydown={handleKeydown}
		/>
		{#if isLoading}
			<div class="preview-card">
				<span class="loading-text">Loading preview…</span>
			</div>
		{:else if showPreview}
			<div class="preview-card">
				{#if ogImage}
					<img class="preview-image" src={ogImage} alt="" />
				{/if}
				{#if ogTitle}
					<span class="preview-title">{ogTitle}</span>
				{/if}
			</div>
		{/if}
		<div class="actions">
			<Button variant="ghost" size="small" onclick={handleCancel}>
				{m.action_cancel()}
			</Button>
			<Button variant="primary" size="small" onclick={handleInsert} disabled={!url.trim()}>
				{m.editor_link_insert()}
			</Button>
		</div>
	</div>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.link-dialog {
		padding: $unit-3x;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.title {
		margin: 0;
		font-size: $font-large;
		font-weight: $bold;
		color: var(--text-primary);
	}

	.preview-card {
		background-color: var(--input-bound-bg);
		border-radius: $card-corner;
		overflow: hidden;
	}

	.preview-image {
		display: block;
		width: 100%;
		aspect-ratio: 1.91 / 1;
		object-fit: cover;
	}

	.preview-title {
		display: block;
		padding: $unit calc($unit * 1.5);
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.loading-text {
		display: block;
		padding: $unit calc($unit * 1.5);
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: $unit;
	}
</style>
