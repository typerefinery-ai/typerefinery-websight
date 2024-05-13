window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layout = Typerefinery.Components.Layout || {};
window.Typerefinery.Components.Layout.Accordion = Typerefinery.Components.Layout.Accordion || {};
window.Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, componentNs, eventNs, document, window) {
    "use strict";

    ns.selectorComponent = '[component=accordion]';
    ns.selectorTemplate = "> template";
    ns.selectorButton = 'button.accordion-button';
    ns.selectorAccordionItem = "accordion-item";
    ns.attributeTarget = "data-bs-target";
    ns.attributeParent = "data-bs-parent";
    ns.attributeAriaControls = "aria-controls";

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

    // local actions representing the form actions
    ns.ADD_ITEM = ($component, componentConfig, data) => {
      console.group('ADD_ITEM');
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.ADD_ITEM, "ADD_ITEM");
      console.groupEnd();
    }     

    ns.openItem = ($component, data) => {
      console.group('openItem');
      console.log(["openItem", $component, data]);

      const { config } = data;
      const id = config;
      const $item = $component.find(`#${id}`);
      const $itemContainer = $item.closest(ns.selectorAccordionItem);
      const $itemButton = $itemContainer.find(ns.selectorButton);
      const itemButtonTarget = $itemButton.attr(ns.attributeTarget);
      const $itemCollapse = $itemContainer.find(itemButtonTarget);
      const itemDataParent = $itemCollapse.attr(ns.attributeParent);
      
      console.log(["$item", $item]);
      console.log(["$itemContainer", $itemContainer]);
      console.log(["$itemButton", $itemButton]);
      console.log(["itemButtonTarget", itemButtonTarget]);
      console.log(["$itemCollapse", $itemCollapse]);
      console.log(["itemDataParent", itemDataParent]);

      $itemButton.removeClass('collapsed');
      $item.addClass('show');

      console.groupEnd();
    }

    ns.addNewItem = ($component, data) => {
      console.group('addNewItem');

      console.log(["addNewItem", $component, data]);

      const componentId = $component.attr('id');
      const componentConfig = componentNs.getComponentConfig($component);

      //default template
      const $internalTemplate = $component.find(ns.selectorTemplate);
      let $template = $internalTemplate;

      console.log('$template', $template);

      const { config } = data;
      console.log('config', config);

      if (config) {
        const $externalTemplate = $(config);
        $template = $externalTemplate.length ? $externalTemplate : $template;
        console.log('$template', $template);
      }


      var $newRow = $($template.html());
      const itemId = Math.random().toString(36).substring(2, 15);

      $newRow.attr('state', "new");
      $newRow.attr('id', itemId);

      console.log('itemId', itemId);

      const itemContentId = `accordionitem_${itemId}`;

      console.log('itemContentId', itemContentId);

      const $itemButton = $newRow.find(ns.selectorButton);
      const itemButtonTarget = $itemButton.attr(ns.attributeTarget); //needs to be updated with new id
      const itemAriaControls = $itemButton.attr(ns.attributeAriaControls); //needs to be updated with new id
      $itemButton.attr(ns.attributeTarget, `#${itemContentId}`);
      $itemButton.attr(ns.attributeAriaControls, itemContentId);

      const $itemCollapse = $newRow.find(itemButtonTarget);
      const itemCollapseId = $itemCollapse.attr('id'); //needs to be updated with new id
      $itemCollapse.attr('id', itemContentId);

      const itemDataParent = $itemCollapse.attr(ns.attributeParent); // is pointing to the parent, needs to be updated to current component
      $itemCollapse.attr(ns.attributeParent, `#${componentId}`);

      console.log('$newRow', $newRow);

      $internalTemplate.before($newRow);

      ns.ADD_ITEM($component, componentConfig, { type: "accordion", action: "add_item" , "id": itemId } );

      console.groupEnd();
    }

    ns.handleEventAction = ($component, action, data) => {
      console.group('handleEvent');
      console.log(["handleEvent", $component, action, data]);
      //load data into form
      if (action === "ADD_ITEM") {
          ns.addNewItem($component, data);
      }
      if (action === "OPEN_ITEM") {
          ns.openItem($component, data);
      }
      console.groupEnd();
  }

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        const { id} = componentConfig;
        console.group('init ' + id);
        console.log(["config", componentConfig]);

        console.log("adding event listeners");
        ns.addEventListener($component, componentConfig);
        console.log(["ns.eventMap", ns.eventMap]);

        console.groupEnd();
    }
})(jQuery, Typerefinery.Components.Layout.Accordion, Typerefinery.Components, Typerefinery.Page.Events, document, window);