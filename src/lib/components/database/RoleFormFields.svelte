<script lang="ts">
	/**
	 * Shared form scaffolding for the character-role new + edit pages: the
	 * name fields and the icon picker. Surrounding page chrome (header, banners,
	 * delete row, submit pipeline) stays in the page.
	 */
	import * as m from '$lib/paraglide/messages'
	import IconUploadField from '$lib/components/IconUploadField.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import type { IconValidationError } from '$lib/utils/iconUpload'

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
	<div class="icon-section">
		<IconUploadField
			iconKey={existingIconKey ?? undefined}
			{iconPreview}
			name={values.nameEn}
			size={64}
			imageSize={48}
			error={iconError}
			ariaLabel={m.roles_icon_upload()}
			onSelect={onSelectIcon}
			onError={(err) => onIconError(iconErrorMessage(err))}
		>
			{#snippet actions({ open })}
				<Button variant="secondary" size="small" onclick={open}>
					{m.roles_icon_choose()}
				</Button>
				<p class="hint">{m.roles_icon_hint_edit()}</p>
			{/snippet}
		</IconUploadField>
	</div>
</DetailsContainer>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.icon-section {
		padding: spacing.$unit-2x;
	}

	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}
</style>
