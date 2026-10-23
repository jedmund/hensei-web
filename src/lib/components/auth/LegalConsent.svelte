<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime.js'
</script>

<p class="legal-consent">
	{m.auth_legal_consent_before()}<br /><a href={localizeHref('/about/terms')} target="_blank"
		>{m.legal_terms_title()}</a
	>{m.auth_legal_consent_and()}<a href={localizeHref('/about/privacy')} target="_blank"
		>{m.legal_privacy_title()}</a
	>{m.auth_legal_consent_after()}
</p>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.legal-consent {
		margin: $unit-3x 0 0;
		font-size: $font-tiny;
		line-height: 1.5;
		color: var(--text-secondary);
		text-align: center;

		a {
			color: var(--text-primary);
			text-decoration: underline;
			white-space: nowrap;
		}
	}
</style>
