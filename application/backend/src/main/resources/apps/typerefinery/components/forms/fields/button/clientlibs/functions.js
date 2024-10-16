window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Button = Typerefinery.Components.Forms.Button || {};
window.Typerefinery.Modal = Typerefinery.Modal || {};
window.Typerefinery.Dropdown = Typerefinery.Dropdown || {};
window.Typerefinery.ToggleComponent = Typerefinery.ToggleComponent || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, componentNs, modalNs, dropdownNs, toggleComponentNs, themeNs, eventNs, document, window) {
    "use strict";
    ns.selectorComponent = '[component=button]';

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
          console.log(["event config", topic, type, name, nameCustom, action, config]);

          console.log(["event to register", topicName, typeName, eventName, action]);

          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap), topicName, typeName, action, eventName, config]);
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
      
      console.group("adding click listener");

      $component.on("click", (e) => {
          console.group("click");
          console.log(["click", e]);
          e?.preventDefault();
          const componentConfig = componentNs.getComponentConfig(e.currentTarget);
          let { buttonType, navigateTo, navigateToInNewWindow } = componentConfig;

          console.log(["config", componentConfig, buttonType, navigateTo, navigateToInNewWindow]);

          if(buttonType === "navigate") {
              if(navigateTo) {
                  
                  if(navigateToInNewWindow) {
                      window.open(navigateTo);
                      return;
                  }
                  window.location.href = navigateTo;
              }
          }else if(buttonType === "action") {
              const { actionType } = componentConfig;
              if(actionType === "openModal") {
                  // add query params from the url and pass it to the modal.
                  const url = new URL(window.location.href);
                  const params = new URLSearchParams(url.search);
                  const modalUrl = componentConfig.actionUrl + "?" + params.toString();
                  modalNs.createModalAndOpen(componentConfig.actionModalTitle, modalUrl, componentConfig.hideFooter);
              } else {
                  ns.BUTTON_CLICK($component, componentConfig, { type: "button", action: "click" , "id": id } );
              }
          }
          console.groupEnd();
      });

      console.groupEnd();
    }

    // local actions representing the form actions
    ns.BUTTON_CLICK = ($component, componentConfig, data) => {
      console.group('BUTTON_CLICK');
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_SUCCESS_ACTION, "BUTTON_CLICK");
      console.groupEnd();
    }     

  
    ns.handleEventAction = ($component, action, data) => {
      console.group('handleEvent');
      console.log(["handleEvent", $component, action, data]);
      console.groupEnd();
  }

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        const { buttonType, id, actionType } = componentConfig;

        console.groupCollapsed("button init " + id);
        console.log("$component", $component);
        console.log("componentConfig", componentConfig);
        console.log("buttonType", buttonType);
        console.log("actionType", actionType);
        console.log(["config", componentConfig, $component, ns.eventMap]);

        let initEvents = true;

        switch (buttonType) {
          case "submit":
            initEvents = false;
            break;
          case "action":
            //FIXME: need to convert these to events.
            switch (actionType) {
              //NOTE: handled in on click.
              // case "openModal":
              //   modalNs.init($component, componentConfig);
              //   initEvents = false;
              //   break;
              case "openDropdown":
                dropdownNs.init($component, componentConfig);
                initEvents = false;
                break;
              case "initialTheme":
                themeNs.init($component, componentConfig);
                initEvents = false;
                break;
              case "toggleComponent":
                toggleComponentNs.init($component, componentConfig);
                initEvents = false;
                break;
              default:
                break;
            }
            break;
          default:
            break;
        }

        console.log(["initEvents", initEvents]);

        if (initEvents) {
          console.log("adding event listeners");
          ns.addEventListener($component, componentConfig);
          console.log(["ns.eventMap", ns.eventMap]);
        }

        console.groupEnd();
    }
})(jQuery, Typerefinery.Components.Forms.Button, Typerefinery.Components, Typerefinery.Modal, Typerefinery.Dropdown, Typerefinery.ToggleComponent, window.Typerefinery.Page.Theme, Typerefinery.Page.Events, document, window);