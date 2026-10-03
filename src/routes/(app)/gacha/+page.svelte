<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import type { CatalogueItem, GachaResult } from '$lib/types/gacha'

	let operation = $state<'draw' | 'until' | 'odds'>('draw')
	let mode = $state('premium')
	let season = $state('')
	let purchase = $state<'ten' | 'singles'>('ten')
	let draws = $state('300')
	let copies = $state(1)
	let comparison = $state('at_least')
	let target = $state('')
	let seed = $state('')
	let search = $state('')
	let rateTarget = $state('')
	let ratePercent = $state('0.3')
	let rateups = $state<{ identity: string; percent: string }[]>([])
	let items = $state<CatalogueItem[]>([])
	let result = $state<GachaResult | null>(null)
	let busy = $state(false)
	let loading = $state(true)
	let failure = $state('')
	let runController: AbortController | undefined
	const modes = $derived({
		premium: m.gacha_premium(),
		legend: m.gacha_legend(),
		flash: m.gacha_flash(),
		classic: m.gacha_classic(),
		classic_ii: m.gacha_classic_ii(),
		classic_iii: m.gacha_classic_iii()
	})
	const seasons = $derived({
		valentines: m.gacha_valentines(),
		summer: m.gacha_summer(),
		halloween: m.gacha_halloween(),
		holiday: m.gacha_holiday(),
		formal: m.gacha_formal()
	})
	const classic = $derived(mode.startsWith('classic'))
	const filtered = $derived(
		items.filter((item) =>
			`${item.name.en} ${item.name.ja} ${item.granblue_id} ${item.recruits?.en ?? ''}`
				.toLowerCase()
				.includes(search.toLowerCase())
		)
	)
	function amount(value: string) {
		const [integer = '0', fraction = ''] = value.split('.')
		const decimals = fraction.replace(/0+$/, '')
		return `${BigInt(integer).toLocaleString(getLocale())}${decimals ? `.${decimals}` : ''}`
	}
	const name = (item: CatalogueItem) =>
		(getLocale() === 'ja' ? item.name.ja : item.name.en) || item.name.en

	$effect(() => {
		const query = `mode=${encodeURIComponent(mode)}${!classic && season ? `&season=${encodeURIComponent(season)}` : ''}`
		const controller = new AbortController()
		loading = true
		failure = ''
		fetch(`/api/gacha/catalogue?${query}`, { signal: controller.signal })
			.then(async (response) => {
				const data = await response.json()
				if (!response.ok) throw new Error(data.error)
				items = data.items
				target = ''
				rateups = []
			})
			.catch((error) => {
				if (!controller.signal.aborted) failure = String(error.message)
			})
			.finally(() => {
				if (!controller.signal.aborted) loading = false
			})
		return () => controller.abort()
	})
	$effect(() => () => runController?.abort())

	async function run(replay = false) {
		if (busy) return
		busy = true
		failure = ''
		runController = new AbortController()
		const signal = runController.signal
		const payload =
			replay && result
				? {
						...result.configuration,
						draws: result.draws,
						seed: result.seed,
						target: result.target,
						copies: Number(result.requested_copies ?? 1),
						comparison: result.comparison
					}
				: {
						mode,
						season: classic ? null : season || null,
						purchase,
						draws,
						copies,
						comparison,
						target,
						rateups,
						...(seed ? { seed } : {})
					}
		try {
			let response = await fetch(`/api/gacha/${operation === 'draw' ? 'simulations' : operation}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				signal
			})
			let data = await response.json()
			if (!response.ok) throw new Error(data.error)
			if (data.token) {
				const token = data.token
				const deadline = Date.now() + 10 * 60_000
				while (Date.now() < deadline) {
					await new Promise((resolve) => setTimeout(resolve, 1500))
					response = await fetch(`/api/gacha/jobs/${token}`, { signal })
					data = await response.json()
					if (!response.ok || data.status === 'failed') throw new Error(data.error)
					if (data.status === 'complete') {
						data = data.result
						break
					}
				}
				if (!data.draws) throw new Error(m.gacha_error())
			}
			result = data
		} catch (error) {
			if (!signal.aborted) failure = error instanceof Error ? error.message : m.gacha_error()
		} finally {
			busy = false
		}
	}
	function addRate() {
		if (!rateTarget || rateups.some((rate) => rate.identity === rateTarget)) return
		rateups = [...rateups, { identity: rateTarget, percent: ratePercent }]
	}
</script>

<PageMeta title={m.gacha_title()} description={m.gacha_notice()} />
<section class="gacha">
	<h1>{m.gacha_title()}</h1>
	<p>{m.gacha_notice()}</p>
	<nav aria-label={m.gacha_title()}>
		{#each ['draw', 'until', 'odds'] as tab (tab)}
			<Button
				active={operation === tab}
				disabled={busy}
				onclick={() => {
					operation = tab as typeof operation
					result = null
				}}
			>
				{tab === 'draw' ? m.gacha_draw() : tab === 'until' ? m.gacha_until() : m.gacha_odds()}
			</Button>
		{/each}
	</nav>
	<form
		onsubmit={(event) => {
			event.preventDefault()
			void run()
		}}
	>
		<fieldset disabled={busy}>
			<div class="controls">
				<label
					>{m.gacha_mode()}<select aria-label={m.gacha_mode()} bind:value={mode}
						>{#each Object.entries(modes) as [value, label] (value)}<option {value}>{label}</option
							>{/each}</select
					></label
				>
				<label
					>{m.gacha_season()}<select
						aria-label={m.gacha_season()}
						bind:value={season}
						disabled={classic}
						><option value="">{m.gacha_none()}</option
						>{#each Object.entries(seasons) as [value, label] (value)}<option {value}
								>{label}</option
							>{/each}</select
					></label
				>
				<label
					>{m.gacha_purchase()}<select aria-label={m.gacha_purchase()} bind:value={purchase}
						><option value="ten">{m.gacha_ten()}</option><option value="singles"
							>{m.gacha_singles()}</option
						></select
					></label
				>
				{#if operation !== 'until'}<label
						>{m.gacha_draws()}<input
							type="text"
							inputmode="numeric"
							pattern="[0-9]+"
							bind:value={draws}
							required
						/></label
					>{/if}
				<label>{m.gacha_seed()}<input bind:value={seed} maxlength="128" /></label>
			</div>
			<label>{m.gacha_search()}<input type="search" bind:value={search} /></label>
			{#if operation !== 'draw'}
				<div class="controls">
					<label
						>{m.gacha_target()}<select aria-label={m.gacha_target()} bind:value={target} required
							><option value="">—</option>{#each filtered as item (item.identity)}<option
									value={item.identity}
									>{name(item)} ({item.drawable_type}, {item.granblue_id})</option
								>{/each}</select
						></label
					>
					<label
						>{m.gacha_copies()}<input
							type="number"
							min="1"
							max="1000"
							bind:value={copies}
							required
						/></label
					>
					{#if operation === 'odds'}<label
							>{m.gacha_comparison()}<select
								aria-label={m.gacha_comparison()}
								bind:value={comparison}
								><option value="at_least">{m.gacha_at_least()}</option><option value="exactly"
									>{m.gacha_exactly()}</option
								></select
							></label
						>{/if}
				</div>
			{/if}
			<h2>{m.gacha_rates()}</h2>
			<p>{m.gacha_rate_help()}</p>
			<div class="controls">
				<label
					>{m.gacha_target()}<select aria-label={m.gacha_target()} bind:value={rateTarget}
						><option value="">—</option
						>{#each filtered.filter((item) => item.rarity === 3) as item (item.identity)}<option
								value={item.identity}>{name(item)} ({item.drawable_type})</option
							>{/each}</select
					></label
				>
				<label>%<input type="text" inputmode="decimal" bind:value={ratePercent} /></label>
				<Button onclick={addRate} disabled={!rateTarget}>{m.gacha_add()}</Button>
			</div>
			{#each rateups as rate, index (rate.identity)}
				<div class="rate">
					<span>{items.find((item) => item.identity === rate.identity)?.name.en}</span>
					<input aria-label={m.gacha_rates()} bind:value={rate.percent} />
					<Button
						onclick={() => {
							rateups = rateups.filter((_, i) => i !== index)
						}}>{m.gacha_remove()}</Button
					>
				</div>
			{/each}
			<button class="run" type="submit" disabled={loading || busy}
				>{busy ? m.gacha_running() : m.gacha_run()}</button
			>
		</fieldset>
	</form>
	{#if failure}<p role="alert">{failure}</p>{/if}
	{#if result}
		<section aria-live="polite">
			<h2>{m.gacha_results()}</h2>
			{#if operation !== 'until'}<p>{m.gacha_draws()}: {amount(result.draws)}</p>{/if}
			{#if operation === 'until'}<p>{m.gacha_sampled()}</p>
				<strong class="sample">{amount(result.draws)}</strong>
				<p>{m.gacha_count()}: {amount(result.copies ?? '0')}</p>{/if}
			{#if result.probability !== undefined}
				<p>
					{m.gacha_probability()}: <strong>{(result.probability * 100).toPrecision(8)}%</strong>
				</p>
				<p>{m.gacha_expected()}: {result.expected_copies}</p>
				<p>
					{m.gacha_thresholds()}: {['50', '90', '95']
						.map((key) => result?.thresholds?.[key] ?? m.gacha_beyond())
						.join(' / ')}
				</p>
			{/if}
			<h3>{m.gacha_cost()}</h3>
			<p>
				{amount(result.cost.crystals)}
				{m.gacha_crystals()} · ¥{amount(result.cost.jpy)} · {result.cost.usd
					? `$${amount(result.cost.usd)} USD`
					: m.gacha_no_usd()}
			</p>
			{#if result.cost.exchange_rate}<p>
					{result.cost.exchange_rate.provider} · {result.cost.exchange_rate.date} · 1 USD = {result
						.cost.exchange_rate.jpy_per_usd} JPY {result.cost.exchange_rate.stale
						? m.gacha_stale()
						: ''}
				</p>{/if}
			<p>{m.gacha_cost_note()}</p>
			<p>{m.gacha_replay_seed()}: {result.seed}</p>
			<Button
				disabled={busy}
				onclick={() => {
					void run(true)
				}}>{m.gacha_replay()}</Button
			>
			{#if result.ordered}
				<details>
					<summary>{m.gacha_draw_order()}</summary>
					<ol>
						{#each result.ordered as item, index (index)}<li>{name(item)}</li>{/each}
					</ol>
				</details>
			{/if}
			{#if result.items}<table>
					<thead><tr><th>{m.gacha_target()}</th><th>{m.gacha_count()}</th></tr></thead><tbody
						>{#each result.items as item (item.identity)}<tr
								><td>{name(item)}</td><td>{amount(item.count ?? '0')}</td></tr
							>{/each}</tbody
					>
				</table>{/if}
		</section>
	{/if}
</section>

<style lang="scss">
	.gacha {
		max-width: 960px;
		margin: 0 auto;
		padding: 2rem;
	}
	nav,
	.controls,
	.rate {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: end;
		margin: 1rem 0;
	}
	fieldset {
		border: 0;
		padding: 0;
	}
	label {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 160px;
	}
	input,
	select {
		font: inherit;
		padding: 0.65rem;
		border: 1px solid #8888;
		border-radius: 0.4rem;
		background: transparent;
		color: inherit;
		max-width: 100%;
	}
	select {
		width: 100%;
	}
	.run {
		font: inherit;
		cursor: pointer;
		padding: 0.8rem 1.5rem;
		margin: 1rem 0;
		border-radius: 0.5rem;
	}
	.sample {
		font-size: clamp(2rem, 7vw, 4rem);
	}
	table {
		width: 100%;
		text-align: left;
		margin-top: 1.5rem;
	}
	td,
	th {
		padding: 0.5rem;
		border-bottom: 1px solid #8884;
	}
	[role='alert'] {
		color: #db5757;
	}
</style>
