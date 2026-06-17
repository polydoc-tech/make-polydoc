function buildPolydocOutput(operation, delivery, body, fileName, imageType) {
    // Download mode returns file bytes (module response.type is binary), so wrap
    // them with a filename and content type; cloud-storage and webhook modes get
    // the gateway's JSON passed through unchanged.
    if (delivery !== 'download') {
        return body;
    }

    var contentType;
    if (operation === 'screenshot') {
        contentType = 'image/' + (imageType || 'png');
    } else {
        contentType = 'application/pdf';
    }

    var name = fileName;
    if (!name) {
        if (operation === 'screenshot') {
            var ext = (imageType === 'jpeg') ? 'jpg' : (imageType || 'png');
            name = 'screenshot.' + ext;
        } else if (operation === 'einvoice') {
            name = 'invoice.pdf';
        } else {
            name = 'document.pdf';
        }
    }

    return {
        fileName: name,
        contentType: contentType,
        data: body
    };
}
