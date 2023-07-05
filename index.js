const  { Alexa }  = require('ask-sdk');
const { v4: uuidv4 } = require('uuid');
const { filesize } = require("filesize");
const { DateTime } = require("luxon");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
var flatten = require('flat');


/**
 * 
 * Capture an analytics event
 * 
 * @param {object} handlerInput 
 * @param {object} config 
 * @param {object} payload  additional analytics info like player stream info
 */
exports.capture = function (handlerInput, config, payload) {
  getAlexaContentAnalytics(handlerInput, config, payload)
}

/**
 * 
 * Alexa Content Analytics client
 * 

 * @param {object} handlerInput 
 * @param {object} config 
 * @param {object} payload  additional analytics info like player stream info
 */
async function getAlexaContentAnalytics(handlerInput, config, payload) {
  /*
  let config = {
    endpointType: "http", // htttp sends event to http API,  ga for google analytics
    endPointUrl: "https://your-analytics-endpoint", // required when endpointType is http 
    ga_measurement_id: 'G-xxxxxxxxx', //required if sending to google analytics
    ga_api_secret: '`your GA4 data stream api key',
    headers: {
      your auth http headers
    },
    captureFullEnvelope: false
}
  }
  */
  switch (config.endpointType) {
    case "http":
      sendHttp(handlerInput, config, payload);
      break;
    case "ga":
      sendGA(handlerInput, config, payload);
      break;
    default:
      console.error('config.endpointType incorrect value ' + config.endpointType);
  }


}

async function sendHttp(handlerInput, config, payload) {
  try {
    payload = await processHandlerInput(payload, handlerInput, config);
    var iso = DateTime.fromISO(DateTime.now());
    payload.analyticsTimezoneName = iso.zoneName;
    payload.analyticsTimeStamp = iso.toString();
    payload.id = uuidv4();
    let a = new Promise((resolve) => {
      return fetch(config.endPointUrl, {
        method: 'PUT',
        headers: config.headers,
        body: JSON.stringify(payload)
      }).then(async (res) => {
        return res.json()
      })
        .then((data) => resolve(data)).catch((error) => {
          console.error('AlexaContentAnalytics put error', JSON.stringify(error, null, 2));
        }
        );
    });
  } catch (e) {
    console.error('AlexaContentAnalytics', JSON.stringify(e, null, 2));
  }
}


function removeUnused(payload){
  for(key in payload){
    if(payload[key] === ""){
      delete payload[key];
    }
  }
  return payload;
}

// ref:  https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag
async function sendGA(handlerInput, config, payload) {
  const measurement_id = config.ga_measurement_id;
  const api_secret = config.ga_api_secret;



  let aa = await processHandlerInput(payload, handlerInput, config);
  let b = flatten(aa, { delimiter: "_" });
  //(b);

  let eventName = "unknown";
  if ((b.requestType + b.intentName) !== "") {
    eventName = b.requestType + b.intentName;
  }

  b = removeUnused(b);

  /*
  console.log(JSON.stringify({
    client_id: 'XXXXXXXXXX',
    events: [{
      name:eventName,
      params: b,
    }]
  }, null, 2));
*/
  //  console.log(`https://www.google-analytics.com/mp/collect?measurement_id=${config.ga_measurement_id}&api_secret=${config.ga_api_secret}`)
  /*
  console.log(JSON.stringify({
    client_id: b.deviceId,
    events: [{
      name: eventName,
      params: b,
    }]
  }), null, 2);
  */
  // debug GA endpoint: `https://www.google-analytics.com/debug/mp/collect?measurement_id=${config.ga_measurement_id}&api_secret=${config.ga_api_secret}`
      fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${config.ga_measurement_id}&api_secret=${config.ga_api_secret}`, {
      method: "POST",
      body: JSON.stringify({
        client_id: payload.deviceId,
        events: [{
          name: eventName,
          params: b,
        }]
      })
    }).then(response=>response.toString()) // switch response.json for debug endpoint
    .then(data=>{ console.log(data); })

    return;
  let a = new Promise((resolve) => {
    return fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${config.ga_measurement_id}&api_secret=${config.ga_api_secret}`, {
      method: "POST",
      body: JSON.stringify({
        client_id: payload.deviceId,
        events: [{
          name: payload.requestType + payload.intentName,
          params: b,
        }]
      })
    }).then(async (res) => {
      console.log(res);
      //  return res
    })
      .then((data) => resolve(data)).catch((error) => {
        console.error('AlexaContentAnalytics sendGA', JSON.stringify(error, null, 2));
      }
      );
  });

}

/**
* 
* add additional info to payload
* Alexa node SDK utils: https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/utilities.html
* 
* @param payload 
* @param handlerInput 
* @returns 
*/
async function processHandlerInput(payload, handlerInput, config) {

  if (handlerInput === undefined) {
    return payload
  }
  payload.startRequestSecs = await getRequestStartTime(handlerInput);
  // payload.persistentStorage = getStorageFileSize(handlerInput);
  payload.displaydevicesupport = getDeviceDisplaySupport(handlerInput);
  payload.displayresolution = await getDeviceResolution(handlerInput);
  payload.devicesupportinterfaces = getdeviceSupportedInterfaces(handlerInput);
  payload.endRequestSecs = getEndRequestSecs();
  payload.intentName = getIntentName(handlerInput);
  payload.requestType = getRequestType(handlerInput);
  payload.deviceId = getDeviceId(handlerInput);
  payload.locale = getLocale(handlerInput);
  payload.applicationId = getApplicationId(handlerInput);
  if (config.captureFullEnvelope === true) { payload.requestEnvelopeRequest = getRequestEnvelope(handlerInput) }
  return payload;
}

