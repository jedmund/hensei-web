<script lang="ts">
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import WeaponSkillList from '$lib/components/weapon/WeaponSkillList.svelte'
	import EmptyState from '$lib/components/ui/EmptyState.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { weaponAdapter, type Weapon } from '$lib/api/adapters/weapon.adapter'
	import type { RecordTabProps } from '$lib/features/database/schema/types'

	let { record, canEdit, refetch }: RecordTabProps<Weapon> = $props()

	const skills = $derived(record.weaponSkills ?? [])
	// Undefined until the API sends it: treated as never built
	const built = $derived(Boolean(record.skillsBuiltAt))

	let isBuilding = $state(false)

	// The Raw Data tab's re-parse, fetching the wiki page first: weapons that were never
	// built usually have no stored wikitext yet, and the build reads from it
	async function build() {
		isBuilding = true
		try {
			await weaponAdapter.reparseWeapon(record.id, true)
			toast.success(m.weapon_skills_build_done())
			refetch()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : m.weapon_skills_build_failed())
		} finally {
			isBuilding = false
		}
	}
</script>

{#if skills.length}
	<WeaponSkillList {skills} />
{:else if built}
	<EmptyState message={m.weapon_skills_empty()} />
{:else}
	<EmptyState message={m.weapon_skills_not_built()}>
		{#if canEdit}
			<Button variant="secondary" size="small" onclick={build} disabled={isBuilding}>
				{isBuilding ? m.weapon_skills_building() : m.weapon_skills_build()}
			</Button>
		{/if}
	</EmptyState>
{/if}
