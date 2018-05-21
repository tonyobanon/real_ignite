
//In seconds
var DRAFT_SYNCHRONIZATION_INTERVAL = 45;

//In  bytes
var MAX_ATTACHMENT_FILE_SIZE = 2048000;

var ENABLE_DRAFT_SYNCHRONIZE_HOOK = true;

function fetchDraftData(context) {

  return new Promise(function (resolve, reject) {

    if (context == rendererNamespace.defaultViewContext) {

      // Create new draft
      createDraft().then(function (data) {

        //Before resolving, update the views for other relevant 'messages' contexts
        __upgrade_messages_view([data], rendererNamespace.defaultViewContext); // All Messages
        __upgrade_messages_view([data], 'draft'); // Drafts

        __increment_created_messages_stat();
        
        resolve(data);
      });

    } else if (context) {

      getDraft(context).then(function (data) {
        resolve(data);
      });
    }

  });
}

function __sendMail() {

  var ctx = getCurrentContextIdentifier();

  synchronizeDraft(ctx.context, false).then(function (draftData) {

    notifyUser('Sending message ..', 1000);

    // Temporarily disable the draft synchronization hook
    ENABLE_DRAFT_SYNCHRONIZE_HOOK = false;

    sendMail(ctx.context).then(function (data) {

      notifyUser('Message sent successfully ..', 2500);

      // Update messages views to reflect changes
      draftData.is_sent = true;
      __upgrade_messages_view([draftData], rendererNamespace.defaultViewContext); // All Messages
      __upgrade_messages_view([draftData], 'sent'); // Sent Messages
      __downgrade_messages_view([draftData.id], 'draft'); // Drafts

      __increment_sent_messages_stat();

      $(window).one('view-transition-done', function () {

        // Destroy view context once the view is on screen
        destroyViewContext('compose', ctx.context);

        // Re-enable the draft synchronization hook
        ENABLE_DRAFT_SYNCHRONIZE_HOOK = true;
      });

      render('messages', rendererNamespace.defaultViewContext, {
        // Don't attempt to synchronize draft once this view context leaves screen
        // See __hide_compose_context(..)
        call_hide_function: false
      });

    }).catch(function (data) {
      notifyUser(data.message + ' ..');
    });
  });
}

/**
 * This is called in the following scenarios
 * 
 * 1. Through a hook that is added when the 'compose' view is first loaded by any context.
 * 
 * 2. Through __hide_compose_context(..) which is called when any 'draft' context is transitioned out
 *    of the screen.
 * 
 * 3. When __sendMail() is called, i.e when the user clicks send in a 'compose' context
 * 
 * @param context 
 */
function synchronizeDraft(context, notify) {

  var data = getDraftDataFromView(context);

  data.updated_at = new Date().toISOString();

  if (notify === undefined || notify) {
      notifyUser('Saving Draft Message ..');
  }

  return updateDraft(context, data).then(function () {

    //update the views for other relevant 'messages' contexts
    __upgrade_messages_view([data], rendererNamespace.defaultViewContext); // All Messages
    __upgrade_messages_view([data], 'draft'); // Drafts

    return data;
  });
}

function addDraftSynchronizationHook() {

  setInterval(function () {

    if (!ENABLE_DRAFT_SYNCHRONIZE_HOOK) {
      return;
    }

    // check if current context is a 'draft' view
    var ctx = getCurrentContextIdentifier();
    if (ctx.viewId !== 'compose') {
      return;
    }

    synchronizeDraft(ctx.context);
  }, DRAFT_SYNCHRONIZATION_INTERVAL * 1000);

}

/**
 * This is called the first a draft view is displayed
 */
function __load_compose_view() {
  // Add hook to occassionally synchronize draft with server
  addDraftSynchronizationHook();
}

/**
 * This is called each time any context is displayed on the screen
 */
function __show_compose_context(container, context) {
}

function __hide_compose_context(context) {
  // A context is about to be swapped with another
  // We need to synchronize draft with server so that no changes are lost
  // as our synchronize hook will not 
  synchronizeDraft(context);
}

