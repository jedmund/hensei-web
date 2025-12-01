<script lang="ts">
	import UnitMenuContainer from '$lib/components/ui/menu/UnitMenuContainer.svelte'
	import MenuItems from '$lib/components/ui/menu/MenuItems.svelte'

	let message = $state('No action yet')

	function handleViewDetails() {
		message = 'View Details clicked'
	}

	function handleReplace() {
		message = 'Replace clicked'
	}

	function handleRemove() {
		message = 'Remove clicked'
	}
</script>

<div class="test-page">
	<h1>Context Menu Test Page</h1>

	<p class="instructions">
		Test both interaction methods:
	</p>
	<ul class="instructions">
		<li><strong>Right-click</strong> on the weapon image to open the context menu</li>
		<li><strong>Hover</strong> over the weapon to see the gear button appear</li>
		<li><strong>Click</strong> the gear button to open the dropdown menu</li>
	</ul>

	<div class="test-container">
		<div class="test-unit">
			<UnitMenuContainer showGearButton={true}>
				{#snippet trigger()}
					<img
						src="/images/placeholders/placeholder-weapon-grid.png"
						alt="Test weapon"
						class="test-image"
					/>
				{/snippet}

				{#snippet contextMenu()}
					<MenuItems
						onViewDetails={handleViewDetails}
						onReplace={handleReplace}
						onRemove={handleRemove}
						canEdit={true}
						variant="context"
						viewDetailsLabel="View Details"
						replaceLabel="Replace"
						removeLabel="Remove"
					/>
				{/snippet}

				{#snippet dropdownMenu()}
					<MenuItems
						onViewDetails={handleViewDetails}
						onReplace={handleReplace}
						onRemove={handleRemove}
						canEdit={true}
						variant="dropdown"
						viewDetailsLabel="View Details"
						replaceLabel="Replace"
						removeLabel="Remove"
					/>
				{/snippet}
			</UnitMenuContainer>
			<div class="test-label">Hover me or right-click</div>
		</div>
	</div>

	<div class="result">
		<strong>Last action:</strong> {message}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.test-page {
		padding: $unit-4x;
		max-width: 800px;
		margin: 0 auto;
	}

	h1 {
		font-size: $font-xxlarge;
		margin-bottom: $unit-3x;
	}

	.instructions {
		margin-bottom: $unit-3x;
		line-height: 1.6;

		&.instructions {
			padding-left: $unit-3x;
		}
	}

	.test-container {
		display: flex;
		justify-content: center;
		padding: $unit-8x;
		background: var(--app-bg-secondary);
		border-radius: $unit;
		margin-bottom: $unit-3x;
	}

	.test-unit {
		width: 200px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit;
		cursor: pointer;
	}

	.test-image {
		width: 100%;
		border-radius: $unit;
		background: var(--card-bg);
		position: relative;
		display: block;
	}

	.test-label {
		font-size: $font-small;
		color: var(--text-secondary);
		text-align: center;
	}

	.result {
		padding: $unit-2x;
		background: var(--card-bg);
		border-radius: $unit;
		font-size: $font-regular;
	}
</style>