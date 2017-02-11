
# FoxHunt
An Amateur Radio Automatic Direction Finding (ADF/RDF) IoT application

Copyright MenloParkInnovation LLC.

Released under MIT license.

Application allows Amateur Radio RDF (Radio Direction Finding) units
to report time, position, frequency, relative bearing, signal strength
to an IoT data service.

The data may be pulled from the IoT data service for analysis, real time plotting
on a map, etc.

Web and/or mobile applications would provide application access to the data, and
provide a mobile web page for manual RDF reports and any additional information.

#Usage Model:

The usage model for the FoxHunter application is to have multiple fixed,
and mobile RDF units reporting in. It expects the RDF units to have
access to a GPS signal with accurate time and position information.

The report can be a relative, or true bearing depending on the setup.

All reports go into a database. This data may be queried for time
period, frequency, and a set of records returned with the reported
readings. Software can then use this information to perform bearing
crossings, triangulation, and calculate an estimated position of
a signal source.

These estimated position calculations can be performed by a web
service, or a function/lambda triggered by a series of readings.

A web site may be setup to allow access to the information query
and report from any device. This web site consists of standard
HTML5 + Javascript that provides a REST/JSON client to the data
service. This is the basic infrastructure for mobile and tablet
access, in addition to providing the infrastructure for higher
level web applications services such as a real-time map.

#Device Setup

To setup a device create a free Azure IoT Hub account which allows one device
to send reports every 5.5 seconds.

Each ADF/RDF unit reports to its own individually managed Azure IoT Hub to
allow use of the free tier, and also to distribute the management of
the ADF/RDF reporting domains since they are likely to be individual
hams or repeater groups.

Each individually managed IoT Hub may then publish a read-only key
to any individual or group that wants to aggregate their readings.

This allows for distributed, co-operative management of ADF networks.

www.azure.com

Once your free IoT Hub has been set up (suggested name ADFReport)
configure your IoT Hub credentials in setcredentials.sh and run
". ./setcredentials.sh" to set your credentials required by the application.

Then run the node.js program in setup_device. To do so:

> cd setup_device

> npm install     // only needed once

>./createdeviceidentity.sh

Be sure to record the newly allocated DeviceId and place it in setdevicecredentials.sh

#Reading ADF Device Reports

> ". ./setcredentials.sh"

> npm install     // only needed once

> ./readdevicetocloudmessages.sh

#Sending ADF Device Reports

> ./setdevicecredentials.sh

> cd send_reports

> npm install  // only needed once

> ./simulateddevice.sh

#Further Development

send_reports/SimulatedDevice.js provides a starting point for reporting data from your
ADF/RDF unit. Typically this will be done by a RaspberryPi, a laptop, or fixed PC.

ADF/RDF units may incorporate microcontrollers such as the Particle Photon for such
reports using the available C/C++ and multiple language bindings of Azure Iot Hub
and popular open protocols.

For disconnected operations an ADF unit may log reports and send them as a batch
when its eventually connected. The reports distinguish the time the report entry was
generated, from the time it is submitted to the Iot Hub. Data analysis applications use
the record reporting time for any bearing calculations.

Note that the batch reporting may be a separate computer, such as a laptop reporting
a batch of readings from an ADF units log on an SD "flash" card.

As the project moves forward additional code will be provided for reporting data
from specific ADF units, as well as basic web pages for data access and reports.

