<svelte:options runes={true} />

<script lang="ts">
	import { setContext } from 'svelte'
	import { createDragDropContext, type DragOperation } from '$lib/composables/drag-drop.svelte'
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import DraggableItem from '$lib/components/dnd/DraggableItem.svelte'
	import DropZone from '$lib/components/dnd/DropZone.svelte'

	// Create mock data
	const mockCharacters = [
		{ id: '1', name: { en: 'Katalina', ja: 'カタリナ' }, granblueId: 3040001000 },
		{ id: '2', name: { en: 'Rosetta', ja: 'ロゼッタ' }, granblueId: 3040002000 },
		{ id: '3', name: { en: 'Io', ja: 'イオ' }, granblueId: 3040003000 },
		{ id: '4', name: { en: 'Rackam', ja: 'ラカム' }, granblueId: 3040004000 },
		{ id: '5', name: { en: 'Ferry', ja: 'フェリ' }, granblueId: 3040005000 }
	]

	const mockWeapons = [
		{ id: 'w1', name: { en: 'Murgleis', ja: 'ミュルグレス' }, granblueId: 1040001000 },
		{ id: 'w2', name: { en: 'Love Eternal', ja: 'ラブ・エターナル' }, granblueId: 1040002000 },
		{ id: 'w3', name: { en: 'Certificus', ja: 'ケルティケウス' }, granblueId: 1040003000 },
		{ id: 'w4', name: { en: 'Blue Sphere', ja: 'ブルースフィア' }, granblueId: 1040004000 },
		{ id: 'w5', name: { en: 'Ichigo Hitofuri', ja: '一期一振' }, granblueId: 1040005000 }
	]

	const mockSummons = [
		{ id: 's1', name: { en: 'Bahamut', ja: 'バハムート' }, granblueId: 2040001000 },
		{ id: 's2', name: { en: 'Lucifer', ja: 'ルシフェル' }, granblueId: 2040002000 },
		{ id: 's3', name: { en: 'Europa', ja: 'エウロペ' }, granblueId: 2040003000 },
		{ id: 's4', name: { en: 'Shiva', ja: 'シヴァ' }, granblueId: 2040004000 }
	]

	// Grid states
	let characters = $state<(GridCharacter | undefined)[]>([
		{ id: 'gc1', position: 0, character: mockCharacters[0] },
		{ id: 'gc2', position: 1, character: mockCharacters[1] },
		{ id: 'gc3', position: 2, character: mockCharacters[2] },
		undefined,
		undefined
	])

	let weapons = $state<(GridWeapon | undefined)[]>([
		{ id: 'gw1', position: -1, mainhand: true, weapon: mockWeapons[0] }, // Mainhand
		{ id: 'gw2', position: 0, weapon: mockWeapons[1] },
		undefined,
		{ id: 'gw3', position: 2, weapon: mockWeapons[2] },
		undefined,
		undefined,
		{ id: 'gw4', position: 5, weapon: mockWeapons[3] },
		undefined,
		undefined,
		undefined
	])

	let summons = $state<(GridSummon | undefined)[]>([
		{ id: 'gs1', position: -1, main: true, summon: mockSummons[0] }, // Main
		{ id: 'gs2', position: 0, summon: mockSummons[1] },
		undefined,
		{ id: 'gs3', position: 2, summon: mockSummons[2] },
		undefined,
		undefined, // positions 4-5 for subaura
		{ id: 'gs4', position: 6, friend: true, summon: mockSummons[3] } // Friend
	])

	// Extra containers
	let extraCharacters = $state<(GridCharacter | undefined)[]>([
		{ id: 'egc1', position: 5, character: mockCharacters[3] },
		{ id: 'egc2', position: 6, character: mockCharacters[4] }
	])

	let subauras = $state<(GridSummon | undefined)[]>([
		undefined,
		undefined
	])

	let extraWeapons = $state<(GridWeapon | undefined)[]>([
		{ id: 'egw1', position: 9, weapon: mockWeapons[4] },
		undefined,
		undefined
	])

	// Operation tracking
	let operations = $state<DragOperation[]>([])

	// Create drag-drop context
	const dragContext = createDragDropContext({
		onLocalUpdate: (operation) => {
			console.log('📝 Local update:', operation)
			operations = [...operations, operation]
			handleOperation(operation)
			// Clear the operation from queue after processing
			setTimeout(() => {
				const processed = dragContext.getQueuedOperations()
				if (processed.length > 0) {
					// Mark as processed by clearing from context
					dragContext.clearQueue()
				}
			}, 100)
		},
		onValidate: (source, target) => {
			// Custom validation rules
			if (source.type !== target.type) return false

			// Characters: Sequential filling
			if (source.type === 'character' && target.container === 'main-characters') {
				// Allow drops only in sequential order
				const filledCount = characters.filter(c => c).length
				if (target.position >= filledCount) return false
			}

			// Weapons: Mainhand not draggable
			if (target.type === 'weapon' && target.position === -1) return false

			// Summons: Main/Friend not draggable
			if (target.type === 'summon' && (target.position === -1 || target.position === 6)) return false

			return true
		}
	})

	setContext('drag-drop', dragContext)

	function handleOperation(operation: DragOperation) {
		const { source, target } = operation

		if (operation.type === 'swap') {
			handleSwap(source, target)
		} else if (operation.type === 'move') {
			handleMove(source, target)
		}
	}

	function handleSwap(source: any, target: any) {
		console.log('🔄 Swapping:', source, target)

		// Get container info with position mapping
		const sourceInfo = getContainerInfo(source.container, source.position)
		const targetInfo = getContainerInfo(target.container, target.position)

		if (!sourceInfo || !targetInfo) {
			console.error('Invalid container', source.container, target.container)
			return
		}

		// Find the items using mapped indices
		const sourceItem = sourceInfo.array[sourceInfo.index]
		const targetItem = targetInfo.array[targetInfo.index]

		if (!sourceItem) {
			console.error('Source item not found')
			return
		}

		// If there's no target item, this is actually a move, not a swap
		if (!targetItem) {
			handleMove(source, target)
			return
		}

		// Perform the swap
		if (sourceInfo.container === target.container) {
			// Same container - update the appropriate array
			const updatedArray = getUpdatedArray(source.container, (arr) => {
				const temp = [...arr]
				temp[sourceInfo.index] = targetItem
				temp[targetInfo.index] = sourceItem

				// Preserve the original position properties
				if (temp[sourceInfo.index]) temp[sourceInfo.index].position = source.position
				if (temp[targetInfo.index]) temp[targetInfo.index].position = target.position

				return temp
			})

			setArrayForContainer(source.container, updatedArray)
		} else {
			// Different containers - cross-container swap
			const updatedSource = getUpdatedArray(source.container, (arr) => {
				const temp = [...arr]
				temp[sourceInfo.index] = targetItem
				if (temp[sourceInfo.index]) temp[sourceInfo.index].position = source.position
				return temp
			})

			const updatedTarget = getUpdatedArray(target.container, (arr) => {
				const temp = [...arr]
				temp[targetInfo.index] = sourceItem
				if (temp[targetInfo.index]) temp[targetInfo.index].position = target.position
				return temp
			})

			setArrayForContainer(source.container, updatedSource)
			setArrayForContainer(target.container, updatedTarget)
		}
	}

	function handleMove(source: any, target: any) {
		console.log('📦 Moving:', source, target)

		const sourceInfo = getContainerInfo(source.container, source.position)
		const targetInfo = getContainerInfo(target.container, target.position)

		if (!sourceInfo || !targetInfo) {
			console.error('Invalid container', source.container, target.container)
			return
		}

		const sourceItem = sourceInfo.array[sourceInfo.index]
		if (!sourceItem) {
			console.error('Source item not found')
			return
		}

		if (source.container === target.container) {
			// Same container - move within
			const updatedArray = getUpdatedArray(source.container, (arr) => {
				const temp = [...arr]
				temp[sourceInfo.index] = undefined
				temp[targetInfo.index] = sourceItem
				if (temp[targetInfo.index]) temp[targetInfo.index].position = target.position
				return temp
			})

			setArrayForContainer(source.container, updatedArray)
		} else {
			// Different containers - move across
			const updatedSource = getUpdatedArray(source.container, (arr) => {
				const temp = [...arr]
				temp[sourceInfo.index] = undefined
				return temp
			})

			const updatedTarget = getUpdatedArray(target.container, (arr) => {
				const temp = [...arr]
				temp[targetInfo.index] = sourceItem
				if (temp[targetInfo.index]) temp[targetInfo.index].position = target.position
				return temp
			})

			setArrayForContainer(source.container, updatedSource)
			setArrayForContainer(target.container, updatedTarget)
		}
	}

	function getContainerInfo(container: string, position: number) {
		switch (container) {
			case 'main-characters':
				return { array: characters, index: position, container }
			case 'extra-characters':
				// Extra characters have positions 5-6 but array indices 0-1
				return { array: extraCharacters, index: position - 5, container }
			case 'main-weapons':
				// Main weapons are positions 0-8, but need to account for mainhand
				// The actual weapons array has mainhand at index 0, sub-weapons at 1-9
				return { array: weapons.slice(1, 10), index: position, container }
			case 'extra-weapons':
				// Extra weapons have positions 9-11 but array indices 0-2
				return { array: extraWeapons, index: position - 9, container }
			case 'main-summons':
				// Main summons are positions 0-3, need to account for main summon
				// The actual summons array has main at 0, subs at 1-4
				return { array: summons.slice(1, 5), index: position, container }
			case 'subaura':
				// Subaura have positions 4-5 but array indices 0-1
				return { array: subauras, index: position - 4, container }
			default:
				return null
		}
	}

	function getUpdatedArray(container: string, updateFn: (arr: any[]) => any[]) {
		switch (container) {
			case 'main-characters':
				return updateFn(characters)
			case 'extra-characters':
				return updateFn(extraCharacters)
			case 'main-weapons':
				// For weapons, we need to work with the sub-weapons only
				const subWeapons = weapons.slice(1, 10)
				return updateFn(subWeapons)
			case 'extra-weapons':
				return updateFn(extraWeapons)
			case 'main-summons':
				// For summons, we need to work with the sub-summons only
				const subSummons = summons.slice(1, 5)
				return updateFn(subSummons)
			case 'subaura':
				return updateFn(subauras)
			default:
				return []
		}
	}

	function getArrayForContainer(container: string) {
		switch (container) {
			case 'main-characters': return characters
			case 'extra-characters': return extraCharacters
			case 'main-weapons': return weapons.slice(1, 10) // Skip mainhand
			case 'extra-weapons': return extraWeapons
			case 'main-summons': return summons.slice(1, 5) // Skip main, get sub-summons
			case 'subaura': return subauras
			default: return null
		}
	}

	function setArrayForContainer(container: string, newArray: any[]) {
		switch (container) {
			case 'main-characters':
				characters = newArray
				break
			case 'extra-characters':
				extraCharacters = newArray
				break
			case 'main-weapons':
				// Update weapons array (preserving mainhand)
				weapons = [weapons[0], ...newArray]
				break
			case 'extra-weapons':
				extraWeapons = newArray
				break
			case 'main-summons':
				// Update summons (preserving main and friend)
				summons = [summons[0], ...newArray, summons[5], summons[6]]
				break
			case 'subaura':
				subauras = newArray
				break
		}
	}

	function handleCharacterDrop(fromPos: number, toPos: number) {
		const temp = [...characters]
		const item = temp[fromPos]

		if (!item) return

		// Remove from source
		temp[fromPos] = undefined

		// Insert at target
		if (temp[toPos]) {
			// Swap
			temp[fromPos] = temp[toPos]
		}
		temp[toPos] = item

		// Update positions
		temp.forEach((char, idx) => {
			if (char) char.position = idx
		})

		// Ensure sequential filling
		characters = temp.filter(c => c).concat(temp.filter(c => !c))
	}

	// Sync status
	let syncStatus = $derived(
		dragContext.getQueuedOperations().length > 0 ? 'pending' : 'idle'
	)
