<script lang="ts">
	import InfoTile from './InfoTile.svelte'

	interface Props {
		fullAuto?: boolean
		autoGuard?: boolean
		autoSummon?: boolean
		chargeAttack?: boolean
		clickable?: boolean
		onclick?: () => void
	}

	let { fullAuto, autoGuard, autoSummon, chargeAttack, clickable = false, onclick }: Props =
		$props()

	interface Setting {
		key: string
		label: string
		active: boolean
	}

	const settings: Setting[] = $derived([
		{ key: 'chargeAttack', label: `Charge Attack ${chargeAttack ?? true ? 'On' : 'Off'}`, active: chargeAttack ?? true },
		{ key: 'fullAuto', label: `Full Auto ${fullAuto ? 'On' : 'Off'}`, active: fullAuto ?? false },
		{ key: 'autoSummon', label: `Auto Summon ${autoSummon ? 'On' : 'Off'}`, active: autoSummon ?? false },
		{ key: 'autoGuard', label: `Auto Guard ${autoGuard ? 'On' : 'Off'}`, active: autoGuard ?? false }
	])
</script>

<InfoTile label="Settings" class="settings-tile" {clickable} {onclick}>
	<div class="settings-tokens">
		{#each settings as setting (setting.key)}
			<span class="token {setting.key}" class:on={setting.active} class:off={!setting.active}>
				{setting.label}
			</span>
		{/each}
	</div>
</InfoTile>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.settings-tokens {
		display: flex;
		flex-wrap: wrap;
		gap: $unit;
	}

	.token {
		display: inline-flex;
		align-items: center;
		padding: $unit-three-quarter $unit-2x;
		border-radius: $full-corner;
		font-size: $font-small;
		font-weight: $bold;
		line-height: 1.4;
		text-align: center;
		user-select: none;
		background: var(--input-bg);

		&.off {
			color: var(--text-secondary);
		}

		&.chargeAttack.on {
			background: var(--charge-attack-bg);
			color: var(--charge-attack-text);
		}

		&.fullAuto.on,
		&.autoSummon.on {
			background: var(--full-auto-bg);
			color: var(--full-auto-text);
		}

		&.autoGuard.on {
			background: var(--auto-guard-bg);
			color: var(--auto-guard-text);
		}
	}
</style>
