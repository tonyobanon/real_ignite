
/**
 * This is the custom renderer that helps orchestrates most of the SPA
 * functionalities. It renders views on-demand, support transitioning, dynamic
 * script loading, HTML5 pushState, e.t.c ¯\_(ツ)_/¯
 * 
 * @author Tony
 */

// CSS Transition classes to use while switching between views

var transitionOutCssClass = ['js-render-content', 'anim-scaleDown'];
var transitionInCssClass = ['js-render-content', 'anim-moveFromRight', 'js-render-ontop'];

var rendererNamespace = {
    root: 'wrapper',
    rootContent: 'wrapper-content',
    defaultViewContext: 'default',
    renderingOpts: {
        enable_pushState: false,
        call_hide_function: true,
        assetFetchTimeout: 50000,
        viewTitle: 'Web Application',
        historyDisabledViews: []
    },
};

/**
 * {Object}
 */
var loadedViews = {};

/**
 * {Array<String>}
 */
var loadedContexts = [];

/**
 * {String}
 */
var current_view;

if (rendererNamespace.renderingOpts.enable_pushState) {
    window.onpopstate = function (event) {
        if (!event.state) {
            return;
        }
        var viewId = event.state.viewId;
        var context = event.state.context;
        render(viewId, context, rendererNamespace.renderingOpts);
    };
}

function render(viewId, context, opts) {

    opts = opts || {};

    if (!context) {
        context = rendererNamespace.defaultViewContext;
    }

    // Validate parameters
    validateRenderParameters(viewId, context);

    // Add rendering options
    for (var k in rendererNamespace.renderingOpts) {
        if (opts[k] === undefined) {
            opts[k] = rendererNamespace.renderingOpts[k];
        }
    }

    //Render new View
    __render(viewId, context, opts);
}

function validateRenderParameters(viewId, context) {

    if (Object.keys(loadedViews).indexOf(context) !== -1) {
        var err = 'Context: ' + viewId + '/' + context + ' has the same name with an existing view';
        // Due to the manner in which view contexts are loaded, there is a
        // possibility that this error can occur on a normal circumstance
        alert(err);
        throw new Error(err);
    }

    if (context.constructor.name == 'String' && context.includes(STRINGIFIED_CONTEXT_PREFIX)) {
        // For instances when a context is provided as a real number, we stringify it and
        // add STRINGIFIED_CONTEXT_PREFIX in front of it. Hence a (string) context must not
        // contain the prefix
        var err = 'Context: ' + viewId + '/' + context + ' is using a reserved name';
        alert(err);
        throw new Error(err);
    }

    if (viewId.constructor.name != 'String') {
        var err = 'View: ' + viewId + ' must be a String';
        alert(err);
        throw new Error(err);
    }
}

function isViewLoaded(viewId) {
    return Object.keys(loadedViews).indexOf(viewId) !== -1;
}

function destroyViewContext(view_id, context) {

    // Delete view context from DOM
    var viewSelector = getViewSelector(view_id, context);
    $(viewSelector).remove();

    var ind = loadedContexts.indexOf(getContextIdentifier(view_id, context));
    if (ind != -1) {
        loadedContexts.splice(ind, 1);
    }
}

function loadView(viewId) {
    return new Promise(function (resolve, reject) {

        if (isViewLoaded(viewId)) {
            resolve(loadedViews[viewId]);
        } else {
            $.get('views/' + viewId + '.view', function (data) {
                loadedViews[viewId] = data;

                function call_init_function() {
                    var init_function = window['__load_' + viewId + '_view'];
                    if (init_function && init_function instanceof Function) {
                        init_function();
                    }
                }

                call_init_function();

                resolve(data);
            });
        }
    });
}


function getViewSelector(view_id, context) {
    return '.' + getViewClasses(view_id, context).join('.');
}

function getViewClasses(view_id, context) {
    return [view_id, 'view', toContextString(view_id, context)];
}

/**
 * Given the content wrapper, this function guesses the correponding viewId and context
 * by examining the css classes
 */
function getViewContextFromWrapper(contentWrapper) {

    var viewWrapper = contentWrapper.find('.view');

    if (!viewWrapper.length) {
        // contentWrapper is probably the default content wrapper
        // which does not have any view wrapper
        return null;
    }

    var classList = viewWrapper[0].className.split(/\s+/);

    var viewId;
    var context;

    // First, look for the view Id
    for (var i in classList) {
        if (Object.keys(loadedViews).indexOf(classList[i]) !== -1) {
            viewId = classList[i];
            break;
        }
    }

    // Then the context
    for (var i in classList) {
        if (classList[i] !== viewId && classList[i] != 'view') {
            context = fromContextString(classList[i]);
            break;
        }
    }

    if (!viewId || !context) {
        return null;
    }

    return {
        viewId: viewId,
        context: context
    };
}

var STRINGIFIED_CONTEXT_PREFIX = 'scp_';

