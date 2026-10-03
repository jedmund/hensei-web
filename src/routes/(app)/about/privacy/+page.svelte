<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import LegalDocument from '$lib/components/about/LegalDocument.svelte'
	import LegalSection from '$lib/components/about/LegalSection.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime.js'

	// Bump this whenever the policy changes in a way users should know about.
	const EFFECTIVE_DATE = '2026-10-02'
	const CONTACT = 'privacy@granblue.team'
</script>

<PageMeta title={m.page_title_privacy()} description={m.page_desc_privacy()} />

<LegalDocument title={m.legal_privacy_title()} effectiveDate={EFFECTIVE_DATE}>
	{#snippet intro()}
		<p>
			granblue.team is a fan-made resource for Granblue Fantasy. This page explains what we collect,
			why, who else touches it, and how to get it deleted. Each section begins with a plain English
			summary. You can switch to <strong>Full text</strong> to read the binding legal wording underneath.
		</p>
		<p>
			The short version: we collect what we need to run your account and show your teams, we don't
			sell anything or show ads, and you can delete your account from Settings at any time.
		</p>
	{/snippet}

	<LegalSection id="who-we-are" title="Who we are">
		{#snippet summary()}
			<p>
				granblue.team is run by
				<a href="https://jedmund.com" target="_blank" rel="noopener noreferrer">@jedmund</a> from
				the United States. This site isn't a company and isn't affiliated with Cygames. If you have
				a privacy question, email
				<a href="mailto:{CONTACT}">{CONTACT}</a>.
			</p>
		{/snippet}
		<p>
			This Privacy Policy describes how personal information is collected, used and shared when you
			use the website at granblue.team and its subdomains (the "Site"), the granblue.team API, and
			the granblue.team browser extension (the "Extension"), and the Siero bot on Discord ("Siero"),
			together the "Service". The Service is operated by Justin Edmund, an individual resident in
			the United States ("we", "us", "our"). For the purposes of the EU and UK General Data
			Protection Regulation ("GDPR"), we are the controller of the personal data described in this
			policy.
		</p>
		<p>
			The Service is an independent fan project. It is not affiliated with, endorsed by or sponsored
			by Cygames, Inc. or any of its affiliates.
		</p>
		<p>
			You can contact us about this policy or your personal data at
			<a href="mailto:{CONTACT}">{CONTACT}</a>.
		</p>
	</LegalSection>

	<LegalSection id="what-we-collect" title="What we collect">
		{#snippet summary()}
			<p>
				You can build and share teams without an account. If you make an account, we store your
				email, username, a scrambled copy of your password, and the settings and content you add:
				teams, collections, crew info, and profile details. We also see basic technical information
				that every website can see, such as your IP address.
			</p>
		{/snippet}
		<h3>Information you give us</h3>
		<ul>
			<li>
				<strong>Account information:</strong> email address, username, and password. Passwords are stored
				only as a one-way bcrypt hash; we cannot read them.
			</li>
			<li>
				<strong>Profile information you choose to add:</strong> display name, short bio, avatar and element
				choice, Granblue Fantasy player ID, links to a wiki profile or YouTube channel, language, theme,
				timezone and other preferences.
			</li>
			<li>
				<strong>Content you create:</strong> teams (parties) and their descriptions, playlists, favorites,
				your item collection (characters, weapons, summons, artifacts and accessories), support summons,
				crew membership, crew rosters and Guild War scores.
			</li>
			<li>
				<strong>Messages to us:</strong> anything you send by email or in our Discord server.
			</li>
		</ul>
		<h3>Information from sign-in providers</h3>
		<p>
			If you sign in with Google, Discord or Apple, the provider sends us the information you
			approve on its consent screen. We request only:
		</p>
		<ul>
			<li><strong>Google:</strong> your Google account ID, email address, and basic profile.</li>
			<li><strong>Discord:</strong> your Discord user ID, username, and email address.</li>
			<li>
				<strong>Apple:</strong> your Apple ID identifier, email address (which may be an Apple private
				relay address), and, the first time only, your name.
			</li>
		</ul>
		<p>
			We store the provider's account identifier, the email address it gives us, and whether that
			email is verified, so we can recognize you next time. We use your name or provider username
			only to suggest a username when you sign up, and we do not store it. We never receive your
			passwords for those services, and we do not access your contacts, files, calendar, or any
			other data in those accounts.
		</p>
		<h3>Information collected automatically</h3>
		<ul>
			<li>
				<strong>Technical data:</strong> IP address, browser type, device type and the pages or API endpoints
				requested. We use IP addresses to rate-limit requests and block abuse; our hosting and network
				providers also record them in short-lived logs.
			</li>
			<li>
				<strong>Error and performance data:</strong> when something breaks, we collect an error report
				(the error, the page, browser details and a sampled performance trace) so we can fix it.
			</li>
			<li>
				<strong>Extension version:</strong> when the Extension talks to our API, we record which version
				you're running so we can tell you about updates.
			</li>
		</ul>
	</LegalSection>

	<LegalSection id="cookies" title="Cookies and local storage">
		{#snippet summary()}
			<p>
				We use a handful of cookies to keep you logged in and remember your language and theme.
				There are no advertising or tracking cookies.
			</p>
		{/snippet}
		<p>The Site uses only cookies and browser storage that are necessary for it to work:</p>
		<ul>
			<li>
				<strong>Session cookies</strong> (<code>account</code>, <code>refresh</code>): keep you
				signed in. Up to 60 days.
			</li>
			<li>
				<strong>Preference cookies</strong> (<code>user</code>, <code>theme</code>,
				<code>PARAGLIDE_LOCALE</code>): remember your display settings and language.
			</li>
			<li>
				<strong>Sign-in cookies:</strong> short-lived cookies that protect the Google, Discord and Apple
				sign-in flows (state, nonce and code verifier, plus signup and account-link tickets). They expire
				within minutes.
			</li>
			<li>
				<strong>Local storage:</strong> if you build teams without an account, the "edit keys" that let
				you keep editing them are stored in your browser. They are sent to us only if you later sign
				in and choose to attach those teams to your account.
			</li>
		</ul>
		<p>
			We do not use advertising cookies, cross-site tracking, or third-party analytics cookies.
			Because every cookie we set is strictly necessary, we don't show a cookie consent banner. If
			you embed a YouTube video in a team description, YouTube may set its own cookies when that
			video loads; see Google's privacy policy.
		</p>
	</LegalSection>

	<LegalSection id="extension" title="The browser extension">
		{#snippet summary()}
			<p>
				The extension reads the data the game sends to your browser on Granblue Fantasy pages, such
				as your inventory, team setups and crew score pages, and keeps a copy on your computer. It
				sends that data to granblue.team only when you click to import it. It doesn't read other
				websites, your game password, or your game login cookies.
			</p>
		{/snippet}
		<p>
			The Extension helps you import your Granblue Fantasy data into the Service. To do this it uses
			the following browser permissions:
		</p>
		<ul>
			<li>
				<strong>debugger</strong>: attaches only to tabs open on Granblue Fantasy game domains (<code
					>game.granbluefantasy.jp</code
				>, <code>gbf.game.mbga.jp</code> and
				<code>steam.granbluefantasy.com</code>) and reads the responses of a fixed list of game
				endpoints: inventory and collection lists, item details, party decks, crew information,
				Guild War performance pages, and your profile's support summons. It does not read request
				headers, cookies, or credentials, and it does not attach to any other site.
			</li>
			<li>
				<strong>storage</strong>: keeps captured data, your preferences, and your granblue.team
				sign-in token on your device in the Extension's local storage.
			</li>
			<li>
				<strong>tabs</strong> and <strong>sidePanel</strong>: detect when a game tab is open and
				show the Extension's panel.
			</li>
			<li>
				<strong>cookies</strong>: used only to set the language cookie on granblue.team when you
				change the Extension's language, so the Site matches it.
			</li>
		</ul>
		<p>
			Captured data stays on your device until you choose to send it. When you click an import or
			upload button, the Extension sends the selected data to the granblue.team API under your
			account. Removing the Extension from your browser deletes everything it has stored on your
			device.
		</p>
		<p>
			The Extension's use of data complies with the Chrome Web Store User Data Policy, including its
			Limited Use requirements. Data the Extension collects is used only to provide its import
			features. It is not sold, not used for advertising or creditworthiness, not transferred to
			anyone except as needed to run the Service, and not read by humans except with your consent,
			for security, or to comply with law.
		</p>
	</LegalSection>

	<LegalSection id="siero" title="The Siero Discord bot">
		{#snippet summary()}
			<p>
				Siero is our Discord bot. If you use its spark tracker or save rate-ups, we store those
				numbers alongside your Discord user ID. We also store the IDs of the servers where you've
				used the bot in order to show leaderboards for spark progress. Siero cannot read your
				messages. Gacha simulations don't store anything about you.
			</p>
		{/snippet}
		<p>Siero stores information only when you use commands that save something:</p>
		<ul>
			<li>
				<strong>Spark tracking</strong> (<code>/spark</code>): your Discord user ID, the crystals
				and draw tickets you enter, an optional target item and note, the IDs of the Discord servers
				where you have used the command, and when you last updated it.
			</li>
			<li>
				<strong>Saved rate-ups</strong> (<code>/rateup</code>): your Discord user ID and the items
				and rates you save.
			</li>
		</ul>
		<p>
			Spark progress is visible to other members of servers where you have used Siero: on that
			server's leaderboard (for 14 days after your last update) and to anyone who looks up your
			spark. Saved rate-ups can be viewed or copied by other users of the bot. Leaderboards show
			your current Discord username, which Siero looks up from Discord when it renders the
			leaderboard; the username itself is not stored.
		</p>
		<p>
			Siero does not request access to the content of Discord messages. Raid sign-up sheets live
			only in the Discord messages the bot posts; they are not stored in our database. Gacha
			simulations are calculated by the granblue.team API and do not include your Discord ID. Siero
			is not currently linked to granblue.team accounts.
		</p>
		<p>
			You can clear your saved rate-ups with <code>/rateup reset</code> and zero your spark with
			<code>/spark reset</code>. To have your Siero records deleted entirely, email
			<a href="mailto:{CONTACT}">{CONTACT}</a> with your Discord username. Discord's own handling of
			your data is governed by Discord's privacy policy.
		</p>
	</LegalSection>

	<LegalSection id="other-players" title="Information about other players">
		{#snippet summary()}
			<p>
				When a crew officer imports Guild War scores or a crew roster, we store other crew members'
				in-game names, player IDs and scores, even if those players don't have a granblue.team
				account. Only the crew can see this. If that's you and you want it removed, email us.
			</p>
		{/snippet}
		<p>
			Crew captains and vice captains can import their crew's member list and Guild War scores from
			the game. This creates records ("phantom players") containing another player's in-game name,
			Granblue Fantasy player ID, and scores, whether or not that player has an account with us.
			This information is shown only to members of that crew. A player can claim their phantom
			record by joining the crew on granblue.team.
		</p>
		<p>
			If you are a player whose information was imported this way and you want it removed, email
			<a href="mailto:{CONTACT}">{CONTACT}</a> with your player ID and crew name. Our legal basis for
			holding this information is our and the crew's legitimate interest in tracking crew activity, and
			you may object to it at any time.
		</p>
	</LegalSection>

	<LegalSection id="how-we-use" title="How we use your information">
		{#snippet summary()}
			<p>
				We use your information to run the site for you. It's only used so that you can log in, save
				and show your teams, import your collection, send account emails, keep things secure, and
				fix bugs. We don't sell your data and we won't use it for ads.
			</p>
		{/snippet}
		<p>We use personal information to:</p>
		<ul>
			<li>
				create and secure your account and sign you in, including with Google, Discord or Apple;
			</li>
			<li>
				store, display and share the content you create, according to your visibility settings;
			</li>
			<li>import data from Granblue Fantasy through the Extension when you ask it to;</li>
			<li>
				send transactional emails: email verification, password resets, and account-deletion
				notices. We don't send marketing email;
			</li>
			<li>prevent abuse, enforce rate limits, and keep the Service secure;</li>
			<li>diagnose errors and improve performance; and</li>
			<li>
				comply with legal obligations and enforce our <a href={localizeHref('/about/terms')}
					>Terms of Service</a
				>.
			</li>
		</ul>
		<p>
			We do not sell or rent personal information, use it for advertising or profiling, or use it to
			train machine-learning models.
		</p>
		<h3>Legal bases (EEA and UK users)</h3>
		<ul>
			<li><strong>Contract:</strong> to provide the account and features you asked for.</li>
			<li>
				<strong>Legitimate interests:</strong> to secure the Service, prevent abuse, fix errors, and
				support crew features, balanced against your rights.
			</li>
			<li>
				<strong>Consent:</strong> where you choose to sign in with a third-party provider or embed third-party
				content. You can withdraw consent at any time.
			</li>
			<li>
				<strong>Legal obligation:</strong> where the law requires us to keep or disclose information.
			</li>
		</ul>
	</LegalSection>

	<LegalSection id="google-data" title="Google user data">
		{#snippet summary()}
			<p>
				If you sign in with Google, we only use your Google account ID and email address to log you
				in. We won't share this information except to run the site or when required by law.
			</p>
		{/snippet}
		<p>
			When you sign in with Google, we receive your Google account identifier, email address,
			whether that address is verified, and basic profile information (the <code>openid</code>,
			<code>email</code>, and <code>profile</code> scopes). We use this information only to create your
			account, sign you in, and let you link or unlink Google from your account.
		</p>
		<p>
			granblue.team's use and transfer of information received from Google APIs adheres to the
			<a
				href="https://developers.google.com/terms/api-services-user-data-policy"
				target="_blank"
				rel="noopener noreferrer">Google API Services User Data Policy</a
			>, including the Limited Use requirements. We do not transfer Google user data to third
			parties except as needed to provide the Service, comply with law, or as part of a merger or
			acquisition; we do not use it for advertising; and we do not allow humans to read it except
			with your consent, for security purposes, or to comply with law.
		</p>
		<p>
			You can disconnect Google at any time in Settings, or revoke access from your
			<a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer"
				>Google Account permissions</a
			>.
		</p>
	</LegalSection>

	<LegalSection id="whats-public" title="What other people can see">
		{#snippet summary()}
			<p>
				Your username, profile and public teams can be seen by anyone. You choose whether each team
				is public, unlisted or private, and whether your collection is visible to everyone, your
				crew, or only you. Your email is never shown.
			</p>
		{/snippet}
		<ul>
			<li>
				<strong>Public by default:</strong> your username, display name, bio, avatar, profile links,
				Granblue Fantasy player ID and timezone (if you've added them), and teams set to Public.
			</li>
			<li>
				<strong>Under your control:</strong> each team can be Public, Unlisted (visible to anyone with
				the link), or Private. Your collection can be visible to everyone, your crew only, or only you.
				Your support summons can be public or private. You can hide your crew tag on your profile.
			</li>
			<li>
				<strong>Visible to your crew:</strong> your crew membership, role, and Guild War scores.
			</li>
			<li>
				<strong>Never public:</strong> your email address, password, IP address, and sign-in providers.
			</li>
		</ul>
		<p>
			Content you make public can be viewed, linked to, and copied by others, and may remain in
			search engine caches or other people's copies after you delete it.
		</p>
	</LegalSection>

	<LegalSection id="sharing" title="Who we share it with">
		{#snippet summary()}
			<p>
				We don't sell your data. A few companies help run the site (hosting, email, error tracking)
				and process data only on our behalf. We'd only hand data to anyone else if the law required
				it.
			</p>
		{/snippet}
		<p>
			We share personal information only with service providers that process it on our behalf to run
			the Service, under contracts that limit their use of it:
		</p>
		<ul>
			<li><strong>Railway</strong>: application and database hosting (United States).</li>
			<li><strong>Cloudflare</strong>: content delivery, DNS, and protection against abuse.</li>
			<li>
				<strong>Amazon Web Services</strong>: storage for images and generated preview images.
			</li>
			<li><strong>Resend</strong>: delivery of account emails.</li>
			<li><strong>Sentry</strong>: error reporting and performance monitoring.</li>
			<li><strong>New Relic</strong>: API performance monitoring.</li>
			<li>
				<strong>Discord</strong>: delivers Siero's commands and messages.
			</li>
			<li>
				<strong>Google, Discord, and Apple</strong>: only if you choose to sign in with them, to
				verify your identity.
			</li>
		</ul>
		<p>
			We may also disclose information if required by law or valid legal process, to protect the
			rights, safety, or property of our users or others, or in connection with a transfer of the
			Service to a new operator, in which case this policy will continue to apply to your
			information unless you are notified otherwise.
		</p>
	</LegalSection>

	<LegalSection id="retention" title="How long we keep your data, and deleting your account">
		{#snippet summary()}
			<p>
				We keep your data while you have an account. You can delete your account at any time from
				Settings: after you confirm with your password, your account will be scheduled for deletion
				in 30 days. If you change your mind, log in during that time and cancel. After 30 days, your
				account and personal data will be permanently erased, and backups will be rotated within
				another 30-day time period.
			</p>
		{/snippet}
		<p>
			We keep account information and content for as long as your account exists. You can delete
			your account at any time in <strong>Settings → Account</strong>. Deletion works as follows:
		</p>
		<ol>
			<li>
				You confirm the request with your password. If you signed up with Google, Discord, or Apple
				and haven't set a password, you'll be asked to set one first.
			</li>
			<li>
				Your account is scheduled for deletion 30 days later, you are signed out on every device,
				and we email you a confirmation. During those 30 days your account and content remain as
				they were, and you can cancel by signing in and choosing <strong>Cancel deletion</strong>.
			</li>
			<li>
				After 30 days we permanently delete your account, profile, teams, playlists, favorites,
				collection, support summons, linked sign-in providers, and sign-in sessions. If you are a
				crew captain, captaincy passes to a vice captain or, if there is none, to the
				longest-standing member; a crew with no other active members is deleted along with its
				rosters and scores.
			</li>
		</ol>
		<p>
			Some records that also belong to other people are kept without your name attached: for
			example, Guild War scores you recorded for your crew stay with the crew but are no longer
			linked to you. Teams other people copied from yours are theirs and are not deleted.
		</p>
		<p>
			Deleted data may remain in encrypted database backups for up to 30 days before those backups
			are overwritten. Server and network logs containing IP addresses are kept for a limited period
			(generally no more than 30 days). Error reports are kept for up to 90 days.
		</p>
		<p>
			If you can't access your account, email <a href="mailto:{CONTACT}">{CONTACT}</a> from the address
			on the account and we'll handle the request manually.
		</p>
	</LegalSection>

	<LegalSection id="your-rights" title="Your rights">
		{#snippet summary()}
			<p>
				You can see, fix, or delete your data at any time via Settings. If there's something else
				you need regarding your account, email us and we'll respond within 30 days. We treat
				everyone the same no matter where they live.
			</p>
		{/snippet}
		<p>
			Wherever you live, you can ask us to access, correct, or delete your personal information, or
			object to or restrict how we use it. Most of these you can do yourself in Settings. For
			anything else, email <a href="mailto:{CONTACT}">{CONTACT}</a>. We may need to verify that the
			request comes from the account holder, and we will respond within 30 days.
		</p>
		<h3>EEA and UK residents</h3>
		<p>
			Under the GDPR you have the rights of access, rectification, erasure, restriction, data
			portability, and objection, and the right to withdraw consent at any time. You also have the
			right to complain to your local data protection authority.
		</p>
		<h3>California residents</h3>
		<p>
			Under the California Consumer Privacy Act (as amended by the CPRA), you have the right to know
			what personal information we collect, use, and disclose; to delete it; to correct it; and to
			opt out of its sale or sharing. We do not sell or share personal information for cross-context
			behavioral advertising, and we have not done so in the past 12 months. We will not
			discriminate against you for exercising these rights. You may use an authorized agent to make
			a request on your behalf.
		</p>
	</LegalSection>

	<LegalSection id="transfers" title="International transfers">
		{#snippet summary()}
			<p>
				The site is run from the United States, so your data is stored there even if you live
				somewhere else.
			</p>
		{/snippet}
		<p>
			The Service is operated from, and our service providers store data in, the United States. If
			you use the Service from outside the United States, your information will be transferred to
			and processed in the United States, which may not have the same data protection laws as your
			country. Where the GDPR applies, we rely on the European Commission's Standard Contractual
			Clauses or our providers' certifications under the EU-U.S. Data Privacy Framework for these
			transfers.
		</p>
	</LegalSection>

	<LegalSection id="security" title="Security">
		{#snippet summary()}
			<p>
				We take reasonable steps to protect your data. Unfortunately, no site is perfectly secure.
				We'll let you know if something goes wrong as soon as we know.
			</p>
		{/snippet}
		<p>
			We use industry-standard safeguards, including encryption in transit (HTTPS), hashed
			passwords, hashed reset and verification tokens, rate limiting, and access controls on our
			infrastructure. No method of transmission or storage is completely secure, so we cannot
			guarantee absolute security. If a breach affects your personal information, we will notify you
			promptly after we become aware of it, and notify the relevant authorities as required by law.
		</p>
	</LegalSection>

	<LegalSection id="children" title="Age requirement">
		{#snippet summary()}
			<p>You must be at least 16 to make an account.</p>
		{/snippet}
		<p>
			The Service is not directed to children, and you must be at least 16 years old to create an
			account. We do not knowingly collect personal information from anyone under 16. If you believe
			a child under 16 has given us personal information, email
			<a href="mailto:{CONTACT}">{CONTACT}</a> and we will delete it.
		</p>
	</LegalSection>

	<LegalSection id="changes" title="Changes to this policy">
		{#snippet summary()}
			<p>
				If we change this policy, we'll update the date at the top. For big changes, we'll let you
				know on the site or by email first.
			</p>
		{/snippet}
		<p>
			We may update this policy from time to time. When we do, we will change the effective date at
			the top of this page. If a change materially affects how we use your personal information, we
			will notify you through the Service or by email before it takes effect.
		</p>
	</LegalSection>

	<LegalSection id="contact" title="Contact">
		{#snippet summary()}
			<p>Questions or requests: <a href="mailto:{CONTACT}">{CONTACT}</a>.</p>
		{/snippet}
		<p>
			Justin Edmund, operator of granblue.team. Email: <a href="mailto:{CONTACT}">{CONTACT}</a>.
		</p>
	</LegalSection>
</LegalDocument>