function __load_compose_context(container, context) {

  var viewId = 'compose';

  fetchDraftData(context).then(function (data) {
    //if(context != data.id) {
    //}
    container = refreshViewContext(viewId, context, data.id);
    context = data.id;

    loadContext(data);
  });

  function loadContext(data) {

    function loadEditor() {

      var viewSelector = getViewSelector('compose', context);

      // Load Quill editor
      var editorSelector = viewSelector + ' .editor-container';
      var toolbarSelector = viewSelector + ' .toolbar-container';

      var quill = new Quill(editorSelector, {
        modules: {
          formula: true,
          syntax: true,
          toolbar: toolbarSelector
        },
        placeholder: 'Compose New Mail...',
        theme: 'snow'
      });

    }

    // Load the Quill WYSIWYG Editor
    try {
      loadEditor(); //Todo: remove try block
    } catch (e) { }

    // Then, Load data into view
    loadDraftDataIntoView(data, context);

    // Tell the renderer that our view is loaded and can come into the screen now
    triggerViewLoadEndNow();
  }
}

/**
 * This loads the specified draft data into the specified 'compose' context
 */
function loadDraftDataIntoView(data, context) {

  data = formatObject(data);

  var viewSelector = getViewSelector('compose', context);

  //  Add subject
  $(viewSelector + ' .email-parameters .subject input').val(data.subject);

  // Add body
  $(viewSelector + ' .editor-container .ql-editor').html(data.body);

  // Add CC Addresses
  for (var i in data.cc_addresses) {
    __add_address(viewSelector, 'cc-address', data.cc_addresses[i]);
  }

  // Add BCC Addresses
  for (var i in data.bcc_addresses) {
    __add_address(viewSelector, 'bcc-address', data.bcc_addresses[i]);
  }

  // Add attachments
  var filesContainer = $(viewSelector + ' .attachment.area .files');
  for (var i in data.attachments) {
    var attachment = data.attachments[i];
    var contents = '<div data-attachment-id="' + attachment.id + '"><span class="name"> ' + attachment.name
      + ' </span> <a class="remove">Remove</a></div>';
    filesContainer.append(contents);
  }

  // Listen for when cc and bcc address(es) are entered
  var addressesInputSelectors = [
    viewSelector + ' .email-parameters .cc-address input',
    viewSelector + ' .email-parameters .bcc-address input'
  ];
  $(addressesInputSelectors.join(',')).on('keypress', function (e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code === 13) {
      var elem = $(this);
      var addressType = elem.hasClass('bcc-address') ? 'bcc-address' : 'cc-address';
      __add_address(viewSelector, addressType, elem.val());
      //Clear input
      elem.val('');
    }
  });

  //Listen for when address chips are deleted
  $(document).on('click', viewSelector + ' .mdl-chip__action', function (e) {
    $(this).parent().remove();
  });

  // Listen for when attachments are added
  $(viewSelector + ' .email-attachments-input').change(function () {
    __add_attachment($(this)[0].files[0]);
  });
  $(viewSelector + ' .email-attachments-button').on('click', function () {
    $(viewSelector + ' .email-attachments-input').trigger('click');
  });

  // Listen for when attachments are deleted
  $(document).on('click', viewSelector + ' .attachment.area .files .remove', function () {
    var parent = $(this).parent();
    var attachment_id = parent.attr('data-attachment-id');
    var ctx = getCurrentContextIdentifier();
    var messageId = ctx.context;
    removeAttachment(messageId, attachment_id).then(function (data) {
      parent.remove();
    });
  });

  //Listen for when the send button is clicked
  $(viewSelector + ' .footer.area .send-email-button').on('click', function () {
    __sendMail();
  });
}

/**
 * This gets the draft data in the specified 'compose' context
 * @param context 
 */
