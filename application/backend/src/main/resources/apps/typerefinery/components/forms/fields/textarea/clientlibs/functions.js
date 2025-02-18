
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Textarea = Typerefinery.Components.Forms.Textarea || {};

(function ($, ns, componentNs, eventNs, window, document) {
    "use strict";

    ns.selectorComponent = '[component=textarea]';

    ns.ACTION_TEXTAREA_CHANGE = "TEXTAREA_CHANGE"; // action to handle textarea change for all textareas with the same name

    //actions supported by this component
    ns.ACTIONS = {
      TEXTAREA_CHANGE: ns.ACTION_TEXTAREA_CHANGE // action to handle textarea change
    }
    

    // map event types to handlers in component
    // this will indicate which events are supported by component
    // ns.eventMap = eventNs.genericEventsTopicMap();
    ns.eventMap = eventNs.genericEventsTopicMap();

    // this will add event listener to the component and register the event for all textareas with the same name
    ns.addEventListener = ($component, componentConfig) => {
        
      const { events, id } = componentConfig;
      const defaultTopic = componentConfig.name || id;
      const comonentEventId = componentConfig.name || id;
      console.group('addEventListener ' + comonentEventId);
      
      console.log(["config", events, comonentEventId, defaultTopic, componentConfig]);
      
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
          
          console.groupCollapsed(`event ${typeName} - ${action}:${topic}`);
          console.log(["event config", topic, type, name, nameCustom, action, config]);

          console.log(["event to register", topicName, typeName, eventName, action]);

          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap), topicName, typeName, action, eventName, config]);
          eventNs.registerEventActionMapping(ns.eventMap, comonentEventId, topicName, typeName, action, eventName, config);
          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap)]);

          // if event type is listen then add event listener for the event

          if (typeName === eventNs.EVENT_TYPE_EMIT) {
              //emit do nothing here              
              console.log("adding event listener " + action);
              if (action === ns.ACTION_TEXTAREA_CHANGE) {
                console.group(`adding change listener to component ${comonentEventId}`);
  
                $component.on("change", (e) => {
                    console.group("change");
                    console.log(["change", e]);
          
                    console.log(["config", componentConfig]);
                    const $instance = $(e.target);
                    const value = $instance.attr('value');
                    const id = $instance.attr('id');
                    const type = $instance.attr('type');
  
                    ns.handleEventAction($component, componentConfig, ns.TEXTAREA_CHANGE, { 
                      value: value,
                      type: type,
                      id: id,
                      action: "click" 
                    });
          
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

    ns.TEXTAREA_CHANGE = ($component, componentConfig, data) => {
      console.group(ns.ACTION_TEXTAREA_CHANGE);
      const { id } = componentConfig;
      const comonentEventId = componentConfig.name || id;

      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_ITEM_UPDATE, ns.ACTION_TEXTAREA_CHANGE, {id: comonentEventId});

      console.groupEnd();
    }

    ns.handleEventAction = ($component,componentConfig, action, data) => {
      console.group('handleEvent');
      console.log(["handleEvent", $component, action, data]);
      switch (action) {
        case ns.TEXTAREA_CHANGE:
            ns.TEXTAREA_CHANGE($component, componentConfig, data );
            break
        default:
            console.log("no action found");
            break;
      }
      console.groupEnd();
    }

    ns.init = async ($component) => {
      const componentConfig = componentNs.getComponentConfig($component);
      const { id, actionType } = componentConfig;
      console.groupCollapsed("textarea init " + id);
      console.log("$component", $component);
      console.log("componentConfig", componentConfig);

      console.log("adding event listeners");
      ns.addEventListener($component, componentConfig);
      console.log(["ns.eventMap", ns.eventMap]);

      console.groupEnd();

    }

})(jQuery, window.Typerefinery.Components.Forms.Textarea, window.Typerefinery.Components, Typerefinery.Page.Events, window, document);
