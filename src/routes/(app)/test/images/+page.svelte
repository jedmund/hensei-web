<script lang="ts">
	import {
		getImageUrl,
		getCharacterPose,
		type ResourceType,
		type ImageVariant
	} from '$lib/utils/images'

	// State for selections
	let resourceType: ResourceType = $state('character')
	let variant: ImageVariant = $state('main')
	let itemId = $state('3030182000') // Gran/Djeeta as default
	let pose = $state('01')
	let uncapLevel = $state(0)
	let transcendenceStep = $state(0)
	let weaponElement = $state(0)
	let customPose = $state(false)

	// Sample item IDs for testing
	const sampleIds = {
		character: [
			{ id: '3030182000', name: 'Gran/Djeeta (Element-specific)' },
			{ id: '3020000000', name: 'Katalina' },
			{ id: '3020001000', name: 'Rackam' },
			{ id: '3020002000', name: 'Io' },
			{ id: '3040000000', name: 'Charlotta' }
		],
		weapon: [
			{ id: '1040000000', name: 'Sword' },
			{ id: '1040001000', name: 'Luminiera Sword' },
			{ id: '1040500000', name: 'Bahamut Sword' },
			{ id: '1040019000', name: 'Opus Sword' }
		],
		summon: [
			{ id: '2040000000', name: 'Colossus' },
			{ id: '2040001000', name: 'Leviathan' },
			{ id: '2040002000', name: 'Tiamat' },
			{ id: '2040003000', name: 'Yggdrasil' }
		]
	}

	// Available variants per resource type
	const availableVariants = $derived.by(() => {
		const base: ImageVariant[] = ['main', 'grid', 'square']
		if (resourceType === 'character') {
			return [...base, 'detail']
		} else if (resourceType === 'weapon') {
			return [...base, 'base']
		} else {
			return [...base, 'detail', 'wide']
		}
	})

	// Auto-calculate pose based on uncap/transcendence
	const calculatedPose = $derived(
		customPose ? pose : getCharacterPose(uncapLevel, transcendenceStep)
	)

	// Handle Gran/Djeeta element-specific poses
	const finalPose = $derived.by(() => {
		if (resourceType !== 'character') return undefined

		let p = calculatedPose
		if (itemId === '3030182000' && weaponElement > 0) {
			p = `${p}_0${weaponElement}`
		}
		return p
	})

	// Generated image URL
	const imageUrl = $derived(
		getImageUrl(resourceType as ResourceType, itemId || null, variant as ImageVariant, {
			pose: finalPose,
			element: (resourceType as ResourceType) === 'weapon' && (variant as ImageVariant) === 'grid' ? weaponElement : undefined
		})
	)

	// File extension display
	const fileExtension = $derived.by(() => {
		if (resourceType === 'character' && variant === 'detail') return '.png'
		if (resourceType === 'weapon' && variant === 'base') return '.png'
		if (resourceType === 'summon' && variant === 'detail') return '.png'
		return '.jpg'
	})

	// Reset variant if not available
	$effect(() => {
		if (!availableVariants.includes(variant)) {
			variant = 'main'
		}
	})
</script>