/**
* 
* add device support meta
* 
* @param handlerInput 
* @returns 
*/
function getDeviceDisplaySupport(handlerInput) {
  try {
    let result = "false";
    let supportedInterfaces = Alexa.getSupportedInterfaces(handlerInput.requestEnvelope);
    /*
    display device supportedInterfaces:
    {
        AudioPlayer: {},
        'Alexa.Presentation.APL': { runtime: { maxVersion: '2023.1' } }
    }
 
    non display supportedInterfaces
    { AudioPlayer: {} }
 
    */

    if (supportedInterfaces['Alexa.Presentation.APL'] !== undefined) {
      result = "true";
    }

    return result;
  } catch (e) {
    console.error('AlexaContentAnalytics getDeviceDisplaySupport', JSON.stringify(e.message, null, 2));
    return "false";
  }
}


async function getDeviceResolution(handlerInput) {
  try {
    if (handlerInput.requestEnvelope.context !== undefined && handlerInput.requestEnvelope.context.Viewport !== undefined) {
      return {
        pixelWidth: await handlerInput.requestEnvelope.context.Viewport.pixelWidth,
        pixelHeight: await handlerInput.requestEnvelope.context.Viewport.pixelHeight
      }
    } else {
      return pixelWidth + "x" + pixelHeight
    }
  } catch (e) {
    console.error('AlexaContentAnalytics getDeviceResolution', JSON.stringify(e.message, null, 2));
    return "x"
  }
}


/**
 * 
 * The persistent attributes manager should contain an attribute named alexaContentAnalyticsRequestStartSecs for the event to capture correctly.
 * 
 * @param {*} handlerInput 
 * @returns 
 */
async function getRequestStartTime(handlerInput) {
  // add timings
  try {
    let requestAttributes;
    requestAttributes = await handlerInput.attributesManager.getRequestAttributes();
    return requestAttributes.alexaContentAnalyticsRequestStartSecs;
  } catch (e) {
    // payload.startRequestSecs = 0;
    console.error("AlexaContentAnalytics processHandlerInput startRequestSecs", JSON.stringify(e.message));
    return 0;
  }
}

async function getStorageFileSize(handlerInput) {
  try {
    let {
      attributesManager,
    } = handlerInput;
    let persistentAtttributes = await attributesManager.getPersistentAttributes();
    let attributesStr = JSON.stringify(persistentAtttributes);
    let filesizeobj = filesize(attributesStr.length, { base: 2, standard: "jedec", output: "object" });
    let response = {
      size: filesizeobj.value,
      sizeUnit: filesizeobj.unit
    };

    return response
  } catch (e) {
    console.error('AlexaContentAnalytics getStorageFileSize', JSON.stringify(e.message));
    let result = { size: "0", sizeUnit: "unknown" }
    console.error('AlexaContentAnalytics getStorageFileSize', result);

    return result;
  }
}


function getdeviceSupportedInterfaces(handlerInput) {
  try {
    return Alexa.getSupportedInterfaces(handlerInput.requestEnvelope);
  } catch (e) {
    console.error('AlexaContentAnalytics getdeviceSupportedInterfaces', JSON.stringify(e.message));
    return { APL: "unknown" };
  }
}

function getEndRequestSecs() {
  try {
    return DateTime.now().toMillis();
  } catch (e) {
    console.error(JSON.stringify('AlexaContentAnalytics getEndRequestSecs ', e.message));
    return 0;
  }
}

function getIntentName(handlerInput) {
  try {
    if (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest') {
      return Alexa.getIntentName(handlerInput.requestEnvelope);
    }
  } catch (e) {
    console.error('AlexaContentAnalytics getIntentName', JSON.stringify(e.message));
    return "";
  }
}

function getRequestType(handlerInput) {
  try {
    return Alexa.getRequestType(handlerInput.requestEnvelope);
  } catch (e) {
    console.error('AlexaContentAnalytics getRequestType', JSON.stringify(e.message));
    return "";
  }
}

function getDeviceId(handlerInput) {
  try {
    let deviceId = Alexa.getDeviceId(handlerInput.requestEnvelope);
    if (deviceId === "") { deviceId = "unknown" };
    return deviceId;
  } catch (e) {
    console.error('AlexaContentAnalytics getDeviceId', JSON.stringify(e.message));
    return "unknown";
  }
}

function getLocale(handlerInput) {
  try {
    return Alexa.getLocale(handlerInput.requestEnvelope);
  } catch (e) {
    console.error('AlexaContentAnalytics getLocale', JSON.stringify(e.message));
    return "unknown";
  }
}

function getApplicationId(handlerInput) {
  try {
    return handlerInput.requestEnvelope.context.System.application.applicationId;
  }
  catch (e) {
    console.error('AlexaContentAnalytics getApplicationId', JSON.stringify(e.message));
    return "unknown";
  }
}

function getRequestEnvelope(handlerInput) {
  try {
    return handlerInput.requestEnvelope.request;
    // console.log('AlexaContentAnalytics payload requestEnvelope', JSON.stringify(handlerInput.requestEnvelope, null, 2));
  } catch (e) {
    console.error('AlexaContentAnalytics getRequestEnvelope', JSON.stringify(e.message));
    return {};
  }
}



