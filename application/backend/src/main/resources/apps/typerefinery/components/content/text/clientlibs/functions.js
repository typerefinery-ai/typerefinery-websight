window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Content = Typerefinery.Components.Content || {};
Typerefinery.Components.Content.Text = Typerefinery.Components.Content.Text || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function (ns, componentNs, eventNs, document, window) {
    "use strict";

    ns.selectorComponent = '[component="text"]';

    ns.registerEvent = ($component, componentId, fieldName) => {
        const key = `${componentId}-${fieldName}`;
        eventNs.registerEvents(key, (data) => {
            if(data.type === eventNs.EVENTS.EVENT_READ_ACTION) {
                // get the first children and set the inner html.
                const $firstChild = $component.children[0];
                const componentConfig = componentNs.getComponentConfig($component);
                // get the inner HTML and replace the {{value}} with the data.value
                const innerHTML = $firstChild.innerHTML.replace(`{{${fieldName}}}`, data.data.value) || data.data.value;
                // if innerHTML is empty or === "<p></p>" then set the innerHTML to the data.value
                if (innerHTML === "<p></p>" || innerHTML === "") {
                    $firstChild.innerHTML = data.data.value;
                    return;
                }

                $firstChild.innerHTML = innerHTML;
            }
        });      
    }


    ns.init = ($component) => {
        // check if the component have a data attribute with the name "data-field-componentId" and "data-field-name" then register eventNs
        const componentId = $component.getAttribute("data-field-componentId");
        const fieldName = $component.getAttribute("data-field-name");
        if (componentId && fieldName) {
          //listen for evenets and update the innerHTML
          ns.registerEvent($component, componentId, fieldName);
        };
    }
}
)(Typerefinery.Components.Content.Text, Typerefinery.Components, Typerefinery.Page.Events, document, window);
