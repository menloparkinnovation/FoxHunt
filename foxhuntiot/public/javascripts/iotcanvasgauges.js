
//
//   Openpux Internet Of Things (IOT) Framework.
//
//   Copyright (C) 2016,2017 Menlo Park Innovation LLC
//
//   menloparkinnovation.com
//   menloparkinnovation@gmail.com
//
//   IoT Canvas Gauges Library
//

//
// This works with the HTML elements for the Canvas Gauges library.
//

function IoTGauge(name)
{
    var self = this;

    self.name = name;

    //
    // Support a highlight range around the needle
    //
    self.autoUpdateHighLight = false;
    self.highLightRange = 0;
}

//
// Update the gauge with a new reading.
//
// There may be multiple gauges of the same name in different
// views.
//
// This finds them all and updates them.
//
// Note: It does not look at the visibility tag relying on
// the library to be efficient when not in view. By keeping
// the data up to date, it will have the correct value
// when placed in view.
//
// Returns the count of gauges updated.
//
IoTGauge.prototype.update = function(newValue)
{
    var self = this;

    var updatedCount = 0;

    //
    // You can't use document.getElementById() on the gauges <canvas> element
    // because its not the gauge object.
    //
    // The actual gauge object is in document.gauges[].
    //

    document.gauges.forEach(function(gauge) {

        if (gauge.canvas.element.id == self.name) {

            //
            // Note: value updates do not require gauge.update() invoke.
            //

            gauge.value = newValue;

            self.updateHighLight(gauge, newValue);

            updatedCount++;
        }
    });

    return updatedCount;
}

//
// This allows a range around the need to be highlighted.
//
// For some applications it can represent the uncertainty of the reading.
//
IoTGauge.prototype.setHighLightRange = function(newValue)
{
    var self = this;

    self.highLightRange = newValue;
    self.autoUpdateHighLight = true;
}

//
// Update high light around the new value
//
IoTGauge.prototype.updateHighLight = function(gauge, newValue)
{
    var self = this;

    if (!self.autoUpdateHighLight) {
        return;
    }

    var highLights = gauge.options.highlights;

    // Get the red entry
    var h = highLights[1];

    //
    // "data-field_name" becomes just "field_name"
    //

    // Must convert the possible string of newValue to a number
    var num = Number(newValue);

    h.from = num - self.highLightRange;

    h.to = num + self.highLightRange;

    //
    // Larger changes to the overall presentation of the gauge
    // require specific update notifications.
    //
    var ob = {};

    // N.B. Same object is sent on update
    ob.highlights = highLights;

    gauge.update(ob);
}

IoTGauge.prototype.updateSize = function(scale_factor)
{
    var self = this;

    var updatedCount = 0;

    //
    // You can't use document.getElementById() on the gauges <canvas> element
    // because its not the gauge object.
    //
    // The actual gauge object is in document.gauges[].
    //

    document.gauges.forEach(function(gauge) {

        if (gauge.canvas.element.id == self.name) {

            // Just use a 300 pixel base line.
            var newHeight = 300 * scale_factor;
            var newWidth = 300 * scale_factor;

            var ob = {};

            ob.height = newHeight;
            ob.width = newWidth;

            gauge.update(ob);

            updatedCount++;
        }
    });

    return updatedCount;
}