function getDraftDataFromView(context) {

  var viewSelector = getViewSelector('compose', context);

  //  Get subject
  var subject = $(viewSelector + ' .email-parameters .subject input').val() || '';

  // Get body
  var bodyContainer = $(viewSelector + ' .editor-container .ql-editor');
  var body = bodyContainer.html();

  // Generate Body Preview
  var bodyPreview = trimText(getDraftPreview(bodyContainer[0]).replace(/\s/g, ' '), 65);

  // Add CC Addresses
  var ccAddressChips = $(viewSelector + ' .email-parameters .cc-address .mdl-chip');
  var ccAddressInput = $(viewSelector + ' .email-parameters .cc-address input').val();
  var cc_addresses = [];
  for (var i = 0; i < ccAddressChips.length; i++) {
    cc_addresses.push(ccAddressChips[i].getAttribute('data-email'));
  }
  if (cc_addresses.indexOf(ccAddressInput) == -1 && __validateEmail(ccAddressInput)) {
    cc_addresses.push(ccAddressInput);
  }

  // Add BCC Addresses
  var bccAddressChips = $(viewSelector + ' .email-parameters .bcc-address .mdl-chip');
  var bccAddressInput = $(viewSelector + ' .email-parameters .bcc-address input').val();
  var bcc_addresses = [];
  for (var i = 0; i < bccAddressChips.length; i++) {
    bcc_addresses.push(bccAddressChips[i].getAttribute('data-email'));
  }
  if (bcc_addresses.indexOf(bccAddressInput) == -1 && __validateEmail(bccAddressInput)) {
    bcc_addresses.push(bccAddressInput);
  }

  var draftData = {
    id: context,
    subject: subject,
    body: body,
    body_preview: bodyPreview,
    cc_addresses: cc_addresses,
    bcc_addresses: bcc_addresses
  };

  return draftData;
}

function __add_address(viewSelector, addressType, email) {

  if (!__validateEmail(email)) {
    return alert('Please enter a valid email address');
  }

  var headerContainer = $(viewSelector + ' .email-parameters .' + addressType + ' .header');

  var titleContainer = headerContainer.find('.title');

  // Check if address has been added previously
  if (headerContainer.find('.mdl-chip[data-email*=\'' + email + '\']').length) {
    return alert('Email address already exists');
  }

  var isFirstEmail = headerContainer.children().length == 1;

  // Add chip
  var chip = $('<span data-address-type=\'' + addressType + '\' data-email=\'' + email + '\' class=\'mdl-chip mdl-chip--deletable\'><span class=\'mdl-chip__text\'>' + email + '</span><button type=\'button\' class=\'mdl-chip__action\'><i class=\'material-icons\'>cancel</i></button></span>');
  headerContainer.append(chip);

  if (addressType == 'cc-address' && isFirstEmail) {
    // Update title from recipient to CC Addresses
    titleContainer.text('CC Addresses');
  }

}

function __add_attachment(file) {

  var ctx = getCurrentContextIdentifier();

  var viewSelector = getViewSelector(ctx.viewId, ctx.context);

  if (file.size > MAX_ATTACHMENT_FILE_SIZE) {
    return alert('The maximum file size for attachments is: ' + Math.floor(MAX_ATTACHMENT_FILE_SIZE / 1000000) + ' MB');
  }

  var messageId = ctx.context;

  var progressBar = $(viewSelector + ' .attachment.area .mdl-js-progress');
  progressBar.css('display', 'block');

  addAttachment(messageId, file, function (v) {
    v = Math.floor(v);

    progressBar[0].MaterialProgress.setProgress(v);

    if (v == 100) {
      progressBar.css('display', 'none');
      progressBar[0].MaterialProgress.setProgress(0);
    }
  }).then(function (data) {

    var id = data.id;

    var filesContainer = $(viewSelector + ' .attachment.area .files');

    var contents = '<div data-attachment-id="' + id + '"><span class="name"> ' + file.name
      + ' </span> <a class="remove">Remove</a></div>';

    filesContainer.append(contents);
  });

}

function getDraftPreview(container) {

  if (!container || !container instanceof HTMLElement || container.textContent === undefined) {
    return null;
  }

  var preview = '';

  if (container.nodeType === Node.TEXT_NODE) {
    preview = container.textContent;
  } else {
    var contentNodes = container.childNodes;
    for (var i = contentNodes.length - 1; i >= 0; i--) {
      var childPreview = getDraftPreview(contentNodes[i]);
      if (childPreview) {
        preview = childPreview + ' ' + preview;
      }
    }
  }

  return preview;
}