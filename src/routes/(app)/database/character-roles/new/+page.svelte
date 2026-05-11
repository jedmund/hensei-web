<script lang="ts">
	import { goto } from '$app/navigation'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import RoleIcon from '$lib/components/database/RoleIcon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'

	import { useCreateRole, useUploadRoleIcon } from '$lib/api/mutations/role.mutations'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { extractErrorMessage } from '$lib/utils/errors'
	import {
		dataUrlToBase64,
		validateIconFile,
		type IconValidationError
	} from '$lib/utils/iconUpload'

	const createMut = useCreateRole()
	const uploadIconMut = useUploadRoleIcon()

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

	let editData = $state({
		nameEn: '',
		nameJp: ''
	})
	let iconFile = $state<File | null>(null)
	let iconPreview = $state<string | null>(null)
	let iconError = $state<string | null>(null)
	let iconInputRef = $state<HTMLInputElement | undefined>(undefined)

	function openIconPicker() {
		iconInputRef?.click()
	}

	let isSaving = $state(false)
	let saveError = $state<string | null>(null)
	// Track the created role across retries so a failed icon upload doesn't
	// orphan a previously-created role on retry.
	let createdRole = $state<{ id: string } | null>(null)

	const canCreate = $derived(editData.nameEn.trim() !== '')

	async function handleIconSelect(e: Event) {
		iconError = null
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return

		const result = await validateIconFile(file)
		if (!result.ok) {
			iconError = iconErrorMessage(result.error)
			input.value = ''
			return
		}

		iconFile = result.file
		iconPreview = result.dataUrl
	}

	async function handleCreate() {
		if (!canCreate) return
		isSaving = true
		saveError = null
		try {
			if (!createdRole) {
				createdRole = await createMut.mutateAsync({
					nameEn: editData.nameEn.trim(),
					nameJp: editData.nameJp.trim() || null
				})
			}

			if (iconFile && iconPreview) {
				await uploadIconMut.mutateAsync({
					id: createdRole.id,
					image: dataUrlToBase64(iconPreview),
					filename: iconFile.name
				})
			}

			goto(localizeHref(`/database/character-roles/${createdRole.id}`))
		} catch (err) {
			saveError = extractErrorMessage(err, m.roles_save_failed())
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		// If the role was already created (e.g. icon upload failed mid-flow),
		// take the user to that role rather than dropping them at the list with
		// an unrelated state.
		if (createdRole) {
			goto(localizeHref(`/database/character-roles/${createdRole.id}`))
		} else {
			goto(localizeHref('/database/character-roles'))
		}
	}
</script>

<PageMeta title={m.page_title_db_roles_new()} description={m.page_desc_home()} />

<div class="page">
	<DatabaseFormHeader
		title={m.roles_new_title()}
		onCancel={handleCancel}
		onSave={handleCreate}
		{isSaving}
		disabled={!canCreate}
		saveLabel={m.roles_create()}
	/>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<section class="details">
		<DetailsContainer title={m.roles_section_basics()}>
			<DetailItem
				label={m.roles_field_name_en()}
				bind:value={editData.nameEn}
				editable={true}
				type="text"
				placeholder={m.roles_placeholder_name_en()}
			/>
			<DetailItem
				label={m.roles_field_name_jp()}
				bind:value={editData.nameJp}
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
					aria-label={m.roles_icon_field()}
				>
					<RoleIcon
						src={iconPreview ?? undefined}
						name={editData.nameEn}
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
	</section>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/database' as database;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		@include database.details;
	}

	.error-banner {
		@include database.error-banner;
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

	.icon-upload {
		display: flex;
		gap: spacing.$unit-2x;
		align-items: flex-start;
		padding: spacing.$unit-2x;
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
