import { redirect } from '@sveltejs/kit'
import type { PageLoad } from './$types'

// Crew settings is a dialog on the crew page. This keeps /crew/settings
// linkable: it opens the crew page with the dialog open, keeping any locale
// prefix (/ja/crew/settings → /ja/crew?settings).
export const load: PageLoad = ({ url }) => {
	redirect(307, `${url.pathname.replace(/\/settings\/?$/, '')}?settings`)
}
