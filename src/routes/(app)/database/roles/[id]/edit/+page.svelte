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

	const slotTypeOptions = [
		{ value: 'Character', label: m.roles_type_character() },
		{ value: 'Weapon', label: m.roles_type_weapon() },
		{ value: 'Summon', label: m.roles_type_summon() }
	]

	const ICON_MAX = 128
	const ICON_BYTES_MAX = 256 * 1024 // 256 KB cap on the request body

	let editData = $state({
		nameEn: '',
		nameJp: '',
		slotType: 'Character' as 'Character' | 'Weapon' | 'Summon'
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
				nameJp: role.nameJp ?? '',
				slotType: (role.slotType as 'Character' | 'Weapon' | 'Summon') ?? 'Character'
			}
		}
	})

	async function readDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result as string)
			reader.onerror = () => reject(reader.error)
			reader.readAsDataURL(file)
		})
	}

	async function checkDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
		return new Promise((resolve, reject) => {
			const img = new Image()
			img.onload = () => resolve({ width: img.width, height: img.height })
			img.onerror = () => reject(new Error('Could not decode image'))
			img.src = dataUrl
		})
	}

	async function handleIconSelect(e: Event) {
		iconError = null
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return

		if (file.type !== 'image/png') {
			iconError = m.roles_icon_error_png()
			input.value = ''
			return
		}
		if (file.size > ICON_BYTES_MAX) {
			iconError = m.roles_icon_error_size()
			input.value = ''
			return
		}

		const dataUrl = await readDataUrl(file)
		const { width, height } = await checkDimensions(dataUrl)
		if (width > ICON_MAX || height > ICON_MAX) {
			iconError = m.roles_icon_error_dimensions()
			input.value = ''
			return
		}

		iconFile = file
		iconPreview = dataUrl
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
					nameJp: editData.nameJp.trim() || null,
					slotType: editData.slotType
				}
			})

			if (iconFile) {
				const dataUrl = await readDataUrl(iconFile)
				const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '')
				await uploadIconMut.mutateAsync({
					id: role.id,
					image: base64,
					filename: iconFile.name
				})
				iconFile = null
				iconPreview = null
			}

			saveSuccess = true
			if (saveTimeout !== null) clearTimeout(saveTimeout)
			saveTimeout = setTimeout(() => goto(localizeHref(`/database/roles/${role.id}`)), 500)
		} catch (err) {
			saveError = extractErrorMessage(err, m.roles_save_failed())
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		if (role?.id) goto(localizeHref(`/database/roles/${role.id}`))
		else goto(localizeHref('/database/roles'))
	}

	let confirmDeleteOpen = $state(false)

	async function handleConfirmDelete() {
		if (!role) return
		try {
			await deleteMut.mutateAsync({ id: role.id })
			goto(localizeHref('/database/roles'))
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
					label={m.roles_field_slot_type()}
					bind:value={editData.slotType}
					editable={true}
					type="select"
					options={slotTypeOptions}
				/>
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
					<RoleIcon
						iconKey={role.iconKey}
						src={iconPreview ?? undefined}
						name={role.nameEn}
						size={96}
					/>

					<div class="icon-controls">
						<input
							type="file"
							accept="image/png"
							onchange={handleIconSelect}
							aria-label={m.roles_icon_field()}
						/>
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
				<p>{m.roles_delete_confirm_message({ name: role.nameEn })}</p>
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

	.delete-row {
		display: flex;
		justify-content: flex-end;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}

	.loading {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}
</style>
