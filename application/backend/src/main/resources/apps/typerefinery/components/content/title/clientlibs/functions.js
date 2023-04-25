window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Content = Typerefinery.Components.Content || {};
Typerefinery.Components.Content.Title = Typerefinery.Components.Content.Title || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function (ns, eventNs, document, window) {
    "use strict";

    ns.registerEvent = ($component, componentId, fieldName) => {
        const key = `${componentId}-${fieldName}`;
        eventNs.registerEvents(key, (data) => {
            if(data.type === "LOAD_DATA") {
                // get the first children and set the inner html.
                const $firstChild = $component.children[0];
                $firstChild.innerHTML = data.data.value;
            }
        });      
    }


    ns.init = ($component) => {
        // check if the component have a data attribute with the name "data-field-componentId" and "data-field-name" then register eventNs
        const componentId = $component.getAttribute("data-field-componentId");
        const fieldName = $component.getAttribute("data-field-name");
        if (componentId && fieldName) {
            ns.registerEvent($component, componentId, fieldName);
        };
    }
}
)(Typerefinery.Components.Content.Title, Typerefinery.Page.Events, document, window);
