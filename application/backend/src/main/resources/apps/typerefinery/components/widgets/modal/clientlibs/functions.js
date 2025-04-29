window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layout = Typerefinery.Components.Layout || {};
window.Typerefinery.Components.Layout.Modal = Typerefinery.Components.Layout.Modal || {};
window.Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, formNs, componentNs, eventNs, document, window) {
    "use strict";

    ns.selectorComponentName = "modal";
    ns.selectorComponent = '[component=modal]';

    ns.eventNameShowModal = "tr.modal.show";

    ns.classButtonMaximise = "btn-maximize";
    ns.selectorButtonMaximise = `.${ns.classButtonMaximise}`;
    ns.classCancelButton = "btn-secondary";
    ns.selectorCancelButton = `.${ns.classCancelButton}`;
    ns.classSaveButton = "btn-primary";
    ns.selectorSaveButton = `.${ns.classSaveButton}`;
    ns.classCloseButton = "btn-close";
    ns.selectorCloseButton = `.${ns.classCloseButton}`;

    ns.classModal = "modal";
    ns.selectorModal = `.${ns.classModal}`;
    ns.classModalContent = "modal-content";
    ns.selectorModalContentTemplate = `template`;
    ns.selectorModalContent = `.${ns.classModalContent}`;
    ns.classModalTemplateRender = "render";
    ns.selectorModalTemplateRender = `.${ns.classModalTemplateRender}`;
    ns.classModalHeader = "modal-header";
    ns.selectorModalHeader = `.${ns.classModalHeader}`;
    ns.classModalBody = "modal-body";
    ns.selectorModalBody = `.${ns.classModalBody}`;
    ns.classModalFooter = "modal-footer";
    ns.selectorModalFooter = `.${ns.classModalFooter}`;
    ns.classModalDialog = "modal-dialog";
    ns.selectorModalDialog = `.${ns.classModalDialog}`;

    ns.classStatus = "status";
    ns.selectorStatus = `.${ns.classStatus}`;
    ns.classStatusLoader = "loading";
    ns.selectorStatusLoader = `.${ns.classStatusLoader}`;
    ns.classStatusSubmitting = "submitting";
    ns.selectorStatusSubmitting = `.${ns.classStatusSubmitting}`;
    ns.classStatusSubmitted = "submitted";
    ns.selectorStatusSubmitted = `.${ns.classStatusSubmitted}`;
    ns.classStatusError = "error";
    ns.selectorStatusError = `.${ns.classStatusError}`;

    ns.selectorFrame = "iframe";
    ns.selectorForm = "form";
    ns.selectorIcon = ".icon";

    ns.messageNameFormSubmit = "ts.form.submit";
    ns.messageNameFormSuccess = "ts.form.success";
    ns.messageNameFormCancel = "ts.form.cancel";
    ns.messageNameFormError = "ts.form.error";
    ns.messageNameFormUnknown = "ts.form.unknown";

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

    
    ns.MESSAGE_NAMES = {
        FORM_SUBMIT: ns.messageNameFormSubmit,
        FORM_SUCCESS: ns.messageNameFormSuccess,
        FORM_CANCEL: ns.messageNameFormCancel,
        FORM_ERROR: ns.messageNameFormError,
        FORM_UNKNOWN: ns.messageNameFormUnknown
      };
  
    ns.modalListeners = new Map();

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
        var $modal = ns.findModal($component);
        var modal = ns.getModal($modal);

        ns.addModalMaximiseListener($modal);
        ns.addModelOpenListener($modal);
      
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
                    $modal.on('shown.bs.modal', function (event) {
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
                    $modal.on('hidden.bs.modal', function (event) {
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
                    $modal.on('hidePrevented.bs.modal', function (event) {
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
                    $modal.on('hide.bs.modal', function (event) {
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
                    $modal.on('open.bs.modal', function (event) {
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

        console.log("adding modal event listeners");
        // add all other modal event listeners to process after all events are processed
        ns.addModalCloseListener($modal);
        ns.addModalSubmitListener($modal);

        ns.addModalFrameErrorListener($modal);
        ns.addModalLoaderEventListener($modal);
                
        console.groupEnd();
      
    }

    ns.addModalFormListeners = ($modal) => {
        console.log("adding form event listeners");
        ns.modalRegisterEvent($modal, ns.MESSAGE_NAMES.FORM_SUCCESS, ns.frameMessageHandler, ($modal, data, eventHandlerId) => {
            console.log("form submitted");
            console.log(["$modal", $modal, "data", data]);
    
            ns.showStatus($modal, ns.selectorStatusSubmitted);
      
            // hide the modal after 2 seconds
            setTimeout(() => {
              ns.hideModal($modal, ns.MESSAGE_NAMES.FORM_SUCCESS);
            }, 2000);
        });
        ns.modalRegisterEvent($modal, ns.MESSAGE_NAMES.FORM_CANCEL, ns.frameMessageHandler, ($modal, data, eventHandlerId) => {
            console.log("form cancelled");
            console.log(["$modal", $modal, "data", data]);
    
            ns.showStatus($modal, ns.selectorStatusError);
      
            // hide the modal after 2 seconds
            setTimeout(() => {
              ns.hideModal($modal);
            }, 2000);
        });
        ns.modalRegisterEvent($modal, ns.MESSAGE_NAMES.FORM_ERROR, ns.frameMessageHandler, ($modal, data, eventHandlerId) => {
            console.log("form submitted");
            console.log(["$modal", $modal, "data", data]);
    
            ns.showStatus($modal, ns.selectorStatusError);
    
            // hide the modal after 2 seconds
            setTimeout(() => {
              ns.hideModal($modal);
            }, 2000);
        });

    }

    ns.addModelOpenListener = ($modal) => {
        console.log("adding open event listener for modal");
        $modal.on("show.bs.modal", function () {
          console.log(`modal opened ${$modal.attr('id')}`);
          //if modal has iframe then show loader
          if($modal.find(ns.selectorFrame).length > 0) {
              ns.showStatus($modal, ns.selectorStatusLoader);
          }
        });
    };

    /**
     * Toggle the modal  to maximise or minimise
     * @param {*} $modal 
     * @param {*} force 
     */
    ns.maximiseModalToggle = ($modal, force) => {
        console.group(`maximiseModalToggle`, $modal);
        let $modalDialog = $modal.find(ns.selectorModalDialog);
        console.log(["$modal", $modal, "$modalDialog", $modalDialog]);
        //quick check if modal dialog is available
        if ($modalDialog.length > 0) {
            console.log("modal dialog found");
            let modal = bootstrap.Modal.getOrCreateInstance($modal.get(0));

            console.log(["$modal", $modal, "modal", modal]);

            //check if modal is visible
            if ($modal.is(":visible")) {
                console.log("modal is visible");

                let $maximiseButton = $modal.find(ns.selectorButtonMaximise);
                console.log(["$maximiseButton", $maximiseButton]);

                //check if modal is already maximised
                if (!$modalDialog.hasClass("modal-fullscreen") || force) {
                    console.log("modal is not maximised, maximising modal");
                    //toggle maximise
                    let $modalIcon = $maximiseButton.find(ns.selectorIcon);
                    if ($modalIcon.length === 0) {
                        console.log("icon not found");
                        $modalDialog.toggleClass("modal-fullscreen");
                    } else {
                        console.log("icon found");
                        $modalDialog.toggleClass("modal-fullscreen");
                        $modalIcon.toggleClass(
                            "pi-window-maximize pi-window-minimize"
                        );
                    }
                    // get new label from button
                    let label = $maximiseButton.attr("labelMaximise");
                    // set new aria-label
                    $maximiseButton.attr("aria-label", label);
                } else {
                    console.log("modal is already maximised");
                    //minimise modal
                    $modalDialog.toggleClass("modal-fullscreen");
                    let $modalIcon = $maximiseButton.find(ns.selectorIcon);
                    if ($modalIcon.length > 0) {
                        $modalIcon.toggleClass(
                            "pi-window-minimize pi-window-maximize"
                        );
                    }
                    // get new label from button
                    let label = $maximiseButton.attr("labelMinimise");
                    // set new aria-label
                    $maximiseButton.attr("aria-label", label);
                }
            } else {
                console.log("modal is not visible");
            }
        } else {
            console.log("modal dialog not found");
        }

        console.groupEnd();
    };

    // Add listener to expand icon in the dialog
    ns.addModalMaximiseListener = ($modal) => {   
        console.log(["adding maximise event listener for modal", $modal.find(ns.selectorButtonMaximise)]);     
        $modal.find(ns.selectorButtonMaximise).on("click", function (e) {
          console.log("maximize clicked");
          e?.preventDefault();
          e?.stopPropagation();  
          ns.maximiseModalToggle($modal);
  
          $(this).blur();

  
        });
      };

    ns.addModalCloseListener = ($modal) => {
        // listen to modal event hidden.bs.modal and remove modal from the dom.
        console.log("adding close event listener for modal");
        $modal.on("hidden.bs.modal", function () {
          console.log("modal closed, hiding modal");
          ns.unloadModalContent($modal);
          $modal.hide();
        });
      };

    ns.addModalSubmitListener = ($modal) => {
        // Add listener to submit button in the dialog
        console.log("adding submit event listener for modal");
        $modal.on("click", ns.selectorSaveButton, function (e) {
            e?.preventDefault();
            e?.stopPropagation();
            console.log("submit clicked");

            let contentHasFrame = $modal.find(ns.selectorFrame).length > 0;
            console.log(["contentHasFrame", contentHasFrame]);
            let contentHasForm = $modal.find(ns.selectorForm).length > 0;
            console.log(["contentHasForm", contentHasForm]);
            
            if (contentHasFrame) {
                // hide frame
                $modal.find(ns.selectorFrame).hide();
        
                ns.showStatus($modal, ns.selectorStatusSubmitting);
                
                let formOnSameDomain = false;
                try {
                    //
                    let $frame = $modal.find(ns.selectorFrame);
                    //find the iframe in the modal
                    const iframeDocument = $frame.get(0).contentDocument;
                    //find first form in the iframe
                    const forms = iframeDocument.getElementsByTagName(ns.selectorForm);
        
                    console.log(["forms", forms]);
        
                    $modal.attr('hasForm', forms.length > 0);
        
                    if(forms.length > 0) {
                    // get the first form as Form Element and request submit it.
                    forms[0].requestSubmit();
                    // disable the primary action button.
                    $(this).prop('disabled', true);
                    }
                    formOnSameDomain = true;
                } catch (e) {
                    console.log("could not find form in the iframe, or iframe is from different origin.");
                    console.log(e);
                }
        
                if (formOnSameDomain == false) {
                    console.log("form is not on the same domain, sending frame message.");
                    // send message to iframe to submit the form.
                    const iframe = $modal.find(ns.selectorFrame).get(0);            
                    iframe.contentWindow.postMessage('submit', '*');
                    console.log("message sent to iframe to submit the form.");
                }
            } else if (contentHasForm) {

                console.log(["contentHasForm", contentHasForm]);

                let $form = $modal.find(ns.selectorForm);
                console.log(["$form", $form]);

                formNs.submitForm($form, ($component, componentConfig, payload) => { 
                    //success
                    console.log(["success", payload]);
                    ns.hideStatus($modal);
                    ns.hideContent($modal);
                    ns.showStatus($modal, ns.selectorStatusSubmitted);
                    ns.hideModal($modal, ns.MESSAGE_NAMES.FORM_SUCCESS);

                    // // hide the modal after 2 seconds
                    // setTimeout(() => {
                    //   ns.hideModal($modal, ns.MESSAGE_NAMES.FORM_SUCCESS);
                    // }, 2000);

                }, ($component, componentConfig, payload) => {
                    //error
                    console.log(["error", payload]);
                    ns.hideStatus($modal);
                    ns.hideContent($modal);
                    ns.showStatus($modal, ns.selectorStatusError);

                 });

                // disable the primary action button.
                $(this).prop('disabled', true);
        
            } else {
                console.log("no form or iframe is found");
            }
        });
    };

    ns.addModalFrameErrorListener = ($modal) => {
        console.log("adding frame error event listener for modal");
        //show loader when modal is opened
        let $iframes = $modal.find(ns.selectorFrame)

        if ($iframes.length === 0) {
            console.log("iframe not found");
            return;
        }

        let iframe = $iframes.get(0);
        console.log([ns.selectorFrame, iframe]);
  
        iframe.addEventListener('error', function () {
          $modal.find(ns.selectorFrame).hide();
          console.log("iframe error");
  
          ns.showStatus($modal, ns.selectorStatusError);
        }, true);   
  
        try {
          //try iframe contentWindow onerror
          if (iframe.contentWindow && iframe.contentWindow.addEventListener) {
            iframe.contentWindow.addEventListener("error", function () {
              $modal.find(ns.selectorFrame).hide();
              console.log("iframe error");
  
              ns.showStatus($modal, ns.selectorStatusError);
            });
          } else {
            console.log("iframe.contentWindow does not exist.");
          }
        } catch (e) {
          console.log("could not add iframe contentWindow onerror, iframe is from different origin.");
          console.log(e);
        }
    };
  

    ns.addModaliFrameLoadListener = ($modal, iframe) => {
        console.log("adding frame load event listener for modal");
        iframe.addEventListener('load', function () {
            console.log("iframe loaded");
    
            let frameStatusAccessed = false
            try {
              var frameStatus = iframe.contentWindow.performance.getEntries().find(e => e.entryType === "navigation")['responseStatus'];
              frameStatusAccessed = true;
              if (frameStatus !== 200) {
                console.log("iframe loaded with error status", frameStatus);
    
                ns.showStatus($modal, ns.selectorStatusError);
    
                //enable the save button
                $modal.find(ns.selectorSaveButton).prop('disabled', true);
                return;
              } else {
                console.log("iframe loaded successfully");
              }
            } catch (e) {
              console.log("could not read frame status, iframe is from different origin.");
              console.log(e);
            }

            // hide the loaders
            ns.showStatus($modal, ns.selectorStatusLoader);
    
            //enable the save button
            ns.disableSaveButton($modal);
    
            let modal = ns.getModal($modal);
            //show the form
            modal.show();
    
          }, true);
    }

    ns.addModalLoaderEventListener = ($modal) => {
        console.log("adding loader event listener for modal");
  
        ns.showStatus($modal, ns.selectorStatusLoader);

        $modal.on("load", function () {
            console.log("modal load event");
        });
  
        let $iframes = $modal.find(ns.selectorFrame)

        if ($iframes.length === 0) {
            console.log("iframe not found");
        } else {
            let iframe = $iframes.get(0);
        
            console.log(["add listeners to first iframe", ns.selectorFrame, iframe]);

            ns.addModaliFrameLoadListener($modal, $iframes.get(0));
        }
        
        let $forms = $modal.find(ns.selectorForm);

        if ($forms.length === 0) {
            console.log("form not found");
        } else {
            let form = $forms.get(0);
            console.log(["add listeners to first form", ns.selectorForm, form]);

            form.addEventListener('submit', function () {
                console.log("form submitted");
            });
        }

    };        

    ns.generateEventControllerId = (modalId, name) => {
        return `ts.modal.frame.event.${modalId}.${name}`;
    };
  
    //create a new function for this modal and store it ns.modalListeners map that will use abortcontroller to abort listener when modal is closed.
    ns.modalRegisterEvent = ($modal, name, handler, callback) => {
        console.groupCollapsed(`registering modal event ${name}`);
        console.log(["$modal", $modal, "name", name, "handler", handler, "callback", callback]);

        let $iFrames = $modal.find(ns.selectorFrame);
        if ($iFrames.length === 0) {
            console.log("iframe not found");
        } else {
            const iFrameContentWindow = $iFrames.get(0).contentWindow;
            console.log(["windowListeneriFrameEvent", iFrameContentWindow]);
            //listen for global message events that are emited by iframe
            let modalId = $modal.attr('id') || $modal.parent().attr('id');
            let eventHandlerId = ns.generateEventControllerId(modalId, name);
            console.log(["modalId", modalId, "eventHandlerId", eventHandlerId]);
            let controller = new AbortController();
            // create a new function for this modal and store it ns.modalListeners map
            ns.modalListeners.set(eventHandlerId, {
                "id": eventHandlerId,
                "modalId": modalId,
                "handler": handler, 
                "frame": iFrameContentWindow, 
                "$modal": $modal, 
                "callback": callback, 
                "controller": controller
            });
    
            // add event listener for message event from ns.modalListeners map
            window.addEventListener('message', ns.modalListeners.get(eventHandlerId).handler, {
                signal: ns.modalListeners.get(eventHandlerId).controller.signal
            });
        }

        console.groupEnd();
  
    };

    
    /**
     * Unregister named event for the modal by removing the event listener and aborting the controller.
     * @param {*} $modal 
     * @param {*} eventName 
     */
    ns.modalUnregisterEvent = ($modal, eventName) => {
        console.log("unregistering modal");
        let modalId = $modal.attr('id');
        let eventHandlerId = ns.generateEventControllerId(modalId, eventName);
        let {controller} = ns.modalListeners.get(eventHandlerId);
        controller.abort();
        ns.modalListeners.delete(eventHandlerId); // Remove it from the map
    };
  
  
    /**
     * Unregister all events for the modal by removing all event listeners and aborting all controllers.
     * @param {*} $modal 
     */
    ns.modalUnredisterAllEvents = ($modal) => {
        console.log("unregistering all modal events");
        let modalId = $modal.attr('id');
        let eventHandlerId = ns.generateEventControllerId(modalId, "");
       // find all event that start with this modalId and abort them.
        ns.modalListeners.forEach((value, key) => {
            if(key.startsWith(eventHandlerId)) {
                console.log(["aborting event", key]);
                value.controller.abort();
                ns.modalListeners.delete(key);
            }
        });
    };

    // translate the event payload action to message name
    ns.getMessageNameFromEventAction = (eventAction) => {
        console.log(["eventDataPayloadAction", eventAction]);
        let messageName = null;
  
        if (eventAction === formNs.ACTIONS.FORM_SUCCESS) {
          messageName = ns.MESSAGE_NAMES.FORM_SUCCESS;
        } else if (eventAction === formNs.ACTIONS.FORM_CANCEL) {
          messageName = ns.MESSAGE_NAMES.FORM_CANCEL;
        } else if (eventAction === formNs.ACTIONS.FORM_ERROR) {
          messageName = ns.MESSAGE_NAMES.FORM_ERROR;
        } else {
          messageName = ns.MESSAGE_NAMES.FORM_UNKNOWN;
          console.warn("eventDataPayloadAction not found");
        }
        console.log(["messageName", messageName]);
        return messageName;
    };

    ns.frameMessageHandler = (event) => {
        console.groupCollapsed(`embed windowListeneriFrameEvent on ${window.location}`);
        console.log(["event", event]);
  
        var eventType = event.type;
        var eventSource = event.source;
        var eventOrigin = event.origin;
        var eventData = event.data;
  
        console.log(["eventType", eventType, "eventSource", eventSource, "eventOrigin", eventOrigin, "eventData", eventData]);
        console.log(["modalListeners", ns.modalListeners, ns.modalListeners.has(event.source)]);
  
        let eventDataPayloadAction = eventData?.payload?.action;
        console.log(["eventDataPayloadAction", eventDataPayloadAction]);
  
        //this is the suffix for event name
        let messageName = ns.getMessageNameFromEventAction(eventDataPayloadAction);
        console.log(["messageName", messageName]);
        
        let $modal = eventSource?.frameElement?.closest(".modal");
        let modalId = $modal?.id || $modal?.parentElement?.id;
        console.log(["modalId", modalId]);
        let eventHandlerId = ns.generateEventControllerId(modalId, messageName);
        console.log(["eventHandlerId", eventHandlerId, ns.modalListeners.has(eventHandlerId)]);
  
        // find the modalListener in modalListeners map by looking for  event source
        if (ns.modalListeners.has(eventHandlerId)) {
          let {$modal, callback} = ns.modalListeners.get(eventHandlerId);
          console.log(["modal", $modal, "callback", callback]);
          //this message is from component iframe
          var eventData = event.data;
          var sourceWindow = event.source;
          var sourceOrigin = event.origin;
          console.log(["sourceWindow", sourceWindow, "sourceOrigin", sourceOrigin, "eventData", eventData]);
  
          var sourceData = eventData;
          if (typeof eventData === 'string') {
            sourceData = JSON.parse( eventData );
          }
        
          if (sourceData) {
            console.log(["sourceData", sourceData]);
  
            // ns.processWindowListenerEvent($component, event, sourceData);
            if (callback) {
              callback($modal, sourceData, eventHandlerId);
            }
          }
        } else {
          console.warn(`eventHandlerId ${eventHandlerId} does not match component iframe, ignoring`);
        }
        console.groupEnd();
    };
  

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
    
    ns.findModal = ($component) => {
        //is $component is modal then return it
        if ($component.hasClass("modal")) {
          return $component;
        }
        return $component.find(".modal");
    }

    ns.getModal = ($modal) => {
      console.log(["modalObject", $modal, $modal.get(0)]);
      if (!$modal || $modal.length === 0) {
        return null;
      }
      return bootstrap.Modal.getOrCreateInstance($modal.get(0));
    }

    ns.loadModalContent = ($component) => {
        console.groupCollapsed('loadModalContent');

        ns.showStatus($component, ns.selectorStatusLoader);

        // find template in modal content
        var $modal = ns.findModal($component);
        var $modalContent = $component.find(ns.selectorModalContent);
        var $modalContentTemplate = $modalContent.find(ns.selectorModalContentTemplate);
        var $modalContentTemplateRender = $modalContent.find(ns.selectorModalTemplateRender);

        console.log(["modalContent", $modalContent]);

        $modalContentTemplate.on('load', function () {
            console.log('modal content template loaded');
        });

        // if template found then load content
        if ($modalContentTemplate.length > 0) {
            var template = $modalContentTemplate.html();
            console.log(["template", template]);

            //serach for iframe and form in template string
            var templateHasiFrame = template.indexOf(`<${ns.selectorFrame}`) > 0;
            var templateHasForm = template.indexOf(`<${ns.selectorForm}`) > 0;
            
            console.log(["templateHasiFrame", templateHasiFrame]);
            console.log(["templateHasForm", templateHasForm]);
            
            $modalContentTemplateRender.html(template);

            if (templateHasiFrame) {
                console.log("template has iframe");
                // add listen event for iframe load
                var $iframe = $modalContentTemplateRender.find(ns.selectorFrame);
                $iframe.on('load', function () {
                    console.log('iframe loaded');
                    ns.hideStatus($component);
                    ns.showContent($component);
                    ns.enableSaveButton($component);
                });
                //register form events that are emited by iframe
                ns.addModalFormListeners($modal);
            } else if (templateHasForm) {
                console.log("template has form");
                // add listen event for form submit
                var $form = $modalContentTemplateRender.find(ns.selectorForm);
                console.log(["form", $form]);
                ns.hideStatus($component);
                ns.showContent($component);
                ns.enableSaveButton($component);
                // $form.on('submit', function () {
                //     console.log('form submitted');
                //     ns.hideContent($component);
                //     ns.showStatus($modal, ns.selectorStatusSubmitted);
      
                //     // hide the modal after 2 seconds
                //     setTimeout(() => {
                //       ns.hideModal($modal, ns.MESSAGE_NAMES.FORM_SUCCESS);
                //     }, 2000);
                // });
            } else {
                console.log("template has no form or iframe");
                ns.hideStatus($component);
            }


            
        }

        console.groupEnd();
    }

    ns.enableSaveButton = ($modal) => {
        console.log("enableSaveButton");
        $modal.find(ns.selectorSaveButton).prop('disabled', false);
    }

    ns.disableSaveButton = ($modal) => {
        console.log("disableSaveButton");
        $modal.find(ns.selectorSaveButton).prop('disabled', false);
    }

    ns.hideContent = ($component) => {
        console.groupCollapsed('hideContent');
        console.log(["component", $component]);

        // find template render in modal content
        var $modalContentTemplateRender = $component.find(ns.selectorModalTemplateRender);

        // add hide class to template render
        $modalContentTemplateRender.addClass('hide');
        console.groupEnd();
    }

    ns.showContent = ($component) => {
        console.groupCollapsed('showContent');
        console.log(["component", $component]);

        // find template render in modal content
        var $modalContentTemplateRender = $component.find(ns.selectorModalTemplateRender);
        
        // remove hide class from template render
        $modalContentTemplateRender.removeClass('hide');
    }        

    ns.hideStatus = ($component) => {
        console.groupCollapsed('hideStatus');
        console.log(["status", ns.selectorStatus, $component.find(ns.selectorStatus)]);

        $component.find(ns.selectorStatus).addClass('hide');

        console.groupEnd();
    }
        
    ns.showStatus = ($component, statusSelector) => {
        console.groupCollapsed('showStatus');
        console.log(["status", statusSelector, $component, $component.find(ns.selectorStatus), $component.find(statusSelector)]);

        //hide all status
        $component.find(ns.selectorStatus).addClass('hide');

        //show specific status
        $component.find(statusSelector).removeClass('hide');

        console.groupEnd();
    }

    ns.unloadModalContent = ($component) => {
        console.groupCollapsed('unloadModalContent');

        // find template render in modal content
        var $modalContent = $component.find(ns.selectorModalContent);
        var $modalContentTemplateRender = $modalContent.find(ns.selectorModalTemplateRender);

        console.log(["modalContent", $modalContent]);

        // if template render found then unload content
        if ($modalContentTemplateRender.length > 0) {
            $modalContentTemplateRender.html("");
        }

        console.groupEnd();
    }
    


    ns.showModal = ($component) => {
        console.groupCollapsed('openModal');
        var $modal = ns.findModal($component);
        var modal = ns.getModal($modal);
        console.log(["modal", modal]);
        modal.show();

        ns.showStatus($modal, ns.selectorStatusLoader);

        console.log("load modal content");
        ns.loadModalContent($component);
        console.log("content loaded");
        console.groupEnd();
    }

    ns.hideModal = ($component, reason) => {
        console.groupCollapsed('hideModal');
        console.log(["modal", $component]);
        var $modal = ns.findModal($component);
        var modal = ns.getModal($modal);
        console.log("unload modal content");
        ns.unloadModalContent($component);
        console.log(["modal", modal]);
        modal.hide();
        console.log("content unloaded");
        console.groupEnd();
    }

    ns.updateModal = ($component) => {
        console.groupCollapsed('updateModal');
        var $modal = ns.findModal($component);
        var modal = ns.getModal($modal);
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

})(jQuery, Typerefinery.Components.Layout.Modal, Typerefinery.Components.Forms.Form, Typerefinery.Components, Typerefinery.Page.Events, document, window);