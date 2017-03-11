
//
//   Openpux Internet Of Things (IOT) Framework.
//
//   Copyright (C) 2017 Menlo Park Innovation LLC
//
//   menloparkinnovation.com
//   menloparkinnovation@gmail.com
//
//   IoT Chart.js based strip charts.
//

//
// Chart.js support
//

//
// config.elementId // HTML id= for chart element
//
// config.data      // Chart.js configuration data
//
// config.options   // Chart.js configuration options
//
// config.dataSeries // Data series for plotting
//
function IoTStripChart(config)
{
    var self = this;

    self.config = config;

    self.elementId = config.elementId;

    self.data = config.data;

    self.options = config.options;

    self.dataSeries = config.dataSeries;

    self.chart = null;

    self.chartctx = null;

    //
    // Chart.defaults.global provide settings for all charts.
    //
    // http://www.chartjs.org/docs/#chart-configuration-creating-a-chart-with-options
    //
    Chart.defaults.global.defaultFontColor = "#EEEEEE";
    Chart.defaults.global.defaultFontSize = 18;
    Chart.defaults.global.responsive = true;
}

IoTStripChart.prototype.draw = function()
{
    var self = this;

    self.chartctx = document.getElementById(self.elementId);

    self.chart = new Chart(self.chartctx, {
        type: 'line',
        data: self.data,
        options: self.options
    });
}

IoTStripChart.prototype.update = function(newData)
{
    var self = this;    

    //
    // Time series data are kept as arrays.
    //

    //
    // With current time hh::mm::ss
    //
    self.dataSeries.UpdateWithCurrentTime(newData);

    //
    // http://www.chartjs.org/docs/#scales-update-default-scale-config
    //
    self.chart.data.datasets[0].data = self.dataSeries.getPoints();
    self.chart.data.labels = self.dataSeries.getLabels();
    self.chart.update(1, false);
}

IoTStripChart.prototype.updateSize = function(scale_factor)
{
    var self = this;

    // TODO: Update size
}

//
// Strip chart data series handler.
//
// This maintains a historic data series with more recent information
// at finer resolution, and older history data "compressed" to averages
// of the readings during those periods.
//
// numberOfPoints - Number of points to place on chart
//
// defaultValue - Default value to initialize points with.
//
// seriesCompression - Number of periods to use to provide a compressed
//    history of the readings.
//
//    0 - disable, a strict linear scrolling chart.
//
//    1 - First entry contains average of previous history
//
//    2 - First entry contains the average of the previous history
//        for 2 intervals past. Second entry contains the previous
//        interval history.
//
//    n - Compress up to n intervals. Note: Intervals deduct from the
//        total available points over time until 1/2 are used for
//        the compressed series.
//
function StripChartDataSeries(numberOfPoints, defaultValue, seriesCompression)
{
    var self = this;

    self.numberOfPoints = numberOfPoints;
    self.defaultValue = defaultValue;
    self.seriesCompression = seriesCompression

    //
    // Current count of entries
    //
    self.currentCount = 0;

    self.currentHistoryIndex = 0;

    self.history = null;

    //
    // The view data is always ready to display
    //
    // This must have the full number of points to ensure
    // that the strip charts can display their configured number of
    // points without going past the end of the arrays.
    //

    self.viewData = new StripChartData(numberOfPoints, defaultValue);

/*

x could be a time line, or just a series of readings.

x could be managed on clock periods in order to line up better with what
  humans like to look at such as hours, mins, seconds.

---------------------------------------------------------------------------------------------
| avg (x-10) - (x-20) | avg x - (x-9) |                                                     |
---------------------------------------------------------------------------------------------
x-20                  x-10            x-9   x-8   x-7   x-6   x-5   x-4   x-3   x-2   x-1   x


Wall Clock Time Series:

One minute intervals.

 12 hour        1 hour             30 min            5 min                 1 min
--------------------------------------------------------------------------------------------
|       | avg (x-30) - (x-60) | avg x - (x-30) |  avg x - (x - 5) |      5 min series      |
--------------------------------------------------------------------------------------------
12hr    x-60                  x-30                                x-5  x-4  x-3  x-2  x-1  x

5  min  reading is average of last 1 min series of x-5 -> x
   - contains 5 one minute reading entries

30 min  reading is average of last six 5 min series.
   - contains 30 one minute reading entries

1 hour  reading is average of last two 30 min series.
   - contains 60 one minute reading entries
   - at which point is the math average better than keeping data around?

12 hour reading is average of last 24 30 min series.
   - average of 12 one hour entries
   - if raw data, 720 data points.

24 hour reading is average of last two 12 hour series.
   - average of 24 one hour entries
   - if raw data, 1,440 data points.

7 days  reading is average of last seven 24 hour series.
   - average of 7 24 hour entries.
   - if raw data, 10,800 data points.

30 days reading is average of last 30 24 hour series.
   - Skips the 7 day to get the better average.
   - if raw data, 43,200 data points.


*/

    //
    // If series compression is set, allocate the arrays that
    // represent history information.
    //
    // Organization of the arrays is as follows:
    //
    // [0] - Most recent readings. The number of entries is the chart
    //       numberOfPoints minus the number of history series.
    //       (seriesCompression)
    //
    // [1] - The running average of the previous readings from series [0].
    //       
    // [2] - The running average from series [1]
    //
    // [n] - The running average from series [n-1]
    //
    if (self.seriesCompression != 0) {
        self.history = new Array(self.seriesCompression);

        for (var index in self.history) {

            // 0 for number of points means a dynamic array
            self.history[index] = new StripChartData(0, defaultValue);
        }
    }
}

