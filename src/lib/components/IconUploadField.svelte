<script lang="ts">
	/**
	 * Reusable icon picker: a clickable EntityIcon preview + hidden file input
	 * + optional error caption. Callers supply their own action buttons via the
	 * `actions` snippet so each consumer can match its surrounding layout
	 * (vertical hint stack for forms, inline ghost buttons for modals, etc.).
	 *
	 * Validation goes through `validateIconFile` from `$lib/utils/iconUpload`
	 * so MIME / size / dimension constraints stay consistent everywhere.
	 */
	import EntityIcon from '$lib/components/EntityIcon.svelte'
	import { validateIconFile, type IconValidationError } from '$lib/utils/iconUpload'
	import type { Snippet } from 'svelte'

	interface Props {
		/** Existing iconKey to render as fallback (edit flows). */
		iconKey?: string | null | undefined
		/** dataUrl preview of an in-progress selection (takes precedence over iconKey). */
		iconPreview?: string | null
		/** Used as the EntityIcon alt text. */
		name?: string
		/** Container size in px. */
		size?: number
		/** Image size in px (defaults to container size). */
		imageSize?: number
		/** Human-readable error message; rendered below the picker when set. */
		error?: string | null
		/** Optional ARIA label for the click target. */
		ariaLabel?: string
		onSelect: (selection: { file: File; dataUrl: string }) => void
		onError: (error: IconValidationError) => void
		/** Optional action buttons rendered next to the icon (e.g. Replace / Remove). */
		actions?: Snippet<[{ open: () => void }]>
	}

	let {
		iconKey,
		iconPreview = null,
		name = '',
		size = 64,
		imageSize,
		error = null,
		ariaLabel,
		onSelect,
		onError,
		actions
	}: Props = $props()

	let inputRef = $state<HTMLInputElement | undefined>(undefined)

	function open() {
		inputRef?.click()
	}

	async function handleChange(e: Event) {
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return

		const result = await validateIconFile(file)
		if (!result.ok) {
			onError(result.error)
			input.value = ''
			return
		}

		onSelect({ file: result.file, dataUrl: result.dataUrl })
		// Reset the input so re-selecting the same file still fires `change`.
		input.value = ''
	}
</script>

<div class="icon-upload-field">
	<button type="button" class="trigger" onclick={open} aria-label={ariaLabel}>
		<EntityIcon
			iconKey={iconKey ?? undefined}
			src={iconPreview ?? undefined}
			{name}
			{size}
			{imageSize}
		/>
	</button>

	<input
		bind:this={inputRef}
		type="file"
		accept="image/png"
		onchange={handleChange}
		class="visually-hidden"
		aria-hidden="true"
		tabindex="-1"
	/>

	{#if actions}
		<div class="actions">{@render actions({ open })}</div>
	{/if}

	{#if error}
		<p class="error">{error}</p>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.icon-upload-field {
		display: flex;
		gap: spacing.$unit-2x;
		align-items: center;
		flex-wrap: wrap;
	}

	.trigger {
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: layout.$item-corner;

		&:focus-visible {
			outline: 2px solid var(--accent-blue);
			outline-offset: 2px;
		}
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.error {
		flex-basis: 100%;
		margin: 0;
		font-size: typography.$font-small;
		color: var(--error, #e53e3e);
	}
</style>