function toContextString(view_id, ctx) {
    if (ctx.constructor.name == 'Number' && ctx >= 0) {
        ctx = ctx.toString();
        var _ctx = '';
        for (var i = 0; i < ctx.length; i++) {
            _ctx = _ctx + String.fromCharCode(parseInt(ctx.charAt(i)) + 97);
        }
        return STRINGIFIED_CONTEXT_PREFIX + _ctx;
    } else if (ctx.constructor.name == 'String') {
        return ctx;
    } else {
        var err = 'Context: ' + view_id + '/' + ctx + ' is neither a real number or a string';
        throw new Error(err);
    }
}

function fromContextString(ctx) {
    if (ctx.startsWith(STRINGIFIED_CONTEXT_PREFIX)) {
        ctx = ctx.replace(STRINGIFIED_CONTEXT_PREFIX, '');
        var _ctx = '';
        for (var i = 0; i < ctx.length; i++) {
            _ctx = _ctx + (ctx.charCodeAt(i) - 97 + '');
        }
        return parseInt(_ctx);
    } else {
        return ctx;
    }
}

function getContextIdentifier(view_id, context) {
    return view_id + '-' + context;
}

function parseContextIdentifier(identifier) {

    var arr = identifier.split('-');

    var viewId = arr[0];
    var context = arr[1];

    // Since toContextString() is not used when generating identifier, stored as is
    // We need to test first test if context is an Integer
    var iContext = parseInt(context);
    if (!Number.isNaN(iContext)) {
        context = iContext;
    }

    return {
        viewId: viewId,
        context: context
    };
}

function getCurrentContextIdentifier() {
    return parseContextIdentifier(window.current_view);
}

function refreshViewContext(viewId, oldContext, newContext) {

    if (oldContext == newContext) {
        return;
    }

    var oldIdentifier = getContextIdentifier(viewId, oldContext);
    var newIdentifier = getContextIdentifier(viewId, newContext);

    // Update current_view

    if (current_view == oldIdentifier) {
        current_view = newIdentifier;
    }

    // Update loadedContexts

    var ind = loadedContexts.indexOf(oldIdentifier);
    loadedContexts[ind] = newIdentifier;


    // Update context container (Replace CSS class) and return

    var viewContainer = $(getViewSelector(viewId, oldContext));
    viewContainer.attr('class', '');

    var cssClasses = getViewClasses(viewId, newContext);

    for (var i in cssClasses) {
        viewContainer.addClass(cssClasses[i]);
    }


    // Perform History replaceState
    var opts = rendererNamespace.renderingOpts;
    if (opts.enable_pushState && opts.historyDisabledViews.indexOf(viewId) == -1) {
        var stateObj = {
            viewId: viewId,
            context: newContext
        };
        window.history.replaceState(stateObj, rendererNamespace.renderingOpts.viewTitle, '/?_=' + generateShortId());
    }

    return viewContainer;
}

function triggerViewLoadEnd() {
    // Give the renderer some time to add the view-load event listener
    setTimeout(function () {
        triggerViewLoadEndNow();
    }, 100);
}

function triggerViewLoadEndNow() {
    var identifier = parseContextIdentifier(current_view);
    $(window).trigger('view-load-end', identifier);
}

/**
 * Renders content to the DOM, can animate content in and out of the dom
 * @param view_id
 * @param context
 * @param opts
 * @private
 */
