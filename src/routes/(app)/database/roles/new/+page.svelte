<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'

	import { useCreateRole } from '$lib/api/mutations/role.mutations'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { extractErrorMessage } from '$lib/utils/errors'

	const createMut = useCreateRole()

	const initialSlot = $page.url.searchParams.get('slot_type')
	const slotType = (
		initialSlot === 'Weapon' || initialSlot === 'Summon' ? initialSlot : 'Character'
	) as 'Character' | 'Weapon' | 'Summon'

	let editData = $state({
		nameEn: '',
		nameJp: '',
		slotType
	})

	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	const slotTypeOptions = [
		{ value: 'Character', label: m.roles_type_character() },
		{ value: 'Weapon', label: m.roles_type_weapon() },
		{ value: 'Summon', label: m.roles_type_summon() }
	]

	const canCreate = $derived(editData.nameEn.trim() !== '')

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
			goto(localizeHref(`/database/roles/${role.id}/edit`))
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

		<p class="hint">{m.roles_icon_hint_new()}</p>
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

	.hint {
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}
</style>
