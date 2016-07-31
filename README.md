# js-utils

Keeping collection of useful JavaScript utilities.

## Network Status
NavigatorOnLine API gives the network's online/offline status it gets from the operating system. This status may not be useful because the system may be online connected to local network, but the client app not able to reach server on the web. 

Here we have webworker that sends requests to the server to find connectivity to the server.