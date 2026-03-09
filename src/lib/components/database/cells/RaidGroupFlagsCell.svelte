
<script lang="ts">
	interface Props {
		row: any
	}

	const { row }: Props = $props()
</script>

<div class="flags">
	{#if row.hl}<span class="flag hl">HL</span>{/if}
	{#if row.extra}<span class="flag extra">Extra</span>{/if}
	{#if row.guidebooks}<span class="flag guidebooks">Guidebooks</span>{/if}
	{#if row.unlimited}<span class="flag unlimited">Unlimited</span>{/if}
	{#if !row.hl && !row.extra && !row.guidebooks && !row.unlimited}
		<span class="no-flags">—</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/typography' as typography;
	@use '$src/themes/spacing' as spacing;

	.flags {
		display: flex;
		gap: spacing.$unit-half;
		flex-wrap: wrap;
	}

	.flag {
		display: inline-block;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: typography.$font-tiny;
		font-weight: typography.$bold;

		&.hl {
			background: var(--flag-hl);
			color: white;
		}

		&.extra {
			background: var(--flag-extra);
			color: white;
		}

		&.guidebooks {
			background: var(--flag-guidebooks);
			color: white;
		}

		&.unlimited {
			background: var(--flag-unlimited);
			color: white;
		}
	}

	.no-flags {
		color: var(--text-tertiary);
	}
</style>
