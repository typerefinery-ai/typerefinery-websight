window.Typerefinery = window.Typerefinery || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, document, window) {
    "use strict";

    ns.registery = {};

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
      ns.EVENTS_CACHE[ns.EVENT_TYPE_EMIT] = ns.genericEvents([]);
      ns.EVENTS_CACHE[ns.EVENT_TYPE_LISTEN] = ns.genericEvents([]);
      return ns.EVENTS_CACHE;      
    }

    //add event mapping in eventMap local to component, maps component action to topic with event, for quick access by functions.
    ns.registerEventActionMapping = function(eventMap, topic, type, componentAction, eventName) {
      console.group('registerEventActionMapping');
      console.log(eventMap, topic, type, componentAction, eventName);
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
      const topicAction = {
        topic: topic,
        action: componentAction,
      }

      //init type
      if (!eventMap[type]) {
        eventMap[type] = [eventName];
        console.warn("type not found, creating new type");
      }

      if (!eventMap[type][eventName]) {
        eventMap[type][eventName] = [componentAction];
        console.warn("event not found, creating new event");
      }

      if (!eventMap[type][eventName][componentAction]) {
        eventMap[type][eventName][componentAction] = [topic];
        console.warn("component action not found, creating new component action");
      } else {
        //add event to type
        eventMap[type][eventName][componentAction].push(topic);
        console.warn("component action found, adding topic to component action");
      }

      console.groupEnd();
    };

    ns.emitEvent = (topic, payload) => {
        const evt = document.createEvent('customEvent');
        evt.initCustomEvent('customEvent', false, false, { topic, payload });
        ns.socket.dispatchEvent(evt);
    };

    ns.createWebSocketConnection = () => {
        ns.socket = new EventTarget();
    };

    ns.socketListener = () => {
        ns.socket.addEventListener('customEvent', (e) => {
            const detail = e.detail;
            const { topic, payload } = detail;

            if (ns.registery[topic]) {
                ns.registery[topic].forEach((callbackFn) => {
                    if (typeof callbackFn === 'function') {
                        callbackFn(payload);
                    }
                });
            }
        });
    };


    ns.compileEventData = (payload, eventName, action) => {
        return { type: eventName, payload: payload, action: action};
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
    };

    // document ready jquery
    $(document).ready(() => {
        ns.init();
    });
})(jQuery, Typerefinery.Page.Events, document, window);
