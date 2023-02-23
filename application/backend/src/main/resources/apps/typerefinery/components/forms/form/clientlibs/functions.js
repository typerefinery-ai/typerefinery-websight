window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Form = Typerefinery.Components.Forms.Form || {};


(function (ns, componentNs, document, window) {
    "use strict";

    ns.getFormData = (form) => {
        const result = {};
        const inputs = Array.from(form.querySelectorAll("input"));
        inputs.forEach(input => {
            if(input?.name) {
                result[input.name] = input?.value || "";
            }
        });
        return result;
    };

    ns.submit = async (url, method, payloadType, body, successCallback = () => {}, errorCallback = () => {}) => {
        try{
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
        }catch(error) {
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
        if(!writePayloadType || !writeMethod || !writeUrl) {
            alert("Fill all the parameters.");
            return;
        }

        if(writePayloadType === "application/json") {
            ns.jsonRequest(writeUrl, componentConfig, payload);
        }else if(writePayloadType === "application/x-www-form-urlencoded") {
            ns.formRequest(writeUrl, componentConfig, payload);
        }

    };

    ns.loadInitialData = async ($component) => {
        try{
            const componentConfig = componentNs.getComponentConfig($component);
            const { resourcePath, readUrl, readMethod = "GET", readPayloadType = "application/json" } = componentConfig;
            if(!readUrl) {
                return;
            }
            const response = await fetch(
                readUrl, 
                {
                    method: readMethod,
                    headers: {
                        "Content-Type": readPayloadType
                    }
                }
            ).then(response => response.json());
            
            Object.entries(response).forEach(item => {
                const el = document.getElementById(resourcePath).querySelector(`[name="${item[0]}"]`);
                if(el){
                    el.setAttribute("value", item[1] || "");
                    if(el.getAttribute("type") === "checkbox" || el.getAttribute("type") === "radio") {
                        if(item[1]) {
                            el.setAttribute("checked", true);
                        }
                    }
                }
            })
        }catch(error) {
            console.log("Error in fetching form initial data");
            console.error(error);
        }
    }

    ns.addEventListener = () => {
        $(document).on("submit", "form", function (e) {
            e.preventDefault();
            const { target } = e;
            ns.formSubmitHandler(target);
        });
    };

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        const { resourcePath } = componentConfig;
        $component.setAttribute("id", resourcePath);
        ns.loadInitialData($component);
        ns.addEventListener(resourcePath);
    }

})(Typerefinery.Components.Forms.Form, Typerefinery.Components, document, window);