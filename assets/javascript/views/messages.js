
/**
 * 
 * @param {JQuery} container 
 * @param {String} viewId 
 * @param {String} context 
 */
function __load_messages_context(container, context) {

    var parameter;

    switch (context) {
        case 'draft': parameter = false; break;
        case 'sent': parameter = true; break;
    }

    listMessages(parameter).then(function (data) {

        if (!data.length) {
            container.find('.header > .title')
                .text('No messages yet');
        } else {
            __upgrade_messages_view(data, context);
            container.find('> table').show();
        }

        triggerViewLoadEndNow();
    });
}

/**
 * 
 * @param {Array<Object>} messages The array of message object to use in updating this view
 * @param {String} context The view context to which the messages should be added
 */
function __upgrade_messages_view(messages, context) {

    var viewSelector = getViewSelector('messages', context);

    var table = $(viewSelector + ' table');
    var title = $(viewSelector + ' .header .title');
    var tbody = table.find('> tbody');

    var isEmpty = table.css('display') === 'none';

    if (isEmpty && Object.keys(messages).length) {

        var viewTitle;

        switch (context) {
            case 'draft': viewTitle = 'Drafts'; break;
            case 'sent': viewTitle = 'Sent Messages'; break;
            default: viewTitle = 'All Messages';
        }

        title.text(viewTitle);
        table.show();
    }

    addRows(messages);

    function addRows(messages) {

        for (var i in messages) {

            var message = formatObject(messages[i]);

            var id = message.id;

            var row;
            var isCreate;

            if (tbody.find('.message-' + id).length) {
                row = tbody.find('.message-' + id);
                isCreate = false;
            } else {
                row = $('<tr></tr>', { 'class': 'message-' + id });
                isCreate = true;
            }


            var subject = message.subject ? message.subject : '<i> No Subject </i>';
            var body_preview = message.body_preview;
            var is_sent = message.is_sent ? '<i class="material-icons" style="color: green;">done</i>' : 'No';

            var updated_at = getFormattedDate(message.updated_at);

            if (isCreate) {

                row.append('<td class="mdl-data-table__cell--non-numeric">' + subject + '</td>');
                row.append('<td>' + body_preview + '</td>');
                row.append('<td>' + is_sent + '</td>');
                row.append('<td>' + getFormattedDate(message.created_at) + '</td>');
                row.append('<td>' + updated_at + '</td>');

                tbody.append(row);

            } else {
                row.find(':nth-child(1)').html(subject);
                row.find(':nth-child(2)').html(body_preview);
                row.find(':nth-child(3)').html(is_sent);
                row.find(':nth-child(5)').html(updated_at);
                row.onclick = function(){};
            }

            if (!message.is_sent) {
                row.attr('onclick', 'render(\'compose\', ' + id + ');');
            }
        }
    }
}

/**
 * 
 * @param {Array<Number>} messages The array of message ids to remove from this context
 * @param {String} context The view context from which the messages should be removed
 */
function __downgrade_messages_view(messages, context) {

    if (!messages instanceof Array) {
        var err = 'An array of message ids is required to update messages/' + context;
        alert(err);
        throw new Error(err);
    }

    var table = $(getViewSelector('messages', context) + ' table');
    var title = table.find('.header .title');
    var tbody = table.find('> tbody');

    for (var i in messages) {
        var id = messages[i];
        var row = tbody.find('.message-' + id);
        row.remove();
    }
 
    if (tbody.children().length == 0) {
        title.text('No message yet');
        table.hide();
    }

}
