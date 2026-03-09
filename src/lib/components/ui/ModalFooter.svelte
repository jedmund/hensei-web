
<script lang="ts">
	import type { Snippet } from 'svelte'
	import Button from './Button.svelte'

	interface PrimaryAction {
		label: string
		onclick: () => void
		destructive?: boolean
		disabled?: boolean
	}

	interface Props {
		onCancel: () => void
		cancelDisabled?: boolean
		primaryAction?: PrimaryAction
		left?: Snippet
		showShadow?: boolean
	}

	let { onCancel, cancelDisabled = false, primaryAction, left, showShadow = false }: Props =
		$props()
</script>

<div class="modal-footer" class:shadow={showShadow}>
	{#if left}
		<div class="left">
			{@render left()}
		</div>
	{/if}
	<div class="actions">
		<Button variant="ghost" onclick={onCancel} disabled={cancelDisabled}>Nevermind</Button>
		{#if primaryAction}
			<Button
				variant={primaryAction.destructive ? 'destructive' : 'primary'}
				onclick={primaryAction.onclick}
				disabled={primaryAction.disabled}
			>
				{primaryAction.label}
			</Button>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/effects' as effects;

	.modal-footer {
		padding: spacing.$unit-2x;
		padding-top: spacing.$unit-2x;
		display: flex;
		gap: spacing.$unit-2x;
		align-items: center;
		@include effects.smooth-transition(effects.$duration-quick, box-shadow);

		&.shadow {
			box-shadow: var(--shadow-lg);
		}
	}

	.left {
		flex: 1;
	}

	.actions {
		display: flex;
		gap: spacing.$unit;
		margin-left: auto;
	}
</style>
