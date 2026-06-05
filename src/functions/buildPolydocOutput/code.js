// Shape a module's output bundle. For the Download delivery mode the gateway
// returns the file bytes (the module's response.type is binary), so expose the
// buffer with a filename and content type. For Cloud Storage and Webhook the
// gateway returns JSON, which is passed through unchanged. Keeping this branch
// in a tested function avoids fragile inline IML in every module.
function buildPolydocOutput(operation, delivery, body, fileName, imageType) {
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
