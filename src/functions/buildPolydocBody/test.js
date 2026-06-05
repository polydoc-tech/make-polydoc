it('PDF from URL produces just the source', () => {
    assert.deepEqual(
        buildPolydocBody('pdf', { sourceType: 'url', url: 'https://example.com', delivery: 'download' }),
        { source: 'https://example.com' }
    );
});

it('passes inline HTML through as source', () => {
    var b = buildPolydocBody('pdf', { sourceType: 'html', html: '<h1>Hi</h1>' });
    assert.equal(b.source, '<h1>Hi</h1>');
});

it('wraps a template id and carries templateData', () => {
    var b = buildPolydocBody('pdf', { sourceType: 'template', templateId: 'jlE-whg', templateData: { invoice_number: 'INV-1' } });
    assert.equal(b.source, '[template:jlE-whg]');
    assert.deepEqual(b.templateData, { invoice_number: 'INV-1' });
});

it('omits empty templateData', () => {
    var b = buildPolydocBody('pdf', { sourceType: 'template', templateId: 'x', templateData: {} });
    assert.equal(b.templateData, undefined);
});

it('maps PDF options into a layout object, defaulting unset margins to 0', () => {
    var b = buildPolydocBody('pdf', { sourceType: 'url', url: 'https://example.com', format: 'A4', landscape: true, marginTop: '10mm' });
    assert.deepEqual(b.layout, { format: 'A4', landscape: true, margin: { top: '10mm', right: '0', bottom: '0', left: '0' } });
});

it('attaches no layout when no PDF options are set', () => {
    var b = buildPolydocBody('pdf', { sourceType: 'url', url: 'https://example.com' });
    assert.equal(b.layout, undefined);
});

it('nests the screenshot viewport', () => {
    var b = buildPolydocBody('screenshot', { sourceType: 'url', url: 'https://example.com', imageType: 'jpeg', fullPage: true, viewportWidth: 1024, viewportHeight: 768, devicePixelRatio: 2 });
    assert.deepEqual(b.screenshot, { type: 'jpeg', fullPage: true, viewport: { width: 1024, height: 768, devicePixelRatio: 2 } });
});

it('nests the eInvoice payload', () => {
    var b = buildPolydocBody('einvoice', { sourceType: 'html', html: '<h1>Invoice</h1>', eInvoiceStandard: 'zugferd', eInvoiceProfile: 'en16931', eInvoiceVerify: true, invoice: { number: 'INV-1' } });
    assert.deepEqual(b.eInvoice, { standard: 'zugferd', profile: 'en16931', invoice: { number: 'INV-1' }, verify: true });
});

it('sets cloudStorage for cloud delivery', () => {
    var b = buildPolydocBody('pdf', { sourceType: 'url', url: 'https://example.com', delivery: 'cloudStorage', presignedUrl: 'https://put.example/abc' });
    assert.deepEqual(b.cloudStorage, { presignedUrl: 'https://put.example/abc' });
});

it('sets the webhook object for webhook delivery', () => {
    var b = buildPolydocBody('pdf', { sourceType: 'url', url: 'https://example.com', delivery: 'webhook', webhookUrl: 'https://hook', webhookOptions: { async: true } });
    assert.deepEqual(b.webhook, { url: 'https://hook', async: true });
});

it('deep-merges Advanced (JSON) into the body, advanced wins', () => {
    var b = buildPolydocBody('pdf', { sourceType: 'url', url: 'https://example.com', format: 'A4', advanced: { pdf: { pdfa: { level: '3b' } }, layout: { landscape: true } } });
    assert.deepEqual(b.pdf.pdfa, { level: '3b' });
    assert.deepEqual(b.layout, { format: 'A4', landscape: true });
});

it('includes filename, tag and positive timeout', () => {
    var b = buildPolydocBody('pdf', { sourceType: 'url', url: 'https://example.com', filename: 'out.pdf', tag: 'run1', timeout: 60000 });
    assert.equal(b.filename, 'out.pdf');
    assert.equal(b.tag, 'run1');
    assert.equal(b.timeout, 60000);
});

it('parses JSON strings for templateData, invoice and advanced', () => {
    var b = buildPolydocBody('pdf', { sourceType: 'url', url: 'https://example.com', advanced: '{"render":{"blockAds":true}}' });
    assert.deepEqual(b.render, { blockAds: true });
});
