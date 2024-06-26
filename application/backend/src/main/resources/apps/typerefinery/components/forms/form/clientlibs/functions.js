window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Form = Typerefinery.Components.Forms.Form || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Editor = Typerefinery.Components.Widgets.Editor || {};
window.Typerefinery.Components.Forms.Select = Typerefinery.Components.Forms.Select || {};
window.Typerefinery.Components.Forms.Composite = Typerefinery.Components.Forms.Composite || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Events = Typerefinery.Page.Events || {};
window.Typerefinery.Page.Files = Typerefinery.Page.Files || {};

(function ($, ns, componentNs, editorNs, selectNs, compositeNs, eventNs, filesNs, document, window) {
    "use strict";
    
    ns.selectorComponent = '[component=form]';
    ns.selectorInputAttribute = "isInput";
    ns.selectorInput = `[${ns.selectorInputAttribute}]`;

    // map event types to handlers in component
    // this will indicate which events are supported by component
    ns.eventMap = eventNs.genericEventsTopicMap();

    // compule form data into payload
    ns.getFormData = async ($component, addFieldHint) => {
        const result = {};
        // get all non composite fields and immidiate composite fields.
        const $formComponents = $component.findExclude(`${ns.selectorInput},${compositeNs.selector}`,compositeNs.selector);
        console.group("getFormData");
        
        const formId = $component.attr("id");
        //get form data from global form object
        const formData = Object.fromEntries(new FormData(document.forms[formId]));
        
        console.log($formComponents, $component, formData);

        // using for to ensure async await works.
        for(let i = 0; i < $formComponents.length; i++) {
            const $input = $($formComponents[i]);
            const inputObject = $input.get(0);
            const name = $input.attr("name") || $input.attr("id");
            const id = $input.attr("id");
            const type = $input.attr("type") || "";
            console.group(name);
            console.log("$input", $input);
            console.log("inputObject", inputObject);
            console.log("console.log($input.val());", $input.val());

            //is this input field
            const isInput = $input.attr(ns.selectorInputAttribute);
            //is this composite value
            const isCompositeParent = $input.is(compositeNs.selector);

            console.log(["getFormData form component", name, isInput, isCompositeParent]);

            //skip all field that do not have a name
            if (name) {
                // is this text area or input field.
                const isEditor = isInput === "editor";
                const isSelect = isInput === "select";

                console.log(["getFormData basic form component", isSelect, isEditor]);

                if(isCompositeParent) {

                  console.log(["getFormData composite component", name, isCompositeParent]);
                  
                  // get value from composite value
                  var $compositeValue = $input.findExclude(compositeNs.selectorValue, compositeNs.selector);
                  console.log(["getFormData composite value input", $compositeValue]);
                  var compositeValueName = $compositeValue.attr(compositeNs.selectorNameAttribute);
                  console.log(["getFormData composite value", $compositeValue]);
                  result[compositeValueName] = {};
                  Object.assign(result[compositeValueName], $compositeValue.compositeVal(addFieldHint));

                  if (addFieldHint) {
                    ns.addFieldHint($input, compositeValueName, id);
                  }

                } else if(isEditor) {
                    const editorId = $input.data("editor-id");
                    console.log(["getFormData editor component", name, editorId]);
                    result[name] = await editorNs.getValue(editorId);

                    if (addFieldHint) {
                      ns.addFieldHint($input, name, editorId);
                    }             
                }else if(isSelect) {
                    // get value from select tag
                    console.log(["getFormData select component", name, id]);
                    result[name] = selectNs.getValue(id);
                    if (addFieldHint) {
                      ns.addFieldHint($input, name, id);
                    }             
                  } else {
                    console.log(["getFormData other component value", name, result[name], $input.val()]);
                    if (type === "checkbox") {
                        // get value from checkbox if checked
                        if ($input.is(":checked")) {
                          if (!result[name]) {
                              result[name] = [];
                          }
                          result[name].push($input.val());
                        }
                    } else if (type === "radio") {
                        // get value from radio if checked
                        if ($input.is(":checked")) {
                          result[name] = $input.val();
                        }
                    } else if (type === "file") {
                      const files = [...inputObject.files];
                      // add loader.
                      files.forEach(file => {
                          const fileName = file?.name?.trim()?.replace(/\s/g, "-");
                          document.getElementById(`close-${fileName}`).style.display = "none";
                          document.getElementById(`loader-${fileName}`).style.display = "block";
                      });
                      if($input.multiple) {
                          result[name] = [];
                          for(let i = 0; i < files.length; i++) {
                              const fileName = files[i]?.name?.trim()?.replace(/\s/g, "-");
                              const output = await filesNs.uploadFile(files[i]);
                              document.getElementById(`loader-${fileName}`).style.display = "none";
                              document.getElementById(`close-${fileName}`).style.display = "block";
                              result[name].push(output);
                          }
                      }else if($input.files.length > 0){
                          const blobUrl = await filesNs.uploadFile(files[0]);
                          const fileName = files[0]?.name?.trim()?.replace(/\s/g, "-");
                          document.getElementById(`loader-${fileName}`).style.display = "none";
                          document.getElementById(`close-${fileName}`).style.display = "block";
                          result[name] = blobUrl;
                      } else {
                          // if no file is selected then it will return empty string.
                          result[name] = "";
                      }
                    } else {                        
                      // get value from $input tag
                      result[name] = $input.val();
                    }
                    
                    if (addFieldHint) {
                      ns.addFieldHint($input, name, id);
                    }             

                }

            }
            console.groupEnd();
        }
        console.log(["getFormData", result]);
        console.groupEnd();
        return result;
    };

    // submit the request to the server
    ns.submit = async ($component, componentConfig, url, method, payloadType, body, successCallback = () => { }, errorCallback = () => { }) => {
        console.group("submit");
        console.log([url, method, payloadType, body])
        let controller = new AbortController();
        try {          
          await fetch(url, {
            method: method || 'POST',
            headers: {
              'Content-Type': payloadType || 'application/x-www-form-urlencoded'
            },
            body: body,
            keepalive: true,
            redirect: 'follow',
            signal: controller.signal
          })
          .then(res => res.json())
          .then(res => {
            console.group("submit response");
            console.log(res)
            successCallback($component, componentConfig, {
              url: url, 
              method: method, 
              payloadType: payloadType, 
              body: body
            })
            console.groupEnd();
          });
        
        } catch (error) {
            console.group("Error in submitting the request");
            console.error(error);
            errorCallback($component, componentConfig, {
              url: url, 
              method: method, 
              payloadType: payloadType, 
              body: body
            });
            console.groupEnd();
            return;
        }
        controller = null;
        console.groupEnd();
        return;
    };

    // local actions representing the form actions
    ns.FORM_SUCCESS = ($component, componentConfig, formData) => {
      console.group("FORM_SUCCESS");
      console.log(["FORM_SUCCESS", $component, componentConfig, formData]);
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, formData, eventNs.EVENTS.EVENT_SUCCESS_ACTION, "FORM_SUCCESS");
      console.groupEnd();
    }
    ns.FORM_ERROR = ($component, componentConfig, formData) => {
      console.log("FORM_ERROR");
      console.log(["FORM_ERROR", $component, componentConfig, formData]);
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, formData, eventNs.EVENTS.EVENT_ERROR_ACTION, "FORM_ERROR");
      console.groupEnd();
    }
    ns.FORM_SUBMIT = ($component, componentConfig, formData) => {
      console.log("FORM_SUBMIT");
      console.log(["FORM_SUBMIT", $component, componentConfig, formData]);
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, formData, eventNs.EVENTS.EVENT_SUBMIT_ACTION, "FORM_SUBMIT");
      console.groupEnd();
    }
    ns.FORM_CANCEL = ($component, componentConfig, formData) => {
      console.log("FORM_CANCEL");
      console.log(["FORM_CANCEL", $component, componentConfig, formData]);
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, formData, eventNs.EVENTS.EVENT_CANCEL_ACTION, "FORM_CANCEL");
      console.groupEnd();
    }
    ns.FORM_RESET = ($component, componentConfig, formData) => {
      console.log("FORM_RESET");
      console.log(["FORM_RESET", $component, componentConfig, formData]);
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, formData, eventNs.EVENTS.EVENT_RESET_ACTION, "FORM_RESET");
      console.groupEnd();
    }
    ns.FORM_LOADED = ($component, componentConfig, formData) => {
      console.log("FORM_LOADED");
      console.log(["FORM_LOADED", $component, componentConfig, formData]);
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, formData, eventNs.EVENTS.EVENT_READ_ACTION, "FORM_LOADED");
      console.groupEnd();
    }

    // json form post
    ns.jsonRequest = async (url, componentConfig, payload, $component) => {
        const { writePayloadType, writeMethod } = componentConfig;
        ns.FORM_SUBMIT($component, componentConfig, payload);
        await ns.submit($component, componentConfig, url, writeMethod, writePayloadType, JSON.stringify(payload), ns.FORM_SUCCESS, ns.FORM_ERROR);
    };
    //plain form post
    ns.formRequest = async (url, componentConfig, payload, $component) => {
        const { writePayloadType, writeMethod } = componentConfig;
        const formData = new URLSearchParams();
        Object.entries(payload).map(item => {
            formData.append(item[0], item[1])
        });
        ns.FORM_SUBMIT($component, componentConfig, formData);
        await ns.submit($component, componentConfig, url, writeMethod, writePayloadType, formData.toString(), ns.FORM_SUCCESS, ns.FORM_ERROR);
    };

    // update the button state to loading or completed.
    ns.updateButtonState = ($component, state) => {
        const $button = $component.find("button[type='submit']");
        if ($button) {
            
            // disable the button and loading text 
            $button.disabled = state === "loading";
            $button.innerHTML = state === "loading" ? `<i class="pi pi-spin pi-spinner"></i>` : $button.attr("data-label");
        }
    };


    // form submit handler
    ns.formSubmitHandler = async ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        console.log(["formSubmitHandler", componentConfig, $component])
        let { writePayloadType, writeMethod, writeUrl } = componentConfig;
        if (!writeUrl) {
          ns.FORM_CANCEL($component, componentConfig, {data: componentConfig, reason: "Form has not been configured properly."});
          console.log("Post URL not set can't continue.");
          return;
        }
        //do default JSON and POST if not set
        if (!writePayloadType || !writeMethod ) {
            writePayloadType = "application/json";
            writeMethod = "POST";
            console.log("Payload type or method not set, defaulting to JSON and POST.");
            return;
        }
        const payload = await ns.getFormData($component);
        ns.updateButtonState($component, "loading");

        //TODO: do form validation here and cancel the request if validation fails
        writeUrl = componentNs.replaceRegex(writeUrl, componentNs.getQueryParams());

        if (writePayloadType === "application/json") {
            await ns.jsonRequest(writeUrl, componentConfig, payload, $component);
        } else if (writePayloadType === "application/x-www-form-urlencoded") {
            await ns.formRequest(writeUrl, componentConfig, payload, $component);
        }
        ns.updateButtonState($component, "completed");
    };

    ns.loadData = async ($component, data, componentConfig) => {
        try { 
          // if componentConfig is not passed then get the componentConfig from the $component           
          if (!componentConfig) {
              componentConfig = componentNs.getComponentConfig($component);
          }
          const $formComponents = $component.findExclude(`${ns.selectorInput},${compositeNs.selector}`,compositeNs.selector);
          console.group("loadData");
          console.log(["loadData", $component, data, componentConfig, $formComponents]);

          // if data is not passed then return
          if (!data) {
              console.log("Data is missing");
              return;
          }
            
          // step though $formComponents
          for(let i = 0; i < $formComponents.length; i++) {
              const $input = $($formComponents[i]);
              const inputObject = $input.get(0);
              const name = $input.attr("name") || $input.attr("id");
              const id = $input.attr("id");
              const type = $input.attr("type") || "";
              const tagName = $input.prop("tagName");
              const isInput = $input.attr(ns.selectorInputAttribute);
              const isCompositeParent = $input.is(compositeNs.selector);
              console.group(name);
              console.log($input);
              console.log(inputObject);
              console.log($input.val());

              //skip all field that do not have a name and dont exist in data
              if (name && data[name]) {
                  const isSelect = tagName === "SELECT";
                  const isEditor = isInput === "editor";
                  console.log(["loadData basic form component", isSelect, isEditor]);

                  if(isCompositeParent) {
                    console.log(["loadData composite component", name, isCompositeParent]);
                    compositeNs.setValue($input, data[name]);
                  } else if(isEditor) {
                      const editorId = $input.data("editor-id");
                      console.log(["loadData editor component", name, editorId]);
                      editorNs.setEditorData(editorId, data[name]);
                  } else if(isSelect) {
                      selectNs.setValue(id, data[name]);
                  } else {
                      console.log(["loadData other component value", name, data[name], $input.val()]);
                      if (type === "checkbox") {
                          // check all inputs
                          if (data[name] === $input.val()) {
                              $input.attr("checked", "checked");
                          }
                      } else if (type === "radio") {
                          // check all radio inputs
                          if (data[name] === $input.val()) {
                              $input.attr("checked", "checked");
                          }
                      } else {
                          $input.attr("value", data[name]);
                      }
                  }
              }
              console.groupEnd();

          }

          // loop through all the input fields and set the value from the response.
          $component.find("[isInput]").each(function() {
              const $item = $(this);
              
              const name = $item.attr("name");

              if (!data[name]) {
                  return;
              }

              const isInput = $item.attr('isInput');
              if (isInput === "true") {
                  // if select tag then update the option with selected attribute
                  if ($item.tagName === "SELECT") {
                      const options = $item.find("option");

                      // if data[name] is string then split by , and trim all.
                      if (typeof data[name] === "string") {
                          data[name] = data[name].split(",").map(item => item.trim());
                      }

                      // if data[name] is array then loop through the array and check wether the option value is present in the array or not.
                      if (Array.isArray(data[name])) {
                          // if choice js gas not rendered the select, set values in select tag.
                          options.each(function() {
                              const option = $(this);
                              if (data[name].includes(option.attr("value"))) {
                                  option.attr("selected", true);
                              }
                          });
                          //set values in choice js instance
                          data[name].forEach(function(option) {
                            selectNs.setChoiceByValue(`${$item.attr('id')}`, option);
                          });
                          // $(`#${$item.attr('id')}`).val(data[name]);
                      }
                  }


                  // if item type is checked or radio then set checked attribute
                  if ($item.attr("type") === "checkbox" || $item.attr("type") === "radio") {
                      if (data[name]) {
                          $item.attr("checked", name);
                      }
                  }

                  // set value attribute
                  $item.attr("value", data[name]);

              } else if (isInput === "editor") {
                  const editorId = $input.data("editor-id");
                  ns.editorNs.setEditorData(editorId, data[name]);
              }
          });

          // emit event to notify the form is loaded
          ns.FORM_LOADED($component, componentConfig, data, $component);

        } catch (error) {
            console.log("Error loading data into form");
            console.error(error);
        }
    }
    
    // check if query string exists and return the query string.
    ns.isDataLoadRequired = (componentConfig) => {
      const { readUrl } = componentConfig;
      console.warn(["isDataLoadRequired", readUrl, window.location, window.location.search.substring(1)]);
      if (!readUrl && readUrl != "") {
        return false;
      }
      return window.location.search.substring(1) === "" ? false : true;
    }


    ns.getData = async ($component, initConfig) => {
        try {
            const componentConfig = initConfig || componentNs.getComponentConfig($component);
            const { readUrl, readMethod = "GET", readPayloadType = "application/json", id } = componentConfig;
            if (!readUrl && readUrl != "") {
                return;
            }
            const queryParams = componentNs.getQueryParams();
            const url = componentNs.replaceRegex(readUrl, queryParams);
            console.log(["componentConfig", componentConfig, readUrl, queryParams, url, readMethod, readPayloadType]);
            
            var response;
            try {
              response = await fetch(
                  url,
                  {
                      method: readMethod || "GET",
                      headers: {
                          "Content-Type": readPayloadType || "application/json"
                      },
                      keepalive: true,
                      redirect: 'follow'
                  }
              ).then(response => response.json());

            } catch (error) {
                console.log(`Could not read data from ${readUrl}, possible reasons: querystring is missing; endpoint does not provide default data; CORS issue or server error.`);
                console.error(error);
                return;
            }

            return response;

        } catch (error) {
            console.log("Error in fetching form initial data");
            console.error(error);
        }
    }

    ns.consumeIncomingEvent =  ($component, eventData) => {
        const { type, topic, payload } = eventData;
        console.log(["consumeIncomingEvent", type, topic, payload]);
        const componentConfig = componentNs.getComponentConfig($component);
        const { id } = componentConfig;
        const key = `${id}-${type}`;
        const event = ns.eventMap[eventNs.EVENT_TYPE_LISTEN][key];
        if (event) {
            event(payload);
        }  
    };

    ns.addEventListener = ($component, componentConfig) => {
      console.group('addEventListener');
      const { events, id } = componentConfig;
      const defaultTopic = id;

      console.log(["config", events, id, defaultTopic]);
      
      console.log("registering events");
      //register events
      if (events) {        
        events.forEach(event => {
          const { topic, type, name, nameCustom, action } = event;
          //if topic not set use component id as topic
          const topicName = topic || defaultTopic;
          // if type is not defined then its emitted
          let typeName = type || eventNs.EVENT_TYPE_EMIT;

          //custom name takes precidence over name, this will be raised as event name
          let eventName = nameCustom || name;

          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap), topicName, typeName, action, eventName]);
          eventNs.registerEventActionMapping(ns.eventMap, topicName, typeName, action, eventName);
          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap)]);

          // if event type is listen then add event listener for the event

          if (typeName === eventNs.EVENT_TYPE_EMIT) {
              //emit do nothing here
          } else {
              //listen register the event and listent for specific event on topic
              console.log(["registerEvents", topicName, eventName]);
              eventNs.registerEvents(topicName, (data) => {
                  // check make sure the event is for this event
                  if (data.type === eventName) {
                      ns.update($component, data.type, data.data);
                  }
              });
          }
        });
      }

      console.log(["eventMap", ns.eventMap]);

      console.log("adding submit event listener");

      // override default submit to handle form submit using code
      $component.on("submit",  function (e) {
          console.group("form submit event listener")
          e.preventDefault();
          const { target } = e;
          console.log(target)
          ns.formSubmitHandler($(target));
          console.groupEnd();
      });

      // add event listener to document to listen for incoming events
      $(document).keydown(function(event) {
        if (event.ctrlKey && event.shiftKey && event.altKey && String.fromCharCode(event.which) === "I") {
          console.group("showhints");
          ns.showFormHints($component, componentConfig).then(() => {
            console.groupEnd();
          });
        }
    });

      console.groupEnd();
    };

    ns.addFieldHint = ($field, fieldName, fieldId) => {
      const $fieldHint = $field.find(`div.fieldhint[data-fieldid="${fieldId}"]`);
      console.log("found field", $field);
      console.log("found hint", $fieldHint);
      //updated it or create it
      if ($fieldHint.length > 0) {
        $fieldHint.html(`${fieldName}`);  
      } else {
        const $hint = $(`<div class="fieldhint badge rounded-pill bg-secondary" data-fieldid="${fieldId}">${fieldName}</div>`);
        console.log("created hint", $hint);
        const $fieldParent = $field.closest(`field`);
        console.log("found parent", $fieldParent);
        if ($fieldParent.length > 0) {
          $hint.insertBefore($fieldParent);
        } else {
          //add hint above the field
          $hint.insertBefore($field);
        }
      }
    }      
    
    ns.showFormHints = async ($component, componentConfig) => {
      //find all fields and show hints that represent field name and value
      const formData = await ns.getFormData($component, true);
      console.group("showFormHints");
      console.log(formData);
      $component.find(".fieldhint").show();
      console.groupEnd();
    }          

    ns.update = ($component, eventName, data) => {
        console.log(["update", $component, eventName, data]);
        //load data into form
        if (eventName === eventNs.EVENTS.EVENT_READ_ACTION) {
            ns.loadData($component, data);
        }
    }

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        console.group("forms init");
        console.log(["config", componentConfig, $component, ns.eventMap]);
        if (Object.keys(componentConfig).length === 0) {
            console.error("Component config of form component is missing");
            return;
        }
        console.log("adding event listeners");
        ns.addEventListener($component, componentConfig);
        console.log(["ns.eventMap", ns.eventMap]);

        if (ns.isDataLoadRequired(componentConfig)) {
          console.log("query string exists, loading data...");
          var initData = ns.getData($component, componentConfig);
          ns.loadData($component, initData, componentConfig);
        }
        console.groupEnd();
    }

})(jQuery, Typerefinery.Components.Forms.Form, Typerefinery.Components, Typerefinery.Components.Widgets.Editor, Typerefinery.Components.Forms.Select, window.Typerefinery.Components.Forms.Composite, Typerefinery.Page.Events, Typerefinery.Page.Files, document, window);