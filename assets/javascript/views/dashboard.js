

function __load_dashboard_context(container, context) {

    setTimeout(function () {
        __loadDashboard();
    }, 700);

    triggerViewLoadEnd();
}

function __loadDashboard() {

    getUserActivityTrend().then(function (data) {

        var viewSelector = getViewSelector('dashboard', 'default');

        // Add Trend data

        var chart = new Chartist.Line(viewSelector + ' .ct-chart.mail-trend', data.trend, {
            low: 0,
            showArea: true,
            showPoint: true,
            fullWidth: true,
            axisY: {
                onlyInteger: true,
                scaleMinSpace: 10
            }
        });

        chart.on('draw', function (data) {
            if (data.type === 'line' || data.type === 'area') {
                data.element.animate({
                    d: {
                        begin: 2000 * data.index,
                        dur: 2000,
                        from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
                        to: data.path.clone().stringify(),
                        easing: Chartist.Svg.Easing.easeOutQuint
                    }
                });
            }
        });


        // Add stats

        $(viewSelector + ' .stat.emails-created .value').text(data.stats.emails_created);
        $(viewSelector + ' .stat.emails-sent .value').text(data.stats.emails_sent);

    });

}

function __increment_created_messages_stat() {
    var viewSelector = getViewSelector('dashboard', 'default');
    var elem = $(viewSelector + ' .stat.emails-created .value');
    elem.text(parseInt(elem.text()) + 1);
}

function __increment_sent_messages_stat() {
    var viewSelector = getViewSelector('dashboard', 'default');
    var elem = $(viewSelector + ' .stat.emails-sent .value');
    elem.text(parseInt(elem.text()) + 1);
}
