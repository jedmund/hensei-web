<script lang="ts">
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { NEW_TEAM_PATH } from '$lib/utils/browseRoutes'
	import Button from '../ui/Button.svelte'
	import type { NavElement } from './navigationState.svelte'

	interface Props {
		userElement?: NavElement | undefined
	}

	const { userElement }: Props = $props()

	const newTeamHref = $derived(localizeHref(NEW_TEAM_PATH))
</script>

<Button
	icon="plus"
	iconOnly
	shape="circle"
	variant={userElement ? 'primary' : 'subtle'}
	{...userElement ? { element: userElement } : {}}
	elementStyle={Boolean(userElement)}
	class="new-team-button"
	aria-label={m.nav_new_team()}
	href={newTeamHref}
/>
