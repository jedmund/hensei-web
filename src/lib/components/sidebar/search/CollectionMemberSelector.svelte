
<script lang="ts">
	import Select from '../../ui/Select.svelte'
	import Icon from '../../Icon.svelte'
	import * as m from '$lib/paraglide/messages'

	interface MemberOption {
		value: string
		label: string
		image?: string
		suffix?: string
	}

	interface LockedMemberInfo {
		label: string
		image?: string
	}

	interface Props {
		isLocked: boolean
		lockedMember?: LockedMemberInfo
		memberOptions: MemberOption[]
		selectedMemberId: string | undefined
		onMemberChange: (memberId: string | undefined) => void
		onUnlinkRequest: () => void
	}

	let { isLocked, lockedMember, memberOptions, selectedMemberId, onMemberChange, onUnlinkRequest }:
		Props = $props()
</script>

<div class="member-select">
	{#if isLocked && lockedMember}
		<div class="member-locked">
			{#if lockedMember.image}
				<img src={lockedMember.image} alt="" class="member-avatar" />
			{/if}
			<span class="member-name">{lockedMember.label}</span>
			<button class="member-unlock" onclick={onUnlinkRequest}>
				<Icon name="close" size={14} />
			</button>
		</div>
	{:else}
		<Select
			options={memberOptions}
			value={selectedMemberId}
			onValueChange={(v) => onMemberChange(v)}
			placeholder={m.search_select_member()}
			contained
			fullWidth
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.member-select {
		flex-shrink: 0;
		margin-bottom: $unit;

		.member-locked {
			display: flex;
			align-items: center;
			gap: $unit-half;
			width: 100%;
			box-sizing: border-box;
			padding: $unit calc($unit * 1.5);
			background-color: var(--select-contained-bg);
			border-radius: $input-corner;
			border: 1px solid transparent;
			min-height: $unit-4x;
			font-size: $font-regular;
			font-family: var(--font-family);

			.member-avatar {
				width: $unit-3x;
				height: auto;
				flex-shrink: 0;
			}

			.member-name {
				flex: 1;
				text-align: left;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				color: var(--text-secondary);
			}

			.member-unlock {
				all: unset;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
				cursor: pointer;
				color: var(--text-tertiary);
				transition: 0.15s color ease-out;

				&:hover {
					color: var(--text-primary);
				}
			}
		}
	}
</style>
