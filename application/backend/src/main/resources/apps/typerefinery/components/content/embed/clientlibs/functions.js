window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Content = Typerefinery.Components.Content || {};
Typerefinery.Components.Content.Embed = Typerefinery.Components.Content.Embed || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, componentNs, eventNs, document, window) {
    "use strict";

    ns.selectorComponent = '[component=embed]';

    //actions supported by this component
    ns.ACTIONS = {
      EVENT_PROXY: "EVENT_PROXY"
    }

    // map event types to handlers in component
    // this will indicate which events are supported by component
    ns.eventMap = eventNs.genericEventsTopicMap();

    ns.registerEvent = ($component, componentId, fieldName) => {
      console.group("registerEvent");
      const key = `${componentId}-${fieldName}`;
      console.log(["registerEvent", key]);
      eventNs.registerEvents(key, (data) => {
        console.group("registerEvents callback on " + window.location);
        console.log(["registerEvents callback", key, data.type, data]);
        if(data.type === eventNs.EVENTS.EVENT_PROXY) {
            // get the first children and set the inner html.
            const $firstChild = $component.children[0];
            console.log(["registerEvents callback EVENT_PROXY", $firstChild]);
            const componentConfig = componentNs.getComponentConfig($component);
            console.log(["registerEvents callback EVENT_PROXY", componentConfig, componentConfig.variant]);
            if (componentConfig.variant === "iframe") {
              console.log(["registerEvents callback EVENT_PROXY", componentConfig, componentConfig.variant, $component.find("iframe").attr("src"), data.data.value]);
              $component.find("iframe").attr("src", data.data.value);
            }
        }
        console.groupEnd();
      });      
      console.groupEnd();
    }

    //send message to iframe
    ns.sendMessageToiFrame = function($component, data) {
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
      console.log(["sendMessageToiFrame", sourceData, $iframe, iframe]);
      //if iframe does not have TypeRefinery then it will need to manage its own events
      iframe.contentWindow.postMessage(sourceData, "*");
      //call events
      if (iframe.contentWindow.Typerefinery.Page.Events) {
        const topic = sourceData.type;
        iframe.contentWindow.Typerefinery.Page.Events.emitEvent(topic, sourceData);
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
      console.group(ns.ACTIONS.EVENT_PROXY);
      console.log([ns.ACTIONS.EVENT_PROXY, $component, componentConfig, data]);
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_PROXY, ns.ACTIONS.EVENT_PROXY);
      console.groupEnd();
    }


    ns.handleEvent = ($component, eventName, data) => {
      console.log(["update", $component, eventName, data]);
      //load data into form
      if (eventName === eventNs.EVENTS.EVENT_PROXY) {
          ns.EVENT_PROXY($component, data);
      } else {
        console.error(["unsupported action", eventName]);
      }
    }


    ns.addEventListener = ($component, componentConfig) => {
      console.group('addEventListener');
      const { events, id } = componentConfig;
      const defaultTopic = id;

      console.log(["config", events, id, defaultTopic]);

      console.log("registering events");
      //register events
      if (events) {        
        events.forEach(event => {
          console.log(["event", event]);
          const { topic, type, name, nameCustom, action, config} = event;
          //if topic not set use component id as topic
          const topicName = topic || defaultTopic;
          // if type is not defined then its emitted
          let typeName = type || eventNs.EVENT_TYPE_LISTEN; //default is listen

          //custom name takes precidence over name, this will be raised as event name
          let eventName = nameCustom || name;

          // if action is EVENT_PROXY 

          // if action is EVENT_PROXY then add the event to registry
          if (action === ns.ACTIONS.EVENT_PROXY) {

            console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap), topicName, typeName, action, eventName]);
            eventNs.registerEventActionMapping(ns.eventMap, id, topicName, typeName, action, eventName, config);
            console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap)]);

            // if event type is listen then add event listener for the event
            if (typeName === eventNs.EVENT_TYPE_EMIT) {
                console.log(["add windowListeneriFrameEventProxy for this component", eventName, id]);
                //listen for global message events that are emited by iframe
                ns.windowListeneriFrameEventProxy($component, componentConfig, eventName, action, id, config);
            } else {
                //listen register the event and listent for specific event on topic
                console.log(["registerEvents", topicName, eventName]);
                eventNs.registerEvents(topicName, (data) => {
                    console.log(["registerEvents callback", topicName, eventName, data]);
                    // check make sure the event is for this event
                    if (data.type === eventName) {
                      //send message to iframe
                        ns.sendMessageToiFrame($component, data.payload);
                    }
                });
                //need to reach into the frame and register message event
                //this will ensure that only messages from this frame are listened
                //windowListener
            }
          } else {
            console.error(["unsupported action", action]);
          }

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

    /* listen for window post messages sent by iframe to this component */
    ns.windowListeneriFrameEventProxy = function($component, componentConfig, eventName, action, id, config) {
      const iFrameContentWindow = $component.find("iframe")[0].contentWindow;
      console.log(["windowListeneriFrameEventProxy", iFrameContentWindow]);
      window.addEventListener('message', function(event) {  
        console.groupCollapsed('embed windowListeneriFrameEventProxy on ' + window.location);
        console.log(["event", event, event.source == iFrameContentWindow, eventName, action, id, config, event.data]);
        if (event.source == iFrameContentWindow) {
          console.log(["event", event]);
          var eventData = event.data;
          var sourceWindow = event.source;
          var sourceOrigin = event.origin;
          console.log(["sourceWindow", sourceWindow, "sourceOrigin", sourceOrigin, "eventData", eventData]);

          var sourceData;
          if (eventData) {
            if (typeof eventData === 'string') {
              sourceData = JSON.parse( eventData );
            }
            sourceData = eventData;
          }

          console.log(["sourceData", sourceData]);

          if (sourceData) {
            //const eventPayloadData = eventNs.compileEventData(sourceData, eventName, action, id, config);

            //console.log(["eventPayloadData", eventPayloadData]);

            //emit the event
            ns.EVENT_PROXY($component, componentConfig, sourceData);

          }
        } else {
          console.warn("source not matched");
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

      // add event listener that have been configured for this component
      ns.addEventListener($component, componentConfig);

      console.log(["embed init done"]);
      console.groupEnd();
    }
}
)(jQuery, Typerefinery.Components.Content.Embed, Typerefinery.Components, Typerefinery.Page.Events, document, window);
