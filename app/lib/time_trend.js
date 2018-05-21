
const moment = require('moment');

/**
 * This class computes the trends, given a set of dates.
 * 
 * @author Tony
 */

const HOUR_FREQUENCY = 'hh';
const DAY_FREQUENCY = 'dd';
const MONTH_FREQUENCY = 'mm';

class TimeTrend {

    static getStartDate() {
        return moment(new Date(0)).format('YYYY-MM-DD HH:mm:ss');
    }

    static getEndDate() {
        return moment().format('YYYY-MM-DD HH:mm:ss');
    }

    constructor(dates, maxDataPoint) {

        this.maxDataPoint = maxDataPoint;
        this.now = moment();
        this.dates = [];

        // Convert to moment date object
        for (let i in dates) {
            this.dates.push(moment(dates[i]));
        }
    }

    setFrequency(frequency) {
        this.frequency = frequency;
        return this;
    }

    /**
     * Determine suitable frequency to use for the trend, i.e hour, day, month
     */
    computeOptimalFrequency() {

        let frequencies = {
            hh: [], dd: [], mm: []
        };

        function add(frequency, value) {
            if (frequencies[frequency].indexOf(value) == -1) {
                frequencies[frequency].push(value);
            }
        }

        for (let i = 0; i < this.dates.length; i++) {
            let date = this.dates[i];
            add(HOUR_FREQUENCY, date.hour());
            add(DAY_FREQUENCY, date.date());
            add(MONTH_FREQUENCY, date.month());
        }

        let frequency;

        for (let i in frequencies) {
            if (!frequency || frequency.count < frequencies[i].length) {
                frequency = {
                    name: i,
                    count: frequencies[i].length
                };
            }
        }

        this.frequency = frequency.name;
        return this;
    }

    getPointLabel(frequency, point, now) {
        switch (frequency) {
            case HOUR_FREQUENCY: return moment(now).subtract(point, 'hours').format('h A');
            case DAY_FREQUENCY: return moment(now).subtract(point, 'days').format('Do');
            case MONTH_FREQUENCY: return moment(now).subtract(point, 'months').format('MMM');
        }
    }

    computeTrendLabels() {

        let dataPoints = [];
        for (let i = 0; i < this.maxDataPoint; i++) {
            let point = this.maxDataPoint - (i + 1);
            dataPoints[i] = this.getPointLabel(this.frequency, point, this.now);
        }
        return dataPoints;
    }

    computeTrendValues() {

        function isBefore(frequency, point, time, now) {
            switch (frequency) {
                case HOUR_FREQUENCY:
                    return !time.isSameOrAfter(moment(now).subtract(point, 'hours').set('minute', 0));
                case DAY_FREQUENCY:
                    return !time.isSameOrAfter(moment(now).subtract(point, 'days').set('hour', 0).set('minute', 0));
                case MONTH_FREQUENCY:
                    return !time.isSameOrAfter(moment(now).subtract(point, 'months').set('date', 0).set('hour', 0).set('minute', 0));
            }
        }

        function matches(frequency, point, time, now) {
            switch (frequency) {
                case HOUR_FREQUENCY:
                    return time.hours() == moment(now).subtract(point, 'hours').hours();
                case DAY_FREQUENCY:
                    return time.days() == moment(now).subtract(point, 'days').days();
                case MONTH_FREQUENCY:
                    return time.months() == moment(now).subtract(point, 'months').months();
            }
        }

        let dataPoints = [];

        let dateIndex = 0;

        dataPointLoop:
        for (let i = 0; i < this.maxDataPoint; i++) {

            let point = this.maxDataPoint - (i + 1);

            while (dateIndex < this.dates.length) {

                let date = this.dates[dateIndex];

                if (isBefore(this.frequency, point, date, this.now)) {
                    dateIndex++; continue;
                }

                var match = matches(this.frequency, point, date, this.now);

                if (!match) {
                    break;
                }

                if (dataPoints[i] == undefined) {
                    dataPoints[i] = 1;
                } else {
                    dataPoints[i]++;
                }
                dateIndex++;
            }

            if (dataPoints[i] == undefined) {
                dataPoints[i] = 0;
            }
        }

        return dataPoints;
    }

}

module.exports = TimeTrend;
