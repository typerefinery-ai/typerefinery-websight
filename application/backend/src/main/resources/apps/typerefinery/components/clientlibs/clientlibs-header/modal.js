window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Modal = Typerefinery.Modal || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Form = Typerefinery.Components.Forms.Form || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, formNs, eventsNs, document, window) {


    ns.eventNameShowModal = "tr.modal.show";
    ns.classButtonMaximise = "btn-maximize";
    ns.selectorButtonMaximise = `.${ns.classButtonMaximise}`;
    ns.classCancelButton = "btn-secondary";
    ns.selectorCancelButton = `.${ns.classCancelButton}`;
    ns.classSaveButton = "btn-primary";
    ns.selectorSaveButton = `.${ns.classSaveButton}`;
    ns.classCloseButton = "btn-close";
    ns.selectorCloseButton = `.${ns.classCloseButton}`;
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

    ns.messageNameFormLoad = "ts.form.load";
    ns.messageNameModalOpen = "ts.modal.open";
    ns.messageNameModalClosing = "ts.modal.closing";

    ns.MESSAGE_NAMES = {
      FORM_SUBMIT: ns.messageNameFormSubmit,
      FORM_SUCCESS: ns.messageNameFormSuccess,
      FORM_CANCEL: ns.messageNameFormCancel,
      FORM_ERROR: ns.messageNameFormError,
      FORM_UNKNOWN: ns.messageNameFormUnknown,
      FORM_LOAD: ns.messageNameFormLoad,
      MODAL_OPEN: ns.messageNameModalOpen,
      MODAL_CLOSING: ns.messageNameModalClosing,
    };


    ns.isParentWindow = false;

    ns.modalListeners = new Map();

    // Inner HTML for the modal window.
    ns.getModalInnerHTML = (options) => {
      let modalTitle = options.modalTitle || "";
      let iframeURL = options.iframeURL || "";
      let hideFooter = options.hideFooter || false;
      let saveChangesText = options.saveChangesText || "Save Changes";
      let labelCancel = options.saveChangesText || "Cancel";
      let labelMaximise = options.labelMaximise || "Maximise";
      let labelMinimise = options.labelMinimise || "Minimise";
      let labelStatusLoading = options.loadingText || "Loading...";
      let labelStatusSubmitting = options.labelStatusSubmitting || "Submitting...";
      let labelStatusSubmitted = options.labelStatusSubmitted || "Submitted";
      let labelStatusError = options.labelStatusError || "Error";
      return `
          <div class="modal-dialog modal-lg">
              <div class="modal-content">
                  <div class="modal-header">
                      <h5 class="modal-title">${modalTitle}</h5>
                      <div class="modal-header-icons">
                        <button type="button" class="${ns.classButtonMaximise}" aria-label="${labelMaximise}" labelMaximise="${labelMaximise}" labelMinimise="${labelMinimise}">
                          <i class="icon pi pi-window-maximize"></i>
                        </button>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="${labelCancel}">
                        </button>
                      </div>
                  </div>
                  <div class="modal-body">
                      <div class="status ${ns.classStatusLoader}">
                          <div class="spinner-border" role="status">
                            <span class="visually-hidden">${labelStatusLoading}</span>
                          </div>
                      </div>
                      <div class="status ${ns.classStatusSubmitting}">
                          <div class="spinner-border text-warning" role="status">
                            <span class="visually-hidden">${labelStatusSubmitting}</span>
                          </div>
                      </div>
                      <div class="status ${ns.classStatusSubmitted}">
                          <div class="spinner-border text-success" role="status">
                            <span class="visually-hidden">${labelStatusSubmitted}</span>
                          </div>
                      </div>
                      <div class="status ${ns.classStatusError}">
                          <div class="spinner-border text-danger" role="status">
                            <span class="visually-hidden">${labelStatusError}</span>
                          </div>
                      </div>
                      <iframe src="${iframeURL}"></iframe>
                  </div>
                      ${hideFooter === true ? 
                              "" 
                          : 
                          `
                              <div class="modal-footer" >
                                  <button type="button" class="btn ${ns.classCancelButton}" data-bs-dismiss="modal">${labelCancel}</button>
                                  <button type="button" class="btn ${ns.classSaveButton}" disabled>
                                    <span class="spinner-border spinner-border-sm hidden" role="status" aria-hidden="true"></span>
                                    ${saveChangesText}
                                  </button>
                              </div>
                          `
                      }
              </div>
          </div>
      `;
    };

    ns.showStatus = ($modal, statusSelector) => {
        console.groupCollapsed('showStatus');
        console.log(["status", statusSelector]);

        // hide the loaders
        $modal.find(ns.selectorStatus).hide();
        // show submitted message
        $modal.find(statusSelector).css('display', 'flex');

        console.groupEnd();
    }

    ns.addModelListners = ($modal, options) => {

      ns.addModalMaximiseListener($modal);
      ns.addModalSubmitListener($modal);
      ns.addModalCloseListener($modal, options.callbackFn);
      ns.addModalLoaderEventListener($modal, options.callbackFnData);
      ns.addModelOpenListener($modal);
      ns.addModalFrameErrorListener($modal);
      ns.modalRegisterEvent($modal, ns.MESSAGE_NAMES.FORM_SUCCESS, ns.frameMessageHandler, ($modal, data, eventHandlerId) => {
        console.log("form submitted");
        console.log(["$modal", $modal, "data", data]);

        ns.showStatus($modal, ns.selectorStatusSubmitted);

        if (options.callbackFn) {
            options.callbackFn($modal, data, ns.MESSAGE_NAMES.FORM_SUCCESS);
        }
  
        // hide the modal after 2 seconds
        setTimeout(() => {
          ns.closeModal($modal, ns.MESSAGE_NAMES.FORM_SUCCESS);
        }, 2000);
      });
      ns.modalRegisterEvent($modal, ns.MESSAGE_NAMES.FORM_CANCEL, ns.frameMessageHandler, ($modal, data, eventHandlerId) => {
        console.log("form cancelled");
        console.log(["$modal", $modal, "data", data]);

        ns.showStatus($modal, ns.selectorStatusError);
  
        if (options.callbackFn) {
            options.callbackFn($modal, data, ns.MESSAGE_NAMES.FORM_CANCEL);
        }
        
        // hide the modal after 2 seconds
        setTimeout(() => {
          ns.closeModal($modal);
        }, 2000);
      }

      );
      ns.modalRegisterEvent($modal, ns.MESSAGE_NAMES.FORM_ERROR, ns.frameMessageHandler, ($modal, data, eventHandlerId) => {
        console.log("form submitted");
        console.log(["$modal", $modal, "data", data]);

        ns.showStatus($modal, ns.selectorStatusError);

        if (options.callbackFn) {
            options.callbackFn($modal, data, ns.MESSAGE_NAMES.FORM_ERROR);
        }

        // hide the modal after 2 seconds
        setTimeout(() => {
          ns.closeModal($modal);
        }, 2000);
      });
    };

    ns.addModalSubmitListener = ($modal) => {
      // Add listener to submit button in the dialog
      console.log("adding submit event listener for modal");
      $modal.on("click", ns.selectorSaveButton, function (e) {
        e?.preventDefault();
        e?.stopPropagation();
        
        console.groupCollapsed("submit clicked");

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
        console.groupEnd();
      });
    };

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

    ns.addModalCloseListener = ($modal, callbackFn) => {
      // listen to modal event hidden.bs.modal and remove modal from the dom.
      console.log("adding close event listener for modal");
      $modal.on("hidden.bs.modal", function () {
        if (callbackFn) {
            callbackFn($modal, {}, ns.MESSAGE_NAMES.MODAL_CLOSING);
        }
        //TODO: raise event to parent about closing of the modal.
        console.log("modal closed, destroying modal");
        // remove all event listeners
        ns.modalUnredisterAllEvents($modal);
        $modal.remove();
      });
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

        // let $modalDialog = $(this).find(ns.selectorModalDialog);
        // if($modalDialog.length === 0) {
        //     return;
        // }
        
        // let $modalIcon = $modalDialog.find(ns.selectorIcon);
        // if($modalIcon.length === 0) {
        //   $modalDialog.toggleClass("modal-fullscreen");
        //   return;
        // }
        // $modalDialog.toggleClass("modal-fullscreen");
        // $modalIcon.toggleClass("pi-window-maximize pi-window-minimize");

      });
    };

    /**
     * Add event listener for the modal to show loader when iframe is loading.
     * @param {*} $modal modal element
     * @param {*} callbackFnData($modal, data, message) callback to get data to be passed to the iframe.
     */
    ns.addModalLoaderEventListener = ($modal, callbackFnData) => {
      console.log("adding loader event listener for modal");

      ns.showStatus($modal, ns.selectorStatusLoader);

      let iframe = $modal.find(ns.selectorFrame).get(0);
      
      console.log([ns.selectorFrame, iframe]);
      
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
            if (callbackFnData) {
              // send message to iframe to load data into the form, the form should already have the event listener to handle this event.
              let data = callbackFnData();
              console.log(["callbackFnData", data]);
              const eventPayloadData = eventsNs.compileEventData(data, formNs.ACTIONS.FORM_LOAD, formNs.ACTIONS.FORM_LOAD, $modal.componentId, null);
              console.log(["send eventPayloadData to iframe", eventPayloadData]);
              ns.sendMessageToiFrame($modal, formNs.ACTIONS.FORM_LOAD, eventPayloadData);
            }
          }
        } catch (e) {
          console.log("could not read frame status, iframe is from different origin.");
          console.log(e);
        }

        // hide the loaders
        $modal.find(ns.selectorStatus).hide();

        //enable the save button
        $modal.find(ns.selectorSaveButton).prop('disabled', false);

        //show the form
        $(this).show();

      }, true);
    };  


    //send message to iframe
    ns.sendMessageToiFrame = function($component, action, eventData) {
        console.group("sendMessageToiFrame on " + window.location);
  
        //ensure that eventData is object
        var parsedEventData = eventData;
        if (typeof parsedEventData === 'string') {
          parsedEventData = JSON.parse( eventData );
        }
  
        if (!parsedEventData) {
          console.error("no data to send");
          console.groupEnd();
          return;
        }
  
        // console.log(["sendMessageToiFrame", data]);
        var $iframe = $component.find("iframe");
        var iframe = $iframe[0];
        console.log(["sendMessageToiFrame using postMessage", action, parsedEventData, $iframe, iframe]);
        //if iframe does not have TypeRefinery then it will need to manage its own events
        iframe.contentWindow.postMessage(parsedEventData, "*");
  
        console.log(["sendMessageToiFrame using postMessage, done"]);
        //call events
        //TODO: this will trigger CORS issue, disable to acoid double events?
        // try {
        //   if (iframe.contentWindow.Typerefinery.Page.Events) {
        //     console.log(["sendMessageToiFrame using events call, expect possible cors issue."]);
        //     const topic = sourceData.type;
        //     iframe.contentWindow.Typerefinery.Page.Events.emitEvent(topic, sourceData);
        //   }
        // } catch (error) {
        //   console.error("sendMessageToiFrame", error);
        // }
        console.groupEnd();
      }

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
      if($modalDialog.length > 0) {
        console.log("modal dialog found");
        let modal = bootstrap.Modal.getOrCreateInstance($modal.get(0));

        console.log(["$modal", $modal, "modal", modal]);

        //check if modal is visible
        if($modal.is(":visible")) {
          console.log("modal is visible");
          
          let $maximiseButton = $modal.find(ns.selectorButtonMaximise);
          console.log(["$maximiseButton", $maximiseButton]);

          //check if modal is already maximised
          if(!$modalDialog.hasClass("modal-fullscreen") || force) {
            console.log("modal is not maximised, maximising modal");
            //toggle maximise
            let $modalIcon = $maximiseButton.find(ns.selectorIcon);
            if($modalIcon.length === 0) {
                console.log("icon not found");
                $modalDialog.toggleClass("modal-fullscreen");
            } else {
                console.log("icon found");
                $modalDialog.toggleClass("modal-fullscreen");
                $modalIcon.toggleClass("pi-window-maximize pi-window-minimize");
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
            if($modalIcon.length > 0) {
              $modalIcon.toggleClass("pi-window-minimize pi-window-maximize");
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

    ns.generateEventControllerId = (modalId, name) => {
      return `ts.modal.frame.event.${modalId}.${name}`;
    };

    //create a new function for this modal and store it ns.modalListeners map that will use abortcontroller to abort listener when modal is closed.
    ns.modalRegisterEvent = ($modal, name, handler, callback) => {
      console.log("registering modal");
      const iFrameContentWindow = $modal.find("iframe")[0].contentWindow;
      console.log(["windowListeneriFrameEvent", iFrameContentWindow]);
      //listen for global message events that are emited by iframe
      let modalId = $modal.attr('id');
      let eventHandlerId = ns.generateEventControllerId(modalId, name);
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

      let modalId = eventSource?.frameElement?.closest(".modal")?.id;
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
    }

    /**
     * Unregister all events and close modal
     * @param {*} $modal 
     */
    ns.closeModal = ($modal) => {
      console.log("closing modal");
      ns.modalUnredisterAllEvents($modal);
      ns.hideModal($modal);
    };

    /**
     * Close the modal
     * @param {*} $modal 
     */
    ns.hideModal = ($modal) => {
      console.log("hiding modal");
      let modal = bootstrap.Modal.getOrCreateInstance($modal.get(0));
      modal.hide();
    };

    ns.addModalFrameErrorListener = ($modal) => {
      console.log("adding frame error event listener for modal");
      //show loader when modal is opened
      let iframe = $modal.find(ns.selectorFrame).get(0);

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

    /**
     * if iframe is from same origin then we can check the ready state of the iframe content document.
     * @param {*} iframe iframe element
     * @param {*} callback callback function 
     * @returns {boolean} true if iframe is loaded, false if iframe is not loaded. 
     */
    ns.iframeLoaded = (iframe, callback) => {
      if (iframe?.contentDocument) {
        let state = iframe?.contentDocument?.readyState || null;
        if(!state || state === 'complete') {
            callback();
            return;
        }
        let checkLoad = setInterval(() => {
            if (state !== iframe.contentDocument?.readyState) {
                if (iframe?.contentDocument?.readyState === 'complete') {
                    clearInterval(checkLoad);
                    callback();
                }
                state = iframe.contentDocument?.readyState;
            }
        }, 200);
      } else {
        console.log("iframe contentDocument is not available, executing callback.");
        callback();
        return false;
      }
    }

    /**
     * check if this is from iframe or not.
     * @returns {boolean} true if this is parent view, false if this is iframe view.
     */
    ns.isParentView = () => {
        return window.self === window.top;
        
    }

    /**
     * This is the Iframe Event Listener.
     * listen for showModal event.
     */
    ns.iframeEventListener = () => {
      // This is the Iframe Event Listener.
      // listen for showModal event.
      window.document.addEventListener(ns.eventNameShowModal, function (event) {
        console.group(`${ns.eventNameShowModal} event`);
        console.log(["event", event]);
          let options = event.detail.options;
          let $component = event.detail.$component;
          console.log(["$component", $component]);
          console.log(["options", options]);
          ns.createModalAndOpen($component, options);
        console.groupEnd();
      }, false);
    }

    // Setup modal controller for the page to listen to the ns.eventNameShowModal event that is dispatched from the iframe or other components that should not show modals.
    ns.initCommonModal = () => {
        // check if this is from iframe or not.
        const isParentView = ns.isParentView(); 

        // if this is not a parent view then return.
        if(!isParentView) {
            // console.log("This is not a parent view");
            return;
        }

        // This is the Iframe Event Listener.
        ns.iframeEventListener();
        
        // This is the parent view event listener.
        ns.isParentWindow = true;

    };  
  

    ns.createModalAndOpen = ($component, options) => {

      console.group('createModalAndOpen');
      console.log(["$component", $component, options]);
      console.log(["isParentWindow", ns.isParentWindow]);
      //if this is not parent then raise the event to parent, to manage the modal.
      if(ns.isParentWindow === false) {
        console.log("This is not a parent view, so dispatching the event to the parent view.");
        // dispatch parent
        const event = new CustomEvent(ns.eventNameShowModal, { detail: {options: options, $component: $component}});
        window.parent.document.dispatchEvent(event);

        return;
      }
      console.log("This is a parent view, so creating the modal here.");

      
      const modalId = Math.random().toString(16).slice(2);
      const modalContent = ns.getModalInnerHTML(options);
      const modalComponentName = options.modalComponentName || "generatedmodal";

      let backdropIsStatic = options.backdropIsStatic || false;
      let backdropIsStaticHtml = backdropIsStatic ? 'data-bs-backdrop="static"' : '';
      let keyboardIsEnabled = options.keyboardIsEnabled || true;
      let keyboardIsEnabledHtml = keyboardIsEnabled ? 'data-bs-keyboard="true"' : 'data-bs-keyboard="false"';

      // Modal Container with default Attributes
      let $modal = $(`<div 
        component="${modalComponentName}"
        class="modal fade modal-default" 
        id="${modalId}"
        ${keyboardIsEnabledHtml}
        ${backdropIsStaticHtml}
        tabindex="-1">
        ${modalContent}
      </div>`);

      // add event listener for modal
      $modal.on("click", function (e) { 
        console.log("modal clicked cancel event propogation");
        e?.preventDefault();
        e?.stopPropagation();
      });


      console.log(["$modal", $modal]);
      $component.append($modal);

      console.log("creating modal");

      const modal = bootstrap.Modal.getOrCreateInstance($modal.get(0));

      console.log("adding modal listeners");
      ns.addModelListners($modal, options);

      console.log(["showing modal",modal]);
      modal.show();

      
      console.groupEnd();
      return $modal;
    };

    // Init a common modal controller for the page to listen to the showModal event that is dispatched from the iframe or other components that should not show modals.
    ns.initCommonModal();

})(jQuery, Typerefinery.Modal, Typerefinery.Components.Forms.Form, Typerefinery.Page.Events, document, window);