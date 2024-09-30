// @ts-check
window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Content = Typerefinery.Components.Content || {};
Typerefinery.Components.Content.Embed = Typerefinery.Components.Content.Embed || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, componentNs, eventNs, tmsNs, document, window) {
    "use strict";

    ns.selectorComponent = '[component=embed]';

    ns.ACTION_EVENT_PROXY = "EVENT_PROXY"; //emmit event from iframe as if it was raised by this component
    ns.ACTION_DATA_REQUEST = "DATA_REQUEST"; //request data by iframe
    ns.ACTION_DATA_PAYLOAD = "DATA_PAYLOAD"; //deliver data to iframe
    ns.ACTION_DATA_SOURCE = "DATA_SOURCE"; //change source for iframe
    
    //actions supported by this component
    ns.ACTIONS = {
      EVENT_PROXY: ns.ACTION_EVENT_PROXY, //emmit event from iframe as if it was raised by this component
      DATA_REQUEST: ns.ACTION_DATA_REQUEST, //request data by iframe
      DATA_PAYLOAD: ns.ACTION_DATA_PAYLOAD, //deliver data to iframe
      DATA_SOURCE: ns.ACTION_DATA_SOURCE //change source for iframe
    }

    // map event types to handlers in component
    // this will indicate which events are supported by component
    ns.eventMap = eventNs.genericEventsTopicMap();

    // change src for iframe
    ns.updateDataSource = ($component, config) => {
      console.group("updateDataSource");
      console.log(["updateDataSource", $component, config]);
      //check if config has source or config.config.source then get is value
      let sourceUrl = config.source || config.config.source;

      const payloadData = config.payload || {};
      
      if (sourceUrl) {
        sourceUrl = componentNs.replaceRegex(sourceUrl, payloadData)
        console.log(["update iframe source", sourceUrl]);
        $component.find("iframe").attr("src", sourceUrl);
      } else {
        console.error("no source was specified");
      }
      console.groupEnd();
    }

    //send message to iframe
    ns.sendMessageToiFrame = function($component, action, data) {
      console.group("sendMessageToiFrame on " + window.location);


      var sourceData = data;
      if (typeof sourceData === 'string') {
        sourceData = JSON.parse( data );
      }

      if (!sourceData) {
        console.error("no data to send");
        console.groupEnd();
        return;
      }

      // console.log(["sendMessageToiFrame", data]);
      var $iframe = $component.find("iframe");
      var iframe = $iframe[0];
      console.log(["sendMessageToiFrame", action, sourceData, $iframe, iframe]);
      //if iframe does not have TypeRefinery then it will need to manage its own events
      iframe.contentWindow.postMessage(sourceData, "*");

      
      //call events
      //TODO: this will trigger CORS issue
      try {
        if (iframe.contentWindow.Typerefinery.Page.Events) {
          const topic = sourceData.type;
          iframe.contentWindow.Typerefinery.Page.Events.emitEvent(topic, sourceData);
        }
      } catch (error) {
        console.error("sendMessageToiFrame", error);
      }
      console.groupEnd();
    }

    ns.autoLoad = ($component) => {
      console.group("autoLoad");
      // if autoResize is set to true, then register the autoResize event.
      const componentConfig = componentNs.getComponentConfig($component);
      console.log(["autoLoad", componentConfig.autoResize]);
      if (componentConfig.autoResize) {
        console.log(["register outo resie event"]);
        $component.on("load", function() {
            ns.autoResize($component);
        });
      }
      console.groupEnd();
    }

    ns.autoResize = ($component) => {
      if (!$component) {
          return;
      }
      const $iframe = $component.find("iframe");
      //console.log(["autoResize", embedid, $iframe]);
      var newHeight = $iframe.contents().height()+200;
      var maxHeight = $iframe.attr("max-height");

      // set new height to maxheight if its specified.
      if (maxHeight && parseInt(maxHeight, 10)) {
          if (parseInt(maxHeight, 10) < newHeight) {
              newHeight = maxHeight;
          }
      }
      //console.log(["autoResize newHeight", embedid, newHeight]);
      $iframe.height(newHeight);
    }

    // local actions
    ns.EVENT_PROXY = ($component, componentConfig, data) => {
      console.group(ns.ACTION_EVENT_PROXY);
      console.log([ns.ACTION_EVENT_PROXY, $component, componentConfig, data]);
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_PROXY, ns.ACTIONS.EVENT_PROXY);
      console.groupEnd();
    }

    ns.DATA_PAYLOAD = ($component, eventData, doNotSave) => {
      console.group(ns.ACTION_DATA_PAYLOAD);
      console.log([ns.ACTION_DATA_PAYLOAD, $component, eventData, doNotSave]);
      
      //TODO: save data to local storage      
      // if (ns.useLocalStorage && !doNotSave) {
      //   const { topic, data } = eventData;
      //   console.log("save data to local storage");
      //   //save data to local storage to load nexr time
      //   localStorage.setItem(`${topic}`, JSON.stringify(data));
      // }
      
      console.log("send data to iframe");
      //TODO: send data to iframe
      ns.sendMessageToiFrame($component, ns.ACTION_DATA_PAYLOAD, eventData);
      console.log("data sent to iframe");
      console.groupEnd();
    }

    /**
     * Get data from endpoint
     * @param {*} $component component instance
     * @param {*} componentConfig component configuration
     * @param {*} eventData event data
     * @param {*} endpointConfig endpoint configuration to make request, needs to have at least url
     */
    ns.DATA_REQUEST = ($component, componentConfig, eventData, endpointConfig) => {
      console.group(ns.ACTION_DATA_REQUEST);
      console.log([ns.ACTION_DATA_REQUEST, $component, componentConfig, endpointConfig]);
      console.log(["getRequest", endpointConfig]);
      //TODO: get data - make a get request to the url
      let url = endpointConfig.url;
      let requestMethod = endpointConfig.method || "GET";
      let responseContentType = endpointConfig.responseContentType || "application/json";
      ns.getRequest(
        $component, 
        eventData, 
        url, 
        ($component, eventData) => {
          console.log(["getData success", $component, eventData]);
          // raise event - ns.ACTION_DATA_PAYLOAD
          ns.sendMessageToiFrame($component, ns.ACTION_DATA_PAYLOAD, eventData);
          console.log(["getData done"]);
          return eventData;
        }, 
        ($component, data) => {
          console.log(["getData error", $component, data]);
          return data;
        }, 
        requestMethod, 
        responseContentType
      );
      console.log(["DATA_REQUEST initiated", $component, componentConfig, url]);
      //eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.DATA_REQUEST, ns.ACTIONS.DATA_REQUEST);
      console.groupEnd();
    }

    // json form post
    ns.getRequest = async ($component, eventData, url, successCallbackFn, errorCallbackFn, requestMethod, responseContentType) => {
      const contentType = responseContentType || "application/json";
      const method = requestMethod || "GET";
      const responseData = await ns.fetch(
        $component,
        url,
        method,
        contentType,
        eventData,
        null,
        successCallbackFn,
        errorCallbackFn,
      );
      return responseData;
    };

    // send the request to the server
    ns.fetch = async ($component, url, method, contentType, eventData, body, successCallback = ($component, data) => { }, errorCallback = ($component, data) => { }) => {
      console.group(["fetch", url, method, contentType, body]);
      console.log([url, method, contentType, body])
      let controller = new AbortController();
      try {          
        await window.fetch(url, {
          method: method || 'GET',
          headers: {
            'Content-Type': contentType || 'application/x-www-form-urlencoded'
          },
          body: body,
          keepalive: true,
          redirect: 'follow',
          signal: controller.signal
        })
        .then(response => response.json())
        .then(responseJson => {
          console.group("fetch response");
          successCallback($component, {
            ...eventData,
            url: url, 
            method: method, 
            payloadType: contentType, 
            body: body,
            ok: true,
            data: responseJson,
          })
          console.groupEnd();
        });
      
      } catch (error) {
          console.group("Error in submitting the request");
          console.error(error);
          errorCallback($component, {
            ...eventData,
            url: url, 
            method: method, 
            payloadType: contentType, 
            body: body,
            error: error,
          });
          console.groupEnd();
      }
      controller = null;
      console.groupEnd();
      return;
  };
  

    //listen for data from TMS and run callback
    ns.useLocalStorage = false;
    ns.tmsConnected = function ($component, host, topic, callbackFn) {
      console.group(`tmsConnected ${host} ${topic} on ${window.location}`);
      try {         
          let componentConfig = componentNs.getComponentConfig($component);
          tmsNs.registerToTms(host, topic, componentConfig.resourcePath, callbackFn);
          if (ns.useLocalStorage) {
            const componentData = localStorage.getItem(`${topic}`);
            if (!componentData) {
              console.warn("no data found in local storage");
            } else {
              callbackFn(JSON.parse(componentData));
            }
          }
      } catch (error) {
          console.error("tmsConnected", host, topic, error);
      }
      console.groupEnd();
    };

    // // iframe has requested data    
    // ns.handleDataRequest = ($component, componentConfig, event) => {
    //   console.group("handleDataRequest getData");
    //   console.log(["handleDataRequest getData", $component, componentConfig, event]);
    //   ns.DATA_REQUEST($component, componentConfig, event);
    //   console.groupEnd();
    // }        

    // decide which action to take based on action name
    ns.handleEventAction = ($component, action, data) => {
      console.log(["handleEventAction", $component, action, data]);
      //load data into form
      if (action === ns.ACTION_EVENT_PROXY) {
        //send message to iframe
        ns.sendMessageToiFrame($component, action, data.payload);
      } else if (action === ns.ACTION_DATA_PAYLOAD) {
        ns.sendMessageToiFrame($component, action, data.payload);
      // } else if (action === ns.ACTION_DATA_REQUEST) {
      //   ns.handleDataRequest($component, data);
      } else if (action === ns.ACTION_DATA_SOURCE) {
        ns.updateDataSource($component, data);
      } else {
        console.error(["handleEventAction unsupported action", action]);
      }
    }

    // function to check if string is JSON
    ns.isJsonString = (str) => {
      try {
          JSON.parse(str);
      } catch (e) {
          return false;
      }
      return true;
    }

    //function to convert string to JSON or return string
    ns.parseJson = (str) => {
      if (ns.isJsonString(str)) {
        return JSON.parse(str);
      }
      return str;
    }

          
    
    ns.addEventListener = ($component, componentConfig) => {
      console.group('addEventListener embed');
      const { events, id } = componentConfig;
      const defaultTopic = id;

      console.log(["config", events, id, defaultTopic]);

      console.log("registering events");
      //register events
      if (events) {        
        events.forEach(event => {
          const { topic, type, name, nameCustom, action, config} = event;
          const configData = ns.parseJson(config) || "";
          //if topic not set use component id as topic
          const topicName = topic || defaultTopic;
          // if type is not defined then its emitted
          let typeName = type || eventNs.EVENT_TYPE_LISTEN; //default is listen

          //custom name takes precidence over name, this will be raised as event name
          let eventName = nameCustom || name;

          console.groupCollapsed(`event ${typeName} - ${action}:${topic}`);
          console.log(["event", event]);

          // if action is EVENT_PROXY 

          // if action is EVENT_PROXY then add the event to registry
          // does ns.ACTIONS have this action
          if (ns.ACTIONS[action]) {

            console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap), topicName, typeName, action, eventName]);
            eventNs.registerEventActionMapping(ns.eventMap, id, topicName, typeName, action, eventName, configData);
            console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap)]);

            // if event type is listen then add event listener for the event
            if (typeName === eventNs.EVENT_TYPE_EMIT) {
              //NOTE: this is the event that will be raised by iFrame
              // iframe will raise events and this component will emit them

              //TODO: add new event to allow sending data to tms
              //NOTE: handle all different actions in windowListeneriFrameEvent
              if (action === ns.ACTION_EVENT_PROXY) {
                console.log(["add windowListeneriFrameEvent for this component", action, id, configData]);
                //listen for global message events that are emited by iframe
                ns.addEventEmitter($component, componentConfig, topicName, eventName, action, configData, (data) => {
                  console.log(["windowListeneriFrameEvent callback", topicName, eventName, action, data, configData]);
                  // proxy all events
                  console.log(["EVENT_PROXY", $component, componentConfig, data]);
                  ns.EVENT_PROXY($component, componentConfig, data);
                });
              } else if (action === ns.ACTION_DATA_REQUEST) {
                console.log(["add windowListeneriFrameEvent for this component", action, id, configData]);
                //listen for data request that are emited by iframe and conver these to data request events
                ns.addEventEmitter($component, componentConfig, topicName, eventName, action, configData, (data) => {
                  console.log(["windowListeneriFrameEvent callback", topicName, eventName, action, data]);
                  console.log(["DATA_REQUEST", $component, componentConfig, configData]);                  

                  // get url from config or use config as url
                  let endpointConfig = {};                  
                  if (typeof configData === 'string') {
                    endpointConfig.url = configData;
                  } else {
                    endpointConfig = configData;
                  }

                  const eventData = {
                    ...data,
                    topicName: topicName,
                    eventName: eventName,
                    action: action,
                    endpointConfig: endpointConfig
                  }
                  eventData.target = "iframe-" + id;
                  //check if config is possible JSON string

                  ns.DATA_REQUEST($component, componentConfig, eventData, endpointConfig);
                });
              }
            } else {
                //listen register the event and listent for specific event on topic
                console.log(["registerEvents", topicName, eventName]);

                if (eventName === eventNs.EVENTS.EVENT_TOPIC_PAYLOAD) {
                 
                  //if config is string then use it as host
                  const host = (typeof configData === 'string' ? (configData ? configData : false) : (typeof configData === 'object' ? configData.host : false)) || "ws://localhost:8112/$tms"; //TODO: get host default value from config
                  //add warning if host is not set
                  if (!host) {
                    console.warn("host not set for TMS address.");
                  }
                  console.log(["register with TMS", host, topicName]);

                  const url = typeof configData === 'string' ? configData : configData.url;
                  //add warning if url is not set
                  if (!url) {
                    console.warn("url is not set for Payload.");
                  }

 
                  ns.tmsConnected($component, host, topicName, (data) => {
                    const eventData = {
                      topicName: topicName,
                      eventName: eventName,
                      action: action,
                      url: url,
                      data: data,
                      target: "iframe-" + id,
                      source: host
                    }
                    console.log(["tms data callback", topicName, eventName, data]);
                    // check make sure the event is for this event
                    // ns.handleEventAction($component, action, data);
                    ns.DATA_PAYLOAD($component, eventData);
                  });
                  //console.warn("register with TMS, not implemented");
                } else {
                  eventNs.registerEvents(topicName, (data) => {
                    console.log(["registerEvents callback", topicName, eventName, data]);
                    // check make sure the event is for this event
                    if (data.type === eventName) {
                      ns.handleEventAction($component, action, data);
                    }
                  });
                }
                //need to reach into the frame and register message event
                //this will ensure that only messages from this frame are listened
                //windowListener
            }
          } else {
            console.error(["unsupported action", action]);
          }

          console.log(["addEventListener done"]);
          console.groupEnd();
        });
      }

      console.log(["eventMap", ns.eventMap]);

          
      console.groupEnd();
    }

    ns.isProxyEnabled = ($component, componentConfig) => {

      //for all keys in eventMap check if any action is EVENT_PROXY
      for (const key in ns.eventMap) {
        if (ns.eventMap.hasOwnProperty(key)) {
          const events = ns.eventMap[key];
          for (const key in events) {
            if (events.hasOwnProperty(key)) {
              const event = events[key];
              if (event.action === eventNs.EVENTS.EVENT_PROXY) {
                //does this event has maping to this component
                if (events.hasOwnProperty(componentConfig.id)) {
                  return true;
                }
              }
            }
          }
        }
      }
      
      return false;

    }

    //all the callbacks for events, these are the actions to be taken when event is raised
    ns.windowListeneriFrameEventCallBacks = new Map();
    ns.addEventEmitter = function($component, componentConfig, topicName, eventName, action, configData, callbackFn) {
      console.groupCollapsed(`embed addEmitter for ${topicName},${eventName},${action}, on ${window.location}`);
      console.log(["addEmitter", topicName, eventName, action, configData, callbackFn]);

      const { id } = componentConfig;
      const callbackId = `${id}-${topicName}-${eventName}-${action}`;
      
      ns.windowListeneriFrameEventCallBacks.set(callbackId,{
        $component: $component,
        componentConfig: componentConfig,
        topicName: topicName,
        eventName: eventName,
        action: action,
        config: configData,
        callbackFn: callbackFn
      })
      console.log(["windowListeneriFrameEventCallBacks", ns.windowListeneriFrameEventCallBacks]);
      ns.bindWindowListeneriFrameEvent($component);
      console.groupEnd();
    }

    ns.windowListeneriFrameEventBound = false;
    ns.bindWindowListeneriFrameEvent = function($component) {
      console.groupCollapsed("bindWindowListeneriFrameEvent");
      console.log(["bindWindowListeneriFrameEvent", ns.windowListeneriFrameEventBound]);
      if (ns.windowListeneriFrameEventBound) {
        console.groupEnd();
        return;
      }
      ns.windowListeneriFrameEvent($component);
      ns.windowListeneriFrameEventBound = true;
      console.log(["bindWindowListeneriFrameEvent", ns.windowListeneriFrameEventBound]);
      console.groupEnd();
    }
    
    ns.processWindowListenerEvent = function($component, event, sourceData) {
      console.groupCollapsed(`processWindowListenerEvent ${sourceData.type}`);
      console.log(["processWindowListenerEvent", $component, event, sourceData]);
      const eventType = sourceData.type;
      const eventAction = sourceData.action;
      console.log(["eventType", eventType]);
      console.log(["eventAction", eventAction]);
      console.log(["sourceData", sourceData]);
      const countofCallbacks = ns.windowListeneriFrameEventCallBacks.size;
      console.log(`find matching callbacks for event ${eventAction}:${eventType} in ${countofCallbacks} callbacks`);

      let hasCatchAll = false;

      const matchedCallbacksArray = [...ns.windowListeneriFrameEventCallBacks];

      console.log(["matchedCallbacksArray", matchedCallbacksArray]);

      //find all callbacks that match the event
      const matchedCallbacks = [...ns.windowListeneriFrameEventCallBacks].filter(([key, callBack]) => {
        const callBackAction = callBack.action; //action component supports
        const callBackTopicName = callBack.topicName; //topic name, should match event type
        // const eventName = callBack.eventName; //named or custom event name
        console.groupCollapsed(`callBack action ${callBackAction}:${callBackTopicName}`);
        console.log(["callBack", callBack]);
        console.log(["callBackAction", callBackAction]);
        console.log(["callBackTopicName", callBackTopicName]);
        // console.log(["eventName", eventName]);
        const isProxyEvent = (callBackAction === ns.ACTION_EVENT_PROXY);
        const isActionMatch = (callBackAction === eventAction);
        const isTopicMatch = (callBackTopicName === eventType);
        const isCatchAll = (callBack.config ? (callBack.config.catchAll ? callBack.config.catchAll : false) : false);
        if (isProxyEvent) {
          console.warn(["isProxyEvent", isProxyEvent]);
        } else {
          console.log(["isProxyEvent", isProxyEvent]);
        }
        if (isActionMatch) {
          console.warn(["isActionMatch", isActionMatch]);
        } else {
          console.log(["isActionMatch", isActionMatch]);
        }
        if (isTopicMatch) {
          console.warn(["isTopicMatch", isTopicMatch]);
        } else {
          console.log(["isTopicMatch", isTopicMatch]);
        }
        if (isCatchAll) {
          console.warn(["isCatchAll", isCatchAll]);
          hasCatchAll = true;
        } else {
          console.log(["isCatchAll", isCatchAll]);
        }

        // if event is proxy and is catch all then match all events
        // if event is proxy then match topic only
        // if action is match and topic is match then match
        if ((isProxyEvent && isCatchAll) || (isProxyEvent && isTopicMatch) ||  (isActionMatch && isTopicMatch)) {
          console.log(["match"]);
          console.groupEnd();
          return true;
          //callBack.callbackFn(sourceData);
        } else {
          console.warn("no match");
        }
        console.groupEnd();
        return false;
      });

      console.log(["matchedCallbacks", matchedCallbacks]);


      if (matchedCallbacks.length > 0) {
        if (matchedCallbacks.length == 1) {
          console.log(["matchedCallbacks", matchedCallbacks]);
          const callBackItem = matchedCallbacks[0];
          const callBack = callBackItem[1];
          const callBackKey = callBackItem[0];
          console.log([`callBack exec ${callBackKey}`, callBack]);
          // if callbackFn is set then call it
          if (callBack.callbackFn) {
            callBack.callbackFn(sourceData);
            console.log([`callBack done ${callBackKey}`]);
          } else {
            console.error(`no callback function found ${callBackKey}`);
          }
        } else {
          //order the to have the catch all last
          matchedCallbacks.sort((a, b) => {
            if (a.config && a.config.catchAll) {
              return 1;
            }
            return 0;
          });
      
          console.log(["matchedCallbacks", matchedCallbacks]);

          //run callbacks
          matchedCallbacks.forEach(([key, callBack]) => {
            //skip catch all but not if catchAllAlways is set
            if (callBack.config && callBack.config.catchAll && !callBack.config.catchAllAlways) {
              return;
            }          

            console.log([`callBack exec ${key}`, callBack]);
            // if callbackFn is set then call it
            if (callBack.callbackFn) {
              callBack.callbackFn(sourceData);
              console.log([`callBack done ${key}`]); 
            } else {
              console.error(`no callback function found ${key}`);
            }
          });
        }        
      } else {
        console.warn("no matching callbacks found");
      }
      console.groupEnd();
    };

    /* listen for window post messages sent by iframe to this component */
    ns.windowListeneriFrameEvent = function($component) {
      const iFrameContentWindow = $component.find("iframe")[0].contentWindow;
      console.log(["windowListeneriFrameEvent", iFrameContentWindow]);
      
      //listen for global message events that are emited by iframe
      window.addEventListener('message', function(event) {  
        console.groupCollapsed(`embed windowListeneriFrameEvent on ${window.location}`);
        if (event.source == iFrameContentWindow) {
          //this message is from component iframe
          console.log(["event", event]);
          var eventData = event.data;
          var sourceWindow = event.source;
          var sourceOrigin = event.origin;
          console.log(["sourceWindow", sourceWindow, "sourceOrigin", sourceOrigin, "eventData", eventData]);

          var sourceData = eventData;
          if (typeof eventData === 'string') {
            sourceData = JSON.parse( eventData );
          }
        
          if (sourceData) {
            console.log(["sourceData", sourceData]);

            ns.processWindowListenerEvent($component, event, sourceData);
          }
        } else {
          console.warn("event.source does not match component iframe, ignoring");
        }
        console.groupEnd();
      });
    };

    ns.init = ($component) => {
      console.groupCollapsed("embed init");
      const componentConfig = componentNs.getComponentConfig($component);
      // check if the component have a data attribute with the name "data-field-componentId" and "data-field-name" then register eventNs
      // const componentId = $component.attr("data-field-componentId");
      // const fieldName = $component.attr("data-field-name");
      console.log(["embed init", componentConfig]);

      //run events for this component when it loads
      ns.autoLoad($component);

      console.log(["addEventListener"]);
      // add event listener that have been configured for this component
      ns.addEventListener($component, componentConfig);

      console.log(["embed init done"]);
      console.groupEnd();
    }
}
)(
  // @ts-ignore
  window.jQuery, 
  Typerefinery.Components.Content.Embed, 
  Typerefinery.Components, 
  Typerefinery.Page.Events, 
  Typerefinery.Page.Tms,
  document,
  window
);

