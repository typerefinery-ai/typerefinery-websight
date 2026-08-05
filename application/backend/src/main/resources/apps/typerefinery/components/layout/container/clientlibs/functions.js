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
          // if type is not defined then its listen event
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
                  console.log(["container event data", topicName, eventName, data]);
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

      // Give the row a way to be taken away again.
      //
      // alpha-launch docs/issues/0057: template rows could be added and never removed —
      // `handleEventAction` knew only ADD_ITEM and ADDONCE_ITEM, so there was no remove action for
      // an authored button to bind to either, and any remove control authored into the template
      // would have been a dead control. Attaching it here fixes every form that uses the pattern
      // at once, which matters because the fault was present on 14 of them.
      //
      // Deliberately generic: no field name, type name or vocabulary appears here.
      ns.addRemoveControl($component, $newRow, itemId);

      //insert into component
      $componentBody.append($newRow);

      //raise event that item is added
      ns.ADD_ITEM($component, componentConfig, { type: ns.selectorComponentName, action: "add_item" , "id": itemId } );

      console.groupEnd();
    }

    /** A control that removes the row it sits in. Added to every row `addNewItem` creates. */
    ns.addRemoveControl = ($component, $newRow, itemId) => {
      const $remove = $(
        '<button type="button" class="composite-remove-item btn btn-sm btn-link"' +
        ' data-action="remove-item" aria-label="Remove item" title="Remove item">&times;</button>'
      );
      $remove.on('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        ns.removeItem($component, { id: itemId });
      });
      $newRow.append($remove);
    }

    /**
     * Remove a previously added row.
     *
     * Accepts the row's generated `id` (what {@link ns.addRemoveControl} passes) or a `config`
     * naming the row or its template, so an authored button bound to REMOVE_ITEM works too.
     */
    ns.removeItem = ($component, data) => {
      console.group('removeItem');
      console.log(["removeItem", $component, data]);

      const target = (data && (data.id || data.config)) || '';
      let $row = $();
      if (target) {
        $row = $component.find(`#${target}`);
        if ($row.length === 0) $row = $component.find(`[templateId='${target}']`);
      }
      if ($row.length === 0) {
        console.log(`row ${target} not found to remove`);
        console.groupEnd();
        return;
      }

      // Removing the row takes its `templateId` marker with it, so an ADDONCE template can be
      // added again afterwards — otherwise remove would be a one-way door.
      console.log(`removing row ${target}`);
      $row.remove();
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
      // Symmetric with ADD_ITEM so a remove control can also be *authored* against a button,
      // not only the one addNewItem attaches (alpha-launch docs/issues/0057).
      if (action === "REMOVE_ITEM") {
          ns.removeItem($component, data);
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