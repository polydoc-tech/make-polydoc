import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Load the IML custom function sources (bare `function name(){}` declarations)
// into one shared scope, exactly as Make evaluates them, so buildPolydocBody
// can call mergeDeep. This tests the real deployed code, not a copy.
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'functions');
const sources = ['mergeDeep', 'buildPolydocBody', 'buildPolydocOutput']
    .map((name) => readFileSync(join(root, name, 'code.js'), 'utf8'))
    .join('\n');

// eslint-disable-next-line no-new-func
const { mergeDeep, buildPolydocBody, buildPolydocOutput } = new Function(
    sources + '\nreturn { mergeDeep, buildPolydocBody, buildPolydocOutput };'
)();

test('mergeDeep merges nested objects without losing sibling keys', () => {
    assert.deepEqual(mergeDeep({ a: { x: 1 }, b: 2 }, { a: { y: 2 } }), { a: { x: 1, y: 2 }, b: 2 });
});

test('mergeDeep overwrites scalars and arrays', () => {
    assert.deepEqual(mergeDeep({ a: 1, list: [1, 2] }, { a: 9, list: [3] }), { a: 9, list: [3] });
});

test('mergeDeep does not mutate the target', () => {
    const target = { a: { x: 1 } };
    mergeDeep(target, { a: { y: 2 } });
    assert.deepEqual(target, { a: { x: 1 } });
});

test('mergeDeep ignores prototype-pollution keys in the source', () => {
    const malicious = JSON.parse(
        '{"__proto__":{"polluted":"yes"},"constructor":{"polluted":"yes"},"safe":"kept"}',
    );
    const merged = mergeDeep({ existing: 1 }, malicious);
    assert.equal(merged.safe, 'kept');
    assert.equal(merged.existing, 1);
    assert.equal(Object.getPrototypeOf(merged), Object.prototype);
    assert.equal(merged.polluted, undefined);
    assert.equal(({}).polluted, undefined);
});

test('PDF from URL produces just the source', () => {
    assert.deepEqual(
        buildPolydocBody('pdf', { sourceType: 'url', url: 'https://example.com', delivery: 'download' }),
        { source: 'https://example.com' }
    );
});

test('inline HTML passes through as source', () => {
    assert.equal(buildPolydocBody('pdf', { sourceType: 'html', html: '<h1>Hi</h1>' }).source, '<h1>Hi</h1>');
});

test('template id is wrapped and carries templateData', () => {
    const b = buildPolydocBody('pdf', {
        sourceType: 'template',
        templateId: 'jlE-whg',
        templateData: { invoice_number: 'INV-1' },
    });
    assert.equal(b.source, '[template:jlE-whg]');
    assert.deepEqual(b.templateData, { invoice_number: 'INV-1' });
});

test('empty templateData is omitted', () => {
    const b = buildPolydocBody('pdf', { sourceType: 'template', templateId: 'x', templateData: {} });
    assert.equal(b.templateData, undefined);
});

test('PDF options map into a layout, unset margins default to 0', () => {
    const b = buildPolydocBody('pdf', {
        sourceType: 'url',
        url: 'https://example.com',
        format: 'A4',
        landscape: true,
        marginTop: '10mm',
    });
    assert.deepEqual(b.layout, {
        format: 'A4',
        landscape: true,
        margin: { top: '10mm', right: '0', bottom: '0', left: '0' },
    });
});

test('no layout when no PDF options are set', () => {
    assert.equal(buildPolydocBody('pdf', { sourceType: 'url', url: 'https://example.com' }).layout, undefined);
});

test('screenshot viewport is nested', () => {
    const b = buildPolydocBody('screenshot', {
        sourceType: 'url',
        url: 'https://example.com',
        imageType: 'jpeg',
        fullPage: true,
        viewportWidth: 1024,
        viewportHeight: 768,
        devicePixelRatio: 2,
    });
    assert.deepEqual(b.screenshot, {
        type: 'jpeg',
        fullPage: true,
        viewport: { width: 1024, height: 768, devicePixelRatio: 2 },
    });
});

