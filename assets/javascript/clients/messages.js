
function createDraft() {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: '/api/email/create-draft',
            method: 'PUT',
        }).done(function (data) {
            resolve(data.data);
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR.responseJSON);
            });
    });
}

function updateDraft(messageId, data) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: '/api/email/update-draft?message_id=' + messageId,
            method: 'POST',
            data: JSON.stringify(data),
            processData: false,
            dataType: 'json',
            contentType: 'application/json; charset=utf-8'
        }).done(function (data) {
            resolve(data.data);
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR.responseJSON);
            });
    });
}

function getDraft(messageId) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: '/api/email/get-draft?message_id=' + messageId,
        }).done(function (data) {
            resolve(data.data);
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR.responseJSON);
            });
    });
}

function listMessages(is_sent) {

    var url = '/api/email/list-messages';
    if (is_sent !== undefined) {
        url = url + '?is_sent=' + is_sent;
    }

    return new Promise(function (resolve, reject) {
        $.ajax({
            url: url
        }).done(function (data) {
            resolve(data.data);
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR.responseJSON);
            });
    });
}

function addAttachment(messageId, file, progressListener) {
    return new Promise(function (resolve, reject) {
        var formData = new FormData();
        formData.append(file.name, file);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/email/add-attachment?message_id=' + messageId, true);
        xhr.onload = function (e) {
            resolve(JSON.parse(e.target.response).data);
        };
        xhr.onerror = function (e) {
            reject(e);
        };
        // Listen to the upload progress.
        xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
                var value = (e.loaded / e.total) * 100;
                progressListener(value);
            }
        };
        xhr.send(formData);
    });
}

function removeAttachment(messageId, attachmentId) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: '/api/email/remove-attachment?message_id=' + messageId + '&attachment_id=' + attachmentId,
            method: 'POST'
        }).done(function (data) {
            resolve(data.data);
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR.responseJSON);
            });
    });
}

function sendMail(messageId) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: '/api/email/send-message?message_id=' + messageId,
            method: 'POST'
        }).done(function (data) {
            resolve(data.data);
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR.responseJSON);
            });
    });
}

function listMessageErrors(messageId) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: '/api/email/list-message-errors?message_id=' + messageId
        }).done(function (data) {
            resolve(data.data);
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR.responseJSON);
            });
    });
}

function messsagesCount(is_sent) {

    var url = '/api/user-messages-count';

    if (is_sent !== undefined) {
        url = url + '?is_sent=' + is_sent;
    }

    return new Promise(function (resolve, reject) {
        $.ajax({
            url: url
        }).done(function (data) {
            resolve(data.data);
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR.responseJSON);
            });
    });
}


function getUserActivityTrend() {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: '/api/get-user-activity-trend'
        }).done(function (data) {
            resolve(data.data);
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR.responseJSON);
            });
    });
}
