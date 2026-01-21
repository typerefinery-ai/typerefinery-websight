
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Input = Typerefinery.Components.Forms.Input || {};

(function ($, ns, componentNs, eventNs, window, document) {
    "use strict";

    ns.selectorComponent = '[component=input]';

    ns.ACTION_INPUT_CHANGE = "INPUT_CHANGE"; // action to handle input change for all inputs with the same name

    //actions supported by this component
    ns.ACTIONS = {
      INPUT_CHANGE: ns.ACTION_INPUT_CHANGE // action to handle input change
    }
    

    // map event types to handlers in component
    // this will indicate which events are supported by component
    // ns.eventMap = eventNs.genericEventsTopicMap();
    ns.eventMap = eventNs.genericEventsTopicMap();

    // this will add event listener to the component and register the event for all inputs with the same name
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
              if (action === ns.ACTION_INPUT_CHANGE) {
                console.group(`adding change listener to component ${comonentEventId}`);
  
                $component.on("change", (e) => {
                    console.group("change");
                    console.log(["change", e]);
          
                    console.log(["config", componentConfig]);
                    const $input = $(e.target);
                    const value = $input.attr('value');
                    const id = $input.attr('id');
                    const type = $input.attr('type');
  
                    ns.handleEventAction($component, componentConfig, action, { 
                      value: value,
                      type: type,
                      id: id,
                      action: action
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

    ns.INPUT_CHANGE = ($component, componentConfig, data) => {
      console.group(ns.ACTION_INPUT_CHANGE);
      const { id } = componentConfig;
      const comonentEventId = componentConfig.name || id;

      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_ITEM_UPDATE, ns.ACTION_INPUT_CHANGE, {id: comonentEventId});

      console.groupEnd();
    }

    ns.handleEventAction = ($component,componentConfig, action, data) => {
      console.group('handleEvent');
      console.log(["handleEvent", $component, action, data]);
      switch (action) {
        case ns.INPUT_CHANGE:
            ns.INPUT_CHANGE($component, componentConfig, data );
            break
        default:
            console.log("no action found");
            break;
      }
      console.groupEnd();
    }

    ns.initInputmask = ($component, componentConfig) => {
      console.group("initInputmask");
      const { validationInputMask, id, name } = componentConfig;
      console.log("componentConfig:", { id, name, validationInputMask });
      
      if (!validationInputMask) {
        console.log("No validationInputMask provided - skipping");
        console.groupEnd();
        return;
      }

      console.log("Searching for input with data-inputmask attribute");
      const $input = $component.find('input[data-inputmask]');
      console.log("Found inputs:", $input.length);
      
      if ($input.length === 0) {
        console.warn("No input element with data-inputmask attribute found");
        console.groupEnd();
        return;
      }

      try {
        // Check if inputmask jQuery plugin is available
        if ($.fn.inputmask) {
          console.log("Inputmask library available, applying mask:", validationInputMask);
          // Use jQuery plugin syntax: $input.inputmask(mask)
          // The mask pattern is stored directly in data-inputmask attribute
          $input.inputmask(validationInputMask);
          console.log("Inputmask initialized successfully");
        } else {
          console.warn('Inputmask library not loaded - $.fn.inputmask is undefined');
        }
      } catch (e) {
        console.error('Failed to initialize inputmask:', e);
        console.error('Error stack:', e.stack);
      }
      console.groupEnd();
    };

    ns.init = async ($component) => {
      const componentConfig = componentNs.getComponentConfig($component);
      const { id, actionType, inputType, validationInputMask, name } = componentConfig;
      console.groupCollapsed("input init " + id);
      console.log("$component", $component);
      console.log("componentConfig", componentConfig);
      console.log("inputType:", inputType);
      console.log("name:", name);
      console.log("validationInputMask:", validationInputMask);

      // Type-based initialization
      console.log("Starting type-based initialization for:", inputType);
      switch (inputType) {
        case 'rating':
          console.log("Initializing rating input");
          ns.initRating($component, componentConfig);
          break;
        case 'text':
        case 'tel':
        case 'email':
        case 'password':
          console.log("Initializing text-based input type:", inputType);
          // Initialize inputmask if mask is provided
          if (validationInputMask) {
            console.log("Initializing inputmask with mask:", validationInputMask);
            ns.initInputmask($component, componentConfig);
          } else {
            console.log("No inputmask configured for", inputType);
          }
          break;
        case 'range':
        case 'colourpicker':
        case 'number':
        case 'date':
        case 'time':
        case 'hidden':
          console.log("Native HTML5 input type:", inputType, "- no special initialization needed");
          break;
        default:
          console.log("Unknown input type:", inputType);
          // Unknown type - try inputmask if mask provided
          if (validationInputMask) {
            console.log("Attempting inputmask initialization for unknown type:", inputType);
            ns.initInputmask($component, componentConfig);
          } else {
            console.log("No inputmask and unknown type - no initialization");
          }
          break;
      }

      console.log("Type-based initialization complete");
      console.log("adding event listeners");
      ns.addEventListener($component, componentConfig);
      console.log(["ns.eventMap", ns.eventMap]);

      console.groupEnd();

    }

})(jQuery, window.Typerefinery.Components.Forms.Input, window.Typerefinery.Components, Typerefinery.Page.Events, window, document);
