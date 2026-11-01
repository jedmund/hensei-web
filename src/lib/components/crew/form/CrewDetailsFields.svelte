<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		name: string
		gamertag: string
		granblueCrewId: string
		description: string
		/** id for the description textarea, unique per dialog */
		descriptionId: string
		/** Error under the gamertag field (e.g. already taken) */
		gamertagError?: string | undefined
		/** Icon at the end of the gamertag field (availability check) */
		gamertagIcon?: string | undefined
		onGamertagInput?: ((e: Event) => void) | undefined
		/** Message shown above the fields when saving failed */
		error?: string | null | undefined
	}

	let {
		name = $bindable(),
		gamertag = $bindable(),
		granblueCrewId = $bindable(),
		description = $bindable(),
		descriptionId,
		gamertagError,
		gamertagIcon,
		onGamertagInput,
		error
	}: Props = $props()
</script>

<div class="modal-form">
	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	<div class="form-fields">
		<Input
			label={m.crew_name_label()}
			bind:value={name}
			placeholder={m.crew_name_placeholder_short()}
			maxLength={100}
			fullWidth
			contained
		/>

		<Input
			label="{m.crew_gamertag_label()} {m.crew_gamertag_optional()}"
			bind:value={gamertag}
			oninput={onGamertagInput}
			placeholder={m.crew_gamertag_placeholder()}
			maxLength={4}
			fullWidth
			contained
			error={gamertagError}
			rightIcon={gamertagIcon}
		/>

		<Input
			label="{m.crew_granblue_id_label()} {m.crew_gamertag_optional()}"
			bind:value={granblueCrewId}
			placeholder={m.crew_granblue_id_placeholder()}
			fullWidth
			contained
		/>

		<div class="form-field">
			<label for={descriptionId}
				>{m.crew_description_label()}
				<span class="optional">{m.crew_gamertag_optional()}</span></label
			>
			<textarea
				id={descriptionId}
				bind:value={description}
				placeholder={m.crew_description_placeholder()}
				maxlength="500"
				rows="3"></textarea>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.error-message {
		background-color: var(--danger-bg-subtle);
		border: 1px solid var(--danger);
		border-radius: layout.$card-corner;
		color: var(--danger);
		padding: spacing.$unit-2x;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;

		label {
			font-size: typography.$font-small;
			font-weight: typography.$medium;
			color: var(--text-primary);

			.optional {
				font-weight: typography.$normal;
				color: var(--text-secondary);
			}
		}

		textarea {
			padding: spacing.$unit-2x;
			border: none;
			border-radius: layout.$input-corner;
			font-size: typography.$font-regular;
			font-family: inherit;
			background: var(--input-bound-bg);
			color: var(--text-primary);
			resize: vertical;
			min-height: 80px;

			&:hover {
				background: var(--input-bound-bg-hover);
			}

			&::placeholder {
				color: var(--text-tertiary);
			}
		}
	}
</style>
