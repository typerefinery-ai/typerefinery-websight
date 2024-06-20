window.Typerefinery = window.Typerefinery || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, document, window) {
    "use strict";

    ns.registery = {};

    ns.CUSTOM_EVENT_NAME = "customEvent";

    // component event types
    ns.EVENT_TYPE_EMIT = "emit";
    ns.EVENT_TYPE_LISTEN = "listen";

    // cache for events
    ns.EVENTS_CACHE = null;
    // component generic events
    ns.EVENTS = {
      //item crud
      EVENT_ITEM_CREATE: "createitem",
      EVENT_ITEM_READ: "readitem",
      EVENT_ITEM_UPDATE: "updateitem",
      EVENT_ITEM_DELETE: "deleteitem",
      EVENT_ITEM_SELECT: "selectitem",
      //component crud
      EVENT_CREATE_ACTION: "createaction",
      EVENT_READ_ACTION: "readaction",
      EVENT_UPDATE_ACTION: "updateaction",
      EVENT_DELETE_ACTION: "deleteaction",
      EVENT_FILTER_ACTION: "filteraction",
      //action success/error
      EVENT_SUCCESS_ACTION: "successaction",
      EVENT_CANCEL_ACTION: "cancelaction",
      EVENT_RESET_ACTION: "resetaction",
      EVENT_SUBMIT_ACTION: "submitaction",
      EVENT_ERROR_ACTION: "erroraction"      
    }

    //return object with all generic events
    ns.genericEvents = function(initValue) {
      var eventMap = {};
      // add all generic events
      for (var key in ns.EVENTS) {
        //copy value into new object
        eventMap[ns.EVENTS[key]] = JSON.parse(JSON.stringify(initValue));
      }
      return eventMap;
    };

    //map of events to topics, each event when occures will be attached to all mapped topics
    // type (listen,emit) -> event (string) -> [topics] (string)
    ns.genericEventsTopicMap = function() {
      if (ns.EVENTS_CACHE) {
        return ns.EVENTS_CACHE;
      }
      ns.EVENTS_CACHE = {};
      //ns.EVENTS_CACHE[ns.EVENT_TYPE_EMIT] = ns.genericEvents([]);
      //ns.EVENTS_CACHE[ns.EVENT_TYPE_LISTEN] = ns.genericEvents([]);
      return ns.EVENTS_CACHE;      
    }

    //add event mapping in eventMap local to component, maps component action to topic with event, for quick access by functions.
    ns.registerEventActionMapping = function(eventMap, componentId, topic, type, componentAction, eventName, config) {
      console.group('registerEventActionMapping');
      console.log(eventMap, topic, type, componentAction, eventName, config);
      //check if params are passed
      if (!topic || !componentAction || !eventMap) {
        console.error("missing params");
        return;
      }

      // check if type is valid, and set to emit if not
      if (type !== ns.EVENT_TYPE_EMIT && type !== ns.EVENT_TYPE_LISTEN) {
        type = ns.EVENT_TYPE_EMIT;
        console.warn("resetting type to emit, invalid type passed");
      }

      //create event config
      let topicAction = {
        topic: topic,
        action: componentAction,
        event: eventName,
        config: config
      }

      //init event type, EMIT or LISTEN
      if (!eventMap[type]) {
        eventMap[type] = {};
        console.warn(`event type not found ${type}, creating new type ${type}`);
      }

      //init component action that maps to event name
      if (!eventMap[type][componentAction]) {
        eventMap[type][componentAction] = {};
        console.warn(`event action not found ${componentAction}, creating new action ${componentAction}`);
      } 

      //init mapped event name to component id
      if (!eventMap[type][componentAction][componentId]) {
        eventMap[type][componentAction][componentId] = {};
        console.warn(`component id not found ${componentId}, creating new component id ${componentId}`);
      }

      console.log(["topicAction", topicAction]);

      //init mapped event name that maps to topic
      if (!eventMap[type][componentAction][componentId][eventName]) {
        eventMap[type][componentAction][componentId][eventName] = [topicAction];
        console.warn(`event name not found ${eventName}, creating new event name with topic ${topic}`);
      } else {
        //add event to type
        eventMap[type][componentAction][componentId][eventName].push(topicAction);
        console.warn(`component action found ${eventName}, adding topic to component action ${topic}`);
      }

      console.groupEnd();
    };

    ns.emitEvent = (topic, payload) => {
        console.group('emitEvent');
        console.log(["topic", topic, "payload", payload]);
        const evt = document.createEvent(ns.CUSTOM_EVENT_NAME);
        evt.initCustomEvent(ns.CUSTOM_EVENT_NAME, false, false, { topic, payload });
        ns.socket.dispatchEvent(evt);
        console.groupEnd();
    };

    ns.createWebSocketConnection = () => {
        ns.socket = new EventTarget();
    };

    ns.windowListener = function() {
      console.log("windowListener added");
      window.addEventListener('message', function(event) {  
        console.group('windowListener');
        console.log(["event", event]);
        var eventData = event.data;
        var sourceWindow = event.source;
        var sourceOrigin = event.origin;
        console.log(["sourceWindow", sourceWindow, "sourceOrigin", sourceOrigin, "eventData", eventData]);
        // if (event.origin !== window.location.origin) {
        //   console.error("origin not matched");
        //   return;
        // }

        var sourceData;
        if (eventData) {
          if (typeof eventData === 'string') {
            sourceData = JSON.parse( eventData );
          }
        }

        console.log(["sourceData", sourceData]);

        if (sourceData) {
          const { action, payload } = sourceData;
          console.log(["action", action, "payload", payload]);
          console.log(["registery", ns.registery]);
          console.log(["ns.registery action", ns.registery[action]]);


          const eventPayloadData = ns.compileEventData(payload, action, sourceData.action, sourceData.componentId, sourceData.config);

          console.log(["eventPayloadData", eventPayloadData]);
          // ns.emitLocalEvent($component, componentConfig, ns.eventMap, data, action, action);
          ns.emitEvent(action, eventPayloadData);
          // if (ns.registery[action]) {
          //   console.log("topic found", action);
          //   ns.registery[action].forEach((callbackFn) => {
          //     console.log("callbackFn", callbackFn);
          //     if (typeof callbackFn === 'function') {
          //       callbackFn(payload);
          //     } 
          //   });
          // }
        }
        console.groupEnd();
      });
    };

    ns.socketListener = () => {
      console.log("socketListener added");
      ns.socket.addEventListener(ns.CUSTOM_EVENT_NAME, (e) => {
        console.group('socketListener');
        const detail = e.detail;
        const { topic, payload } = detail;
        console.log(["topic", topic, "payload", payload]);
        if (ns.registery[topic]) {
          console.log("topic found", topic);
          ns.registery[topic].forEach((callbackFn) => {
            console.log("callbackFn", callbackFn);
            if (typeof callbackFn === 'function') {
              callbackFn(payload);
            }
          });
        }
      });
    };

    ns.emitLocalEvent = ($component, componentConfig, eventMap, payload, eventName, componentAction) => {
      console.group('emitLocalEvent');
      console.log(["config", $component, componentConfig, payload, eventName, componentAction]);

      const { id } = componentConfig;

      // const eventData = ns.compileEventData(payload, eventName, componentAction);
      // console.log(["eventData", eventData]);
      console.log(["eventMap", eventMap]);

      if (!eventMap) {
        console.error("Event map is missing");
        console.groupEnd();
        return;
      }
      //find event in eventMap and emit event to all the topics
      if (eventMap[ns.EVENT_TYPE_EMIT]) {
        console.log("eventMap found", componentAction, eventMap[ns.EVENT_TYPE_EMIT]);
        if (eventMap[ns.EVENT_TYPE_EMIT][componentAction]) {
          console.log("componentAction found", eventName, eventMap[ns.EVENT_TYPE_EMIT][componentAction]);
          
          //check if events exist for component id
          if (!eventMap[ns.EVENT_TYPE_EMIT][componentAction][id]) {
            console.warn("no events found for component");
            console.groupEnd();
            return;
          }
          
          // for each event name in the component action emit event
          const eventNames = Object.keys(eventMap[ns.EVENT_TYPE_EMIT][componentAction][id]);
          console.group("eventNames");
          console.log("eventNames", eventNames);
          // for each topic in the event name emit event
          eventNames.forEach(eventName => {
            console.log("eventName", eventName);
            const topicValues = eventMap[ns.EVENT_TYPE_EMIT][componentAction][id][eventName];
            console.log("topicValues", topicValues);
            // if topicValues is array then emit event to all the topics
            if (Array.isArray(topicValues)) {
              topicValues.forEach(topicValue => {
                const { topic, config } = topicValue;
                console.log("emit event for topic", topic);
                const eventData = ns.compileEventData(payload, eventName, componentAction, id, config);
                ns.emitEvent(topic, eventData);
              });
            } else {
              //is single value use it as topic
              if (topicValues) {   
                const { topic, config } = topicValue;
                console.log("emit event for topic", topic);
                const eventData = ns.compileEventData(payload, eventName, componentAction, id, config);
                ns.emitEvent(topic, eventData);
              }
            }
          });
          console.groupEnd();
        } else {
          console.log("no component action match");
        }
      } else {
        console.log("no event type match");
      }

      console.groupEnd();
    }

    ns.compileEventData = (payload, eventName, action, componentId, config) => {
        return { type: eventName, payload: payload, action: action, componentId: componentId, config: config};
    };

    ns.registerEvents = (topic, callbackFn) => {
        if (!ns.registery[topic]) {
            ns.registery[topic] = [callbackFn];
        } else {
            // push to array
            ns.registery[topic].push(callbackFn);
        }
    };


    ns.init = () => {
        // NOTE: socket in this ns is a custom event. It is not a websocket.
        ns.createWebSocketConnection();
        ns.socketListener();
        ns.windowListener();
    };

    // document ready jquery
    $(document).ready(() => {
        ns.init();
    });
})(jQuery, Typerefinery.Page.Events, document, window);
