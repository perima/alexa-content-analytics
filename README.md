# alexa-content-analytics
Alexa content analytics pacakges adds content analytics to a custom skill by emitting content analytics to a designated endpoint.


# authorization modes 

## config headers

## Put 


### Parameters 

timeZone, the timezone for the analytics event should a timezone not be available from the device.


# Usage

```

const AlexaContentAnalytics  = require('alexa-content-analytics');

AlexaContentAnalytics.capture();

```
