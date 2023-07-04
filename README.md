# alexa-content-analytics
Alexa content analytics pacakges adds content analytics to a custom skill by emitting content analytics to a designated endpoint.

## Install 

``` npm install alexa-content-analytics ```

## Usage

### Response interceptor 

Add to the custom skill's ```response interceptor``` so that every invocation is captured.

```
// interceptors/requestInterceptor

const AlexaContentAnalytics  = require('alexa-content-analytics');

AlexaContentAnalytics.capture(handlerInput, config, payload);

```

**Sample skill response interceptor**

```

// interceptors/ResponseInterceptors
const AlexaContentAnalytics  = require('alexa-content-analytics');

export const ResponseInterceptor = {

    async process(handlerInput: any) {

        try{
            let payload = {}; // you can pass empty object or add more attributes to capture for example the http stream track title or player state
            let config = { // analytics endpoint configuration
                    endPointUrl: "https://your-analytics-endpoint"
                    headers: {
                            {"your auth http headers"}
                        }
                }
            AlexaContentAnalytics.capture(handlerInput, config, payload);
        } catch (e) {
            console.error(JSON.stringify(e.message));
        }
    }
}


```


### Request Interceptor (optional)

If you wish to capture start time in seconds (so that you can work out total request duration in your analytics), you need to add the following line in your skill's request interceptor :

```
// sample skill request interceptor
// interceptors/requestInterceptor

import * as Alexa from 'ask-sdk';
const { DateTime } = require("luxon");
export const RequestInterceptor = {

    async process(handlerInput: any) {
       
        try {
            let alexaContentAnalyticsRequestStartSecs = '';
            alexaContentAnalyticsRequestStartSecs = DateTime.now().toUnixInteger();
            let requestAttributes = await handlerInput.attributesManager.getRequestAttributes();
            requestAttributes.alexaContentAnalyticsRequestStartSecs = alexaContentAnalyticsRequestStartSecs;
            await handlerInput.attributesManager.setRequestAttributes(requestAttributes);
        } catch (e: any) {
            console.error("RequestInterceptor", JSON.stringify(e.message));
        }
    }

}

```

### Parameters
**handlerInput** 

The handlerInput object passed to your skill on invocation.

**config**

Configuration for the Alexa Analytics Client. Specifically the *endPointUrl* and the authorization *headers* for the receiving endpoint.

```

{
    endPointUrl: "https://your-analytics-endpoint"
    headers: {
      your auth http headers
    }
}

```

For more info on response interceptors see

 https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/handle-requests.html 

 **payload**

You can pass a json object with any data you want to capture. Please note that the client will capture the following when invoked automatically:

Alexa-content-analytics client will capture the following information when invoked 

```

  payload.startRequestSecs // request start point, please enable in the response interceptor of your skill
  payload.persistentStorage.size // size of persistent storage used for the particular user
  payload.persistentStorage.sizeUnit  // size storage unit (b, kb, mb etc)
  payload.displaydevicesupport // returns true if the device has a screen 
  payload.displayresolution // the resolution of the device if available 
  payload.devicesupportinterfaces // supported device interfaces for the device, for example APL
  payload.endRequestSecs // unix seconds for the request endtime. Can be used with startRequestSecs (if enabled to calculate total duration)
  payload.intentName // intent invoked (if applicable)
  payload.requestType // request type (for example playBackStop)
  payload.deviceId  // the id of the device
  payload.locale  // device locale, for example en_au
  payload.applicationId  // the skill id invoked
  payload.requestEnvelopeRequest // the full request envelope 

  ```

## Authorization modes 

At present the client supports http PUT endpoints utilzing HTTP headers for authorization. See separate github repo for sample serverless http endpoint.