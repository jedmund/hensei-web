<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import LegalDocument from '$lib/components/about/LegalDocument.svelte'
	import LegalSection from '$lib/components/about/LegalSection.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime.js'

	// Bump this whenever the terms change in a way users should know about.
	const EFFECTIVE_DATE = '2026-10-02'
	const CONTACT = 'privacy@granblue.team'
</script>

<PageMeta title={m.page_title_terms()} description={m.page_desc_terms()} />

<LegalDocument title={m.legal_terms_title()} effectiveDate={EFFECTIVE_DATE}>
	{#snippet intro()}
		<p>
			Here are some things to keep in mind when using granblue.team and associated tools for
			Granblue Fantasy, like the extension and Siero bot on Discord. Each section starts with a
			plain English summary. Switch to <strong>Full text</strong> to read the legalese. If there's ever
			a discrepancy, the full text wins.
		</p>
	{/snippet}

	<LegalSection id="agreement">
		{#snippet summary()}
			<p>
				By using granblue.team or any of its tools, you agree to these terms. If you don't agree,
				please don't use them.
			</p>
		{/snippet}
		<p>
			These Terms of Service ("Terms") are an agreement between you and Justin Edmund ("we", "us",
			"our"), the operator of the website at granblue.team and its subdomains, the granblue.team
			API, the granblue.team browser extension, and the Siero bot on Discord (together, the
			"Service"). By accessing or using the Service, you agree to these Terms and to our
			<a href={localizeHref('/about/privacy')}>Privacy Policy</a>. If you do not agree, do not use
			the Service.
		</p>
	</LegalSection>

	<LegalSection id="fan-project" title="This is a fan project">
		{#snippet summary()}
			<p>
				granblue.team is made and maintained by fans of the game. We're not connected to Cygames,
				and all the game's art, names, and data belong to them.
			</p>
		{/snippet}
		<p>
			The Service is an independent, non-commercial fan project. It is not affiliated with, endorsed
			by, or sponsored by Cygames, Inc. Granblue Fantasy and all related characters, names, artwork,
			and game data are trademarks or copyrighted works of Cygames, Inc. and are used for
			informational and fan purposes only. Nothing in these Terms grants you any rights in those
			materials.
		</p>
	</LegalSection>

	<LegalSection id="eligibility" title="Who can use it">
		{#snippet summary()}
			<p>
				You need to be at least 16 to make an account, and you're responsible for keeping it secure.
			</p>
		{/snippet}
		<p>
			You must be at least 16 years old to create an account. By creating an account you confirm
			that you meet this requirement and that the information you give us is accurate.
		</p>
		<p>
			You are responsible for keeping your password and sign-in methods secure and for all activity
			under your account. Tell us promptly at <a href="mailto:{CONTACT}">{CONTACT}</a> if you believe
			your account has been compromised. One person may not maintain multiple accounts to evade a suspension
			or the Service's limits.
		</p>
	</LegalSection>

	<LegalSection id="your-content" title="Your content">
		{#snippet summary()}
			<p>
				What you make is yours. You let us store and show it so the site works, including showing
				your public teams to other people. You can't post things you don't have the right to share.
			</p>
		{/snippet}
		<p>
			"Your Content" means teams, descriptions, playlists, profile information, crew information,
			and anything else you submit to the Service. You keep whatever rights you have in Your
			Content.
		</p>
		<p>
			You grant us a worldwide, non-exclusive, royalty-free license to host, store, reproduce,
			display, and adapt Your Content (for example, to generate preview images or format it for
			different screens) solely to operate, provide, and improve the Service. This license ends when
			Your Content is deleted from the Service, except for copies in backups for the period
			described in the Privacy Policy and Content that other users have already copied into their
			own teams.
		</p>
		<p>
			Content you make Public or Unlisted can be viewed by others, and teams can be copied
			("remixed") by other users into their own accounts. You represent that you have the rights
			needed to submit Your Content and that it does not violate these Terms or anyone else's
			rights.
		</p>
	</LegalSection>

	<LegalSection id="acceptable-use" title="Acceptable use">
		{#snippet summary()}
			<p>
				Please be kind to others when using the site. This means no harassment, spam, illegal or
				hateful content. Don't attack the site, and don't scrape it for data. The source code is
				open-source and licensed under AGPLv3 for you to use and remix for non-commercial purposes.
				If you would like to use data for something, please get in touch and we can discuss your
				needs.
			</p>
		{/snippet}
		<p>You agree not to:</p>
		<ul>
			<li>
				post content that is unlawful, harassing, hateful, sexually explicit, or that infringes
				anyone's rights;
			</li>
			<li>impersonate any person, or misrepresent your affiliation with anyone;</li>
			<li>
				use another person's account without permission, or collect other users' personal
				information;
			</li>
			<li>
				probe, scan, or test the vulnerability of the Service, or bypass its security, rate limits,
				or access controls, except through responsible disclosure to us;
			</li>
			<li>
				scrape, crawl, or bulk-download data from the Service, or otherwise access it with automated
				tools beyond reasonable personal use, without our written permission;
			</li>
			<li>interfere with or overload the Service;</li>
			<li>use the Service to send spam or distribute malware; or</li>
			<li>use the Service in violation of any applicable law.</li>
		</ul>
		<p>
			The Service's source code is available under the GNU Affero General Public License v3, subject
			to a non-commercial use condition, as set out in the LICENSE file in each source repository.
			These Terms govern your use of the hosted Service; your use of the source code is governed by
			that license.
		</p>
	</LegalSection>

	<LegalSection id="extension" title="The browser extension and the game's own rules">
		{#snippet summary()}
			<p>
				The extension reads data the game already sends to your browser. It doesn't play the game
				for you or change anything in it, but you're still responsible for following Cygames' rules
				for the game.
			</p>
		{/snippet}
		<p>
			The Extension reads data that Granblue Fantasy sends to your own browser and, when you choose,
			sends it to your granblue.team account. It does not automate gameplay, send requests to the
			game on your behalf, or modify the game.
		</p>
		<p>
			Your use of Granblue Fantasy is governed by Cygames' own terms. You are solely responsible for
			ensuring that your use of the Extension complies with them. We make no representation that use
			of the Extension is permitted by those terms, and we are not responsible for any action
			Cygames takes regarding your game account.
		</p>
	</LegalSection>

	<LegalSection id="termination" title="Deleting your account and our rights">
		{#snippet summary()}
			<p>
				You can delete your account from Settings at any time. Your data will be deleted after 30
				days to give you a chance to change your mind. We reserve the right to remove content or
				suspend accounts that break our rules.
			</p>
		{/snippet}
		<p>
			You may stop using the Service at any time and may delete your account in Settings. Deletion
			takes effect 30 days after you request it, and you may cancel the request by signing in during
			that period. What is deleted and what is retained is described in our
			<a href={localizeHref('/about/privacy')}>Privacy Policy</a>.
		</p>
		<p>
			We may remove content, or suspend or terminate your access to the Service, if we reasonably
			believe you have violated these Terms, or if needed to protect the Service or other users.
			Where practical, we will tell you why. We may also change, suspend, or discontinue any part of
			the Service at any time.
		</p>
	</LegalSection>

	<LegalSection id="copyright" title="Copyright complaints">
		{#snippet summary()}
			<p>
				If you think something on the site infringes your copyright, email us and we'll look at it.
			</p>
		{/snippet}
		<p>
			If you believe content on the Service infringes your copyright, send a notice to
			<a href="mailto:{CONTACT}">{CONTACT}</a> that identifies the copyrighted work, the location of
			the infringing material on the Service, your contact information, a statement that you have a good-faith
			belief the use is not authorized, and a statement, under penalty of perjury, that the information
			in your notice is accurate and that you are the owner or authorized to act on the owner's behalf.
			We will remove infringing material and terminate repeat infringers where appropriate.
		</p>
	</LegalSection>

	<LegalSection id="disclaimers" title="No guarantees">
		{#snippet summary()}
			<p>
				This is a free hobby project. We try to keep it running and the data accurate, but we can't
				promise it will always work, that game data is correct, or that nothing will ever be lost.
				Keep your own copies of anything important.
			</p>
		{/snippet}
		<p>
			THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, WHETHER
			EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
			TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE,
			OR ERROR-FREE, THAT GAME DATA OR CALCULATIONS ARE ACCURATE OR COMPLETE, OR THAT YOUR CONTENT
			WILL BE PRESERVED.
		</p>
	</LegalSection>

	<LegalSection id="liability" title="Limits on liability">
		{#snippet summary()}
			<p>
				If something goes wrong, we're not liable for indirect losses since this service is offered
				for free.
			</p>
		{/snippet}
		<p>
			TO THE FULLEST EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
			SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF DATA, PROFITS, OR GOODWILL,
			ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TERMS, EVEN IF WE HAVE BEEN ADVISED OF THE
			POSSIBILITY OF SUCH DAMAGES. BECAUSE THE SERVICE IS PROVIDED FREE OF CHARGE, TO THE FULLEST
			EXTENT PERMITTED BY LAW WE WILL HAVE NO LIABILITY TO YOU FOR ANY CLAIM RELATING TO THE SERVICE
			OR THESE TERMS, AND OUR TOTAL LIABILITY FOR ALL SUCH CLAIMS IS ZERO U.S. DOLLARS (US$0).
		</p>
		<p>
			Some jurisdictions do not allow the exclusion of certain warranties or the limitation of
			certain damages, so some of the above may not apply to you. Nothing in these Terms limits any
			rights you have as a consumer that cannot be limited by contract.
		</p>
	</LegalSection>

	<LegalSection id="indemnity" title="Indemnity">
		{#snippet summary()}
			<p>
				If your content or misuse of the site gets us into legal trouble, you agree to cover it.
			</p>
		{/snippet}
		<p>
			To the extent permitted by law, you agree to indemnify and hold us harmless from any claims,
			losses, and expenses (including reasonable attorneys' fees) arising from Your Content or your
			violation of these Terms.
		</p>
	</LegalSection>

	<LegalSection id="law" title="Governing law">
		{#snippet summary()}
			<p>
				California law applies, and disputes go to courts in California, unless your local consumer
				law says otherwise.
			</p>
		{/snippet}
		<p>
			These Terms are governed by the laws of the State of California, United States, without regard
			to its conflict-of-laws rules. Any dispute arising from these Terms or the Service will be
			resolved exclusively in the state or federal courts located in California, and you consent to
			their jurisdiction. If you are a consumer in a country whose laws give you the right to bring
			claims in your local courts or under your local law, nothing in this section takes that right
			away.
		</p>
	</LegalSection>

	<LegalSection id="changes" title="Changes to these terms">
		{#snippet summary()}
			<p>
				If we change these terms, we'll update the date at the top and warn you about big changes.
				Using the site afterward means you accept them.
			</p>
		{/snippet}
		<p>
			We may update these Terms from time to time. We will change the effective date at the top of
			this page and, for material changes, notify you through the Service or by email before they
			take effect. Continuing to use the Service after changes take effect means you accept them.
		</p>
		<p>
			If any part of these Terms is found unenforceable, the rest remains in effect. Our failure to
			enforce a provision is not a waiver. You may not transfer these Terms; we may transfer them to
			a successor operator of the Service. These Terms and the Privacy Policy are the entire
			agreement between you and us about the Service.
		</p>
	</LegalSection>

	<LegalSection id="contact" title="Contact">
		{#snippet summary()}
			<p>Questions? Email <a href="mailto:{CONTACT}">{CONTACT}</a>.</p>
		{/snippet}
		<p>
			Justin Edmund, operator of granblue.team. Email: <a href="mailto:{CONTACT}">{CONTACT}</a>.
		</p>
	</LegalSection>
</LegalDocument>
