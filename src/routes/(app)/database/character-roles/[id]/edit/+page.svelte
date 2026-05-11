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
	import RoleIcon from '$lib/components/database/RoleIcon.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'

	import { localizeHref } from '$lib/paraglide/runtime'
	import { extractErrorMessage } from '$lib/utils/errors'
	import {
		dataUrlToBase64,
		validateIconFile,
		type IconValidationError
	} from '$lib/utils/iconUpload'

	import type { PageData } from './$types'

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
	let iconInputRef = $state<HTMLInputElement | undefined>(undefined)

	function openIconPicker() {
		iconInputRef?.click()
	}
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
							iconKey={role.iconKey}
							src={iconPreview ?? undefined}
							name={role.nameEn}
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

	.success-banner {
		@include database.success-banner;
	}

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
