window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Stix = Typerefinery.Components.Stix || {};
window.Typerefinery.Components.Stix.Forms = Typerefinery.Components.Stix.Forms || {};
window.Typerefinery.Components.Stix.Forms.Input = Typerefinery.Components.Stix.Forms.Input || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function (ns, componentNs, eventNs, document, window) {
    "use strict";

    ns.registerEvent = ($component, componentId, fieldName) => {
        const key = `${componentId}-${fieldName}`;
        eventNs.registerEvents(key, (data) => {
            if(data.type === "LOAD_DATA") {
                // get the first children and set the inner html.
                const $firstChild = $component.children[0];
                // get the component config
                const componentConfig = componentNs.getComponentConfig($component);
                // set field value              
                $component.find("input").val(data.data.value);
            }
        });      
    }


    ns.init = ($component) => {
        // check if the component have a data attribute with the name "data-field-componentId" and "data-field-name" then register eventNs
        const componentId = $component.getAttribute("id");
        const fieldName = $component.getAttribute("name");
        if (componentId && fieldName) {
            ns.registerEvent($component, componentId, fieldName);
        };
    }
}
)(window.Typerefinery.Components.Stix.Forms.Input, Typerefinery.Components, Typerefinery.Page.Events, document, window);
