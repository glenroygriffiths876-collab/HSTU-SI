# HSTU-SI — Approved UI Design Contract

**Established:** 12 October 2026  
**Version:** 1 — preservation baseline, not permission to redesign

## Non-negotiable change rule

A targeted change MUST NOT alter any other approved appearance, section, navigation path, data collection, or user action. Validate desktop and phone before publication. Never report a GitHub Actions pass as proof of correct behavior on the user's actual Samsung/Android device.

## Homepage buttons — locked palette

Keep the existing wording, order, rounded sizing, responsive single-column phone layout and routing. Only these appearance tokens are approved:

| Home action | Background | Text | Route |
| --- | --- | --- | --- |
| Explore Research | green `#169447` | white `#ffffff` | `research` |
| View Reports | red `#d71920` | white `#ffffff` | `reports` |
| Data Audit & Utilization | gold `#f2b714` | dark `#161307` | `data-audit` |

Scope the button styles to `.hstu-purpose-cta-930 button[data-purpose-view]`, **not** all buttons or links. Preserve the original gold accents of the proposal banner, top strip, Gallery icon and Health Arcade, and the existing red/green accents elsewhere.

## Source of truth and safe publishing

1. Edit `final-refinements-930.js` for 9.30 Home/navigation refinements; `index.html` includes this file **inline** for reliable first entry.
2. `.github/workflows/apply-930-refinements.yml` replaces the inline runtime **in place** and commits `index.html` only after its browser tests pass. It must remain idempotent.
3. This refinement workflow MUST NOT edit `service-worker.js`, cache names, preload behavior, or first-entry recovery code. Loading/cache changes require a separate diagnosis and test plan.
4. Do not add another competing CSS override, click handler, router, or workflow just to address a local visual issue.
5. Do not combine design changes with loading, data, PDF or navigation changes in a single unreviewed patch.
6. Do not bypass failed QA or push direct changes to generated `index.html` without rechecking that it matches the authoritative source.

## Required pre-release browser checks

The Apply 9.30 workflow tests the mobile and desktop interface and verifies:

- green, red and gold computed button colours, their text contrast, and all three first-click routes;
- Home About text and animation;
- mobile cascading hamburger and Gallery filter selection;
- desktop dropdown structure;
- 15 thematic categories, seven Quick Access items, 51 Gallery images and representative thematic navigation;
- absence of horizontal overflow across phone, tablet and desktop sizes.

The independent `.github/workflows/live-hstu-design-guard.yml` checks **actual GitHub Pages output** after publishing, including mobile and desktop computed colours, first-tap routes, original yellow strip, responsive width and page errors.

A red test is not grounds to weaken assertions or remove the check; investigate the regression. GitHub Pages can publish from main before a live QA workflow finishes, so these tests do **not**, by themselves, constitute branch protection or an absolute deployment block.

## Previously approved functionality to preserve

Eight sections: Home, Research, Capacity Building, Reports, Data Audit & Utilization, Gallery, Resources, Find Services. Keep Gia accessible at bottom-right, the PWA install/share actions, Jamaica map/service directory, Health Arcade, 276 research records, 15 thematic areas, 51 Gallery images, locally hosted PDFs and previews, full research/operational collections, yellow accents, and accessible mobile-first navigation.

**Open issue:** The real-phone first-click blank/stuck page problem is not proven resolved. Never claim it is fixed solely because a Playwright run passed. The existing first-click test must follow the actual checked-in service-worker cache name and continue to test first entry. Before declaring the loading issue resolved, stress-test the **live published version** and get user confirmation on the actual phone.

**Release rule:** A change is complete only when the intended feature works and unrelated baseline elements remain unchanged.