StripChartDataSeries.prototype.UpdateWithCurrentTime = function(newData)
{
    var self = this;

    //
    // If no history, pass it through.
    //
    if (self.history == null) {
        self.viewData.UpdateWithCurrentTime(newData);
        return;
    }
 
    //
    // Track history information
    //

    // Push the new data item to the nearest series
    self.history[0].UpdateWithCurrentTime(newData);
    self.currentCount++;

    if (self.currentCount >= self.numberOfPoints) {

        // We need to average the current data series
    }

    self.currentHistoryIndex++;


    self.viewData.UpdateWithCurrentTime(newData);

}

StripChartDataSeries.prototype.getPoints = function()
{
    return this.viewData.points;
}

StripChartDataSeries.prototype.getLabels = function()
{
    return this.viewData.labels;
}

//
// Strip chart data handler.
//
// Maintains an array of values and a array of "labels".
//
// numberOfPoints - Number of points to place on chart.
//   If 0, then the data accumlates dynamically unless trimmed.
//
// defaultValue - Default value to initialize points with.
//
function StripChartData(numberOfPoints, defaultValue)
{
    var self = this;
    
    self.numberOfPoints = numberOfPoints;
    self.defaultValue = defaultValue;
    self.defaultIndex = 0;
    self.dynamic = false;

    if (self.numberOfPoints == 0) {
        self.dynamic = true;
    }

    // Allocate of zero gives an empty array
    self.points = new Array(self.numberOfPoints);

    for (var index in self.points) {
        self.points[index] = self.defaultValue;
    }

    self.labels = new Array(self.numberOfPoints);

    for (var index in self.labels) {
        self.points[index] = self.defaultIndex++;
    }
}

//
// Trim the oldest data in the series.
//
// This is the front of the array.
//
StripChartData.prototype.trimOldest = function()
{
    // Trim off first entry
    self.points.shift();
    self.labels.shift();
}

StripChartData.prototype.trimNewest = function()
{
    // Trim off the last entry
    self.points.pop();
    self.labels.pop();
}

StripChartData.prototype.getPoints = function()
{
    return this.points;
}

StripChartData.prototype.getLabels = function()
{
    return this.labels;
}

StripChartData.prototype.UpdateWithIndex = function(newData, newLabel)
{
    var self = this;

    // Push new entry on the end.
    self.points.push(newData);
    self.labels.push(newLabel);

    // If a fixed set, trim off the first entries
    if (!self.dynamic) {
        self.points.shift();
        self.labels.shift();
    }
}

//
// Update using the current time as the new label/index.
//
StripChartData.prototype.UpdateWithCurrentTime = function(newData)
{
    var self = this;

    // Push new entry on the end.
    self.points.push(newData);

    var date = new Date(Date.now());

    var newLabel = TwelveHourTimeFormat(date);

    self.labels.push(newLabel);

    // If a fixed set, trim off the first entries
    if (!self.dynamic) {
        self.points.shift();
        self.labels.shift();
    }
}

//
// Create a time series strip chart data set.
//
// The time series will automatically "compress" intervals as data is
// received, so the trend of a monitored value can be quickly seen
// at a glance.
//
// Model:
//
//  The time series automatically ticks through a series of one minute
//  intervals.
//
//  An application may provide data updates at any time. Data received
//  for the current interval becomes the reported data for the interval.
//
//  If no data has been received for the current interval, the previous
//  intervals value is carried forward.
//
//  If multiple values are received for the current interval, a running
//  average is kept, and becomes the report for the interval.
//
//  There is a simulation mode to advance the chart data by one tick
//  for each data update. This is to quickly run through the chart
//  for testing, demonstration, and simulation.
//
//  When the chart is first initialized the initial data value is
//  0, which shows at the bottom of the chart. In most cases this
//  is the "noreading" value. It can be changed by setting a different
//  default value to the constructor.
//
//  As intervals occur, the strip chart data is moved "to the left"
//  with new arrivals on the "right". There is a time compression
//  in which the newest data shows five minutes of one minute
//  intervals, the next is 5 minutes average, 30 minute average,
//  60 minute average, 12 hours average, 24 hour average, and
//  7 day average.
//

