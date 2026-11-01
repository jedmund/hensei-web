<script lang="ts">
	// The role's icon on the edit form, with an upload that saves right away
	// (icons have their own endpoint). PNG up to 128×128 and 256 KB, checked
	// here and again by the API.
	import { useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import { roleAdapter } from '$lib/api/adapters/role.adapter'
	import { adminKeys } from '$lib/api/queries/admin.queries'
	import { roleKeys } from '$lib/api/queries/role.queries'
	import IconUploadField from '$lib/components/IconUploadField.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'
	import { dataUrlToBase64, type IconValidationError } from '$lib/utils/iconUpload'
	import { extractErrorMessage } from '$lib/utils/errors'
	import type { RoleRecord } from '../record'

	let { field, record: rawRecord }: InputProps = $props()

	// On the edit form only (`form: { create: false }`), so there's a record
	const record = $derived(rawRecord as RoleRecord)

	const queryClient = useQueryClient()
	let preview = $state<string | null>(null)
	let error = $state<string | null>(null)
	let uploading = $state(false)

	const ERRORS: Record<IconValidationError, () => string> = {
		mime: m.roles_icon_error_png,
		decode: m.roles_icon_error_png,
		size: m.roles_icon_error_size,
		dimensions: m.roles_icon_error_dimensions
	}

	async function upload({ file, dataUrl }: { file: File; dataUrl: string }) {
		error = null
		uploading = true
		try {
			await roleAdapter.uploadIcon(record.id, dataUrlToBase64(dataUrl), file.name)
			preview = dataUrl
			toast.success(m.db_roles_icon_uploaded())
			void queryClient.invalidateQueries({ queryKey: roleKeys.all })
			void queryClient.invalidateQueries({ queryKey: adminKeys.lists('character-roles') })
		} catch (err) {
			toast.error(extractErrorMessage(err, m.roles_save_failed()))
		} finally {
			uploading = false
		}
	}
</script>

<DetailItem label={field.label()} editable>
	<IconUploadField
		iconKey={record.iconKey}
		iconPreview={preview}
		name={record.nameEn}
		size={64}
		imageSize={48}
		{error}
		ariaLabel={m.roles_icon_upload()}
		onSelect={upload}
		onError={(e) => (error = ERRORS[e]())}
	>
		{#snippet actions({ open })}
			<Button variant="ghost" size="small" disabled={uploading} onclick={open}>
				{m.roles_icon_choose()}
			</Button>
			<p class="hint">{m.roles_icon_hint_edit()}</p>
		{/snippet}
	</IconUploadField>
</DetailItem>

<style lang="scss">
	@use '$src/themes/typography' as typography;

	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}
</style>
