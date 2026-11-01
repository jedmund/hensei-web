<script lang="ts">
	import { goto } from '$app/navigation'
	import { localizeHref } from '$lib/paraglide/runtime'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		isAuthenticated: boolean
		onCreate: () => void
	}

	const { isAuthenticated, onCreate }: Props = $props()
</script>

<div class="no-crew-content">
	<p class="description">
		{m.crew_intro()}
	</p>

	<div class="actions">
		{#if isAuthenticated}
			<Button variant="primary" size="small" onclick={onCreate}>
				{m.crew_create()}
			</Button>
		{:else}
			<Button variant="primary" size="small" onclick={() => goto(localizeHref('/auth/register'))}>
				{m.crew_sign_up()}
			</Button>
			<Button variant="secondary" size="small" onclick={() => goto(localizeHref('/auth/login'))}>
				{m.crew_log_in()}
			</Button>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.no-crew-content {
		padding: spacing.$unit-3x spacing.$unit-2x;
		text-align: center;

		.description {
			color: var(--text-primary);
			font-size: typography.$font-small;
			line-height: 1.5;
			margin-bottom: spacing.$unit-2x;
			max-width: 360px;
			margin-left: auto;
			margin-right: auto;
		}
	}

	.actions {
		display: flex;
		justify-content: center;
		gap: spacing.$unit;
	}
</style>
