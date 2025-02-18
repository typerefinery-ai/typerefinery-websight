
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Checkbox = Typerefinery.Components.Forms.Checkbox || {};

(function ($, ns, componentNs, eventNs, window, document) {
    "use strict";

    ns.selectorComponent = '[component=checkbox]';
    ns.selectorChecked = ':checked';

    ns.ACTION_CHECKBOX_CHANGE = "CHECKBOX_CHANGE"; // action to handle checkbox change for all checkboxes with the same name
    ns.ACTION_CHECKBOX_CLICK = "CHECKBOX_CLICK"; // action to handle checkbox click for checkbox

    //actions supported by this component
    ns.ACTIONS = {
      CHECKBOX_CHANGE: ns.ACTION_CHECKBOX_CHANGE // action to handle checkbox change
    }
    

    // map event types to handlers in component
    // this will indicate which events are supported by component
    // ns.eventMap = eventNs.genericEventsTopicMap();
    ns.eventMap = eventNs.genericEventsTopicMap();

    ns.getValue = function(name) {
      // find all checkboxes with the same name and checked
      const $checked = $(`${ns.selectorComponent}[name="${name}"]${ns.selectorChecked}`);
      // if no checkboxes are checked, return empty array
      if ($checked.length === 0) {
        return [];
      }
      // return array of values
      return $checked.map((i, el) => $(el).val()).get();
    }
    ns.setChoiceByValue = function(name, value) {
      $(`${ns.selectorComponent}[name="${name}"][value="${value}"]`).prop('checked', true);
    }
    ns.setValue = function(name, value) {
      // uncheck all checkboxes with the same name
      $(`${ns.selectorComponent}[name="${name}"]`).prop('checked', false);
      // if value is array, then check all checkboxes with the same name and value
      if (Array.isArray(value)) {
        value.forEach(v => {
          ns.setChoiceByValue(name, v);
        });
      } else {
        ns.setChoiceByValue(name, value);
      }
    }

    // this will add event listener to the component and register the event for all chechboxes with the same name
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
              if (action === ns.ACTION_CHECKBOX_CLICK) {
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
              } else if (action === ns.ACTION_CHECKBOX_CHANGE) {
                console.group("adding checkbox change listener");
  
                $component.on("change", (e) => {
                  console.group("change");
                  console.log(["change", e]);
                  e?.preventDefault();
                  const componentConfig = componentNs.getComponentConfig(e.currentTarget);
                  let { buttonType, navigateTo, navigateToInNewWindow, name, value} = componentConfig;
        
                  console.log(["config on change", componentConfig, name, value]);
        
                  ns.CHECKBOX_CHANGE($component, componentConfig, { 
                    type: "checkbox", 
                    action: "change", 
                    "itemId": id, 
                    "itemValue": value, 
                    "id": name, 
                    value: ns.getValue(name) 
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

    ns.CHECKBOX_CHANGE = ($component, componentConfig, data) => {
      console.group(ns.ACTION_CHECKBOX_CHANGE);
      const { id } = componentConfig;
      const comonentEventId = componentConfig.name || id;

      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_ITEM_UPDATE, ns.ACTION_CHECKBOX_CHANGE, {id: comonentEventId});

      console.groupEnd();
    }

    ns.CHECKBOX_CLICK = ($component, componentConfig, data) => {
      console.group(ns.ACTION_CHECKBOX_CLICK);
      const { id } = componentConfig;
      const comonentEventId = componentConfig.name || id;

      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_ITEM_SELECT, ns.ACTION_CHECKBOX_CLICK, {id: comonentEventId});

      console.groupEnd();
    }

    ns.handleEventAction = ($component,componentConfig, action, data) => {
      console.group('handleEvent');
      console.log(["handleEvent", $component, action, data]);
      switch (action) {
        case ns.CHECKBOX_CLICK:
            ns.CHECKBOX_CLICK($component, componentConfig, data );
            break;
        case ns.CHECKBOX_CHANGE:
            ns.CHECKBOX_CHANGE($component, componentConfig, data );
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
      console.groupCollapsed("checkbox init " + id);
      console.log("$component", $component);
      console.log("componentConfig", componentConfig);

      console.log("adding event listeners");
      ns.addEventListener($component, componentConfig);
      console.log(["ns.eventMap", ns.eventMap]);

      console.groupEnd();

    }

})(jQuery, window.Typerefinery.Components.Forms.Checkbox, window.Typerefinery.Components, Typerefinery.Page.Events, window, document);
