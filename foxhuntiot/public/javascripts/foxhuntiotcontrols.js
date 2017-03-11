
//
//   Openpux Internet Of Things (IOT) Framework.
//
//   Copyright (C) 2017 Menlo Park Innovation LLC
//
//   menloparkinnovation.com
//   menloparkinnovation@gmail.com
//
//   Page Controls support.
//

//
// Create a custom gauge set for the IoT application.
//
// There may be multiple instances of the gauge set created for
// different view such as portait or landscape.
//
function PageIoTGauges(viewName)
{
    var self = this;

    // "landscape" or "portrait"
    self.basename = viewName;

    // Gauge names must match HTML id= element
    self.adfDirectionGauge = new IoTGauge("signal_direction_gauge");
    self.observerDirectionGauge = new IoTGauge("observer_direction_gauge");

    //
    // Strip charts have their own controls to make it
    // easier to separate.
    //

    // Note: Not enabled yet.
    //self.stripCharts = new PageIoTStripCharts();
    //self.stripCharts.draw();
}

//
// Update the gauge set with new readings.
//
PageIoTGauges.prototype.update = function(data)
{
    var self = this;

    //
    // Gauges exist even if their view is not current  as <canvas> elements
    // on the main page. So we must update all of them for a given display
    // data name.
    //

    //
    // Set a highlight range to indicate the direction reading uncertainty
    //
    // Note: The value received from the host is the total range.
    //
    // For the highlight its half the value since the gauge library
    // takes the value to be the above and below for the needle.
    //
    // (To avoid math and rounding at the gauge library level).
    //

    self.adfDirectionGauge.setHighLightRange(data.adfDirectionUncertainty / 2);

    self.adfDirectionGauge.update(data.absoluteBearing);

    self.observerDirectionGauge.setHighLightRange(data.observerDirectionUncertainty / 2);

    self.observerDirectionGauge.update(data.observerDirection);

    if (self.stripCharts != null) {
        self.stripCharts.update(data);
    }
}

PageIoTGauges.prototype.sizeChanged = function(scale_factor)
{
    var self = this;

    //
    // Gauges exist even if their view is not current  as <canvas> elements
    // on the main page. So we must update all of them for a given display
    // data name.
    //

    self.adfDirectionGauge.updateSize(scale_factor);

    self.observerDirectionGauge.updateSize(scale_factor);

    if (self.stripCharts != null) {
        self.stripCharts.updateSize(scale_factor);
    }
}

//
// Application Strip Chart Support
//

var temperature_data = {

    labels: ["12:00", "1:00", "2:00", "3:00", "4:00", "5:00", "6:00", "7:00", "8:00", "9:00",
             "10:00", "11:00", "12:00"],
    datasets: [
        {
            label: "Temperature",

            // Note: Only the number of data points as labels get plotted it appears
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

            fontColor: "rgba(0,0,0,1)",
            fill: false,
            lineTension: 0.1,

            // This sets the color of the plotted line between readings
            borderColor: "rgba(75,192,192,1)",

            //
            // This sets the color of the data points. Make it the same
            // color as borderColor is you don't want the data points
            // called out.
            //
            pointBorderColor: "rgba(75,192,192,1)",

            backgroundColor: "rgba(75,192,192,0)",
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",

            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            spanGaps: false,
        }
    ]
};

var temperature_options = {

        //
        // http://www.chartjs.org/docs/#scales
        //
        scales: {

            // This displays the verticle bars for each X point in the grid.
            xAxes: [{
                display: true
            }]
        },

        // This gets the "Temperature" title color set
        legend: {

            // This displays the title
            display: true,

            labels: {
                fontColor: "#EEEEEE",
                fontSize: 24,

                // this gets rid of the box next to the title
                boxWidth: 0
            }
        }
};

