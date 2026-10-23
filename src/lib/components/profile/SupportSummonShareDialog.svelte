<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'

	interface Props {
		open: boolean
		username: string
		/** Pre-fills the Name field. Falls back to `username` when missing. */
		displayName?: string | null
		/** Pre-fills the GBF ID field when the owner has one on their profile. */
		granblueId?: string | null
	}

	let { open = $bindable(false), username, displayName = null, granblueId = null }: Props = $props()

	let gbfName = $state('')
	let gbfId = $state('')
	let teamUrl = $state('')

	$effect(() => {
		if (open) {
			// Pre-fill from the owner's profile each time the dialog opens. Users
			// can edit or clear any of these — they're transient and not persisted.
			gbfName = displayName?.trim() || username
			gbfId = granblueId?.trim() ?? ''
			teamUrl = `https://granblue.team/${username}`
		}
	})

	function buildDownloadUrl(): string {
		const path = `/download/user/${encodeURIComponent(username)}/support-summons`
		const entries: Array<[string, string]> = []
		if (gbfName.trim()) entries.push(['gbf_name', gbfName.trim()])
		if (gbfId.trim()) entries.push(['gbf_id', gbfId.trim()])
		if (teamUrl.trim()) entries.push(['team_url', teamUrl.trim()])
		if (entries.length === 0) return path
		return `${path}?${new URLSearchParams(entries).toString()}`
	}

	function handleDownload() {
		// Triggering a navigation to a route that responds with
		// Content-Disposition: attachment kicks off a browser-native download
		// without unmounting the modal or leaving the page.
		window.location.assign(buildDownloadUrl())
		open = false
	}

	function handleCancel() {
		open = false
	}
</script>

<Dialog bind:open size="small" class="support-summon-share-dialog">
	<ModalHeader title={m.support_summon_share_title()} />
	<ModalBody>
		<div class="body">
			<p class="description">{m.support_summon_share_description()}</p>
			<div class="fields">
				<Input
					variant="contained"
					label={m.support_summon_share_gbf_name_label()}
					placeholder={m.support_summon_share_gbf_name_placeholder()}
					bind:value={gbfName}
					maxlength={30}
					fullWidth
				/>
				<Input
					variant="contained"
					label={m.support_summon_share_gbf_id_label()}
					placeholder={m.support_summon_share_gbf_id_placeholder()}
					bind:value={gbfId}
					maxlength={16}
					fullWidth
				/>
				<Input
					variant="contained"
					label={m.support_summon_share_team_url_label()}
					placeholder={m.support_summon_share_team_url_placeholder({ username })}
					bind:value={teamUrl}
					maxlength={200}
					clearable
					onClear={() => (teamUrl = '')}
					fullWidth
				/>
			</div>
		</div>
	</ModalBody>
	<div class="footer">
		<Button variant="ghost" size="small" onclick={handleCancel}>{m.modal_cancel()}</Button>
		<Button variant="primary" size="small" onclick={handleDownload}>
			{m.support_summon_share_download()}
		</Button>
	</div>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.body {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: $unit-2x;
	}

	.description {
		margin: 0;
		font-size: $font-small;
		color: var(--text-secondary);
		line-height: 1.45;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.footer {
		display: flex;
		justify-content: flex-end;
		gap: $unit;
		padding: $unit-2x;
	}
</style>
