<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { difficultyQueries } from '$lib/api/queries/difficulty.queries'
	import {
		difficultyAdapter,
		type DifficultyComponent,
		type DifficultyRule,
		type DifficultyPreviewResult
	} from '$lib/api/adapters/difficulty.adapter'
	import type { DifficultyTier } from '$lib/types/api/party'

	type Tab = 'tiers' | 'rules' | 'components'
	let activeTab = $state<Tab>('tiers')

	const client = useQueryClient()

	const tiersQuery = createQuery(() => difficultyQueries.tiers())
	const componentsQuery = createQuery(() => difficultyQueries.components())
	const rulesQuery = createQuery(() => difficultyQueries.rules())
	const ruleTypesQuery = createQuery(() => difficultyQueries.ruleTypes())

	const tiers = $derived(tiersQuery.data ?? [])
	const components = $derived(componentsQuery.data ?? [])
	const rules = $derived(rulesQuery.data ?? [])
	const ruleTypes = $derived(ruleTypesQuery.data?.types ?? [])

	function invalidate(scope: 'tiers' | 'components' | 'rules') {
		const key = scope === 'tiers' ? ['difficulties', 'tiers'] : ['difficulties', scope]
		client.invalidateQueries({ queryKey: key })
	}

	// ============ Tier mutations ============
	const updateTier = createMutation(() => ({
		mutationFn: (input: { id: string; data: Partial<DifficultyTier> }) =>
			difficultyAdapter.updateTier(input.id, input.data),
		onSuccess: () => invalidate('tiers')
	}))
	const createTier = createMutation(() => ({
		mutationFn: (data: Partial<DifficultyTier>) => difficultyAdapter.createTier(data),
		onSuccess: () => {
			invalidate('tiers')
			newTier = freshTier()
		}
	}))
	const deleteTier = createMutation(() => ({
		mutationFn: (id: string) => difficultyAdapter.deleteTier(id),
		onSuccess: () => invalidate('tiers')
	}))

	// ============ Component mutations ============
	const updateComponent = createMutation(() => ({
		mutationFn: (input: { id: string; data: Partial<DifficultyComponent> }) =>
			difficultyAdapter.updateComponent(input.id, input.data),
		onSuccess: () => invalidate('components')
	}))

	// ============ Rule mutations ============
	const updateRule = createMutation(() => ({
		mutationFn: (input: { id: string; data: Partial<DifficultyRule> }) =>
			difficultyAdapter.updateRule(input.id, input.data),
		onSuccess: () => invalidate('rules')
	}))
	const createRule = createMutation(() => ({
		mutationFn: (data: Partial<DifficultyRule>) => difficultyAdapter.createRule(data),
		onSuccess: () => {
			invalidate('rules')
			newRule = freshRule()
		}
	}))
	const deleteRule = createMutation(() => ({
		mutationFn: (id: string) => difficultyAdapter.deleteRule(id),
		onSuccess: () => invalidate('rules')
	}))

	// ============ Preview ============
	let previewShortcode = $state('')
	let previewResult = $state<DifficultyPreviewResult | null>(null)
	let previewError = $state('')
	let previewLoading = $state(false)

	async function runPreview() {
		previewError = ''
		previewLoading = true
		previewResult = null
		try {
			previewResult = await difficultyAdapter.preview(previewShortcode.trim())
		} catch (err) {
			previewError = err instanceof Error ? err.message : 'Preview failed'
		} finally {
			previewLoading = false
		}
	}

	// ============ New-tier form ============
	function freshTier(): Partial<DifficultyTier> {
		return { name: '', slug: '', color: '#86C5A8', min_score: 0, max_score: 100, sort_order: 0 }
	}
	let newTier = $state<Partial<DifficultyTier>>(freshTier())

	// ============ New-rule form ============
	function freshRule(): Partial<DifficultyRule> {
		return {
			name: '',
			component: 'weapon',
			rule_type: '',
			weight: 1,
			active: true,
			params: {}
		}
	}
	let newRule = $state<Partial<DifficultyRule>>(freshRule())
	let newRuleParamsRaw = $state('{}')

	function setRuleParamsFromString() {
		try {
			newRule.params = JSON.parse(newRuleParamsRaw || '{}')
			return true
		} catch {
			return false
		}
	}

	// Per-rule edit state — track which rule is being edited and the working JSON for params
	let editingRuleId = $state<string | null>(null)
	let editingParamsRaw = $state('{}')
