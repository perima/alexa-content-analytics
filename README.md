
Alexa content analytics package adds content analytics to a custom skill by emitting events to a designated endpoint. It currently supports  http API endpoints (see sample [AWS serverless http api endpoint](https://github.com/perima/http-api-analytics-ingest))

# Install 

First install the npm package in your project.

``` 

npm install alexa-content-analytics 

```

## Response interceptor 

Call AlexaContentAnalytics client in the custom skill's ``` response interceptor ``` so that every invocation is captured. If this is the first time you are adding a response interceptor to your custom skill make sure to add the interceptor in your lambda handler.

```

// requestInterceptor

const AlexaContentAnalytics  = require('alexa-content-analytics');

AlexaContentAnalytics.capture(handlerInput, config, payload);

```

## Sample skill response interceptor

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
                            {"your receiving analytics endpoint auth http headers"}
                        }
                }
            AlexaContentAnalytics.capture(handlerInput, config, payload);
        } catch (e) {
            console.error(JSON.stringify(e.message));
        }
    }
}


```


## Request Interceptor (optional)

If you wish to capture start time in seconds (so that you can work out total request duration in your analytics), you need to add the following code in your skill's request interceptor. 

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

## Add interceptor(s) to your lambda handler

```

export const handler = Alexa.SkillBuilders.custom()
    // call request interceptor before anything else 
    .addRequestInterceptors(RequestInterceptor) 

    // skill's other handlers here

    // call response interceptor last
    .addResponseInterceptors(ResponseInterceptor) 
    .lambda();

```

## Client Parameters
**handlerInput** 

The handlerInput object passed to your skill on invocation.

**config**

Configuration for the Alexa Analytics Client. 

**endPointUrl** (String). The https endpoint that will receive the events sent from your skill. 

 **headers** (Object) Authorization headers for the receiving endpoint.

```

{
    endPointUrl: "https://your-analytics-endpoint"
    headers: {
      your auth http headers
    },
    captureFullEnvelope: false
}

```

For more information on response interceptors see the  [Alexa documentation on interceptors](https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/handle-requests.html#request-and-response-interceptors).

 **payload** (Object). A json object with any data you want to capture in addition to what is captured automatically. For example the particular piece of content served to the user like stream title, news piece, quiz etc.



```

// Alexa-content-analytics client will capture the following information when invoked.

 // request start point, please enable in the response interceptor of your skill
 payload.startRequestSecs

// size of persistent storage used for the particular user
payload.persistentStorage.sizeUnit  // size storage unit (b, kb, mb etc)
  
// returns true if the device has a screen 
payload.displaydevicesupport 

// the resolution of the device if available 
payload.displayresolution 

// supported device interfaces for the device, for example APL
payload.devicesupportinterfaces

// unix seconds for the request endtime. 
// Can be used with startRequestSecs (if enabled to calculate total duration)
payload.endRequestSecs 

// intent invoked (if applicable)
payload.intentName 

// request type (for example playBackStop)
payload.requestType 

// the id of the device
payload.deviceId  

// device locale, for example en_au
payload.locale  

// the skill id invoked
payload.applicationId  

// the full request envelope 
payload.requestEnvelopeRequest 

```

# Authorization modes 

At present the client supports https API endpoints (PUT http method), utilzing HTTP headers for authorization. For more info on setting up an http endpoint see [sample serverless http API for more](https://github.com/perima/http-api-analytics-ingest).

# Output 

The client emits a json object.