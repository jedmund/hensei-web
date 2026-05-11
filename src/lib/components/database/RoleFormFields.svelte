<script lang="ts">
	/**
	 * Shared form scaffolding for the character-role new + edit pages: the
	 * name fields and the icon picker. Surrounding page chrome (header, banners,
	 * delete row, submit pipeline) stays in the page.
	 */
	import * as m from '$lib/paraglide/messages'
	import RoleIcon from './RoleIcon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { validateIconFile, type IconValidationError } from '$lib/utils/iconUpload'

	interface NameValues {
		nameEn: string
		nameJp: string
	}

	interface Props {
		values: NameValues
		/** Existing iconKey to render as fallback in the preview (edit page only). */
		existingIconKey?: string | null | undefined
		/** dataUrl preview of an in-progress icon selection. */
		iconPreview?: string | null
		iconError?: string | null
		onSelectIcon: (selection: { file: File; dataUrl: string }) => void
		onIconError: (message: string) => void
	}

	let {
		values = $bindable(),
		existingIconKey,
		iconPreview = null,
		iconError = null,
		onSelectIcon,
		onIconError
	}: Props = $props()

	let iconInputRef = $state<HTMLInputElement | undefined>(undefined)

	function openIconPicker() {
		iconInputRef?.click()
	}

	function iconErrorMessage(error: IconValidationError): string {
		switch (error) {
			case 'mime':
				return m.roles_icon_error_png()
			case 'size':
				return m.roles_icon_error_size()
			case 'dimensions':
				return m.roles_icon_error_dimensions()
			case 'decode':
				return m.roles_icon_error_png()
		}
	}

	async function handleIconSelect(e: Event) {
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return

		const result = await validateIconFile(file)
		if (!result.ok) {
			onIconError(iconErrorMessage(result.error))
			input.value = ''
			return
		}

		onSelectIcon({ file: result.file, dataUrl: result.dataUrl })
	}
</script>

<DetailsContainer title={m.roles_section_basics()}>
	<DetailItem
		label={m.roles_field_name_en()}
		bind:value={values.nameEn}
		editable={true}
		type="text"
		placeholder={m.roles_placeholder_name_en()}
	/>
	<DetailItem
		label={m.roles_field_name_jp()}
		bind:value={values.nameJp}
		editable={true}
		type="text"
		placeholder={m.roles_placeholder_name_jp()}
	/>
</DetailsContainer>

<DetailsContainer title={m.roles_section_icon()}>
	<div class="icon-upload">
		<button
			type="button"
			class="icon-trigger"
			onclick={openIconPicker}
			aria-label={m.roles_icon_upload()}
		>
			<RoleIcon
				iconKey={existingIconKey ?? undefined}
				src={iconPreview ?? undefined}
				name={values.nameEn}
				size={64}
				imageSize={48}
			/>
		</button>

		<input
			bind:this={iconInputRef}
			type="file"
			accept="image/png"
			onchange={handleIconSelect}
			class="visually-hidden"
			aria-hidden="true"
			tabindex="-1"
		/>

		<div class="icon-controls">
			<Button variant="secondary" size="small" onclick={openIconPicker}>
				{m.roles_icon_choose()}
			</Button>
			<p class="hint">{m.roles_icon_hint_edit()}</p>
			{#if iconError}
				<p class="icon-error">{iconError}</p>
			{/if}
		</div>
	</div>
</DetailsContainer>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.icon-upload {
		display: flex;
		gap: spacing.$unit-2x;
		align-items: center;
		padding: spacing.$unit-2x;
	}

	.icon-trigger {
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

	.icon-controls {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;

		.hint {
			margin: 0;
			font-size: typography.$font-small;
			color: var(--text-tertiary);
		}

		.icon-error {
			margin: 0;
			font-size: typography.$font-small;
			color: var(--error, #e53e3e);
		}
	}
</style>
