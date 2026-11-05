# Agent instructions

Follow the component, import and navigation conventions in `CLAUDE.md` as well as these rules.

## Kaneo tasks and PR links

For work tracked in Kaneo, resolve the actual task in the **Granblue.team** project (`GBF`) and confirm `jedmund/hensei-web` is connected before opening a PR. The workspace directory for this repository is `hensei-svelte`.

- **Branch:** use `gbf-<task-number>-<short-description>`, for example `gbf-123-fix-import`. The configured pattern is `{slug}-{number}`, anchored at the start; `feature/gbf-123-...`, `feat/gbf-123-...` and `fix/gbf-123-...` do not match. Keep Conventional Commit prefixes in commit messages and PR titles.
- **PR body:** include the full ticket ID (`GBF-123`) and its Kaneo URL when creating the PR. These help people follow the work; `Closes GBF-123` alone does not create a native link. Do not use a bare GitHub issue number as a substitute for the Kaneo ticket.
- **Paired work:** API, web and extractor PRs implementing the same task use that task's number in each branch. Verify every PR is linked, including drafts.
- **Verify after opening:** allow the webhook to arrive, then check the task's native PR badge/external links for the correct repository and PR URL. A prose reference is not proof of a native link. If it is missing, investigate and report the gap; do not claim linking succeeded. Editing an already-open PR body does not create the missing link in the current integration.
- **Shared PRs:** one repository PR can have only one native task owner. Choose the explicit primary task for the branch; add the PR URL and primary ticket to a `Pull request history` section on each secondary task, preserving existing descriptions. One task may own several PRs.
- **Completion:** Kaneo's merge-to-Done transition waits until the task has no other open native PRs. Check remaining acceptance criteria before manually marking a task Done. Do not replay webhooks, change statuses to force a link, or bypass native link uniqueness.

If the project integration changes, verify its actual branch pattern before changing this convention. In the multi-repo workspace, also follow the parent `AGENTS.md`; its `docs/kaneo-pr-linking-playbook.md` explains historical backfills. This rule is self-contained for standalone checkouts.