/*

Wall Clock Time Series:

One minute intervals.

30 days 7 days 24 hours 12 hour        1 hour             30 min             5 min             1 min
--------------------------------------------------------------------------------------------------------------
|      |      |        |       | avg (x-30) - (x-60) | avg x - (x-30) |  avg x - (x - 5) |   5 min series    |
--------------------------------------------------------------------------------------------------------------
30d    7d     24hr     12hr    x-60                  x-30                                x-5 x-4 x-3 x-2 x-1 x

1 min is the average of all readings received in the 1 minute interval.
   - array of 5 entries
   - each interval averages all 5 entries.

5  min reading is the running average of the previous series.
   - contains one entry.

30  min reading is the running average of the previous series.
   - contains one entry.

1 hour reading is the running average of the previous series.
   - contains one entry.

12 hour reading is the running average of the previous series.
   - contains one entry.

24 hour reading is the running average of the previous series.
   - contains one entry.

7 day reading is the running average of the previous series.
   - contains one entry.

30 day reading is the running average of the previous series.
   - contains one entry.

*/
function StripChartTimeSeries(defaultValue)
{
    var self = this;

    if ((typeof(defaultValue) == "undefined") && (defaultValue != null)) {
        self.currentDataItem = defaultValue;
    }
    else {
        self.currentDataItem = 0;
    }

    // 5 one minute intervals, plus averages.
    self.numberOfPoints = 5 + 7;

    //
    // The current data view is always available.
    //

    self.points = new Array(self.numberOfPoints);

    for (var index in self.points) {
        self.points[index] = self.defaultValue;
    }

    self.labels = new Array(self.numberOfPoints);

    for (var index in self.labels) {
        self.points[index] = "00:00:00";
    }

    self.simulationMode = false;

    //
    // Will start a strip chart with 0's for no readings once
    // ticks start.
    //
    self.currentDataItemValid = false;
    self.currentDataTime = Date.now();

    self.minutes = new Array(5);

    for (var index in self.minutes) {
        self.minutes[index] = 0;
    }

    //
    // Each item has a valid flag so that averages are not
    // taken unless a valid reading has been placed.
    //

    self.fiveMinutes = 0;
    self.fiveMinutesValid = false;

    self.thirtyMinutes = 0;
    self.thirtyMinutesValid = false;

    self.hours = 0;
    self.hoursValid = false;

    self.twelveHours = 0;
    self.twelveHoursValid = false;

    self.twentyFourHours = 0;
    self.twentyFourHoursValid = false;

    self.sevenDays = 0;
    self.sevenDaysValid = false;

    self.thirtyDays = 0;
    self.thirtyDaysValid = false;
}

StripChartTimeSeries.prototype.UpdateDataArrays = function()
{
    var self = this;

    var p = self.points;

    // Start of the array is the oldest item

    p[0] = self.thirtyDays;
    p[1] = self.sevenDays;
    p[2] = self.twentyFourHours;
    p[3] = self.twelveHours;
    p[4] = self.hours;
    p[5] = self.thirtyMinutes;
    p[6] = self.fiveMinutes;

    // The individual minutes
    var m = self.minutes;

    p[7] = m[4];
    p[8] = m[3];
    p[9] = m[2];
    p[10] = m[1];
    p[11] = m[0];

    var l = self.labels;

    // Each label is the time series subtracted from the current time.


}

