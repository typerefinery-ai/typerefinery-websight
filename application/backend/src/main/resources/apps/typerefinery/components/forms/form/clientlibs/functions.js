window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Form = Typerefinery.Components.Forms.Form || {};
window.Typerefinery.Components.Forms.Form = Typerefinery.Components.Forms.Form || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Editor = Typerefinery.Components.Widgets.Editor || {};
window.Typerefinery.Components.Widgets.Editor.Instances = Typerefinery.Components.Widgets.Editor.Instances || {};
window.Typerefinery.Components.Forms.Select = Typerefinery.Components.Forms.Select || {};
window.Typerefinery.Components.Forms.Select.Instances = Typerefinery.Components.Forms.Select.Instances || {};


(function (ns, componentNs, editorInstanceNs, selectInstanceNs, document, window) {
    "use strict";

    ns.getFormData = ($component) => {
        const result = {};
        $component.querySelectorAll("[isInput]").forEach($input => {
            const name = $input.getAttribute("name");
            if (name) {
                const isInput = $input.getAttribute('isInput');
                if(isInput === "child") {

                    // get value from child component
                    const $firstChild = $input.children[0];
                    
                    // get value from codemirror editor
                    result[name] = editorInstanceNs[$firstChild.getAttribute("id")].getValue();
                 
                }else if($input.tagName === "SELECT") {
                    // get value from select tag
                    result[name] = selectInstanceNs[$input.getAttribute("id")].getValue(true);
                }else {
                    // get value from $input tag
                    result[name] = $input?.value || "";
                }
            }
        });
        return result;
    };

    ns.submit = async (url, method, payloadType, body, successCallback = () => { }, errorCallback = () => { }) => {
        try {
            await fetch(
                url,
                {
                    method: method,
                    headers: {
                        "Content-Type": payloadType
                    },
                    body
                }
            );
            successCallback();
        } catch (error) {
            console.log("Error in submitting the request");
            console.error(error);
            errorCallback();
        }
    };

    ns.successCallback = () => {
        // TODO: Need to add toast.
        alert("SUCCESS");
    };

    ns.errorCallback = () => {
        // TODO: Need to add toast.
        alert("ERROR");
    };

    ns.jsonRequest = (url, componentConfig, payload) => {
        const { writePayloadType, writeMethod } = componentConfig;

        ns.submit(url, writeMethod, writePayloadType, JSON.stringify(payload), ns.successCallback, ns.errorCallback);
    };

    ns.formRequest = (url, componentConfig, payload) => {
        const { payloadType, writeMethod } = componentConfig;
        const formData = new URLSearchParams();
        Object.entries(payload).map(item => {
            formData.append(item[0], item[1])
        });
        ns.submit(url, writeMethod, payloadType, formData.toString(), ns.successCallback, ns.errorCallback);
    };

    ns.formSubmitHandler = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);

        const payload = ns.getFormData($component);
        const { writePayloadType, writeMethod, writeUrl } = componentConfig;
        if (!writePayloadType || !writeMethod || !writeUrl) {
            alert("Fill all the parameters.");
            return;
        }

        if (writePayloadType === "application/json") {
            ns.jsonRequest(writeUrl, componentConfig, payload);
        } else if (writePayloadType === "application/x-www-form-urlencoded") {
            ns.formRequest(writeUrl, componentConfig, payload);
        }

    };

    ns.loadInitialData = async ($component) => {
        try {
            const componentConfig = componentNs.getComponentConfig($component);
            const { readUrl, readMethod = "GET", readPayloadType = "application/json", id } = componentConfig;
            if (!readUrl) {
                return;
            }
            const response = await fetch(
                readUrl,
                {
                    method: readMethod || "GET",
                    headers: {
                        "Content-Type": readPayloadType || "application/json"
                    }
                }
            ).then(response => response.json());

            $component.querySelectorAll("[isInput]").forEach($item => {

                const name = $item.getAttribute("name");

                if (!response[name]) {
                    return;
                }

                const isInput = $item.getAttribute('isInput');
                if (isInput === "true") {
                    // if select tag then update the option with selected attribute
                    if ($item.tagName === "SELECT") {
                        const options = $item.querySelectorAll("option");

                        // if response[name] is string then split by , and trim all.
                        if (typeof response[name] === "string") {
                            response[name] = response[name].split(",").map(item => item.trim());
                        }

                        // if response[name] is array then loop through the array and check wether the option value is present in the array or not.
                        if (Array.isArray(response[name])) {
                            // check wether choice js is rendered then update the value of the select tag
                            options.forEach(option => {
                                if (response[name].includes(option.getAttribute("value"))) {
                                    option.setAttribute("selected", true);
                                }
                            });
                            response[name].forEach((option) => {
                                selectInstanceNs[`${$item.getAttribute('id')}`].setChoiceByValue(option);
                            });
                            // $(`#${$item.getAttribute('id')}`).val(response[name]);
                        }
                    }


                    // if item type is checked or radio then set checked attribute
                    if ($item.getAttribute("type") === "checkbox" || $item.getAttribute("type") === "radio") {
                        if (response[name]) {
                            $item.setAttribute("checked", name);
                        }
                    }

                    // set value attribute
                    $item.setAttribute("value", response[name]);

                } else if (isInput === "child") {
                    // check the first children of the $item component and check wether it is editable or not and set the value accordingly. 
                    const $firstChild = $item.children[0];
                    const editorConfig = componentNs.getComponentConfig($firstChild)
                    if ($firstChild.getAttribute("component") === "editor") {
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
        } catch (error) {
            console.log("Error in fetching form initial data");
            console.error(error);
        }
    }

    ns.addEventListener = ($component) => {
        $component.addEventListener("submit",  function (e) {
            console.log("---------------SUBMITTING----------------")
            e.preventDefault();
            const { target } = e;
            ns.formSubmitHandler(target);
//     setTimeout(function() {
//        $this.button('reset');
//    }, 8000);
        });
    };

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        if (Object.keys(componentConfig).length === 0) {
            console.log(componentConfig, "componentConfig", $component)
            console.log("Component config of form component is missing");
            return;
        }
        ns.loadInitialData($component);
        ns.addEventListener($component);
    }

})(Typerefinery.Components.Forms.Form, Typerefinery.Components, Typerefinery.Components.Widgets.Editor.Instances, Typerefinery.Components.Forms.Select.Instances, document, window);