# Make PolyDoc app - implementation roadmap

Living roadmap for the Make custom app, built per `../../CONNECTOR-PLAYBOOK.md`,
mirroring the n8n reference (`../../n8n-nodes-polydoc`). Fresh standalone repo at
`~/Projects/polydoc/tools/make-polydoc/`.

Status legend: todo (TODO) | in progress (WIP) | done (DONE)

---

## 0. Decision record (why this shape)

Make custom apps express actions as separate **modules** picked from the app's
module list, not as one node with an operation dropdown (the n8n shape). So the
three operations become three action modules in ONE app: **Convert to PDF**,
**Capture Screenshot**, **Create E-Invoice**. This is the Make-idiomatic reading of
"converge the product, diverge the content": one app, one connection, shared
request-body logic, three focused modules, plus three angle-split blueprints.

The shared request-body assembly (source resolution, the per-operation sub-objects,
delivery, and the Advanced-JSON deep-merge) is ported from the n8n connector's
`GenericFunctions.ts` into three custom IML functions: `mergeDeep`,
`buildPolydocBody`, `buildPolydocOutput`. Every module calls them, so all PolyDoc
connectors send byte-identical payloads. The functions are covered by unit tests
(`test/functions.test.mjs`, run with `node --test`) over the same matrix as the n8n
`buildRequestBody.test.ts`, plus Make-format `test.js` per function.

### What diverges from the n8n build (Make specifics)

1. **Runs server-side.** No CORS concern, and binary file download works natively
   (unlike the Airtable Blocks extension). Download is the default delivery mode.
2. **Credentials are stored encrypted per-connection** by Make. No collaborator
   visibility caveat (unlike Airtable's `globalConfig`). The mandatory credential
   test (playbook gotcha #1) is the connection verification request: a tiny sandbox
   screenshot, forced to `X-Sandbox: true` so it never spends production quota.
3. **Response shape per delivery mode is the one open mechanic** (see below).

### Free vs paid (the cost answer)

- **Build the app source:** free (local tooling, no Make account needed).
- **Deploy to a Make app:** needs a Make account and a Make API token (stored in the
  gitignored `.secrets`, wired through `makecomapp.json` origins) via the Apps SDK
  VS Code extension.
- **Publish to the public Make marketplace:** review-gated (heavier), per the
  playbook. A private app is usable inside your own organization without review.

---

## 1. Product model (mirror the n8n node exactly)

PolyDoc API = 2 endpoints: `POST /pdf/convert`, `POST /screenshot/convert`.
Auth: `Authorization: Bearer <API_KEY>`. Sandbox: `X-Sandbox: true` header, set from
the connection toggle in `base.iml.json`; the credential test forces it true. Field
definitions: `../../polydoc-gateway/src/schemas/{common,pdf,screenshot}.ts` (source
of truth).

Modules: **Convert to PDF** `/pdf/convert` | **Capture Screenshot**
`/screenshot/convert` | **Create E-Invoice** `/pdf/convert` with an `eInvoice`
payload. Source mode: URL / inline HTML / Template (`source: "[template:<id>]"` +
`templateData`). Delivery: Download (binary, default) / Cloud Storage (presigned) /
Webhook, plus an **Advanced (JSON)** deep-merge escape hatch.

### Three angle-split assets (analog of the n8n templates)

| n8n template | Make blueprint | Angle |
|---|---|---|
| `invoice-pdf-from-template.json` | `blueprints/pdf-from-template.blueprint.json` | PDF |
| `url-screenshot-scheduled.json` | `blueprints/url-screenshot.blueprint.json` | Screenshot |
| `einvoice-webhook-to-pdf.json` | `blueprints/einvoice.blueprint.json` | E-Invoice |

---

## 2. Passes

### Pass 1 - App source, functions, tests, blueprints, docs (DONE)
Local, zero Make-account dependency.
- DONE Repo scaffold: `git init`, `package.json`, `.gitignore`, `makecomapp.json`.
- DONE IML functions `mergeDeep` / `buildPolydocBody` / `buildPolydocOutput` + unit
  tests (20 cases, `node --test`) + Make-format `test.js`.
- DONE `base.iml.json` (baseUrl, auth + X-Sandbox headers, error map, log.sanitize).
- DONE Connection `polydoc` (params + mandatory credential test, forced sandbox).
- DONE Three action modules (communication, expect, interface, samples, scope).
- DONE Three angle-split blueprints (PDF / screenshot / e-invoice).
- DONE Icon (`assets/icon.svg` + 512px `assets/icon.png` from the brand mark).
- DONE README + this ROADMAP. Em-dashes scrubbed from all text (org rule).
- DONE Live sandbox smoke test (`scripts/smoke.mjs`): passes from an allowed network
  (confirmed: all three operations return 200 with the expected content types). It
  returns an empty-body `403` from the build environment (an ingress / source-IP
  block ahead of the gateway, including the public `/health`), so always run it from
  a permitted network, not from CI/build.

### Pass 2 - Deploy and verify in Make (human-gated) (TODO)
Needs a Make account + API token.
- TODO Install the Apps SDK VS Code extension; add a deploy origin in
  `makecomapp.json` (`.secrets` holds the token); deploy the app.
- TODO Confirm the connection verification passes with a valid key (200) and fails
  with an invalid one (401).
- TODO Run each module once (Download), confirm the file output; then once each for
  Cloud Storage and Webhook delivery (JSON output).
- TODO Import each blueprint and run it.
- TODO Resolve the open mechanics below against the live app.

### Pass 3 - Marketplace assets + submission (human-gated) (TODO)
- TODO Listing copy, screenshots, support email/URL (em-dash free).
- TODO Walkthrough video showing the connection test passing + each module.
- TODO Submit for Make review.

---

## 3. Open questions / known unknowns

These are the items to confirm against a live Make deploy (Pass 2). The binary
Download path is the guaranteed baseline; the smoke test already proves the request
bodies are accepted by the gateway, independent of Make's response layer.

- **Conditional `response.type`.** Modules set
  `type: "{{if(parameters.delivery = 'download'; 'binary'; 'automatic')}}"` so a file
  download parses as binary while cloud/webhook parse the JSON response. If Make
  requires a static `type`, fall back to a binary-only download module and handle
  cloud/webhook separately.
- **Passing `parameters` whole to a custom function** (`buildPolydocBody('pdf';
  parameters)`) and one custom function calling another (`buildPolydocBody` ->
  `mergeDeep`). Both are expected to work; verify on deploy. If not, inline
  `mergeDeep` into `buildPolydocBody`.
- **Webhook async delivery** returns 202 with a JSON body; confirm Make parses it
  cleanly (the `automatic` response type should handle it).
- **Response headers** (`x-conversion-id`, `x-credit-used`) are not currently
  surfaced in module output; the docs are unclear on header access. Add to the
  interface if they turn out to be reachable.
- **App name / slug** in the blueprints (`polydoc:`) must match the deployed app's
  name; adjust the blueprints after the app is created if Make assigns a different
  slug.
