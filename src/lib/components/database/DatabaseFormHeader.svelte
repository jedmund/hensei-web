<script lang="ts">
	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	interface Props {
		title: string
		onCancel: () => void
		onSave: () => void
		isSaving?: boolean
		disabled?: boolean
		saveLabel?: string
		savingLabel?: string
	}

	let {
		title,
		onCancel,
		onSave,
		isSaving = false,
		disabled = false,
		saveLabel = 'Save',
		savingLabel = 'Saving...'
	}: Props = $props()
</script>

<SidebarHeader {title}>
	{#snippet leftAccessory()}
		<Button variant="secondary" size="small" onclick={onCancel}>Cancel</Button>
	{/snippet}
	{#snippet rightAccessory()}
		<Button variant="primary" size="small" onclick={onSave} disabled={disabled || isSaving}>
			{isSaving ? savingLabel : saveLabel}
		</Button>
	{/snippet}
</SidebarHeader>