test('viewport needs both width and height', () => {
    const b = buildPolydocBody('screenshot', {
        sourceType: 'url',
        url: 'https://example.com',
        imageType: 'png',
        viewportWidth: 1024,
    });
    assert.equal(b.screenshot.viewport, undefined);
    assert.equal(b.screenshot.type, 'png');
});

test('eInvoice payload is nested with verify', () => {
    const b = buildPolydocBody('einvoice', {
        sourceType: 'html',
        html: '<h1>Invoice</h1>',
        eInvoiceStandard: 'zugferd',
        eInvoiceProfile: 'en16931',
        eInvoiceVerify: true,
        invoice: { number: 'INV-1' },
    });
    assert.deepEqual(b.eInvoice, {
        standard: 'zugferd',
        profile: 'en16931',
        invoice: { number: 'INV-1' },
        verify: true,
    });
});

test('cloud delivery sets cloudStorage', () => {
    const b = buildPolydocBody('pdf', {
        sourceType: 'url',
        url: 'https://example.com',
        delivery: 'cloudStorage',
        presignedUrl: 'https://put.example/abc',
    });
    assert.deepEqual(b.cloudStorage, { presignedUrl: 'https://put.example/abc' });
});

test('webhook delivery merges url with options', () => {
    const b = buildPolydocBody('pdf', {
        sourceType: 'url',
        url: 'https://example.com',
        delivery: 'webhook',
        webhookUrl: 'https://hook',
        webhookOptions: { async: true, retries: 3 },
    });
    assert.deepEqual(b.webhook, { url: 'https://hook', async: true, retries: 3 });
});

test('Advanced (JSON) deep-merges into the body, advanced wins', () => {
    const b = buildPolydocBody('pdf', {
        sourceType: 'url',
        url: 'https://example.com',
        format: 'A4',
        advanced: { pdf: { pdfa: { level: '3b' } }, layout: { landscape: true } },
    });
    assert.deepEqual(b.pdf.pdfa, { level: '3b' });
    assert.deepEqual(b.layout, { format: 'A4', landscape: true });
});

test('filename, tag and positive timeout are included; zero timeout is dropped', () => {
    const b = buildPolydocBody('pdf', {
        sourceType: 'url',
        url: 'https://example.com',
        filename: 'out.pdf',
        tag: 'run1',
        timeout: 60000,
    });
    assert.equal(b.filename, 'out.pdf');
    assert.equal(b.tag, 'run1');
    assert.equal(b.timeout, 60000);
    const z = buildPolydocBody('pdf', { sourceType: 'url', url: 'https://example.com', timeout: 0 });
    assert.equal(z.timeout, undefined);
});

test('JSON string inputs are parsed (advanced as a string)', () => {
    const b = buildPolydocBody('pdf', {
        sourceType: 'url',
        url: 'https://example.com',
        advanced: '{"render":{"blockAds":true}}',
    });
    assert.deepEqual(b.render, { blockAds: true });
});

test('buildPolydocOutput wraps a downloaded file with defaults', () => {
    assert.deepEqual(buildPolydocOutput('pdf', 'download', 'BYTES', '', null), {
        fileName: 'document.pdf',
        contentType: 'application/pdf',
        data: 'BYTES',
    });
});

test('buildPolydocOutput derives screenshot type and extension', () => {
    assert.deepEqual(buildPolydocOutput('screenshot', 'download', 'BYTES', '', 'jpeg'), {
        fileName: 'screenshot.jpg',
        contentType: 'image/jpeg',
        data: 'BYTES',
    });
});

test('buildPolydocOutput passes JSON through for non-download delivery', () => {
    const json = { conversionId: 'abc' };
    assert.deepEqual(buildPolydocOutput('pdf', 'cloudStorage', json, '', null), json);
    assert.deepEqual(buildPolydocOutput('einvoice', 'webhook', json, '', null), json);
});
