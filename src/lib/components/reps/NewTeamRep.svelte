<script lang="ts">
	/**
	 * A placeholder team card that links to a new team: the shape of a GridRep
	 * with "Create a team" for its name, a + on the right, and an empty weapon
	 * grid. Sits after the real teams in a grid.
	 */
	import Icon from '$lib/components/Icon.svelte'
	import WeaponRep from '$lib/components/reps/WeaponRep.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		href: string
	}

	let { href }: Props = $props()
</script>

<a class="new-team-rep" {href}>
	<div class="name-row">
		<h2>{m.home_create_team()}</h2>
		<!-- The whole card is the link; this only looks like a button -->
		<span class="plus" aria-hidden="true"><Icon name="plus" size={14} /></span>
	</div>
	<div class="grid-container">
		<WeaponRep weapons={[]} />
	</div>
</a>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/rep' as rep;
	@use '$src/themes/typography' as typography;

	// GridRep's outlined shell, dashed so it reads as a slot rather than a team
	.new-team-rep {
		display: grid;
		grid-template-rows: auto 1fr;
		gap: spacing.$unit;
		padding: spacing.$unit;
		height: 100%;
		box-sizing: border-box;
		border: 1px dashed var(--grid-border-color);
		border-radius: layout.$card-corner;
		color: inherit;
		text-decoration: none;

		&:hover {
			background: var(--grid-rep-hover);

			.plus {
				background: var(--button-bg-hover);
			}
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 2px;
		}
	}

	.name-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
		padding: spacing.$unit-half 0;

		h2 {
			margin: 0;
			font-size: 1.6rem;
			font-weight: typography.$bold;
			line-height: 1.2;
			color: var(--text-secondary);
		}
	}

	.plus {
		display: grid;
		place-items: center;
		flex: none;
		width: spacing.$unit-4x;
		height: spacing.$unit-4x;
		border-radius: layout.$full-corner;
		background: var(--button-bg);
		color: var(--text-secondary);
		transition: background effects.$duration-quick;
	}

	// The same body as a GridRep, with every slot empty
	.grid-container {
		aspect-ratio: calc(#{rep.$rep-body-ratio} / 1);
		width: 100%;
		align-self: end;
		overflow: hidden;
		opacity: 0.6;
	}
</style>
