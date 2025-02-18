
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Radio = Typerefinery.Components.Forms.Radio || {};
window.Typerefinery.Page = window.Typerefinery.Page || {};
window.Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, componentNs, eventNs, window, document) {
    "use strict";

    ns.selectorComponent = '[component=radio]';

    ns.ACTION_RADIO_CLICK = "RADIO_CLICK";
    ns.ACTION_RADIOGROUP_CLICK = "RADIOGROUP_CLICK";

    // map event types to handlers in component
    // this will indicate which events are supported by component
    // ns.eventMap = eventNs.genericEventsTopicMap();
    ns.eventMap = {};

    ns.addEventListener = ($component, componentConfig) => {
      const { events, id } = componentConfig;
      const defaultTopic = componentConfig.name || id;
      const comonentEventId = componentConfig.name || id;
      console.group('addEventListener ' + id);
      
      console.log(["config", events, id, defaultTopic]);
      
      console.log("registering events");

      //register events
      if (events) {        
        events.forEach(event => {
          const { topic, type, name, nameCustom, action, config, value } = event;
          //if topic not set use component id as topic
          const topicName = topic || defaultTopic;
          // if type is not defined then its listen event
          let typeName = type || eventNs.EVENT_TYPE_LISTEN || "custom";

          let eventName = nameCustom || name || topic;
          console.group(action + " " + eventName);
          console.log(["event config", topic, type, name, nameCustom, action, config]);

          console.log(["event to register", topicName, typeName, eventName, action]);

          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap), topicName, typeName, action, eventName, config]);
          eventNs.registerEventActionMapping(ns.eventMap, comonentEventId, topicName, typeName, action, eventName, config);
          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap)]);

          // if event type is listen then add event listener for the event

          if (typeName === eventNs.EVENT_TYPE_EMIT) {
            console.log("adding event listener " + action);
            if (action === ns.ACTION_RADIO_CLICK) {
              console.group(`adding click listener to component ${comonentEventId}`);

              $component.on("click", (e) => {
                  console.group("click");
                  console.log(["click", e]);
        
                  console.log(["config", componentConfig]);
        
                  // ns.RADIO_CLICK($component, componentConfig, { type: "radio", action: "click" , "id": id } );
                  ns.handleEventAction($component, componentConfig, ns.RADIO_CLICK, { value: value, type: 'radio', id: id, action: "click" });
        
                  console.groupEnd();
              });
        
              console.groupEnd();
            } else if (action === ns.ACTION_RADIOGROUP_CLICK) {
              console.group("adding radio group click listener");
              const groupSelector = ns.selectorComponent + '[name="'+name+'"]';
              console.log(["groupSelector", groupSelector]);
              const $radioGroup = $(groupSelector);
              console.log(["$radioGroup", $radioGroup]);

              $radioGroup.on("click", (e) => {
                  console.group("click");
                  console.log(["click", e]);
        
                  console.log(["config", componentConfig]);

                  const $radio = $(e.target);
                  const value = $radio.attr('value');
                  const id = $radio.attr('id');
        
                  console.log(["$radio", $radio, value, id]);
                  ns.handleEventAction($radio, componentConfig, ns.RADIO_CLICK, { value: value, type: 'radio', id: id, action: "click" });
        
                  console.groupEnd();
              });
        
              console.groupEnd();
              
            }
            
          } else {
              //listen register the event and listent for specific event on topic
              console.log(["register event listen", topicName, eventName]);
              eventNs.registerEvents(topicName, (data) => {
                  // check make sure the event is for this event
                  console.log(["registerEvents callback", topicName, eventName, data]);
                  if (data.type === eventName) {
                      ns.handleEventAction($component, componentConfig, action, data);
                  }
              });
          }
          console.groupEnd();
        });

        console.log(["eventMap", ns.eventMap]);

      } else {
        console.log("no events found");
      }

      console.groupEnd();



    }

    // local actions representing the form actions
    ns.RADIO_CLICK = ($component, componentConfig, data) => {
      console.group(ns.ACTION_RADIO_CLICK);
      const { id } = componentConfig;
      const comonentEventId = componentConfig.name || id;

      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_ITEM_SELECT, "RADIO_CLICK", {id: comonentEventId});
      console.groupEnd();
    }

    ns.handleEventAction = ($component, componentConfig, action, data) => {
      console.group('handleEvent');
      console.log(["handleEvent", $component, action, data]);
      switch (action) {
          case ns.RADIO_CLICK:
              ns.RADIO_CLICK($component, componentConfig, data );
              break;
          default:
              console.log("no action found");
              break;
      }
      console.groupEnd();
    }

    ns.init = ($component) => {
      const componentConfig = componentNs.getComponentConfig($component);
      const { id, actionType } = componentConfig;

      console.groupCollapsed("radio init " + id);
      console.log("$component", $component);
      console.log("componentConfig", componentConfig);

      console.log("adding event listeners");
      ns.addEventListener($component, componentConfig);
      console.log(["ns.eventMap", ns.eventMap]);

      console.groupEnd();

    }

})(jQuery, window.Typerefinery.Components.Forms.Radio, window.Typerefinery.Components, Typerefinery.Page.Events, window, document);