function __render(view_id, context, opts) {

    if (!context) {
        throw new Error('Please provide a rendering context');
    }

    var identifier = getContextIdentifier(view_id, context);

    if (current_view == identifier) {
        triggerViewLoadEndNow();
        return;
    }

    var hasView = isViewLoaded(view_id);
    var isLoaded = loadedContexts.indexOf(identifier) !== -1;

    var wrapper = $('#' + rendererNamespace.root);

    var oldContentWrapper = wrapper.find('.' + rendererNamespace.rootContent + '.ns-active');
    var oldViewContext = getViewContextFromWrapper(oldContentWrapper);

    var viewSelector = getViewSelector(view_id, context);
    var contentWrapper = isLoaded ? $(viewSelector).parent() : null;

    var viewWrapper = isLoaded ? $(viewSelector) : null;

    current_view = identifier;

    if (!isLoaded) {

        loadView(view_id).then(function (data) {

            viewWrapper = $('<div>');

            var cssClasses = getViewClasses(view_id, context);
            for (var i in cssClasses) {
                viewWrapper.addClass(cssClasses[i]);
            }

            viewWrapper.html(data);

            var viewWrapperDOMElement = viewWrapper[0];

            function loadViewContext() {

                // Remove inlined scripts
                removeScripts(getInlinedScripts(viewWrapperDOMElement));

                contentWrapper = $('<div>', { 'class': rendererNamespace.rootContent });
                contentWrapper.hide();
                contentWrapper.append($(viewWrapperDOMElement));

                wrapper.prepend(contentWrapper);

                console.log('Loading context: ' + identifier);

                // Call the view's init function
                call_init_function();

                loadedContexts.push(identifier);

                //Wait for the init function, then finalize afterwards
                $(window).one('view-load-end', function (evt) {
                    finalizeContext();
                });
            }

            if (hasView) {

                //Since this view already exists, we just load a new context
                loadViewContext();

            } else {

                //First import scripts in the view, i.e external js libraries, then load context
                $(window).one('script-load', function (evt) {
                    loadViewContext();
                });

                console.log('Fetching scripts..');
                // Execute any script in viewWrapper
                executeScripts(view_id, viewWrapperDOMElement, opts.assetFetchTimeout);
            }
        });

    } else {

        // Indicate that the view has been loaded
        triggerViewLoadEndNow();

        finalizeContext();
    }

    function finalizeContext() {

        // View already exists, so just transition
        transition();

        // Call the view's show function
        call_show_function();
        
        var opts = rendererNamespace.renderingOpts;

        if (opts.call_hide_function == true) {
            // Call the previous view's hide function
            call_hide_function();
        }

        //  Push state to browser history 
        if (opts.enable_pushState && opts.historyDisabledViews.indexOf(viewId) == -1) {
            var stateObj = {
                viewId: view_id,
                context: context
            };
            history.pushState(stateObj, opts.viewTitle, '/?_=' + generateShortId());
        }
    }

    function call_init_function() {
        var init_function = window['__load_' + view_id + '_context'];
        if (init_function && init_function instanceof Function) {
            init_function(viewWrapper, context);
        }
    }

    function call_show_function() {
        var show_function = window['__show_' + view_id + '_context'];
        if (show_function && show_function instanceof Function) {
            show_function(viewWrapper, context);
        }
    }

    function call_hide_function() {
        if (!oldViewContext) {
            return;
        }
        var hide_function = window['__hide_' + oldViewContext.viewId + '_context'];
        if (hide_function && hide_function instanceof Function) {
            hide_function(oldViewContext.context);
        }
    }

    function transition() {

        if (loadedContexts.length === 0) {
            contentWrapper.addClass('ns-active');
            setTimeout(function () {
                contentWrapper.show();
            }, 100);

            oldContentWrapper.removeClass('ns-active');
            oldContentWrapper.hide();
            return;
        }

        oldContentWrapper.one('animationend', function () {

            for (var i in transitionOutCssClass) {
                oldContentWrapper.removeClass(transitionOutCssClass[i]);
            }

            for (var i in transitionInCssClass) {
                contentWrapper.removeClass(transitionInCssClass[i]);
            }

            contentWrapper.addClass('ns-active');
            contentWrapper.show();

            oldContentWrapper.removeClass('ns-active');
            oldContentWrapper.hide();

            $(window).trigger('view-transition-done');
        });

        for (var i in transitionOutCssClass) {
            oldContentWrapper.addClass(transitionOutCssClass[i]);
        }

        for (var i in transitionInCssClass) {
            contentWrapper.addClass(transitionInCssClass[i]);
        }
    }

}

/**
 * Execute all the scripts in the inserted content node
 * @param view_id
 * @param container
 * @param timeout
 */
function executeScripts(view_id, container, timeout) {

    var scripts = getInlinedScripts(container);

    var loaded = 0;

    if (scripts.length === 0) {
        $(window).trigger('script-load');
        return;
    }

    // Evaluate each script
    scripts.forEach(function (elem) {

        var elemJQ = $(elem);

        var src = elemJQ.attr('src');
        var onload = elemJQ.attr('onload');

        var script = document.createElement('script');

        script.src = src;
        script.async = false;

        script.onload = function () {

            loaded++;

            if (onload) {
                eval(onload);
            }
            if (loaded == scripts.length) {
                $(window).trigger('script-load');
            }
        };

        document.head.appendChild(script);
    });

    // Set Timeout
    setTimeout(function () {
        if (loaded < scripts.length) {
            console.log('Could not fetch ' + (scripts.length - loaded) + ' script(s)');
            $(window).trigger('script-load');
        }
    }, timeout);
}

function getInlinedScripts(container) {

    var scripts = [];

    /**
     * Checks that the passed element has the specified name
     * @param elem
     * @param name
     * @returns {string|boolean}
     */
    var nodeName = function (elem, name) {
        return elem.nodeName && elem.nodeName.toUpperCase() === name.toUpperCase();
    };

    var contentNodes = container.childNodes;

    for (var i in contentNodes) {
        var currNode = contentNodes[i];
        // Check that the current node is a script element with the type set to 'text/javascript' or nothing
        if (
            nodeName(currNode, 'script') &&
            (!currNode.type || currNode.type.toLowerCase() === 'text/javascript')
        ) {
            // Add the script to the scripts array
            scripts.push(currNode);
        }
    }
    return scripts;
}

function removeScripts(scripts) {
    if (scripts.length > 0) {
        scripts.forEach(function (elem) {
            var elemJQ = $(elem);
            elemJQ.remove();
        });
    }
}


