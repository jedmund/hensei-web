<script lang="ts">
	import DatePicker from '$lib/components/ui/DatePicker.svelte'
	import SettingsRow from '$lib/components/ui/SettingsRow.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import * as m from '$lib/paraglide/messages'

	export interface EditableMembershipPeriod {
		id: string
		joinedAt: string
		retiredAt: string
		retired: boolean
	}

	interface Props {
		periods: EditableMembershipPeriod[]
		editRetired: boolean
		onRetiredChange: (retired: boolean) => void
	}

	let { periods = $bindable(), editRetired, onRetiredChange }: Props = $props()
</script>

<div class="membership-periods">
	<h4 class="periods-title">{m.crew_membership_periods()}</h4>
	<p class="help-text">
		{m.crew_membership_hint()}
	</p>
	{#each periods as period, i}
		<div class="period-row">
			<span class="period-label">
				{#if i === 0}
					{m.crew_period_current()}
				{:else}
					{m.crew_period_number({ n: String(periods.length - i) })}
				{/if}
			</span>
			<div class="period-fields">
				<DatePicker
					label={m.crew_joined()}
					bind:value={period.joinedAt}
					contained
				/>
				{#if period.retired || i > 0}
					<DatePicker
						label={m.crew_left()}
						bind:value={period.retiredAt}
						contained
					/>
				{/if}
			</div>
		</div>
	{/each}
</div>

<!-- Retired toggle only affects current membership -->
{#if !periods[0]?.retired}
	<SettingsRow title={m.crew_retired()} subtitle={m.crew_mark_retired()}>
		{#snippet control()}
			<Switch
				checked={editRetired}
				name="retired"
				onCheckedChange={(checked) => {
					onRetiredChange(checked)
					if (periods[0]) {
						periods[0].retired = checked
					}
				}}
			/>
		{/snippet}
	</SettingsRow>
	{#if editRetired && periods[0]}
		<DatePicker label={m.crew_retired_date()} bind:value={periods[0].retiredAt} contained />
	{/if}
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.help-text {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
	}

	.membership-periods {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.periods-title {
		font-size: typography.$font-regular;
		font-weight: typography.$medium;
		margin: 0;
		color: var(--text-primary);
	}

	.period-row {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
		background: rgba(0, 0, 0, 0.02);
		border-radius: layout.$item-corner;
		border: 1px solid rgba(0, 0, 0, 0.06);
	}

	.period-label {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.period-fields {
		display: flex;
		gap: spacing.$unit-2x;

		:global(.date-picker) {
			flex: 1;
		}
	}
</style>
