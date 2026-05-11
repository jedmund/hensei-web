<script lang="ts">
	import { goto } from '$app/navigation'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import { createQuery } from '@tanstack/svelte-query'
	import { roleQueries } from '$lib/api/queries/role.queries'
	import { withInitialData } from '$lib/query/ssr'

	import {
		useUpdateRole,
		useUploadRoleIcon,
		useDeleteRole
	} from '$lib/api/mutations/role.mutations'

	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import RoleFormFields from '$lib/components/database/RoleFormFields.svelte'

	import { localizeHref } from '$lib/paraglide/runtime'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { dataUrlToBase64 } from '$lib/utils/iconUpload'

	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const roleQuery = createQuery(() => ({
		...roleQueries.byId(data.roleRecord?.id ?? ''),
		...withInitialData(data.roleRecord)
	}))

	const role = $derived(roleQuery.data)

	const updateMut = useUpdateRole()
	const uploadIconMut = useUploadRoleIcon()
	const deleteMut = useDeleteRole()

	let editData = $state({
		nameEn: '',
		nameJp: ''
	})
	let iconFile = $state<File | null>(null)
	let iconPreview = $state<string | null>(null)
	let iconError = $state<string | null>(null)

	let isSaving = $state(false)
	let saveError = $state<string | null>(null)
	let saveSuccess = $state(false)
	let saveTimeout: ReturnType<typeof setTimeout> | null = null

	$effect(() => {
		return () => {
			if (saveTimeout !== null) clearTimeout(saveTimeout)
		}
	})

	$effect(() => {
		if (role) {
			editData = {
				nameEn: role.nameEn ?? '',
				nameJp: role.nameJp ?? ''
			}
		}
	})

	function handleSelectIcon(selection: { file: File; dataUrl: string }) {
		iconError = null
		iconFile = selection.file
		iconPreview = selection.dataUrl
	}

	async function handleSave() {
		if (!role) return
		isSaving = true
		saveError = null
		saveSuccess = false
		try {
			await updateMut.mutateAsync({
				id: role.id,
				payload: {
					nameEn: editData.nameEn.trim(),
					nameJp: editData.nameJp.trim() || null
				}
			})

			if (iconFile && iconPreview) {
				await uploadIconMut.mutateAsync({
					id: role.id,
					image: dataUrlToBase64(iconPreview),
					filename: iconFile.name
				})
				iconFile = null
				iconPreview = null
			}

			saveSuccess = true
			if (saveTimeout !== null) clearTimeout(saveTimeout)
			saveTimeout = setTimeout(
				() => goto(localizeHref(`/database/character-roles/${role.id}`)),
				500
			)
		} catch (err) {
			saveError = extractErrorMessage(err, m.roles_save_failed())
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		if (role?.id) goto(localizeHref(`/database/character-roles/${role.id}`))
		else goto(localizeHref('/database/character-roles'))
	}

	let confirmDeleteOpen = $state(false)

	async function handleConfirmDelete() {
		if (!role) return
		try {
			await deleteMut.mutateAsync({ id: role.id })
			goto(localizeHref('/database/character-roles'))
		} catch (err) {
			saveError = extractErrorMessage(err, m.roles_delete_failed())
		} finally {
			confirmDeleteOpen = false
		}
	}

	const pageTitle = $derived(m.page_title_db_edit({ name: role?.nameEn ?? 'Role' }))
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	{#if role}
		<DatabaseFormHeader
			title={m.roles_edit_title()}
			onCancel={handleCancel}
			onSave={handleSave}
			{isSaving}
		/>

		{#if saveError}
			<div class="error-banner">{saveError}</div>
		{/if}

		{#if saveSuccess}
			<div class="success-banner">{m.roles_save_success()}</div>
		{/if}

		<section class="details">
			<RoleFormFields
				bind:values={editData}
				existingIconKey={role.iconKey}
				{iconPreview}
				{iconError}
				onSelectIcon={handleSelectIcon}
				onIconError={(msg) => (iconError = msg)}
			/>

			<div class="delete-row">
				<Button variant="destructive" size="small" onclick={() => (confirmDeleteOpen = true)}>
					{m.roles_delete()}
				</Button>
			</div>
		</section>

		<Dialog bind:open={confirmDeleteOpen} size="small">
			<ModalHeader title={m.roles_delete_confirm_title()} />
			<ModalBody>
				<p>
					{m.roles_delete_confirm_prefix()} <b>{role.nameEn}</b>{m.roles_delete_confirm_suffix()}
				</p>
			</ModalBody>
			<ModalFooter
				onCancel={() => (confirmDeleteOpen = false)}
				primaryAction={{
					label: m.roles_delete(),
					onclick: handleConfirmDelete,
					destructive: true
				}}
			/>
		</Dialog>
	{:else if roleQuery.isLoading}
		<div class="loading">{m.roles_loading()}</div>
	{:else}
		<div class="loading">{m.roles_not_found_title()}</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
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

	.success-banner {
		@include database.success-banner;
	}

	.delete-row {
		display: flex;
		justify-content: flex-end;
		padding: spacing.$unit-2x;
	}

	.loading {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}
</style>
