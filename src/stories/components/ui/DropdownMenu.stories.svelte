<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import Button from '$lib/components/ui/Button.svelte'

	const { Story } = defineMeta({
		title: 'Components/UI/DropdownMenu',
		tags: ['autodocs']
	})
</script>

<!-- Default -->
<Story name="Default">
	<DropdownMenu>
		{#snippet trigger({ props })}
			<Button {...props}>Open Menu</Button>
		{/snippet}
		{#snippet menu()}
			<DropdownMenuBase.Item class="dropdown-menu-item">Edit</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Duplicate</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Archive</DropdownMenuBase.Item>
		{/snippet}
	</DropdownMenu>
</Story>

<!-- With Separator -->
<Story name="With Separator">
	<DropdownMenu>
		{#snippet trigger({ props })}
			<Button variant="secondary" {...props}>Actions</Button>
		{/snippet}
		{#snippet menu()}
			<DropdownMenuBase.Item class="dropdown-menu-item">New File</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">New Folder</DropdownMenuBase.Item>
			<DropdownMenuBase.Separator class="dropdown-menu-separator" />
			<DropdownMenuBase.Item class="dropdown-menu-item">Import</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Export</DropdownMenuBase.Item>
			<DropdownMenuBase.Separator class="dropdown-menu-separator" />
			<DropdownMenuBase.Item class="dropdown-menu-item danger">Delete</DropdownMenuBase.Item>
		{/snippet}
	</DropdownMenu>
</Story>

<!-- With Icons -->
<Story name="With Icons">
	<DropdownMenu>
		{#snippet trigger({ props })}
			<Button {...props}>File</Button>
		{/snippet}
		{#snippet menu()}
			<DropdownMenuBase.Item class="dropdown-menu-item">New Document</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">New Folder</DropdownMenuBase.Item>
			<DropdownMenuBase.Separator class="dropdown-menu-separator" />
			<DropdownMenuBase.Item class="dropdown-menu-item">Save</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Save As...</DropdownMenuBase.Item>
		{/snippet}
	</DropdownMenu>
</Story>

<!-- Danger Actions -->
<Story name="Danger Actions">
	<DropdownMenu>
		{#snippet trigger({ props })}
			<Button variant="secondary" {...props}>Manage</Button>
		{/snippet}
		{#snippet menu()}
			<DropdownMenuBase.Item class="dropdown-menu-item">Edit</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Move</DropdownMenuBase.Item>
			<DropdownMenuBase.Separator class="dropdown-menu-separator" />
			<DropdownMenuBase.Item class="dropdown-menu-item danger">Delete</DropdownMenuBase.Item>
		{/snippet}
	</DropdownMenu>
</Story>

<!-- User Menu Example -->
<Story name="User Menu Example">
	<DropdownMenu>
		{#snippet trigger({ props })}
			<Button variant="subtle" {...props}>
				{#snippet leftAccessory()}
					<span
						style="width: 24px; height: 24px; background: #6366f1; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px;"
						>J</span
					>
				{/snippet}
				John Doe
			</Button>
		{/snippet}
		{#snippet menu()}
			<DropdownMenuBase.Item class="dropdown-menu-item">Profile</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Settings</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Help</DropdownMenuBase.Item>
			<DropdownMenuBase.Separator class="dropdown-menu-separator" />
			<DropdownMenuBase.Item class="dropdown-menu-item danger">Sign out</DropdownMenuBase.Item>
		{/snippet}
	</DropdownMenu>
</Story>

<!-- Icon Button Trigger -->
<Story name="Icon Button Trigger">
	<DropdownMenu>
		{#snippet trigger({ props })}
			<Button size="small" iconOnly icon="ellipsis" {...props} />
		{/snippet}
		{#snippet menu()}
			<DropdownMenuBase.Item class="dropdown-menu-item">View</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Edit</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Share</DropdownMenuBase.Item>
			<DropdownMenuBase.Separator class="dropdown-menu-separator" />
			<DropdownMenuBase.Item class="dropdown-menu-item danger">Delete</DropdownMenuBase.Item>
		{/snippet}
	</DropdownMenu>
</Story>

<!-- Long Menu -->
<Story name="Long Menu">
	<DropdownMenu>
		{#snippet trigger({ props })}
			<Button {...props}>Select Category</Button>
		{/snippet}
		{#snippet menu()}
			<DropdownMenuBase.Item class="dropdown-menu-item">Characters</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Weapons</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Summons</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Classes</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Skills</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Raids</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Materials</DropdownMenuBase.Item>
			<DropdownMenuBase.Item class="dropdown-menu-item">Items</DropdownMenuBase.Item>
		{/snippet}
	</DropdownMenu>
</Story>
