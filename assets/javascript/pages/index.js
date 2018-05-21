

function __init() {

    rendererNamespace.renderingOpts.viewTitle = 'Real Ignite Mail App';

    getUserProfile()
        .then(function (profile) {

            var given_name = profile.first_name + ' ' + profile.last_name;
            $('.mdl-layout__drawer .mdl-layout-title').text(given_name);

            var opts = rendererNamespace.renderingOpts;
            if (opts.enable_pushState) {
                if (history.state) {
                    var viewId = history.state.viewId;
                    var context = history.state.context;
                    render(viewId, context, opts);
                } else {
                    render('messages');
                }
            } else {
                render('messages');
            }

            $(window).one('view-load-end', function (evt, ctx) {
                $('.mdl-layout__drawer-button').show();
            });


        }).catch(function (err) {
            console.log(err);
            render('index');
        });

    $(window).on('view-load-end', function (evt, ctx) {

        var viewId = ctx.viewId;
        var context = ctx.context;

        // Refresh all MDL components each time a new view is rendered
        componentHandler.upgradeDom();

        // Toggle drawer
        if ($('.mdl-layout__drawer-button').attr('aria-expanded') === 'true') {
            var layout = document.querySelector('.mdl-layout'); // Get layout reference
            layout.MaterialLayout.toggleDrawer();
        }

        // Set appropriate navigation link to .active
        $('.mdl-navigation__link').removeClass('active');

        var href = '/views/' + viewId;
        var elem = $('.mdl-navigation__link[href*=\'' + href + '\']');

        if (elem.length > 1) {
            //Add context
            elem = elem.filter('[href*=\'' + href + '?context=' + context + '\']');

            if (elem.length < 1) {
                elem = $('.mdl-navigation__link[href=\'' + href + '\']');
            }
        }
        elem.addClass('active');
    });
}

function notifyUser(msg, duration) {
    var notification = document.querySelector('.mdl-js-snackbar');
    var data = {
        message: msg,
        actionHandler: function (event) { },
        actionText: 'Undo',
        timeout: duration || 3500
    };
    notification.MaterialSnackbar.showSnackbar(data);
}


// Intercept all href references to views, so as to use our custom rendering framework
$(document).on('click', 'a', function (e) {
    var href = $(this).attr('href');
    if (!href) {
        return;
    }
    var pattern = /\/views?\/\w+(\?context=\w+)?/;
    if (match = href.match(pattern)) {
        e.preventDefault();
        var view = match[0].replace(/\/?views?\/?/, '');
        var context;
        var context_ = view.match(/\?context=\w+/);
        if (context_ && context_.length) {
            context = context_[0].replace('?context=', '');
        }
        var view_id = view.replace(context_, '');
        render(view_id, context);
    }
});
