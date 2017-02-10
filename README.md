
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
crossings, trianglation, and calculate an estimated position of
a signal source.

These estimated position calculations can be performed by a web
service, or a function/lambda triggered by a series of readings.

A web site may be setup to allow access to the information query
and report from any device. This web site consists of standard
HTML5 + Javascript that provides a REST/JSON client to the data
service. This is the basic infrastructure for mobile and tablet
access, in addition to providing the infrastructure for higher
level web applications services such as a real-time map.
