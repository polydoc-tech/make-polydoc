# PolyDoc for Make

A custom [Make](https://www.make.com) app for [PolyDoc](https://polydoc.tech), the
REST API that converts HTML or URLs to **PDF**, captures **screenshots**, and
generates EU-compliant **e-invoices** (Factur-X / ZUGFeRD hybrid PDF/A-3).

One app, three modules:

- **Convert to PDF** - layout, margins, page format, page ranges, bookmarks, accessible/tagged PDFs.
- **Capture Screenshot** - PNG / JPEG / WebP, full page, viewport and device-pixel-ratio control.
- **Create E-Invoice** - Factur-X or ZUGFeRD, profiles from `minimum` to `extended`.

Content can come from a **URL**, an inline **HTML** string, or a saved **template**
(with Liquid template data). The result is returned as a file by default, or uploaded
to your **cloud storage** (presigned URL) or delivered to a **webhook**.

## Connection

Create a **PolyDoc** connection with an API key from
[dashboard.polydoc.tech](https://dashboard.polydoc.tech) (API Keys). The key is sent
as `Authorization: Bearer <key>`. One more field:

- **Sandbox** - run conversions in sandbox mode (higher quota, watermarked output). Adds `X-Sandbox: true`.

When you create the connection, Make runs a verification request (a tiny sandbox
screenshot) so an invalid key is caught immediately.

## Anything not in the UI?

Every module has an **Advanced (JSON)** field that is deep-merged into the request
body, so any API capability not surfaced as a control (for example `pdf.watermark`,
`pdf.pdfa`, `pdf.encryption`, `render.*`, `request.*`) is still reachable. See the full
request schema at [docs.polydoc.tech](https://docs.polydoc.tech).

## Example scenarios

Importable blueprints under [`blueprints/`](./blueprints), one per use case:

| Blueprint | Module | Use case |
|---|---|---|
| `pdf-from-template.blueprint.json` | Convert to PDF | Record data to a branded PDF via a saved template |
| `url-screenshot.blueprint.json` | Capture Screenshot | Screenshot any URL on a schedule |
| `einvoice.blueprint.json` | Create E-Invoice | Invoice data to a ZUGFeRD / Factur-X PDF |

In Make: **Create a new scenario -> ... menu -> Import Blueprint**. The app must be
installed first, and the app name in the blueprint (`polydoc:`) must match your
deployed app name.

## Development

This is the Make Apps SDK local-development format: `makecomapp.json` plus `.iml.json`
component files under `src/`. The request-body assembly is ported from the n8n
reference connector (`../../n8n-nodes-polydoc`) into custom IML functions so every
PolyDoc connector sends identical payloads.

```bash
npm test     # unit tests for the IML functions (mergeDeep, buildPolydocBody, buildPolydocOutput)
npm run smoke   # live sandbox smoke test against the real API (needs an API key)
```

The smoke test reads the key from `POLYDOC_API_KEY`, else `/tmp/polydoc-api-token.txt`,
and always uses sandbox mode.

Deploying to a Make organization and submitting to the marketplace are covered in
[`ROADMAP.md`](./ROADMAP.md).

## License

MIT
