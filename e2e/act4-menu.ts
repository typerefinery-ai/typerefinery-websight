/**
 * Act 4's Navigator menu entries — the single source of truth for label and URL.
 * alpha-launch decision 0014, Option 5 (carrying Option 4's wording).
 *
 * ## Why this file exists
 *
 * #44 specifies two custom context-menu items by writing their `{label, url}` literally into the
 * Navigator's `nav-app/src/assets/config.json`. Two problems with that, both principles rather than
 * preferences:
 *
 *   1. it commits STIX vocabulary and an `/os-triage/…` URL into the **platform** repo, which is
 *      required to stay data-agnostic (alpha-launch docs/data-agnostic-principle.md, R1.5);
 *   2. it makes renaming a menu item an edit to a vendored Angular asset — contradicting the demo's
 *      own claim that "adding a menu action is authoring, not development", in the one act meant to
 *      prove the contract extends to third-party tools.
 *
 * Option 5 therefore has the service **generate** that config from environment variables at start,
 * the way Traefik's `dynamic.yml` already templates `{{ env "TRAEFIK_FLOW_URL" }}`.
 *
 * This module is the **test half** of that contract: P4-S2 asserts the *configured* label instead of
 * a hardcoded guess, which is what stops decision 0014's wording question from blocking automation.
 * Change the wording in one env value and the spec follows.
 *
 * ## ⚠️ The wording, and why it is not #44's
 *
 * All three labels #44 and the source task doc propose name the **wrong destination**. The object is
 * written to the incident's **unattached context** and appears in Composer **Scratch** (R4.3, R5.2,
 * P4-S3); getting it into the incident is the separate **Promote** action (P3-S9). "…to Incident"
 * would tell an analyst the technique is somewhere it is not.
 *
 * So the default below says **Scratch**, and uses **Copy** — already this product's verb for exactly
 * this operation (Act 3's tree Copy puts an object into unattached context).
 */

/** Env names the Navigator service must read when generating its config. Keep in step with R3. */
export const ACT4_MENU_ENV = {
  techniqueLabel: 'ATTACK_MENU_TECHNIQUE_LABEL',
  tacticLabel: 'ATTACK_MENU_TACTIC_LABEL',
  techniqueUrl: 'ATTACK_MENU_TECHNIQUE_URL',
  tacticUrl: 'ATTACK_MENU_TACTIC_URL',
} as const

/**
 * Defaults are the *recommended* wording, not a fallback to be relied on: if the service is
 * generating its config properly these are also what it was given. A test that reads the same
 * source as the thing it tests would be circular, so the assertion's value is that the **rendered
 * menu** matches the **configured** value — not that a constant equals itself.
 */
export const ACT4_MENU = {
  techniqueLabel: process.env[ACT4_MENU_ENV.techniqueLabel] || 'Copy Technique to Scratch',
  tacticLabel: process.env[ACT4_MENU_ENV.tacticLabel] || 'Copy Tactic to Scratch',
  techniqueUrl:
    process.env[ACT4_MENU_ENV.techniqueUrl] ||
    'https://flow.typerefinery.localhost:8101/os-triage/transport/attack/{{technique_stixID}}',
  tacticUrl:
    process.env[ACT4_MENU_ENV.tacticUrl] ||
    'https://flow.typerefinery.localhost:8101/os-triage/transport/attack/{{tactic_stixID}}',
}

/** The exact shape the service must write to `nav-app/src/assets/config.json`. */
export function act4MenuConfig() {
  return [
    { label: ACT4_MENU.techniqueLabel, url: ACT4_MENU.techniqueUrl },
    { label: ACT4_MENU.tacticLabel, url: ACT4_MENU.tacticUrl },
  ]
}