var humidity_data = {

    labels: ["12:00", "1:00", "2:00", "3:00", "4:00", "5:00", "6:00", "7:00", "8:00", "9:00",
             "10:00", "11:00", "12:00"],
    datasets: [
        {
            label: "Humidity",

            // Note: Only the number of data points as labels get plotted it appears
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

            fontColor: "rgba(0,0,0,1)",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(75,192,192,0)",
            borderColor: "rgba(75,192,192,1)",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            spanGaps: false,
        }
    ]
};

var humidity_options = {

        scales: {
            xAxes: [{
                display: true
            }]
        },

        // This gets the "Temperature" title color set
        legend: {
            display: true,
            labels: {
                fontColor: "#FFFFFF",
                fontSize: 24,

                // this gets rid of the box next to the title
                boxWidth: 0
            }
        }
};

//
// There are multiple strip chart views which get enabled/disabled
// based on page orientation.
//
// In order to not lose timeline data, that data is stored
// globally and updated/shared by the strip chart in view.
//

function PageIoTStripCharts()
{
    var self = this;

    //
    // Landscape Mode
    //

    self.temperatureLineChartConfig = {};
    self.temperatureLineChartConfig.elementId = "landscape_temperature_strip_chart";
    self.temperatureLineChartConfig.data = temperature_data;
    self.temperatureLineChartConfig.options = temperature_options;
    self.temperatureLineChartConfig.dataSeries = new StripChartDataSeries(13, 0, 0);

    self.temperatureLineChart = new IoTStripChart(self.temperatureLineChartConfig);

    self.humidityLineChartConfig = {};
    self.humidityLineChartConfig.elementId = "landscape_humidity_strip_chart";
    self.humidityLineChartConfig.data = humidity_data;
    self.humidityLineChartConfig.options = humidity_options;
    self.humidityLineChartConfig.dataSeries = new StripChartDataSeries(13, 0, 0);

    self.humidityLineChart = new IoTStripChart(self.humidityLineChartConfig);

    //
    // Portrait Mode
    //

    self.portrait_temperatureLineChartConfig = {};
    self.portrait_temperatureLineChartConfig.elementId = "portrait_temperature_strip_chart";
    self.portrait_temperatureLineChartConfig.data = temperature_data;
    self.portrait_temperatureLineChartConfig.options = temperature_options;
    self.portrait_temperatureLineChartConfig.dataSeries = new StripChartDataSeries(13, 0, 0);

    self.portrait_temperatureLineChart = new IoTStripChart(self.portrait_temperatureLineChartConfig);

    self.portrait_humidityLineChartConfig = {};
    self.portrait_humidityLineChartConfig.elementId = "portrait_humidity_strip_chart";
    self.portrait_humidityLineChartConfig.data = humidity_data;
    self.portrait_humidityLineChartConfig.options = humidity_options;
    self.portrait_humidityLineChartConfig.dataSeries = new StripChartDataSeries(13, 0, 0);

    self.portrait_humidityLineChart = new IoTStripChart(self.portrait_humidityLineChartConfig);
}

//
// Called when the page is loaded from the <body> element.
//
PageIoTStripCharts.prototype.draw = function()
{
    var self = this;

    self.temperatureLineChart.draw();
    self.humidityLineChart.draw();

    self.portrait_temperatureLineChart.draw();
    self.portrait_humidityLineChart.draw();
}

PageIoTStripCharts.prototype.update = function(data)
{
    var self = this;    

    self.temperatureLineChart.update(data.temperature);
    self.humidityLineChart.update(data.humidity);

    self.portrait_temperatureLineChart.update(data.temperature);
    self.portrait_humidityLineChart.update(data.humidity);
}

PageIoTStripCharts.prototype.updateSize = function(scale_factor)
{
    var self = this;

    self.temperatureLineChart.updateSize(scale_factor);
    self.humidityLineChart.updateSize(scale_factor);

    self.portrait_temperatureLineChart.updateSize(scale_factor);
    self.portrait_humidityLineChart.updateSize(scale_factor);
}
