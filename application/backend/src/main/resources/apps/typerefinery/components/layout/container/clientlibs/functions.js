window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layout = Typerefinery.Components.Layout || {};
window.Typerefinery.Components.Layout.Container = Typerefinery.Components.Layout.Container || {};
window.Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, componentNs, eventNs, document, window) {
    "use strict";

    ns.selectorComponentName = "container";
    ns.selectorComponent = '[component=container]';
    
    // map event types to handlers in component
    // this will indicate which events are supported by component
    // ns.eventMap = eventNs.genericEventsTopicMap();
    ns.eventMap = {};

    ns.addEventListener = ($component, componentConfig) => {
        
      const { events, id } = componentConfig;
      const defaultTopic = id;
      console.group('addEventListener ' + id);
      
      console.log(["config", events, id, defaultTopic]);
      
      console.log("registering events");
      //register events
      if (events) {        
        events.forEach(event => {
          const { topic, type, name, nameCustom, action, config } = event;
          //if topic not set use component id as topic
          const topicName = topic || defaultTopic;
          // if type is not defined then its emitted
          let typeName = type || eventNs.EVENT_TYPE_LISTEN || "custom";

          let eventName = nameCustom || name;
          console.group(action + " " + eventName);
          console.log(["event config", topic, type, name, nameCustom, action]);

          console.log(["event to register", topicName, typeName, eventName, action]);

          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap), topicName, typeName, action, eventName]);
          eventNs.registerEventActionMapping(ns.eventMap, id, topicName, typeName, action, eventName, config);
          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap)]);

          // if event type is listen then add event listener for the event

          if (typeName === eventNs.EVENT_TYPE_EMIT) {
              //emit do nothing here
          } else {
              //listen register the event and listent for specific event on topic
              console.log(["register event listen", topicName, eventName]);
              eventNs.registerEvents(topicName, (data) => {
                  // check make sure the event is for this event
                  console.log(["event data", data]);
                  if (data.type === eventName) {                  
                      ns.handleEventAction($component, action, data);
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

    
    ns.addNewItem = ($component, data, once) => {
      console.group('addNewItem');

      console.log(["addNewItem", $component, data]);

      const componentId = $component.attr('id');
      const componentConfig = componentNs.getComponentConfig($component);
      const $componentBody = $component; // main tag is the body of the component

      if ($componentBody.length === 0) {
        console.log(`component body to insert into not found`);
        return;
      }

      const { config } = data;
      console.log('config', config);
      let $template;
      if (config) {
        let found = false;
        //look for template in current component first
        let $templateByConfig = $component.find(config);
        let $templateByConfigAsId = $component.find(`#${config}`);

        console.log('$templateByConfig', $templateByConfig);
        console.log('$templateByConfigAsId', $templateByConfigAsId);

        if ($templateByConfig.length > 0) {
          console.log('found template by config inside the component');
          $template = $templateByConfig;
          found = true;
        } else if ($templateByConfigAsId.length > 0) {
          console.log('found template by config as id inside the component');
          $template = $templateByConfigAsId;
          found = true;
        }
      
        if (!found) {
          $templateByConfig = $(config);
          $templateByConfigAsId = $(`#${config}`);

          console.log('$templateByConfig', $templateByConfig);
          console.log('$templateByConfigAsId', $templateByConfigAsId);

          if ($templateByConfig.length > 0) {
            console.log('found template by config outside of component');
            $template = $templateByConfig;
            found = true;
          } else if ($templateByConfigAsId.length > 0) {
            console.log('found template by config as id outside of component');
            $template = $templateByConfigAsId;
            found = true;
          }
        }

        if (!found) {
          console.log(`template ${config} not found, internaly or externaly`);
          return;
        }
      }

      console.log('$template', $template);

      // get the template id if set
      const templateId = $template.attr('id');

      // if once check if template not already added
      if (once && templateId !== undefined) {
        const $templateExists = $component.find(`[templateId='${templateId}']`);
        if ($templateExists.length > 0) {
          console.log("template already used once");
          ns.openItem($component, { config: $templateExists.attr('id') });
          return;
        }
      }
      
      var $newRow = $($template.html());
      const itemId = Math.random().toString(36).substring(2, 15);

      if (once) {
        $newRow.attr('templateId', templateId);  
      }
      $newRow.attr('state', "new");
      $newRow.attr('id', itemId);

      console.log('itemId', itemId);

      console.log('$newRow', $newRow);

      //insert into component
      $componentBody.append($newRow);
      
      //raise event that item is added
      ns.ADD_ITEM($component, componentConfig, { type: ns.selectorComponentName, action: "add_item" , "id": itemId } );

      console.groupEnd();
    }

    ns.handleEventAction = ($component, action, data) => {
      console.group('handleEvent');
      console.log(["handleEvent", $component, action, data]);

      if (action === "ADD_ITEM") {
          ns.addNewItem($component, data, false);
      }
      if (action === "ADDONCE_ITEM") {
          ns.addNewItem($component, data, true);
      }
      console.groupEnd();
    }

    // local actions representing the form actions
    ns.ADD_ITEM = ($component, componentConfig, data) => {
      console.group('ADD_ITEM');
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.ADD_ITEM, "ADD_ITEM");
      console.groupEnd();
    }     


    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        const { id} = componentConfig;
        console.groupCollapsed('init ' + id);
        console.log(["config", componentConfig]);

        console.log("adding event listeners");
        ns.addEventListener($component, componentConfig);
        console.log(["ns.eventMap", ns.eventMap]);

        console.groupEnd();
    }

})(jQuery, Typerefinery.Components.Layout.Container, Typerefinery.Components, Typerefinery.Page.Events, document, window);