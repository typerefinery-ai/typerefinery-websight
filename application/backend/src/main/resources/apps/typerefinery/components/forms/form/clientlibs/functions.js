window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Form = Typerefinery.Components.Forms.Form || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Editor = Typerefinery.Components.Widgets.Editor || {};
window.Typerefinery.Components.Widgets.Editor.Instances = Typerefinery.Components.Widgets.Editor.Instances || {};
window.Typerefinery.Components.Forms.Select = Typerefinery.Components.Forms.Select || {};
window.Typerefinery.Components.Forms.Select.Instances = Typerefinery.Components.Forms.Select.Instances || {};
window.Typerefinery.Components.Forms.Composite = Typerefinery.Components.Forms.Composite || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, componentNs, editorInstanceNs, selectInstanceNs, compositeNs, eventNs, document, window) {
    "use strict";
    
    ns.filesUrl = "https://files.typerefinery.localhost:8101";

    ns.selectorInputAttribute = "isInput";
    ns.selectorInput = `[${ns.selectorInputAttribute}]`;
    
    ns.uploadFile = async (file) => {
        const fileName = file?.name?.trim()?.replace(/\s/g, "-");
        const datePathWithTime =  new Date().toISOString().split("T")[0].replace(/-/g, "-") + "/" + new Date().toISOString().split("T")[1].split(".")[0].replace(/:/g, "-"); 
        let path = window.location.pathname === "/" ? "" : window.location.pathname;
        // remove .html from the path
        path = path.replace(".html", "");
        path += `/${datePathWithTime}`;
        const PREVIEW = `${ns.filesUrl}/api${path}/${fileName}`
        try{
            await fetch(
                `${ns.filesUrl}/api${path}?type=CREATE_FOLDER`,
                {
                    method: "POST",
                    mode: 'no-cors',
                    headers: {
                        'accept': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                    },
                    redirect: 'follow'
                }
            );
        }   
        catch(error) {
            // ERROR IN CASE PATH EXIST.
        }     
        try{
            const URL = `${ns.filesUrl}/api${path}/${fileName}?type=UPLOAD_FILE&overwrite=true`;
            const formData = new FormData();
            formData.append("upload", file);
            await fetch(
                URL,
                {
                    method: "POST",
                    body: formData,
                    mode: 'no-cors',
                    headers: {
                        'accept': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                    },
                    redirect: 'follow'
                },
            );
            // REMOVE LOADER 

            return PREVIEW;
        }catch(error) {
            return PREVIEW;
        }
        
    };

    ns.getFormData = async ($component) => {
        const result = {};
        // get all non composite fields and immidiate composite fields.
        const $formComponents = $component.findExclude(`${ns.selectorInput},${compositeNs.selector}`,compositeNs.selector);
        console.log(["getFormData", $formComponents, $component])
        // using for to ensure async await works.
        for(let i = 0; i < $formComponents.length; i++) {
            const $input = $($formComponents[i]);
            const inputObject = $input.get(0);
            console.log($input);
            const name = $input.attr("name");

            //is this input field
            const isInput = $input.attr(ns.selectorInputAttribute);
            //is this composite value
            const isCompositeParent = componentNs.isTrue($input.attr(compositeNs.selectorAttribute));

            console.log(["getFormData form component", name, isInput, isCompositeParent]);

            if (name) {
                //is this select tag
                const isSelect = $input.prop("tagName") === "SELECT";
                //is this file input
                const isFile = $input.type === "file";
                // is this text area or input field.
                const isChild = isInput === "child";

                console.log(["getFormData basic form component", isSelect, isFile, isChild]);

                if(isChild) {

                    // get value from child component
                    const $firstChild = $input.children[0];
                    
                    // get value from codemirror editor
                    result[name] = editorInstanceNs[$firstChild.attr("id")].getValue();
                 
                }else if(isSelect) {
                    // get value from select tag
                    result[name] = selectInstanceNs[$input.attr("id")].getValue(true);
                }else if(isFile) {
                    
                    
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
                            const output = await ns.uploadFile(files[i]);
                            document.getElementById(`loader-${fileName}`).style.display = "none";
                            document.getElementById(`close-${fileName}`).style.display = "block";
                            result[name].push(output);
                        }
                    }else if($input.files.length > 0){
                        const blobUrl = await ns.uploadFile(files[0]);
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

            } else if(isCompositeParent) {

              console.log(["getFormData composite component", name, isCompositeParent]);
              
              // get value from composite value
              var $compositeValue = $input.findExclude(compositeNs.selectorValue, compositeNs.selector);
              console.log(["getFormData composite value input", $compositeValue]);
              var compositeValueName = $compositeValue.attr(compositeNs.selectonNameAttribute);
              console.log(["getFormData composite value", $compositeValue]);
              result[compositeValueName] = {};
              Object.assign(result[compositeValueName], $compositeValue.compositeVal());
            }
        }
        console.log(["getFormData", result]);
        return result;
    };

    ns.submit = async (url, method, payloadType, body, successCallback = () => { }, errorCallback = () => { }) => {
        console.log("---------------SUBMIT----------------")
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
            console.log("---------------SUBMITED RESPONSE----------------")
            console.log(res)
            successCallback()
          });
        

          // const [submitResponse] = await Promise.all([
          //   fetch(
          //     url,
          //     {
          //         method: method || "POST",
          //         mode: 'no-cors',
          //         headers: {
          //             "Content-Type": payloadType || "application/x-www-form-urlencoded"
          //         },
          //         cache: 'no-cache',
          //         body: body,
          //         keepalive: true,
          //         redirect: 'follow',
          //         signal: controller.signal
          //     }
          //   )
          // ]);
          //   // const response = await fetch(
          //   //     url,
          //   //     {
          //   //         method: method || "POST",
          //   //         mode: 'no-cors',
          //   //         headers: {
          //   //             "Content-Type": payloadType || "application/x-www-form-urlencoded"
          //   //         },
          //   //         body: body,
          //   //         keepalive: true,
          //   //         redirect: 'follow',
          //   //         signal: controller.signal
          //   //     }
          //   // );
          //   var responseJson = await submitResponse.json();
          //   // console.log(json);
          //   // var text = await response.text();
          //   console.log(responseJson);
          //   // if status is 200 to 299 then it will call success callback.
          //   if (submitResponse.status >= 200 && submitResponse.status <= 299) {
          //       successCallback();
          //   } else {
          //       console.log("Error in submitting the request");
          //       console.error(submitResponse);
          //       errorCallback();
          //   }               
          //   return;
        } catch (error) {
            console.log("Error in submitting the request");
            console.error(error);
            errorCallback();
            return;
        }
        controller = null;
        return;
    };

    ns.successCallback = () => {
        // TODO: Need to add toast.
        alert("SUCCESS");
    };

    ns.errorCallback = () => {
        // TODO: Need to add toast.
        alert("ERROR");
    };

    ns.jsonRequest = async (url, componentConfig, payload) => {
        const { writePayloadType, writeMethod } = componentConfig;
        
        await ns.submit(url, writeMethod, writePayloadType, JSON.stringify(payload), ns.successCallback, ns.errorCallback);
    };

    ns.formRequest = async (url, componentConfig, payload) => {
        const { writePayloadType, writeMethod } = componentConfig;
        const formData = new URLSearchParams();
        Object.entries(payload).map(item => {
            formData.append(item[0], item[1])
        });
        await ns.submit(url, writeMethod, writePayloadType, formData.toString(), ns.successCallback, ns.errorCallback);
    };

    ns.updateButtonState = ($component, state) => {
        const $button = $component.find("button[type='submit']");
        if ($button) {
            
            // disable the button and loading text 
            $button.disabled = state === "loading";
            $button.innerHTML = state === "loading" ? `<i class="pi pi-spin pi-spinner"></i>` : $button.attr("data-label");
        }
    };


    ns.formSubmitHandler = async ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        console.log(["formSubmitHandler", componentConfig, $component])
        let { writePayloadType, writeMethod, writeUrl } = componentConfig;
        if (!writePayloadType || !writeMethod || !writeUrl) {
            console.log("Author should fill all the parameters.");
            return;
        }
        const payload = await ns.getFormData($component);
        ns.updateButtonState($component, "loading");

        writeUrl = componentNs.replaceRegex(writeUrl, componentNs.getQueryParams());

        if (writePayloadType === "application/json") {
            await ns.jsonRequest(writeUrl, componentConfig, payload);
        } else if (writePayloadType === "application/x-www-form-urlencoded") {
            await ns.formRequest(writeUrl, componentConfig, payload);
        }
        ns.updateButtonState($component, "completed");
    };

    ns.loadInitialData = async ($component, initConfig) => {
        try {
            const componentConfig = initConfig || componentNs.getComponentConfig($component);
            const { readUrl, readMethod = "GET", readPayloadType = "application/json", id } = componentConfig;
            if (!readUrl && readUrl != "") {
                return;
            }
            console.log(["componentConfig", componentConfig, readUrl, readMethod, readPayloadType]);
            const url = componentNs.replaceRegex(readUrl, componentNs.getQueryParams());
            
            try {
              const response = await fetch(
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

            // loop through all the input fields and set the value from the response.
            $component.find("[isInput]").each(function() {
                const $item = $(this);
                
                const name = $item.attr("name");

                if (!response[name]) {
                    return;
                }

                const isInput = $item.attr('isInput');
                if (isInput === "true") {
                    // if select tag then update the option with selected attribute
                    if ($item.tagName === "SELECT") {
                        const options = $item.find("option");

                        // if response[name] is string then split by , and trim all.
                        if (typeof response[name] === "string") {
                            response[name] = response[name].split(",").map(item => item.trim());
                        }

                        // if response[name] is array then loop through the array and check wether the option value is present in the array or not.
                        if (Array.isArray(response[name])) {
                            // if choice js gas not rendered the select, set values in select tag.
                            options.each(function() {
                                const option = $(this);
                                if (response[name].includes(option.attr("value"))) {
                                    option.attr("selected", true);
                                }
                            });
                            //set values in choice js instance
                            response[name].forEach(function(option) {
                                selectInstanceNs[`${$item.attr('id')}`].setChoiceByValue(option);
                            });
                            // $(`#${$item.attr('id')}`).val(response[name]);
                        }
                    }


                    // if item type is checked or radio then set checked attribute
                    if ($item.attr("type") === "checkbox" || $item.attr("type") === "radio") {
                        if (response[name]) {
                            $item.attr("checked", name);
                        }
                    }

                    // set value attribute
                    $item.attr("value", response[name]);

                } else if (isInput === "child") {
                    // check the first children of the $item component and check wether it is editable or not and set the value accordingly. 
                    const $firstChild = $item.children[0];
                    const editorConfig = componentNs.getComponentConfig($firstChild)
                    if ($firstChild.attr("component") === "editor") {
                        if (editorInstanceNs[`${editorConfig.id}`]) {

                            if (editorConfig.variant === "CODE_EDITOR") {
                                // Works for code mirror editor.
                                editorInstanceNs[`${editorConfig.id}`].setValue(response[name]);
                            }

                            // TODO: need to load the data for other editors.

                        }
                    }
                }
            });
            $component.find("[data-field-name]").forEach(
                $item => {
                    const fieldName = $item.attr("data-field-name");
                    const componentId = $item.attr("data-field-componentId"); 
                    if (response[fieldName]) {
                        const key = `${componentId}-${fieldName}`;
                        eventNs.emitEvent(key, {
                            data: {
                                value: response[fieldName]
                            },
                            type: "LOAD_DATA"
                        });
                        // eventNs.registerEvents(key, ns.getEventHandlerCallBackFn($component, event));
                    }
                }
            )
        } catch (error) {
            console.log("Error in fetching form initial data");
            console.error(error);
        }
    }

    ns.addEventListener = ($component) => {
        $component.on("submit",  function (e) {
            console.log("---------------SUBMITTING----------------")
            e.preventDefault();
            const { target } = e;
            console.log(target)
            ns.formSubmitHandler($(target));
        });
    };

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        console.log(["forms init", componentConfig, "componentConfig", $component]);
        if (Object.keys(componentConfig).length === 0) {
            console.log("Component config of form component is missing");
            return;
        }
        ns.loadInitialData($component, componentConfig);
        ns.addEventListener($component);
    }

})(jQuery, Typerefinery.Components.Forms.Form, Typerefinery.Components, Typerefinery.Components.Widgets.Editor.Instances, Typerefinery.Components.Forms.Select.Instances, window.Typerefinery.Components.Forms.Composite, Typerefinery.Page.Events, document, window);