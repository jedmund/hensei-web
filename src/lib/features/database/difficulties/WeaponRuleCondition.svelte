<script lang="ts">
	interface Props {
		type: string
		params: Record<string, unknown>
		onchange: (changes: Record<string, unknown>) => void
	}
	let { type, params, onchange }: Props = $props()
	const bounds = $derived(
		type === 'weapon_transcendence_at_least'
			? ['min_transcendence_step', 'max_transcendence_step']
			: type === 'weapon_uncap_at_least'
				? ['min_uncap_level', 'max_uncap_level']
				: ['min_awakening_level', 'max_awakening_level']
	)
</script>

{#if type === 'weapon_series_match'}
	<label>
		<span>Series slugs <small>(comma-separated)</small></span>
		<input
			aria-label="Series slugs"
			value={Array.isArray(params.series_slugs) ? params.series_slugs.join(', ') : ''}
			placeholder="illustrious"
			onchange={(event) =>
				onchange({
					series_slugs: event.currentTarget.value
						.split(',')
						.map((v) => v.trim())
						.filter(Boolean)
				})}
		/>
	</label>
	<p>
		Use catalogue slugs such as <code>illustrious</code>. Series UUIDs can also be supplied as
		<code>series_ids</code> in JSON.
	</p>
{:else}
	<div class="bounds">
		{#each bounds as key, index (key)}
			<label>
				<span
					>{index === 0 ? 'Minimum' : 'Maximum'}
					{type === 'weapon_transcendence_at_least' ? 'step' : 'level'}</span
				>
				<input
					type="number"
					min={index === 0 ? 1 : 0}
					aria-label={`${index === 0 ? 'Minimum' : 'Maximum'} ${type === 'weapon_transcendence_at_least' ? 'step' : 'level'}`}
					value={params[key] == null ? '' : String(params[key])}
					placeholder={index === 1 ? 'No limit' : '1'}
					onchange={(event) =>
						onchange({
							[key]: event.currentTarget.value === '' ? null : Number(event.currentTarget.value)
						})}
				/>
			</label>
		{/each}
	</div>
	<p>
		Bounds include their endpoints. {type === 'weapon_transcendence_at_least'
			? 'Use 3–4 to exclude step 5, or set both bounds to 5 for exactly step 5.'
			: 'Leave Maximum empty for no upper limit.'}
	</p>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;
	label {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		flex: 1;
		min-width: 0;
	}
	span,
	p {
		font-size: typography.$font-small;
	}
	p {
		color: var(--text-tertiary);
		margin: spacing.$unit 0 0;
	}
	small {
		color: var(--text-tertiary);
	}
	.bounds {
		display: flex;
		gap: spacing.$unit;
	}
	input {
		background: var(--input-bound-bg);
		color: var(--text-primary);
		border: 2px solid transparent;
		border-radius: layout.$input-corner;
		padding: spacing.$unit;
		min-width: 0;
		width: 100%;
		font: inherit;
		&:hover {
			background: var(--input-bound-bg-hover);
		}
		&:focus {
			outline: 2px solid var(--focus-ring);
		}
	}
</style>
