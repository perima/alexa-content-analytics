const { Alexa }  = require('ask-sdk');
const { v4: uuidv4 } = require('uuid');
const { filesize } = require("filesize");
const { DateTime } = require("luxon");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


/**
 * 
 * Capture an analytics event
 * 
 * @param {object} handlerInput 
 * @param {object} config 
 * @param {object} payload  additional analytics info like player stream info
 */
exports.capture = function (handlerInput, config, payload) {
  getAlexaContentAnalytics()
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
  // configHeaders, endPointUrl

  /*
  let config = {
    endPointUrl: "https://your-analytics-endpoint"
    headers: {
      your auth http headers
    }
  }
  */
  try {
    payload = await processHandlerInput(payload, handlerInput);
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

/**
* 
* add additional info to payload
* Alexa node SDK utils: https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/utilities.html
* 
* @param payload 
* @param handlerInput 
* @returns 
*/
async function processHandlerInput(payload, handlerInput) {

  if (handlerInput === undefined) {
    return payload
  }
  payload.startRequestSecs = await getRequestStartTime(handlerInput);
  payload.persistentStorage = getStorageFileSize(handlerInput);
  payload.displaydevicesupport = getDeviceDisplaySupport(handlerInput);
  payload.displayresolution = await getDeviceResolution(handlerInput);
  payload.devicesupportinterfaces = getdeviceSupportedInterfaces(handlerInput);
  payload.endRequestSecs = getEndRequestSecs();
  payload.intentName = getIntentName(handlerInput);
  payload.requestType = getRequestType(handlerInput);
  payload.deviceId = getDeviceId(handlerInput);
  payload.locale = getLocale(handlerInput);
  payload.applicationId = getApplicationId(handlerInput);
  payload.requestEnvelopeRequest = getRequestEnvelope(handlerInput);
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
    let result = false;
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
      result = true;
    }

    return result;
  } catch (e) {
    console.error('AlexaContentAnalytics getDeviceDisplaySupport', JSON.stringify(e.message, null, 2));
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
      return {
        pixelWidth: "",
        pixelHeight: ""
      }
    }
  } catch (e) {
    console.error('AlexaContentAnalytics getDeviceResolution', JSON.stringify(e.message, null, 2));
    return {
      pixelWidth: "",
      pixelHeight: ""
    }
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
    payload.startRequestSecs = 0;
    console.error("AlexaContentAnalytics processHandlerInput startRequestSecs", JSON.stringify(e.message));
    return -1;
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

    return {
      size: filesizeobj.value,
      sizeUnit: filesizeobj.unit
    }
  } catch (e) {
    console.error('AlexaContentAnalytics getStorageFileSize', JSON.stringify(e.message));
    return {
      size: -1,
      sizeUnit: "unknown"
    }
  }
}


function getdeviceSupportedInterfaces(handlerInput) {
  try {
    payload.devicesupportinterfaces = Alexa.getSupportedInterfaces(handlerInput.requestEnvelope);
  } catch (e) {
    console.error('AlexaContentAnalytics getdeviceSupportedInterfaces', JSON.stringify(e.message));
    return {};
  }
}

function getEndRequestSecs() {
  try {
    return DateTime.now().toMillis();
  } catch (e) {
    console.error(JSON.stringify('AlexaContentAnalytics getEndRequestSecs ', e.message));
    return -1;
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
    return Alexa.getDeviceId(handlerInput.requestEnvelope);
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



