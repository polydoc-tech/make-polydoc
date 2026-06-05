// Assemble the PolyDoc request body from a module's parameters. Mirrors the n8n
// connector's buildRequestBody so every PolyDoc connector sends identical
// payloads. `operation` is one of 'pdf' | 'screenshot' | 'einvoice'. Pure and
// side-effect free. Relies on the mergeDeep custom function for the Advanced
// (JSON) deep-merge.
function buildPolydocBody(operation, p) {
    p = p || {};

    function isPlainObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    function isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    }

    // Accept either a parsed object or a JSON string; empty / invalid -> undefined.
    function toObject(value) {
        if (value === undefined || value === null || value === '') return undefined;
        if (typeof value === 'object') return value;
        if (typeof value === 'string') {
            try {
                var parsed = JSON.parse(value);
                return (typeof parsed === 'object' && parsed !== null) ? parsed : undefined;
            } catch (e) {
                return undefined;
            }
        }
        return undefined;
    }

    function resolveSource() {
        switch (p.sourceType) {
            case 'url': return p.url || '';
            case 'html': return p.html || '';
            case 'template': return '[template:' + (p.templateId || '') + ']';
            default: return '';
        }
    }

    function buildLayout() {
        var layout = {};
        if (typeof p.format === 'string' && p.format !== '') layout.format = p.format;
        var flags = ['landscape', 'printBackground', 'outline', 'tagged'];
        for (var i = 0; i < flags.length; i++) {
            if (typeof p[flags[i]] === 'boolean') layout[flags[i]] = p[flags[i]];
        }
        if (isNumber(p.scale)) layout.scale = p.scale;
        if (typeof p.pageRanges === 'string' && p.pageRanges !== '') layout.pageRanges = p.pageRanges;

        var margins = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
        var hasMargin = false;
        for (var j = 0; j < margins.length; j++) {
            if (p[margins[j]] !== undefined && p[margins[j]] !== '') hasMargin = true;
        }
        if (hasMargin) {
            layout.margin = {
                top: (p.marginTop === undefined || p.marginTop === null) ? '0' : p.marginTop,
                right: (p.marginRight === undefined || p.marginRight === null) ? '0' : p.marginRight,
                bottom: (p.marginBottom === undefined || p.marginBottom === null) ? '0' : p.marginBottom,
                left: (p.marginLeft === undefined || p.marginLeft === null) ? '0' : p.marginLeft
            };
        }
        return Object.keys(layout).length > 0 ? layout : undefined;
    }

    function buildScreenshot() {
        var shot = {};
        if (typeof p.imageType === 'string' && p.imageType !== '') shot.type = p.imageType;
        if (typeof p.fullPage === 'boolean') shot.fullPage = p.fullPage;
        if (isNumber(p.quality)) shot.quality = p.quality;
        if (isNumber(p.viewportWidth) && isNumber(p.viewportHeight)) {
            var viewport = { width: p.viewportWidth, height: p.viewportHeight };
            if (isNumber(p.devicePixelRatio) && p.devicePixelRatio > 0) {
                viewport.devicePixelRatio = p.devicePixelRatio;
            }
            shot.viewport = viewport;
        }
        return Object.keys(shot).length > 0 ? shot : undefined;
    }

    var body = { source: resolveSource() };

    var templateData = toObject(p.templateData);
    if (templateData && Object.keys(templateData).length > 0) body.templateData = templateData;
    if (p.filename) body.filename = p.filename;
    if (p.tag) body.tag = p.tag;
    if (isNumber(p.timeout) && p.timeout > 0) body.timeout = p.timeout;

    if (operation === 'pdf') {
        var layout = buildLayout();
        if (layout) body.layout = layout;
    } else if (operation === 'screenshot') {
        var shot = buildScreenshot();
        if (shot) body.screenshot = shot;
    } else if (operation === 'einvoice') {
        var eInvoice = {
            standard: p.eInvoiceStandard,
            profile: p.eInvoiceProfile,
            invoice: toObject(p.invoice) || {}
        };
        if (typeof p.eInvoiceVerify === 'boolean') eInvoice.verify = p.eInvoiceVerify;
        body.eInvoice = eInvoice;
    }

    var delivery = p.delivery || 'download';
    if (delivery === 'cloudStorage' && p.presignedUrl) {
        body.cloudStorage = { presignedUrl: p.presignedUrl };
    }
    if (delivery === 'webhook' && p.webhookUrl) {
        var webhook = { url: p.webhookUrl };
        var extra = toObject(p.webhookOptions);
        if (extra) {
            for (var k in extra) {
                if (Object.prototype.hasOwnProperty.call(extra, k)) webhook[k] = extra[k];
            }
        }
        body.webhook = webhook;
    }

    var advanced = toObject(p.advanced);
    if (advanced && Object.keys(advanced).length > 0) {
        return mergeDeep(body, advanced);
    }
    return body;
}
