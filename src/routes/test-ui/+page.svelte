<script lang="ts">
	import Button from '$lib/components/ui/button/Button.svelte';
	import Input from '$lib/components/ui/input/Input.svelte';
	import Select from '$lib/components/ui/select/Select.svelte';
	import Switch from '$lib/components/ui/switch/Switch.svelte';
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte';
	import { SegmentedControl, Segment } from '$lib/components/ui/segmented-control';
	import { Heart, Save, Settings, ChevronRight, Search, User } from 'lucide-svelte';

	let inputValue = $state('');
	let selectValue = $state('option1');
	let switchValue = $state(false);
	let checkboxValue = $state(false);
	let checkboxIndeterminate = $state<boolean | 'indeterminate'>('indeterminate');
	let segmentValue = $state('option1');
	let elementSegment = $state('fire');
	let saved = $state(false);
</script>

<div class="container">
	<h1>UI Component Test Page</h1>

	<section>
		<h2>Button Variants</h2>
		<div class="row">
			<Button variant="primary">Primary</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="text">Text</Button>
			<Button variant="blended">Blended</Button>
			<Button variant="bound">Bound</Button>
			<Button variant="destructive">Destructive</Button>
			<Button variant="notice">Notice</Button>
		</div>
	</section>

	<section>
		<h2>Button Sizes</h2>
		<div class="row">
			<Button size="small">Small</Button>
			<Button size="medium">Medium</Button>
			<Button size="large">Large</Button>
			<Button size="icon"><Settings /></Button>
		</div>
	</section>

	<section>
		<h2>Button with Icons</h2>
		<div class="row">
			<Button leftIcon={Save}>Save</Button>
			<Button rightIcon={ChevronRight}>Continue</Button>
			<Button leftIcon={Heart} rightIcon={ChevronRight}>Favorite</Button>
		</div>
	</section>

	<section>
		<h2>Button Special States</h2>
		<div class="row">
			<Button save bind:saved onclick={() => saved = !saved}>
				{saved ? 'Saved' : 'Save'}
			</Button>
			<Button active>Active Button</Button>
			<Button disabled>Disabled</Button>
		</div>
	</section>

	<section>
		<h2>Element Colored Buttons</h2>
		<div class="row">
			<Button element="fire">Fire</Button>
			<Button element="water">Water</Button>
			<Button element="earth">Earth</Button>
			<Button element="wind">Wind</Button>
			<Button element="light">Light</Button>
			<Button element="dark">Dark</Button>
		</div>
	</section>

	<section>
		<h2>Input Components</h2>
		<div class="column">
			<Input
				bind:value={inputValue}
				placeholder="Enter text..."
				label="Basic Input"
			/>

			<Input
				variant="bound"
				placeholder="Bound variant"
				label="Bound Input"
			/>

			<Input
				placeholder="With left icon"
				leftIcon={Search}
				label="Search Input"
			/>

			<Input
				placeholder="With right icon"
				rightIcon={User}
				label="User Input"
			/>

			<Input
				placeholder="With character counter"
				maxLength={50}
				bind:value={inputValue}
				label="Limited Input"
			/>

			<Input
				placeholder="Enter number"
				variant="number"
				type="number"
				label="Number Input"
			/>

			<Input
				placeholder="This field has an error"
				error="This is an error message"
				label="Input with Error"
			/>
		</div>
	</section>

	<section>
		<h2>Select Component</h2>
		<div class="column">
			<Select bind:value={selectValue} placeholder="Choose an option">
				<option value="option1">Option 1</option>
				<option value="option2">Option 2</option>
				<option value="option3">Option 3</option>
			</Select>

			<Select bind:value={selectValue} placeholder="Choose an option" variant="bound">
				<option value="option1">Bound Option 1</option>
				<option value="option2">Bound Option 2</option>
				<option value="option3">Bound Option 3</option>
			</Select>
		</div>
	</section>

	<section>
		<h2>Switch Component</h2>
		<div class="row align-center">
			<Switch bind:checked={switchValue} />
			<span>Switch is {switchValue ? 'ON' : 'OFF'}</span>
		</div>
		<div class="row align-center">
			<Switch disabled checked />
			<span>Disabled Switch</span>
		</div>
	</section>

	<section>
		<h2>Checkbox Component</h2>
		<div class="column">
			<div class="row align-center">
				<Checkbox bind:checked={checkboxValue} />
				<span>Basic checkbox</span>
			</div>

			<div class="row align-center">
				<Checkbox bind:checked={checkboxIndeterminate} />
				<span>Indeterminate checkbox</span>
			</div>

			<div class="row align-center">
				<Checkbox size="small" />
				<span>Small checkbox</span>
			</div>

			<div class="row align-center">
				<Checkbox size="large" />
				<span>Large checkbox</span>
			</div>

			<div class="row align-center">
				<Checkbox variant="bound" />
				<span>Bound variant</span>
			</div>
		</div>
	</section>

	<section>
		<h2>Segmented Control</h2>
		<div class="column">
			<SegmentedControl bind:value={segmentValue}>
				<Segment value="option1">Option 1</Segment>
				<Segment value="option2">Option 2</Segment>
				<Segment value="option3">Option 3</Segment>
			</SegmentedControl>

			<SegmentedControl bind:value={segmentValue} variant="blended">
				<Segment value="option1">Blended 1</Segment>
				<Segment value="option2">Blended 2</Segment>
				<Segment value="option3">Blended 3</Segment>
			</SegmentedControl>

			<SegmentedControl bind:value={elementSegment} element="fire">
				<Segment value="fire">Fire</Segment>
				<Segment value="water">Water</Segment>
				<Segment value="earth">Earth</Segment>
			</SegmentedControl>
		</div>
	</section>
</div>

<style>
	.container {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	h1 {
		margin-bottom: 2rem;
		font-size: 2rem;
		font-weight: 600;
	}

	h2 {
		margin-bottom: 1rem;
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	section {
		margin-bottom: 3rem;
		padding: 1.5rem;
		background: var(--card-bg);
		border-radius: 8px;
	}

	.row {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.row.align-center {
		align-items: center;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	span {
		color: var(--text-primary);
	}
</style>