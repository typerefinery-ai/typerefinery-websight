window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Search = Typerefinery.Components.Widgets.Search || {};
window.Typerefinery.Page = Typerefinery.Page|| {};
window.Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, componentNs, eventNs, document, window) {
    "use strict";

    ns.selectorComponent = "[component='search']";

    ns.debounce = (fn, delay) => {
        let timerId;
        return function (...args) {
            if (timerId) {
                clearTimeout(timerId);
            }
            timerId = setTimeout(() => {
                fn.apply(this, args);
                timerId = null;
            }, delay);
        };
    };

    ns.highlightWholePage = (componentConfig) => {

        // the value of the input to be searched.
        const valueToBeSearched = document.getElementById(componentConfig.id).value;

        // remove the highlight from the whole page.
        $('body').removeHighlight();

        // highlight the whole page.
        $('body').highlight(valueToBeSearched);
    };

    ns.eventOnHighlight = ($component, data) => {
        if (!$component) {
            return;
        };

        $($component).removeHighlight();

        $($component).highlight(data.value);
    };

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);

        const topic = componentConfig.topic;

        if(topic === "#PAGE" || !topic) {
            $component.on("input", ns.debounce(() => ns.highlightWholePage(componentConfig), 500));
            return;
        }

        $component.on("input", ns.debounce(() => eventNs.emitEvent(topic, { value: document.getElementById(componentConfig.id).value }), 500));
       
    };
})(jQuery, Typerefinery.Components.Widgets.Search, Typerefinery.Components, Typerefinery.Page.Events, document, window);
