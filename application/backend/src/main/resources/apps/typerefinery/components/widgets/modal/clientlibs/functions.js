window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layout = Typerefinery.Components.Layout || {};
window.Typerefinery.Components.Layout.Modal = Typerefinery.Components.Layout.Modal || {};
window.Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, modalNs, componentNs, eventNs, document, window) {
    "use strict";

    ns.selectorComponentName = "modal";
    ns.selectorComponent = '[component=modal]';

    ns.ACTION_MODAL_OPEN = "MODAL_OPEN";
    ns.ACTION_MODAL_OPENED = "MODAL_OPENED";
    ns.ACTION_MODAL_CLOSE = "MODAL_CLOSE";
    ns.ACTION_MODAL_CLOSED = "MODAL_CLOSED";
    ns.ACTION_MODAL_CLOSE_STOP = "MODAL_CLOSE_STOP";

    ns.ACTIONS = {
        MODAL_OPEN: ns.ACTION_MODAL_OPEN,
        MODAL_OPENED: ns.ACTION_MODAL_OPENED,
        MODAL_CLOSE: ns.ACTION_MODAL_CLOSE,
        MODAL_CLOSED: ns.ACTION_MODAL_CLOSED,
        MODAL_CLOSE_STOP: ns.ACTION_MODAL_CLOSE_STOP
    }

    // map event types to handlers in component
    // this will indicate which events are supported by component
    // ns.eventMap = eventNs.genericEventsTopicMap();
    ns.eventMap = {};

    ns.addEventListener = ($component, componentConfig) => {
        
      const { events, id } = componentConfig;
      const defaultTopic = id;
      console.group('addEventListener ' + id);
      
      console.log(["config", events, id, defaultTopic]);
      
      console.log("create modal");
      var modal = ns.getModal($component);
      
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
            console.log("adding event listener " + action);
            if (action === ns.ACTION_MODAL_OPENED) {
                //modal has been shown
                console.log(["open modal", action, eventName]);                
                modal.addEventListener('shown.bs.modal', function (event) {
                  var target = event.relatedTarget;
                  console.log(['shown.bs.modal',target]);
                  ns.handleEventAction($component, ns.ACTION_MODAL_OPENED, { 
                    value: "open",
                    type: type,
                    id: id,
                    action: "open" 
                  });
                })
            } else if (action === ns.ACTION_MODAL_CLOSED) {
                // modal has been closed
                console.log(["close modal", action, eventName]);
                modal.addEventListener('hidden.bs.modal', function (event) {
                  var target = event.relatedTarget;
                  console.log(['hidden.bs.modal',target]);
                  ns.handleEventAction($component, ns.ACTION_MODAL_CLOSED, { 
                    value: "close",
                    type: type,
                    id: id,
                    action: "close" 
                  });
                })
            } else if (action === ns.ACTION_MODAL_CLOSE_STOP) {
                // modal was closing but was stopped from closing, user clicked on backdrop
                console.log(["close modal", action, eventName]);
                modal.addEventListener('hidePrevented.bs.modal', function (event) {
                  var target = event.relatedTarget;
                  console.log(['hidePrevented.bs.modal',target]);
                  ns.handleEventAction($component, ns.ACTION_MODAL_CLOSE_STOP, { 
                    value: "closestop",
                    type: type,
                    id: id,
                    action: "closestop" 
                  });
                })
            } else if (action === ns.ACTION_MODAL_CLOSE) {
                // modal is closing
                console.log(["close modal", action, eventName]);
                modal.addEventListener('hide.bs.modal', function (event) {
                  var target = event.relatedTarget;
                  console.log(['hide.bs.modal',target]);
                  ns.handleEventAction($component, ns.ACTION_MODAL_CLOSE, { 
                    value: "closing",
                    type: type,
                    id: id,
                    action: "closing" 
                  });
                })
            } else if (action === ns.ACTION_MODAL_OPEN) {
                // open is opening
                console.log(["open modal", action, eventName]);
                modal.addEventListener('open.bs.modal', function (event) {
                  var target = event.relatedTarget;
                  console.log(['hide.bs.modal',target]);
                  ns.handleEventAction($component, ns.ACTION_MODAL_OPEN, { 
                    value: "openning",
                    type: type,
                    id: id,
                    action: "openning" 
                  });
                })
            }
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

      // add modal event listeners
      // console.log("adding modal event listeners");
      // console.log(["modal", modal]);

      // modal.addEventListener('shown.bs.modal', function () {
      //   console.log('shown.bs.modal');
      // })
      // modal.addEventListener('shown.bs.modal', function () {
      //   console.log('shown.bs.modal');
      // })

      // modal.addEventListener('hide.bs.modal', function () {
      //   console.log('hide.bs.modal');
      // })
      // modal.addEventListener('hidden.bs.modal', function () {
      //   console.log('hidden.bs.modal');
      // })

      // modal.addEventListener('hidePrevented.bs.modal', function () {
      //   console.log('hidePrevented.bs.modal');
      // })

      console.groupEnd();
      
    }

    ns.MODAL_OPEN = ($component, componentConfig, data) => {
        console.group('MODAL_OPEN');
        console.log(["config", componentConfig]);
        console.log(["data", data]);
        const { id } = componentConfig;
        const comonentEventId = componentConfig.name || id;
        console.log(["comonentEventId", comonentEventId, id]);
  
        // open modal
        eventNs.emitLocalEvent(
          $component,
          componentConfig,
          ns.eventMap,
          data,
          eventNs.EVENTS.EVENT_ITEM_SELECT,
          ns.ACTION_MODAL_OPEN,
          {
            id: comonentEventId
          }
        );

        ns.showModal($component);
  
        console.groupEnd();
    }
    
    ns.MODAL_CLOSE = ($component, componentConfig, data) => {
        console.group('MODAL_CLOSE');
        console.log(["config", componentConfig]);
        console.log(["data", data]);

        const { id } = componentConfig;
        const comonentEventId = componentConfig.name || id;

        eventNs.emitLocalEvent(
          $component,
          componentConfig,
          ns.eventMap,
          data,
          eventNs.EVENTS.EVENT_ITEM_SELECT,
          ns.ACTION_MODAL_CLOSE,
          {
            id: comonentEventId
          }
        );

        ns.hideModal($component);

        console.groupEnd();
    }

    ns.MODAL_OPENED = ($component, componentConfig, data) => {
        console.group('MODAL_OPENED');
        console.log(["config", componentConfig]);
        console.log(["data", data]);

        const { id } = componentConfig;
        const comonentEventId = componentConfig.name || id;

        eventNs.emitLocalEvent(
          $component,
          componentConfig,
          ns.eventMap,
          data,
          eventNs.EVENTS.EVENT_ITEM_CREATED,
          ns.ACTION_MODAL_OPENED,
          {
            id: comonentEventId
          }
        );

        console.groupEnd();
    }

    ns.MODAL_CLOSED = ($component, componentConfig, data) => {
        console.group('MODAL_CLOSED');
        console.log(["config", componentConfig]);
        console.log(["data", data]);

        const { id } = componentConfig;
        const comonentEventId = componentConfig.name || id;

        eventNs.emitLocalEvent(
          $component,
          componentConfig,
          ns.eventMap,
          data,
          eventNs.EVENTS.EVENT_ITEM_DELETED,
          ns.ACTION_MODAL_CLOSED,
          {
            id: comonentEventId
          }
        );

        console.groupEnd();
    }

    ns.MODAL_CLOSE_STOP = ($component, componentConfig, data) => {
        console.group('MODAL_CLOSE_STOP');
        console.log(["config", componentConfig]);
        console.log(["data", data]);

        const { id } = componentConfig;
        const comonentEventId = componentConfig.name || id;

        eventNs.emitLocalEvent(
          $component,
          componentConfig,
          ns.eventMap,
          data,
          eventNs.EVENTS.EVENT_ITEM_SELECT,
          ns.ACTION_MODAL_CLOSE_STOP,
          {
            id: comonentEventId
          }
        );

        console.groupEnd();
    }

    ns.handleEventAction = ($component, action, data) => {
      console.group('handleEvent');
      console.log(["handleEvent", $component, action, data]);
      let componentConfig = componentNs.getComponentConfig($component);

      switch (action) {
        case ns.ACTION_MODAL_OPEN:
          ns.MODAL_OPEN($component, componentConfig, data);
          break;
        case ns.ACTION_MODAL_CLOSE:
          ns.MODAL_CLOSE($component, componentConfig, data);
          break;
        case ns.ACTION_MODAL_OPENED:
          ns.MODAL_OPENED($component, componentConfig, data);
          break;
        case ns.ACTION_MODAL_CLOSED:
          ns.MODAL_CLOSED($component, componentConfig, data);
          break;
        case ns.ACTION_MODAL_CLOSE_STOP:
          ns.MODAL_CLOSE_STOP($component, componentConfig, data);
          break;
        default:
          console.log("no action found");
          break;
      }

      console.groupEnd();
    }
    
    ns.getModal = ($component) => {
      let modalObject = $component.find(".modal").get(0);
      console.log(["modalObject", modalObject]);
      return bootstrap.Modal.getOrCreateInstance(modalObject);
    }

    ns.showModal = ($component) => {
        console.groupCollapsed('openModal');
        var modal = ns.getModal($component);
        console.log(["modal", modal]);
        modal.show();
        console.groupEnd();
    }

    ns.hideModal = ($component) => {
        console.groupCollapsed('hideModal');
        var modal = ns.getModal($component);
        console.log(["modal", modal]);
        modal.hide();
        console.groupEnd();
    }

    ns.updateModal = ($component) => {
      console.groupCollapsed('updateModal');
      var modal = ns.getModal($component);
      console.log(["modal", modal]);
      modal.handleUpdate();
      console.groupEnd();
    }
      

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        const { id } = componentConfig;
        console.groupCollapsed('init ' + id);
        console.log(["config", componentConfig]);

        
        console.log("adding event listeners");
        ns.addEventListener($component, componentConfig);
        console.log(["ns.eventMap", ns.eventMap]);

        console.groupEnd();
    }

})(jQuery, Typerefinery.Components.Layout.Modal, Typerefinery.Modal, Typerefinery.Components, Typerefinery.Page.Events, document, window);