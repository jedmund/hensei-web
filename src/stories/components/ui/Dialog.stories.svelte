<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	const { Story } = defineMeta({
		title: 'Components/UI/Dialog',
		tags: ['autodocs']
	})
</script>

<script>
	let defaultOpen = $state(false)
	let withDescOpen = $state(false)
	let withFooterOpen = $state(false)
	let longContentOpen = $state(false)
	let formOpen = $state(false)
	let confirmOpen = $state(false)
</script>

<!-- Default -->
<Story name="Default">
	<div>
		<Button onclick={() => (defaultOpen = true)}>Open Dialog</Button>
		<Dialog bind:open={defaultOpen}>
			{#snippet children()}
				<ModalHeader title="Dialog Title" />
				<ModalBody>
					{#snippet children()}
						<p>This is the dialog content. You can put any content here.</p>
					{/snippet}
				</ModalBody>
			{/snippet}
		</Dialog>
	</div>
</Story>

<!-- With Description -->
<Story name="With Description">
	<div>
		<Button onclick={() => (withDescOpen = true)}>Open Dialog</Button>
		<Dialog bind:open={withDescOpen}>
			{#snippet children()}
				<ModalHeader title="Account Settings" description="Make changes to your account settings here." />
				<ModalBody>
					{#snippet children()}
						<p>Your account settings form would go here.</p>
					{/snippet}
				</ModalBody>
			{/snippet}
		</Dialog>
	</div>
</Story>

<!-- With Footer -->
<Story name="With Footer">
	<div>
		<Button onclick={() => (withFooterOpen = true)}>Open Dialog</Button>
		<Dialog bind:open={withFooterOpen}>
			{#snippet children()}
				<ModalHeader title="Confirm Action" />
				<ModalBody>
					{#snippet children()}
						<p>Are you sure you want to proceed with this action?</p>
					{/snippet}
				</ModalBody>
				<ModalFooter>
					{#snippet children()}
						<Button variant="secondary" onclick={() => (withFooterOpen = false)}>Cancel</Button>
						<Button variant="primary" onclick={() => (withFooterOpen = false)}>Confirm</Button>
					{/snippet}
				</ModalFooter>
			{/snippet}
		</Dialog>
	</div>
</Story>

<!-- Long Content -->
<Story name="Long Content">
	<div>
		<Button onclick={() => (longContentOpen = true)}>Open Long Dialog</Button>
		<Dialog bind:open={longContentOpen}>
			{#snippet children()}
				<ModalHeader title="Terms and Conditions" />
				<ModalBody>
					{#snippet children()}
						<div style="display: flex; flex-direction: column; gap: 16px;">
							<p>
								Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
								ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
								ullamco laboris.
							</p>
							<p>
								Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
								nulla pariatur. Excepteur sint occaecat cupidatat non proident.
							</p>
							<p>
								Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
								laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.
							</p>
							<p>
								At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium
								voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint.
							</p>
							<p>
								Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id
								quod maxime placeat facere possimus.
							</p>
						</div>
					{/snippet}
				</ModalBody>
				<ModalFooter>
					{#snippet children()}
						<Button variant="secondary" onclick={() => (longContentOpen = false)}>Decline</Button>
						<Button variant="primary" onclick={() => (longContentOpen = false)}>Accept</Button>
					{/snippet}
				</ModalFooter>
			{/snippet}
		</Dialog>
	</div>
</Story>

<!-- Form Dialog -->
<Story name="Form Dialog">
	<div>
		<Button onclick={() => (formOpen = true)}>Edit Profile</Button>
		<Dialog bind:open={formOpen}>
			{#snippet children()}
				<ModalHeader title="Edit Profile" description="Update your profile information." />
				<ModalBody>
					{#snippet children()}
						<div style="display: flex; flex-direction: column; gap: 16px;">
							<div>
								<label
									style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px;"
									for="name">Name</label
								>
								<input
									id="name"
									type="text"
									placeholder="Enter your name"
									style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px;"
								/>
							</div>
							<div>
								<label
									style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px;"
									for="email">Email</label
								>
								<input
									id="email"
									type="email"
									placeholder="Enter your email"
									style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px;"
								/>
							</div>
						</div>
					{/snippet}
				</ModalBody>
				<ModalFooter>
					{#snippet children()}
						<Button variant="secondary" onclick={() => (formOpen = false)}>Cancel</Button>
						<Button variant="primary" onclick={() => (formOpen = false)}>Save Changes</Button>
					{/snippet}
				</ModalFooter>
			{/snippet}
		</Dialog>
	</div>
</Story>

<!-- Confirmation Dialog -->
<Story name="Confirmation Dialog">
	<div>
		<Button variant="destructive" onclick={() => (confirmOpen = true)}>Delete Item</Button>
		<Dialog bind:open={confirmOpen}>
			{#snippet children()}
				<ModalHeader title="Delete Item" />
				<ModalBody>
					{#snippet children()}
						<p>
							Are you sure you want to delete this item? This action cannot be undone and all associated
							data will be permanently removed.
						</p>
					{/snippet}
				</ModalBody>
				<ModalFooter>
					{#snippet children()}
						<Button variant="secondary" onclick={() => (confirmOpen = false)}>Cancel</Button>
						<Button variant="destructive" onclick={() => (confirmOpen = false)}>Delete</Button>
					{/snippet}
				</ModalFooter>
			{/snippet}
		</Dialog>
	</div>
</Story>
