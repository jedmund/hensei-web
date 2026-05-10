<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import RoleIcon from '$lib/components/database/RoleIcon.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'

	import { useCreateRole, useUploadRoleIcon } from '$lib/api/mutations/role.mutations'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { extractErrorMessage } from '$lib/utils/errors'

	const createMut = useCreateRole()
	const uploadIconMut = useUploadRoleIcon()

	const initialSlot = $page.url.searchParams.get('slot_type')
	const slotType = (
		initialSlot === 'Weapon' || initialSlot === 'Summon' ? initialSlot : 'Character'
	) as 'Character' | 'Weapon' | 'Summon'

	const ICON_MAX = 128
	const ICON_BYTES_MAX = 256 * 1024

	let editData = $state({
		nameEn: '',
		nameJp: '',
		slotType
	})
	let iconFile = $state<File | null>(null)
	let iconPreview = $state<string | null>(null)
	let iconError = $state<string | null>(null)

	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	const slotTypeOptions = [
		{ value: 'Character', label: m.roles_type_character() },
		{ value: 'Weapon', label: m.roles_type_weapon() },
		{ value: 'Summon', label: m.roles_type_summon() }
	]

	const canCreate = $derived(editData.nameEn.trim() !== '')

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

	async function handleCreate() {
		if (!canCreate) return
		isSaving = true
		saveError = null
		try {
			const role = await createMut.mutateAsync({
				nameEn: editData.nameEn.trim(),
				nameJp: editData.nameJp.trim() || null,
				slotType: editData.slotType
			})

			if (iconFile) {
				const dataUrl = await readDataUrl(iconFile)
				const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '')
				await uploadIconMut.mutateAsync({
					id: role.id,
					image: base64,
					filename: iconFile.name
				})
			}

			goto(localizeHref(`/database/roles/${role.id}`))
		} catch (err) {
			saveError = extractErrorMessage(err, m.roles_save_failed())
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto(localizeHref('/database/roles'))
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
				<RoleIcon src={iconPreview ?? undefined} name={editData.nameEn} size={96} />

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
