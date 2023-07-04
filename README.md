# alexa-content-analytics
Alexa content analytics pacakges adds content analytics to a custom skill by emitting content analytics to a designated endpoint.

## Install 

``` npm install alexa-content-analytics ```

## Usage

Add to the custom skill's ```response interceptor```  

```

const AlexaContentAnalytics  = require('alexa-content-analytics');

AlexaContentAnalytics.capture(handlerInput, config, payload);

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

## Authorization modes 

At present the client supports http PUT endpoints utilzing HTTP headers for authorization. See separate github repo for sample serverless http endpoint.