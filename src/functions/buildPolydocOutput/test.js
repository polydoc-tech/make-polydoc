it('wraps a downloaded PDF with a default filename and content type', () => {
    assert.deepEqual(
        buildPolydocOutput('pdf', 'download', 'BYTES', '', null),
        { fileName: 'document.pdf', contentType: 'application/pdf', data: 'BYTES' }
    );
});

it('keeps the supplied filename', () => {
    var o = buildPolydocOutput('pdf', 'download', 'BYTES', 'report.pdf', null);
    assert.equal(o.fileName, 'report.pdf');
});

it('derives the screenshot content type and extension from the image type', () => {
    assert.deepEqual(
        buildPolydocOutput('screenshot', 'download', 'BYTES', '', 'jpeg'),
        { fileName: 'screenshot.jpg', contentType: 'image/jpeg', data: 'BYTES' }
    );
});

it('names downloaded e-invoices invoice.pdf by default', () => {
    var o = buildPolydocOutput('einvoice', 'download', 'BYTES', '', null);
    assert.equal(o.fileName, 'invoice.pdf');
    assert.equal(o.contentType, 'application/pdf');
});

it('passes JSON through unchanged for cloud storage and webhook delivery', () => {
    var json = { conversionId: 'abc', uploaded: true };
    assert.deepEqual(buildPolydocOutput('pdf', 'cloudStorage', json, '', null), json);
    assert.deepEqual(buildPolydocOutput('pdf', 'webhook', json, '', null), json);
});