</script>

<div class="test-container">
	<header>
		<h1>Drag & Drop Test</h1>
		<div class="status">
			{#if syncStatus === 'pending'}
				<span class="pending">⏳ {dragContext.getQueuedOperations().length} pending operations</span>
			{:else}
				<span class="idle">✅ All synced</span>
			{/if}
		</div>
	</header>

	<section class="grid-section">
		<h2>Character Grid</h2>
		<div class="character-grid">
			{#each characters as char, idx}
				<DropZone
					container="main-characters"
					position={idx}
					type="character"
					item={char}
				>
					<DraggableItem
						item={char}
						container="main-characters"
						position={idx}
						type="character"
						canDrag={!!char}
					>
						<div class="unit character-unit">
							{#if char}
								<div class="image">👤</div>
								<div class="name">{char.character.name?.en}</div>
							{:else}
								<div class="empty-slot">Empty</div>
							{/if}
						</div>
					</DraggableItem>
				</DropZone>
			{/each}
		</div>

		<h3>Extra Characters</h3>
		<div class="extra-grid">
			{#each extraCharacters as char, idx}
				<DropZone
					container="extra-characters"
					position={idx + 5}
					type="character"
					item={char}
				>
					<DraggableItem
						item={char}
						container="extra-characters"
						position={idx + 5}
						type="character"
						canDrag={!!char}
					>
						<div class="unit character-unit">
							{#if char}
								<div class="image">👤</div>
								<div class="name">{char.character.name?.en}</div>
							{:else}
								<div class="empty-slot">Empty</div>
							{/if}
						</div>
					</DraggableItem>
				</DropZone>
			{/each}
		</div>
	</section>

	<section class="grid-section">
		<h2>Weapon Grid</h2>
		<div class="weapon-grid">
			<div class="mainhand">
				<h4>Mainhand</h4>
				<div class="unit weapon-unit mainhand-unit">
					{#if weapons[0]}
						<div class="image">⚔️</div>
						<div class="name">{weapons[0].weapon.name?.en}</div>
					{:else}
						<div class="empty-slot">Empty</div>
					{/if}
				</div>
			</div>
			<div class="subweapons">
				{#each weapons.slice(1, 10) as weapon, idx}
					<DropZone
						container="main-weapons"
						position={idx}
						type="weapon"
						item={weapon}
					>
						<DraggableItem
							item={weapon}
							container="main-weapons"
							position={idx}
							type="weapon"
							canDrag={!!weapon}
						>
							<div class="unit weapon-unit">
								{#if weapon}
									<div class="image">⚔️</div>
									<div class="name">{weapon.weapon.name?.en}</div>
								{:else}
									<div class="empty-slot">Empty</div>
								{/if}
							</div>
						</DraggableItem>
					</DropZone>
				{/each}
			</div>
		</div>
	</section>

	<section class="grid-section">
		<h2>Summon Grid</h2>
		<div class="summon-grid">
			<div class="main-summon">
				<h4>Main</h4>
				<div class="unit summon-unit">
					{#if summons[0]}
						<div class="image">🐉</div>
						<div class="name">{summons[0].summon.name?.en}</div>
					{/if}
				</div>
			</div>

			<div class="subsummons">
				{#each summons.slice(1, 5) as summon, idx}
					<DropZone
						container="main-summons"
						position={idx}
						type="summon"
						item={summon}
					>
						<DraggableItem
							item={summon}
							container="main-summons"
							position={idx}
							type="summon"
							canDrag={!!summon}
						>
							<div class="unit summon-unit">
								{#if summon}
									<div class="image">🐉</div>
									<div class="name">{summon.summon.name?.en}</div>
								{:else}
									<div class="empty-slot">Empty</div>
								{/if}
							</div>
						</DraggableItem>
					</DropZone>
				{/each}
			</div>

			<div class="friend-summon">
				<h4>Friend</h4>
				<div class="unit summon-unit">
					{#if summons[6]}
						<div class="image">🐉</div>
						<div class="name">{summons[6].summon.name?.en}</div>
					{/if}
				</div>
			</div>
		</div>

		<h3>Subaura</h3>
		<div class="subaura-grid">
			{#each subauras as summon, idx}
				<DropZone
					container="subaura"
					position={idx + 4}
					type="summon"
					item={summon}
				>
					<DraggableItem
						item={summon}
						container="subaura"
						position={idx + 4}
						type="summon"
						canDrag={!!summon}
					>
						<div class="unit summon-unit">
							{#if summon}
								<div class="image">🐉</div>
								<div class="name">{summon.summon.name?.en}</div>
							{:else}
								<div class="empty-slot">Empty</div>
							{/if}
						</div>
					</DraggableItem>
				</DropZone>
			{/each}
		</div>
	</section>

	<section class="operations">
		<h2>Operations Log</h2>
		<pre>{JSON.stringify(operations, null, 2)}</pre>
	</section>
</div>

<style lang="scss">
	.test-container {
		padding: 20px;
		max-width: 1200px;
		margin: 0 auto;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;

		.status {
			.pending {
				color: orange;
			}
			.idle {
				color: green;
			}
		}
	}

	.grid-section {
		margin-bottom: 40px;
		padding: 20px;
		background: #f5f5f5;
		border-radius: 8px;

		h2 {
			margin-bottom: 20px;
		}

		h3 {
			margin-top: 20px;
			margin-bottom: 10px;
		}
	}

	.character-grid, .extra-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 10px;
	}

	.weapon-grid {
		display: grid;
		grid-template-columns: 1fr 3fr;
		gap: 20px;

		.subweapons {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 10px;
		}
	}

	.summon-grid {
		display: grid;
		grid-template-columns: 1fr 2fr 1fr;
		gap: 20px;

		.subsummons {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 10px;
		}
	}

	.subaura-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
		max-width: 300px;
	}

	.unit {
		padding: 15px;
		background: white;
		border: 2px solid #ddd;
		border-radius: 8px;
		text-align: center;
		min-height: 100px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		.image {
			font-size: 32px;
			margin-bottom: 5px;
		}

		.name {
			font-size: 12px;
			color: #666;
		}

		.empty-slot {
			color: #999;
		}
	}

	.mainhand-unit, .main-summon .unit, .friend-summon .unit {
		background: #e3f2fd;
		border-color: #2196f3;
	}

	.operations {
		margin-top: 40px;
		padding: 20px;
		background: #263238;
		color: #fff;
		border-radius: 8px;

		pre {
			max-height: 300px;
			overflow-y: auto;
			font-size: 12px;
		}
	}
</style>