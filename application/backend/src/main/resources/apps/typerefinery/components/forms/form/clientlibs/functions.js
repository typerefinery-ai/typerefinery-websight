window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Form = Typerefinery.Components.Forms.Form || {};


(function (ns, componentNs, document, window) {
    "use strict";

    ns.getFormData = (form) => {
        const formData = new FormData(form);
        // ...or output as an object
        return Object.fromEntries(formData);
    };

    ns.submit = async (url, method, payloadType, body, successCallback = () => {}, errorCallback = () => {}) => {
        try{
            const response = await fetch(
                url, 
                {
                    method: method,
                    headers: {
                        "Content-Type": payloadType
                    },
                    body
                }
            ).then(response => response.json());
            console.log("RESPONSE", response);
            successCallback();
        }catch(error) {
            console.log("ERROR", error);
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
        const payload = ns.getFormData($component);
        const componentConfig = componentNs.getComponentConfig($component);
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
            const parent = document.getElementById(resourcePath);
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
                el.setAttribute("value", item[1] || "");
                console.log(el)
            })
        }catch(error) {
            console.log("ERROR IN LOADING", error);
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
