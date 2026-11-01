<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import GachaItemPicker from '$lib/components/gacha/GachaItemPicker.svelte'
	import GachaRateups from '$lib/components/gacha/GachaRateups.svelte'
	import GachaResults from '$lib/components/gacha/GachaResults.svelte'
	import GachaAnimation from '$lib/components/gacha/GachaAnimation.svelte'
	import GachaLog from '$lib/components/gacha/GachaLog.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import { GachaSimulator } from '$lib/features/gacha/gachaSimulator.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { slide } from 'svelte/transition'
	import { MediaQuery } from 'svelte/reactivity'
	import { gachaItemName, gachaItemThumbnail } from '$lib/utils/gacha'
	import type { CatalogueItem } from '$lib/types/gacha'

	let { data } = $props()

	const gacha = new GachaSimulator()
	const isMobile = new MediaQuery('(max-width: 768px)')
	const name = (item: CatalogueItem) => gachaItemName(item, getLocale())
</script>

<PageMeta
	title={m.page_title_gacha()}
	description={m.page_desc_gacha()}
	image={data.ogImage ?? undefined}
	imageWidth={1200}
	imageHeight={630}
/>

<div class="gacha-page">
	<form
		class="card"
		onsubmit={(event) => {
			event.preventDefault()
			void gacha.run()
		}}
	>
		<div class="card-head">
			<div class="operation">
				<SegmentedControl
					value={gacha.operation}
					onValueChange={gacha.selectOperation}
					size="small"
					variant="background"
					grow
				>
					<Segment value="draw" disabled={gacha.busy}>{m.gacha_draw()}</Segment>
					<Segment value="until" disabled={gacha.busy}>
						{isMobile.current ? m.gacha_until_short() : m.gacha_until()}
					</Segment>
					<Segment value="odds" disabled={gacha.busy}>{m.gacha_odds()}</Segment>
				</SegmentedControl>
			</div>
			<Button
				variant="ghost"
				size="small"
				iconOnly
				icon={gacha.collapsed ? 'chevron-down' : 'chevron-up'}
				aria-label={gacha.collapsed ? m.gacha_show_rateups() : m.gacha_hide_rateups()}
				aria-expanded={!gacha.collapsed}
				aria-controls="gacha-rateups"
				type="button"
				onclick={() => (gacha.collapsed = !gacha.collapsed)}
			/>
		</div>
		<div class="settings">
			<div class="fields">
				<Select
					contained
					label={m.gacha_mode()}
					options={gacha.modeOptions}
					bind:value={gacha.mode}
					fullWidth
				/>
				<!-- Classic pools have no seasons, and the current banner shows its own; the choice is kept for other pools -->
				<Select
					contained
					label={m.gacha_season()}
					options={gacha.seasonOptions}
					value={gacha.classic ? '' : gacha.fixedRates ? gacha.bannerSeason : gacha.season}
					onValueChange={(value) => (gacha.season = value ?? '')}
					disabled={gacha.classic || gacha.fixedRates}
					fullWidth
				/>
				<Select
					contained
					label={m.gacha_purchase()}
					options={gacha.purchaseOptions}
					bind:value={gacha.purchase}
					fullWidth
				/>
				{#if gacha.operation !== 'until'}
					<Input
						contained
						label={m.gacha_draws()}
						type="number"
						min={gacha.purchase === 'ten' ? 10 : 1}
						step={gacha.purchase === 'ten' ? 10 : 1}
						bind:value={gacha.draws}
						disabled={gacha.drawsLocked}
						required
						fullWidth
					/>
				{/if}
			</div>

			{#if gacha.operation !== 'draw'}
				<div class="fields">
					<div class="wide">
						<GachaItemPicker
							contained
							label={m.gacha_target()}
							placeholder={m.gacha_search_items()}
							items={gacha.ssrs}
							bind:value={gacha.target}
							onValueChange={() => (gacha.targetError = '')}
							error={gacha.targetError}
							disabled={gacha.loading}
						/>
					</div>
					<Input
						contained
						label={m.gacha_copies()}
						type="number"
						min="1"
						max="1000"
						bind:value={gacha.copies}
						required
						fullWidth
					/>
					{#if gacha.operation === 'odds'}
						<Select
							contained
							label={m.gacha_comparison()}
							options={gacha.comparisonOptions}
							bind:value={gacha.comparison}
							fullWidth
						/>
					{/if}
				</div>
			{/if}

			{#if !gacha.collapsed}
				<div id="gacha-rateups" transition:slide={{ duration: 150 }}>
					{#if gacha.fixedRates}
						<GachaRateups ssrs={gacha.ssrs} rateups={gacha.bannerRateups} readonly>
							{#snippet aside()}
								{#if gacha.bannerLive}
									<Tooltip content={m.gacha_banner_ends({ date: gacha.bannerEnds })}>
										<span class="banner-countdown">
											{m.gacha_banner_remaining({ time: gacha.bannerCountdown })}
										</span>
									</Tooltip>
								{:else if gacha.banner}
									<!-- Until the new banner's rates arrive, the last banner's stand in -->
									<span class="banner-countdown">{m.gacha_banner_expired()}</span>
								{/if}
							{/snippet}
						</GachaRateups>
					{:else}
						<GachaRateups ssrs={gacha.ssrs} bind:rateups={gacha.rateups} disabled={gacha.loading} />
					{/if}
				</div>
			{/if}
		</div>

		{#if gacha.failure}
			<p class="failure" role="alert">{gacha.failure}</p>
		{/if}

		<div class="actions">
			{#if gacha.collapsed && gacha.shownRateups.length > 0}
				<ul class="collapsed-rateups" aria-label={m.gacha_rates()}>
					{#each gacha.shownRateups as rate (rate.identity)}
						{@const item = gacha.itemFor(rate.identity)}
						{#if item}
							<li title="{name(item)} {rate.percent}%">
								<img src={gachaItemThumbnail(item)} alt={name(item)} />
							</li>
						{/if}
					{/each}
				</ul>
			{/if}
			<div class="run">
				{#if gacha.operation === 'draw'}
					<label class="animation-toggle">
						<Switch
							checked={gacha.playAnimation}
							size="small"
							disabled={gacha.busy}
							onCheckedChange={gacha.setPlayAnimation}
						/>
						<span>{m.gacha_play_animation()}</span>
					</label>
				{/if}
				<Button variant="primary" type="submit" disabled={gacha.loading || gacha.busy}>
					{m.gacha_run()}
				</Button>
			</div>
		</div>
	</form>

	{#if gacha.animation}
		<GachaAnimation
			items={gacha.animation.items}
			presentation={gacha.animation.presentation}
			moons={gacha.animation.moons}
			newCharacters={gacha.animation.newCharacters}
			onDone={gacha.closeAnimation}
			onDrawAgain={gacha.drawAgain}
		/>
	{/if}

	<!-- Held back while the animation plays, so they don't give it away -->
	{#if gacha.result && !gacha.animation && !gacha.drawingAgain}
		<GachaResults
			result={gacha.result}
			heading={m.gacha_latest_result()}
			target={gacha.resultTarget}
			operation={gacha.operation}
			bind:currency={gacha.currency}
			bind:art={gacha.art}
			link={gacha.resultLink}
		/>
	{/if}

	{#if gacha.log.length > 0 && !gacha.animation && !gacha.drawingAgain}
		<GachaLog
			entries={gacha.log}
			bind:currency={gacha.currency}
			bind:art={gacha.art}
			onClear={gacha.clearLog}
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/mixins' as *;

	.gacha-page {
		max-width: var(--main-max-width);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.card {
		background: var(--card-bg);
		color: var(--text-primary);
		border: $card-border;
		border-radius: $page-corner;
		box-shadow: $page-elevation;
		padding: $unit-3x;
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
	}

	.card-head {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	.operation {
		flex: 1;
		min-width: 0;
	}

	.settings {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
	}

	.fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: $unit-2x;

		.wide {
			grid-column: span 2;

			@media (max-width: 450px) {
				grid-column: auto;
			}
		}
	}

	.banner-countdown {
		color: var(--text-secondary);
		font-size: $font-small;
		font-variant-numeric: tabular-nums;
	}

	.failure {
		margin: 0;
		color: $error;
		font-size: $font-small;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: $unit;
	}

	// Keeps its size; the rate-up thumbnails wrap to make room, and on a narrow
	// screen it moves below them
	.run {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: $unit-2x;
		margin-left: auto;
	}

	.animation-toggle {
		display: flex;
		align-items: center;
		gap: $unit;
		font-size: $font-small;
		color: var(--text-secondary);
		white-space: nowrap;
		cursor: pointer;
	}

	.collapsed-rateups {
		display: flex;
		// At least three thumbnails wide
		flex: 1 1 calc($unit-5x * 3 + $unit-half * 2);
		flex-wrap: wrap;
		gap: $unit-half;
		min-width: 0;
		margin: 0;
		padding: 0;
		list-style: none;

		img {
			display: block;
			width: $unit-5x;
			height: $unit-5x;
			border-radius: $item-corner-small;
			object-fit: cover;

			// 25% larger on desktop
			@media (min-width: 769px) {
				width: 50px;
				height: 50px;
			}
		}
	}
</style>
