<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { hasEditKeys } from '$lib/utils/editKeys'
	import { userQueries } from '$lib/api/queries/user.queries'
	import { localizeHref } from '$lib/paraglide/runtime'

	interface Props {
		element?: string
	}

	let { element = 'water' }: Props = $props()

	let dismissed = $state(false)

	const hasLocalKeys = browser ? hasEditKeys() : false

	// Only query server if no local keys (to check for deposited keys)
	const meQuery = createQuery(() => ({
		...userQueries.me(),
		enabled: browser && !hasLocalKeys
	}))

	const visible = $derived(
		!dismissed && (hasLocalKeys || (meQuery.data?.hasStoredEditKeys ?? false))
	)
</script>

{#if visible}
	<div class="migrate-banner element-{element}">
		<div class="banner-content">
			<Icon name="info" size={18} />
			<p>{m.migrate_banner_text()}</p>
		</div>
		<Button size="small" variant="primary" onclick={() => goto(localizeHref('/teams/migrate'))}>
			{m.migrate_banner_action()}
		</Button>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.migrate-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit-2x;
		padding: $unit-2x;
		padding-left: $unit + $unit-half;
		border-radius: $card-corner;
	}

	.banner-content {
		display: flex;
		align-items: center;
		gap: $unit;

		p {
			margin: 0;
			font-size: $font-small;
			line-height: 1.4;
		}
	}

	// Element-specific styles
	.element-wind {
		background: var(--wind-portrait-bg);
		color: var(--wind-text);

		:global(svg) { color: var(--wind-text); }
	}

	.element-fire {
		background: var(--fire-portrait-bg);
		color: var(--fire-text);

		:global(svg) { color: var(--fire-text); }
	}

	.element-water {
		background: var(--water-portrait-bg);
		color: var(--water-text);

		:global(svg) { color: var(--water-text); }
	}

	.element-earth {
		background: var(--earth-portrait-bg);
		color: var(--earth-text);

		:global(svg) { color: var(--earth-text); }
	}

	.element-dark {
		background: var(--dark-portrait-bg);
		color: var(--dark-text);

		:global(svg) { color: var(--dark-text); }
	}

	.element-light {
		background: var(--light-portrait-bg);
		color: var(--light-text);

		:global(svg) { color: var(--light-text); }
	}
</style>
