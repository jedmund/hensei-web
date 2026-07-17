<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity'
	import { getWeaponSkillIcon } from '$lib/utils/images'
	import { appLocale } from '$lib/utils/locale'

	interface Props {
		/** Distinct icon stems for the family — more than one when versions resolve to
		 * different element/type art (e.g. Aegis's per-element icons). */
		iconStems: string[]
		size?: number
		/** Milliseconds between icon transitions when there's more than one. */
		interval?: number
		/** Cap how many distinct icons cycle — large families can carry dozens of
		 * near-duplicate per-weapon variants, which isn't meaningfully "elements/types". */
		maxIcons?: number
	}

	let { iconStems, size = 48, interval = 2000, maxIcons = 6 }: Props = $props()

	const locale = $derived(appLocale())
	const urls = $derived(
		[...new Set(iconStems)]
			.slice(0, maxIcons)
			.map((stem) => getWeaponSkillIcon(stem, locale))
			.filter((url): url is string => !!url)
	)

	let index = $state(0)
	const failed = new SvelteSet<number>()

	// Reset cycling state whenever the underlying icon set changes.
	$effect(() => {
		void urls
		index = 0
		failed.clear()
	})

	$effect(() => {
		if (urls.length <= 1) return
		const id = setInterval(() => {
			index = (index + 1) % urls.length
		}, interval)
		return () => clearInterval(id)
	})

	function hideBroken(i: number) {
		failed.add(i)
	}

	const visibleCount = $derived(urls.length - failed.size)
</script>

{#if visibleCount > 0}
	<div class="weapon-skill-icon" style:width="{size}px" style:height="{size}px">
		{#each urls as url, i (url)}
			{#if !failed.has(i)}
				<img
					src={url}
					alt=""
					class="icon-frame"
					class:active={i === index}
					onerror={() => hideBroken(i)}
				/>
			{/if}
		{/each}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/layout' as layout;

	.weapon-skill-icon {
		position: relative;
		flex-shrink: 0;
	}

	.icon-frame {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
		opacity: 0;
		transition: opacity 0.5s ease;

		&.active {
			opacity: 1;
		}
	}
</style>