//
// Ripple through the time series
//
StripChartTimeSeries.prototype.Ripple = function(timeData)
{
    var self = this;
    
    //
    // Calculate the average for the minutes
    //
    var average = 0;

    for (var index in self.minutes) {
        average += self.minutes[index];
    }

    average = average / self.minutes.length;

    if (self.fiveMinutesValid) {
        self.fiveMinutes = (self.fiveMinutes + average) / 2;
    }
    else {
        self.fiveMinutes = average;
        self.fiveMinutesValid = true;
    }

    //
    // Ripple through the next items
    //
    if (self.thirtyMinutesValid) {
        self.thirtyMinutes = (self.thirtyMinutes + self.fiveMinutes) / 2;
    }
    else {
        self.thirtyMinutes = self.fiveMinutes;
        self.thirtyMinutesValid = true;
    }

    if (self.hoursValid) {
        self.hours = (self.hours + self.thirtyMinutes) / 2;
    }
    else {
        self.hours = self.thirtyMinutes;
        self.hoursValid = true;
    }

    if (self.twelveHoursValid) {
        self.twelveHours = (self.twelveHours + self.hours) / 2;
    }
    else {
        self.twelveHours = self.hours;
        self.twelveHoursValid = true;
    }

    if (self.twentyFourHoursValid) {
        self.twentyFourHours = (self.twentyFourHours + self.twelveHours) / 2;
    }
    else {
        self.twentyFourHours = self.twelveHours;
        self.twentyFourHoursValid = true;
    }

    if (self.sevenDaysValid) {
        self.sevenDays = (self.sevenDays + self.twentyFourHours) / 2;
    }
    else {
        self.sevenDays = self.twentyFourHours;
        self.sevenDaysValid = true;
    }

    if (self.thirtyDaysValid) {
        self.thirtyDays = (self.thirtyDays + self.sevenDays) / 2;
    }
    else {
        self.thirtyDays = self.sevenDays;
        self.thirtyDaysValid = true;
    }

    //
    // Now update the data arrays that are published
    //

    self.UpdateDataArrays();
}

//
// This can be called on an interval such as once per minute.
//
StripChartTimeSeries.prototype.TimeTick = function(timeData)
{
    var self = this;

    //
    // Process a time tick by advancing current time.
    //
    // If no data readings have been supplied the value in
    // self.currentDataItem is used. This "stretches" the
    // interval from the last data received.
    //

    //
    // Advance the time series using the self.currentDataItem
    //


    //
    // Mark the current data item as invalid so the current
    // value will not be averaged with any readings during
    // the interval.
    //
    // The current value is left in self.currentDataItem so
    // that it becomes the reading used for the current interval
    // if no data updates are received.
    //

    self.currentDataItemValid = false;
}

//
// Update a data item.
//
// Multiple updates in the same time interval are averaged.
//
StripChartTimeSeries.prototype.UpdateWithCurrentTime = function(newData)
{
    var self = this;

    //
    // Data is placed into the current slot.
    //
    // If a data reading for the current time interval is already
    // there it is averaged.
    //

    if (self.currentDataItemValid) {

        // Keep a running average the values received till the next time interval
        self.currentDataItem = (self.currentDataItem + newData) / 2;
    }
    else {
        self.currentDataItem = newData;
        self.currentDataItemValid = true;

        // We record the first data sample arrival in a current interval
        self.currentDataTime = Date.now();
    }

    //
    // If in simulation mode treat each new data item as a time tick.
    //

    if (self.simulationmode) {
        self.TimeTick(null);
    }

    //
    // A future TimeTick() will advance the strip chart data.
    //

}

StripChartTimeSeries.prototype.getPoints = function()
{
    return this.viewData.points;
}

StripChartTimeSeries.prototype.getLabels = function()
{
    return this.viewData.labels;
}

//
// Treat an array as a FIFO pushing new data on the
// end, and popping the oldest value off from the front.
//
// Returns the oldest entry popped off.
//
function FiFoArray(array, newData) {

    // Push new entry on the end.
    array.push(newData);

    var firstEntry = array[0];

    // remove the first entry
    array.shift();

    return firstEntry;
}

function TwelveHourTimeFormat(date)
{
    // Could not find a routine to pad leading zero's
    var smallNums = [
        "00", "01", "02", "03", "04", "05", "06", "07", "08", "09"
    ];

    var hours = date.getHours();

    if (hours > 12) {
        hours = hours - 12;
    }

    //
    // Keep the minutes and seconds at two digits so they line
    // up on the graph labels.
    //

    var minutes = date.getMinutes();
    if (minutes <= 9) {
        minutes = smallNums[minutes];
    }


    var seconds = date.getSeconds();
    if (seconds <= 9) {
        seconds = smallNums[seconds];
    }

    var timeString = hours + ":" + minutes + ":" + seconds;

    return timeString;
}

function TwentyFourHourTimeFormat(date)
{
    // Could not find a routine to pad leading zero's
    var smallNums = [
        "00", "01", "02", "03", "04", "05", "06", "07", "08", "09"
    ];

    var hours = date.getHours();

    //
    // Keep the minutes and seconds at two digits so they line
    // up on the graph labels.
    //

    var minutes = date.getMinutes();
    if (minutes <= 9) {
        minutes = smallNums[minutes];
    }


    var seconds = date.getSeconds();
    if (seconds <= 9) {
        seconds = smallNums[seconds];
    }

    var timeString = hours + ":" + minutes + ":" + seconds;

    return timeString;
}