</script>

<PageMeta
	title="Difficulties — Database"
	description="Manage party difficulty tiers, rules, and components."
/>

<div class="page">
	<header class="page-header">
		<h1>{m.party_difficulty_label()}</h1>
	</header>

	<nav class="tabs">
		<button class:active={activeTab === 'tiers'} onclick={() => (activeTab = 'tiers')}>Tiers</button
		>
		<button class:active={activeTab === 'rules'} onclick={() => (activeTab = 'rules')}>Rules</button
		>
		<button class:active={activeTab === 'components'} onclick={() => (activeTab = 'components')}>
			Components
		</button>
	</nav>

	<div class="content">
		<section class="main">
			{#if activeTab === 'tiers'}
				<h2>Tiers</h2>
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Slug</th>
							<th>Color</th>
							<th>Min</th>
							<th>Max</th>
							<th>Sort</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each tiers as tier (tier.id)}
							<tr>
								<td
									><input
										value={tier.name}
										oninput={(e) => (tier.name = e.currentTarget.value)}
									/></td
								>
								<td
									><input
										value={tier.slug}
										oninput={(e) => (tier.slug = e.currentTarget.value)}
									/></td
								>
								<td>
									<input
										type="color"
										value={tier.color ?? '#cccccc'}
										oninput={(e) => (tier.color = e.currentTarget.value)}
									/>
								</td>
								<td>
									<input
										type="number"
										step="0.01"
										value={tier.min_score}
										oninput={(e) => (tier.min_score = parseFloat(e.currentTarget.value))}
									/>
								</td>
								<td>
									<input
										type="number"
										step="0.01"
										value={tier.max_score}
										oninput={(e) => (tier.max_score = parseFloat(e.currentTarget.value))}
									/>
								</td>
								<td>
									<input
										type="number"
										value={tier.sort_order}
										oninput={(e) => (tier.sort_order = parseInt(e.currentTarget.value, 10))}
									/>
								</td>
								<td class="actions">
									<Button
										size="small"
										onclick={() =>
											updateTier.mutate({
												id: tier.id,
												data: {
													name: tier.name,
													slug: tier.slug,
													color: tier.color,
													min_score: tier.min_score,
													max_score: tier.max_score,
													sort_order: tier.sort_order
												}
											})}
									>
										Save
									</Button>
									<Button
										size="small"
										variant="destructive"
										onclick={() => {
											if (confirm(`Delete tier "${tier.name}"?`)) deleteTier.mutate(tier.id)
										}}
									>
										Delete
									</Button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<h3>New tier</h3>
				<div class="new-row">
					<input placeholder="Name" bind:value={newTier.name} />
					<input placeholder="Slug" bind:value={newTier.slug} />
					<input type="color" bind:value={newTier.color} />
					<input type="number" placeholder="Min" bind:value={newTier.min_score} />
					<input type="number" placeholder="Max" bind:value={newTier.max_score} />
					<input type="number" placeholder="Sort" bind:value={newTier.sort_order} />
					<Button onclick={() => createTier.mutate(newTier)}>Create</Button>
				</div>
			{:else if activeTab === 'components'}
				<h2>Components</h2>
				<p class="hint">
					Per-component weights and minimum item counts. Components are seeded; you can adjust their
					weights but cannot create/destroy them.
				</p>
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Weight</th>
							<th>Min items</th>
							<th>Enabled</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each components as comp (comp.id)}
							<tr>
								<td><strong>{comp.name}</strong></td>
								<td>
									<input
										type="number"
										step="0.1"
										value={comp.weight}
										oninput={(e) => (comp.weight = parseFloat(e.currentTarget.value))}
									/>
								</td>
								<td>
									<input
										type="number"
										value={comp.min_count_to_score}
										oninput={(e) => (comp.min_count_to_score = parseInt(e.currentTarget.value, 10))}
									/>
								</td>
								<td>
									<Switch checked={comp.enabled} onCheckedChange={(v) => (comp.enabled = v)} />
								</td>
								<td>
									<Button
										size="small"
										onclick={() =>
											updateComponent.mutate({
												id: comp.id,
												data: {
													weight: comp.weight,
													min_count_to_score: comp.min_count_to_score,
													enabled: comp.enabled
												}
											})}
									>
										Save
									</Button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<h2>Rules</h2>
				<p class="hint">
					Each rule contributes its weight to the relevant component sub-score when it fires. Edit
					params as JSON; available rule types are listed below.
				</p>

				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Component</th>
							<th>Rule type</th>
							<th>Weight</th>
							<th>Active</th>
							<th>Params</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each rules as rule (rule.id)}
							<tr>
								<td
									><input
										value={rule.name}
										oninput={(e) => (rule.name = e.currentTarget.value)}
									/></td
								>
								<td>{rule.component}</td>
								<td>{rule.rule_type}</td>
								<td>
									<input
										type="number"
										step="0.1"
										value={rule.weight}
										oninput={(e) => (rule.weight = parseFloat(e.currentTarget.value))}
									/>
								</td>
								<td>
									<Switch checked={rule.active} onCheckedChange={(v) => (rule.active = v)} />
								</td>
								<td>
									{#if editingRuleId === rule.id}
										<textarea
											rows="3"
											value={editingParamsRaw}
											oninput={(e) => (editingParamsRaw = e.currentTarget.value)}
										></textarea>
									{:else}
										<button
											class="link"
											onclick={() => {
												editingRuleId = rule.id
												editingParamsRaw = JSON.stringify(rule.params, null, 2)
											}}
										>
											Edit
										</button>
										<code class="params-summary">{JSON.stringify(rule.params)}</code>
									{/if}
								</td>
								<td class="actions">
									<Button
										size="small"
										onclick={() => {
											const data: Partial<DifficultyRule> = {
												name: rule.name,
												weight: rule.weight,
												active: rule.active
											}
											if (editingRuleId === rule.id) {
												try {
													data.params = JSON.parse(editingParamsRaw || '{}')
												} catch {
													alert('Invalid JSON in params')
													return
												}
												editingRuleId = null
											}
											updateRule.mutate({ id: rule.id, data })
										}}
									>
										Save
									</Button>
									<Button
										size="small"
										variant="destructive"
										onclick={() => {
											if (confirm(`Delete rule "${rule.name}"?`)) deleteRule.mutate(rule.id)
										}}
									>
										Delete
									</Button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<h3>New rule</h3>
				<div class="new-rule">
					<label>
						Name
						<input bind:value={newRule.name} />
					</label>
					<label>
						Component
						<select bind:value={newRule.component}>
							<option value="weapon">weapon</option>
							<option value="character">character</option>
							<option value="summon">summon</option>
							<option value="job">job</option>
							<option value="accessory">accessory</option>
						</select>
					</label>
					<label>
						Rule type
						<select bind:value={newRule.rule_type}>
							<option value="">— select —</option>
							{#each ruleTypes as t (t)}
								<option value={t}>{t}</option>
							{/each}
						</select>
					</label>
					<label>
						Weight
						<input type="number" step="0.1" bind:value={newRule.weight} />
					</label>
					<label>
						Params (JSON)
						<textarea rows="4" bind:value={newRuleParamsRaw}></textarea>
					</label>
					<Button
						onclick={() => {
							if (!setRuleParamsFromString()) {
								alert('Invalid JSON in params')
								return
							}
							createRule.mutate(newRule)
						}}
					>
						Create rule
					</Button>
				</div>
			{/if}
		</section>

		<aside class="preview">
			<h2>Preview</h2>
			<p class="hint">
				Score a party against the current ruleset without persisting. Helpful when tuning weights or
				testing new rules.
			</p>
			<Input bind:value={previewShortcode} placeholder="Party shortcode" />
			<Button onclick={runPreview} disabled={!previewShortcode.trim() || previewLoading}>
				{previewLoading ? 'Loading…' : 'Run preview'}
			</Button>

			{#if previewError}
				<p class="error">{previewError}</p>
			{/if}

			{#if previewResult}
				<div class="preview-result">
					{#if !previewResult.scoreable}
						<p class="warn">Party isn't scoreable yet (below the minimum item threshold).</p>
					{:else}
						<p>
							<strong>{previewResult.tier?.name ?? '—'}</strong>
							<span class="score">{previewResult.score?.toFixed(2) ?? '0'}</span>
						</p>
						<p class="muted">Ruleset version: {previewResult.ruleset_version}</p>
						{#if previewResult.breakdown}
							<details>
								<summary>Breakdown</summary>
								<pre>{JSON.stringify(previewResult.breakdown, null, 2)}</pre>
							</details>
						{/if}
					{/if}
				</div>
			{/if}
		</aside>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.page {
		padding: $unit-2x;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.page-header h1 {
		font-size: $font-large;
		font-weight: $bold;
	}

	.tabs {
		display: flex;
		gap: $unit;
		border-bottom: 1px solid var(--border-color);

		button {
			padding: $unit $unit-2x;
			background: transparent;
			border: none;
			border-bottom: 2px solid transparent;
			font: inherit;
			color: var(--text-secondary);
			cursor: pointer;

			&.active {
				color: var(--text-primary);
				border-bottom-color: var(--text-primary);
			}
		}
	}

	.content {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: $unit-2x;

		@media (max-width: 1024px) {
			grid-template-columns: 1fr;
		}
	}

	.main h2 {
		margin-top: 0;
		margin-bottom: $unit;
	}

	.main h3 {
		margin-top: $unit-2x;
		margin-bottom: $unit;
	}

	.hint {
		color: var(--text-secondary);
		margin-bottom: $unit-2x;
		font-size: $font-small;
	}

	table {
		width: 100%;
		border-collapse: collapse;

		th,
		td {
			text-align: left;
			padding: $unit-half $unit;
			border-bottom: 1px solid var(--border-color);
			font-size: $font-small;
			vertical-align: middle;
		}

		input,
		textarea,
		select {
			width: 100%;
			padding: $unit-half;
			border: 1px solid var(--border-color);
			border-radius: $item-corner-small;
			background: var(--input-bg);
			color: var(--text-primary);
			font: inherit;
		}

		input[type='number'] {
			width: 80px;
		}

		.actions {
			display: flex;
			gap: $unit-half;
			white-space: nowrap;
		}

		.params-summary {
			display: block;
			max-width: 320px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			color: var(--text-secondary);
			font-size: 0.75em;
		}

		.link {
			background: transparent;
			border: none;
			color: var(--accent-color, #4a90e2);
			cursor: pointer;
			padding: 0;
			margin-right: $unit;
		}
	}

	.new-row {
		display: flex;
		gap: $unit;
		align-items: center;
		flex-wrap: wrap;

		input {
			padding: $unit-half;
			border: 1px solid var(--border-color);
			border-radius: $item-corner-small;
			background: var(--input-bg);
		}
	}

	.new-rule {
		display: flex;
		flex-direction: column;
		gap: $unit;
		max-width: 600px;

		label {
			display: flex;
			flex-direction: column;
			gap: $unit-half;
			font-size: $font-small;

			input,
			select,
			textarea {
				padding: $unit-half;
				border: 1px solid var(--border-color);
				border-radius: $item-corner-small;
				background: var(--input-bg);
				color: var(--text-primary);
				font: inherit;
			}
		}
	}

	.preview {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: $unit-2x;
		background: var(--card-bg);
		border-radius: $card-corner;
		align-self: start;

		h2 {
			margin-top: 0;
			margin-bottom: 0;
		}
	}

	.preview-result {
		.score {
			margin-left: $unit;
			color: var(--text-secondary);
		}

		pre {
			background: var(--input-bg);
			padding: $unit;
			border-radius: $item-corner-small;
			overflow-x: auto;
			font-size: 0.75em;
		}
	}

	.warn {
		color: var(--warning-text, #b86b00);
	}

	.error {
		color: var(--error-text, #b00020);
	}

	.muted {
		color: var(--text-secondary);
		font-size: $font-small;
	}
</style>