<div class="test-container">
	<h1>Image Utility Test Page</h1>

	<div class="controls">
		<section>
			<h2>Resource Type</h2>
			<div class="radio-group">
				{#each ['character', 'weapon', 'summon'] as type}
					<label>
						<input type="radio" bind:group={resourceType} value={type} />
						{type.charAt(0).toUpperCase() + type.slice(1)}
					</label>
				{/each}
			</div>
		</section>

		<section>
			<h2>Image Variant</h2>
			<div class="radio-group">
				{#each availableVariants as v}
					<label class:special={fileExtension === '.png' && variant === v}>
						<input type="radio" bind:group={variant} value={v} />
						{v.charAt(0).toUpperCase() + v.slice(1)}
						{#if (resourceType === 'character' && v === 'detail') || (resourceType === 'weapon' && v === 'base') || (resourceType === 'summon' && v === 'detail')}
							<span class="badge">PNG</span>
						{/if}
					</label>
				{/each}
			</div>
		</section>

		<section>
			<h2>Item Selection</h2>
			<div class="radio-group">
				<label>
					<input type="radio" bind:group={itemId} value="" />
					None (Placeholder)
				</label>
				{#each sampleIds[resourceType] as item}
					<label>
						<input type="radio" bind:group={itemId} value={item.id} />
						{item.name}
					</label>
				{/each}
			</div>
			<div class="custom-id">
				<label>
					Custom ID:
					<input type="text" bind:value={itemId} placeholder="Enter Granblue ID" />
				</label>
			</div>
		</section>

		{#if resourceType === 'character'}
			<section>
				<h2>Character Pose</h2>
				<div class="checkbox-group">
					<label>
						<input type="checkbox" bind:checked={customPose} />
						Manual pose control
					</label>
				</div>

				{#if customPose}
					<div class="radio-group">
						{#each ['01', '02', '03', '04'] as p}
							<label>
								<input type="radio" bind:group={pose} value={p} />
								Pose {p}
							</label>
						{/each}
					</div>
				{:else}
					<div class="slider-group">
						<label>
							Uncap Level: {uncapLevel}
							<input type="range" bind:value={uncapLevel} min="0" max="6" />
						</label>
						<label>
							Transcendence: {transcendenceStep}
							<input type="range" bind:value={transcendenceStep} min="0" max="5" />
						</label>
						<div class="info">Calculated Pose: {calculatedPose}</div>
					</div>
				{/if}

				{#if itemId === '3030182000'}
					<div class="element-group">
						<h3>Gran/Djeeta Element</h3>
						<div class="radio-group">
							{#each [{ value: 0, label: 'None' }, { value: 1, label: 'Wind' }, { value: 2, label: 'Fire' }, { value: 3, label: 'Water' }, { value: 4, label: 'Earth' }, { value: 5, label: 'Dark' }, { value: 6, label: 'Light' }] as elem}
								<label>
									<input type="radio" bind:group={weaponElement} value={elem.value} />
									{elem.label}
								</label>
							{/each}
						</div>
					</div>
				{/if}
			</section>
		{/if}

		{#if resourceType === 'weapon' && variant === 'grid'}
			<section>
				<h2>Weapon Element (Grid Only)</h2>
				<div class="radio-group">
					{#each [{ value: 0, label: 'Default' }, { value: 1, label: 'Wind' }, { value: 2, label: 'Fire' }, { value: 3, label: 'Water' }, { value: 4, label: 'Earth' }, { value: 5, label: 'Dark' }, { value: 6, label: 'Light' }] as elem}
						<label>
							<input type="radio" bind:group={weaponElement} value={elem.value} />
							{elem.label}
						</label>
					{/each}
				</div>
			</section>
		{/if}
	</div>

	<div class="output">
		<section class="url-display">
			<h2>Generated URL</h2>
			<code>{imageUrl}</code>
			<div class="path-info">
				<span>Directory: <strong>{resourceType}-{variant}</strong></span>
				<span>Extension: <strong>{fileExtension}</strong></span>
			</div>
		</section>

		<section class="image-display">
			<h2>Image Preview</h2>
			<div class="image-container" data-variant={variant}>
				<img
					src={imageUrl}
					alt="Test image"
					onerror={(e) => {
						e.currentTarget.classList.add('error')
					}}
					onload={(e) => {
						e.currentTarget.classList.remove('error')
					}}
				/>
			</div>
			<p class="note">Note: Image will show error state if file doesn't exist</p>
		</section>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.test-container {
		padding: $unit-2x;
		max-width: 1400px;
		margin: 0 auto;
	}

	h1 {
		margin-bottom: $unit-3x;
		color: var(--text-primary);
	}

	h2 {
		font-size: $font-large;
		margin-bottom: $unit;
		color: var(--text-secondary);
	}

	h3 {
		font-size: $font-regular;
		margin-bottom: $unit-half;
		color: var(--text-secondary);
	}

	.controls {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: $unit-2x;
		margin-bottom: $unit-3x;
	}

	section {
		background: var(--background-secondary, $grey-90);
		border: 1px solid var(--border-color, $grey-80);
		border-radius: $card-corner;
		padding: $unit-2x;
	}

	.radio-group,
	.checkbox-group {
		display: flex;
		flex-direction: column;
		gap: $unit-half;

		label {
			display: flex;
			align-items: center;
			gap: $unit-half;
			cursor: pointer;
			padding: $unit-half;
			border-radius: $item-corner-small;
			transition: background-color 0.2s;

			&:hover {
				background: var(--background-hover, rgba(255, 255, 255, 0.05));
			}

			&.special {
				background: rgba(59, 130, 246, 0.1);
				border: 1px solid rgba(59, 130, 246, 0.3);
			}

			input {
				margin: 0;
			}

			.badge {
				font-size: $font-tiny;
				padding: 2px 6px;
				background: rgba(59, 130, 246, 0.2);
				color: rgb(59, 130, 246);
				border-radius: $item-corner-small;
				margin-left: auto;
			}
		}
	}

	.custom-id {
		margin-top: $unit;
		padding-top: $unit;
		border-top: 1px solid var(--border-color, $grey-80);

		label {
			display: flex;
			flex-direction: column;
			gap: $unit-half;
		}

		input[type='text'] {
			padding: $unit-half $unit;
			background: var(--input-bg, $grey-95);
			border: 1px solid var(--border-color, $grey-80);
			border-radius: $input-corner;
			color: var(--text-primary);
			font-family: monospace;

			&:focus {
				outline: none;
				border-color: var(--accent-blue, #3b82f6);
			}
		}
	}

	.slider-group {
		display: flex;
		flex-direction: column;
		gap: $unit;

		label {
			display: flex;
			flex-direction: column;
			gap: $unit-half;
		}

		input[type='range'] {
			width: 100%;
		}

		.info {
			padding: $unit-half;
			background: rgba(59, 130, 246, 0.1);
			border-radius: $item-corner-small;
			color: var(--text-primary);
			font-weight: $medium;
		}
	}

	.element-group {
		margin-top: $unit;
		padding-top: $unit;
		border-top: 1px solid var(--border-color, $grey-80);
	}

	.output {
		display: grid;
		gap: $unit-2x;
	}

	.url-display {
		code {
			display: block;
			padding: $unit;
			background: var(--code-bg, $grey-95);
			border-radius: $item-corner-small;
			font-family: monospace;
			font-size: $font-small;
			word-break: break-all;
			color: var(--text-primary);
			margin-bottom: $unit;
		}

		.path-info {
			display: flex;
			gap: $unit-2x;
			font-size: $font-small;
			color: var(--text-secondary);

			strong {
				color: var(--text-primary);
				font-family: monospace;
			}
		}
	}

	.image-display {
		.image-container {
			background: $grey-95;
			border: 2px dashed $grey-80;
			border-radius: $card-corner;
			padding: $unit-2x;
			min-height: 200px;
			display: flex;
			align-items: center;
			justify-content: center;

			&[data-variant='detail'],
			&[data-variant='base'] {
				min-height: 400px;
			}

			&[data-variant='wide'] {
				min-height: 150px;
			}

			img {
				max-width: 100%;
				height: auto;
				display: block;
				border-radius: $item-corner;

				&.error {
					opacity: 0.3;
					filter: grayscale(1);
					border: 2px solid red;
				}
			}
		}

		.note {
			margin-top: $unit;
			font-size: $font-small;
			color: var(--text-secondary);
			font-style: italic;
		}
	}
</style>
