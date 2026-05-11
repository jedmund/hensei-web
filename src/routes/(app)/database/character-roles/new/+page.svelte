<script lang="ts">
	import { goto } from '$app/navigation'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import RoleFormFields from '$lib/components/database/RoleFormFields.svelte'

	import { useCreateRole, useUploadRoleIcon } from '$lib/api/mutations/role.mutations'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { dataUrlToBase64 } from '$lib/utils/iconUpload'

	const createMut = useCreateRole()
	const uploadIconMut = useUploadRoleIcon()

	let editData = $state({
		nameEn: '',
		nameJp: ''
	})
	let iconFile = $state<File | null>(null)
	let iconPreview = $state<string | null>(null)
	let iconError = $state<string | null>(null)

	let isSaving = $state(false)
	let saveError = $state<string | null>(null)
	// Track the created role across retries so a failed icon upload doesn't
	// orphan a previously-created role on retry.
	let createdRole = $state<{ id: string } | null>(null)

	const canCreate = $derived(editData.nameEn.trim() !== '')

	function handleSelectIcon(selection: { file: File; dataUrl: string }) {
		iconError = null
		iconFile = selection.file
		iconPreview = selection.dataUrl
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
		<RoleFormFields
			bind:values={editData}
			{iconPreview}
			{iconError}
			onSelectIcon={handleSelectIcon}
			onIconError={(msg) => (iconError = msg)}
		/>
	</section>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
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
</style>
