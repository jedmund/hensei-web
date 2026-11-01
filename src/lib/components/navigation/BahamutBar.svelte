<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { m } from '$lib/paraglide/messages'
	import type { UserCookie } from '$lib/types/UserCookie'

	interface Props {
		currentUser: UserCookie
	}

	const { currentUser }: Props = $props()

	// Turn off Bahamut Mode
	async function handleBahamutOff() {
		const updatedUser = { ...currentUser, bahamut: false }
		await fetch('/api/settings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updatedUser)
		})
		await invalidateAll()
		window.location.reload()
	}
</script>

<button class="bahamut-bar" onclick={handleBahamutOff}>
	{m.nav_bahamut_mode_on()}
</button>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	// Full-width strip above the navigation
	.bahamut-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: spacing.$unit;
		background-color: #7c3aed;
		color: white;
		border: none;
		cursor: pointer;
		font-family: var(--font-family);
		font-size: typography.$font-tiny;
		font-weight: typography.$medium;
		transition: background-color 0.2s ease;

		&:hover {
			background-color: #6d28d9;
		}
	}
</style>
