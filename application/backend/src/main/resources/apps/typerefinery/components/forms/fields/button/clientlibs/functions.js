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


    ns.ACTION_BUTTON_CLICK = "BUTTON_CLICK";
    ns.ACTION_MODAL_OPEN = "MODAL_OPEN";

    ns.ACTIONS = {
        BUTTON_CLICK: ns.ACTION_BUTTON_CLICK,
        MODAL_OPEN: ns.ACTION_MODAL_OPEN
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
      
      console.log("registering events");

      let eventsAdded = false;
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
                console.log("adding event listener " + action);
                if (action === ns.ACTION_BUTTON_CLICK) {
                    $component.on("click", (e) => {
                        console.group(`click on ${window.location}`);
                        
                        console.log(["click", e]);
                        
                        e?.preventDefault();
                        
                        ns.BUTTON_CLICK($component, componentConfig, { 
                            type: topicName,
                            action: action ,
                            "id": id
                        });

                        console.groupEnd();
                    });
                    eventsAdded = true;
                } else if (action === ns.ACTION_MODAL_OPEN) {
                    $component.on("click", (e) => {
                        console.group(`click on ${window.location}`);
                        console.log(["click", e]);
                        e?.preventDefault();
                        ns.MODAL_OPEN($component, componentConfig, { 
                            type: topicName,
                            action: action,
                            "id": id
                        });
                        console.groupEnd();
                    });
                    eventsAdded = true;
                }
          } else {
              //listen register the event and listent for specific event on topic
              console.log(["register event listen", topicName, eventName]);
              eventNs.registerEvents(topicName, (data) => {
                    // check make sure the event is for this event
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

      if (eventsAdded) {
          console.log("component events has already added event listeners skipping basic events");
      } else {
        // basic button actions
        console.log("adding click listener");

        $component.on("click", (e) => {
            console.group(`click on ${window.location}`);
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
                    let options = {
                        modalTitle: componentConfig.actionModalTitle, 
                        iframeURL: modalUrl, 
                        hideFooter: componentConfig.hideFooter,
                        backdropIsStatic: componentConfig.backdropIsStatic
                    };
                    options.callbackFn = ($modal, data, message) => {
                        console.log(["modal callback", $modal, data, message]);
                        // alpha-launch docs/issues/0123 — mirror the dropdown items'
                        // successNavigateTo behaviour (clientlibs-header/dropdown.js): when the
                        // modal's form reports success, follow the authored destination. This is
                        // what lets a direct "New Incident" button reproduce the docx's
                        // create → land-on-overview journey without the dropdown.
                        if (componentConfig.actionSuccessNavigateTo && message === modalNs.MESSAGE_NAMES.FORM_SUCCESS) {
                            console.log("button openModal form success, navigating to " + componentConfig.actionSuccessNavigateTo);
                            window.location.href = componentConfig.actionSuccessNavigateTo;
                        }
                    };
                    modalNs.createModalAndOpen($component, options);
                } else {
                    ns.BUTTON_CLICK($component, componentConfig, { type: "button", action: "click" , "id": id } );
                }
            }
            console.groupEnd();
        });
      }

      console.groupEnd();

    }

    // local actions representing the form actions
    ns.BUTTON_CLICK = ($component, componentConfig, data) => {
      console.group('BUTTON_CLICK');
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_SUCCESS_ACTION, "BUTTON_CLICK");
      console.groupEnd();
    }

    ns.MODAL_OPEN = ($component, componentConfig, data) => {
      console.group('MODAL_OPEN');
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_SUCCESS_ACTION, "MODAL_OPEN");
      console.groupEnd();
    }
  
    /**
     * A submit button only submits a form it is a *descendant* of. Several pages author the
     * submit button in the page <header> while the form lives in <main> - every stixorm
     * create/update form does this - so the button renders type="submit" and is completely
     * inert: the click produces no submit event, no request, and nothing is logged anywhere,
     * which makes it look like a server problem rather than a markup one
     * (alpha-launch docs/issues/0038).
     *
     * The HTML `form` attribute exists for exactly this case: it associates a control with a
     * form it is not nested inside. Apply it only when the association is unambiguous, and say
     * so in the log either way - a button that cannot submit should never be silent about it.
     */
    ns.associateSubmitButtonWithForm = ($component, componentConfig) => {
      const { id } = componentConfig;
      const button = $component.is("button") ? $component.get(0) : $component.find("button").get(0);

      if (!button) {
        console.warn(`submit button ${id} has no button element to associate with a form.`);
        return;
      }
      if (button.closest("form")) {
        console.log(`submit button ${id} is inside its form, native submit applies.`);
        return;
      }
      if (button.getAttribute("form")) {
        console.log(`submit button ${id} is already associated with form ${button.getAttribute("form")}.`);
        return;
      }

      const forms = document.querySelectorAll("form[component=form]");
      const target = forms.length === 1 ? forms[0] : null;
      // NOTE: read the id with getAttribute, never `target.id`. A form exposes its named
      // controls as properties, so on any form carrying a field named "id" - which these
      // object forms do - `form.id` returns that <input>, not the form's id attribute.
      const targetId = target ? target.getAttribute("id") : null;

      if (targetId) {
        button.setAttribute("form", targetId);
        console.log(`submit button ${id} is outside the form - associated with form ${targetId} via the form attribute.`);
      } else {
        console.warn(`submit button ${id} is outside the form and ${forms.length} form component(s) were found on the page, so it cannot be associated unambiguously - this button will not submit anything.`);
      }
    };

    ns.handleEventAction = ($component, componentConfig, action, data) => {
      console.group('handleEvent');
      console.log(["handleEvent", $component, action, data]);
      // if componentConfig is not passed then get it from the component
      if (!componentConfig) {
        componentConfig = componentNs.getComponentConfig($component);
      }
      switch (action) {
        case ns.ACTION_BUTTON_CLICK:
          ns.BUTTON_CLICK($component, componentConfig, data);
          break;
        case ns.ACTION_MODAL_OPEN:
          ns.MODAL_OPEN($component, componentConfig, data);
          break;
        default:
          break;
      }
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
            // a submit button carries no click handler by design - the browser submits the
            // form for it, but only if the two are associated. See docs/issues/0038.
            initEvents = false;
            ns.associateSubmitButtonWithForm($component, componentConfig);
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