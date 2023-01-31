window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.VueData = Typerefinery.VueData || {};

;(function(ns, vueDataNs, document, window) {
    "use strict";
    ns.registerComponent = (componentData) => {
        vueDataNs = {
            ...vueDataNs,
            componentData
        }
    };
    ns.getComponentConfig = ($component) => {
        console.log("$component-get", $component)
        return JSON.parse($component.getAttribute('data-model') || '{}');
    };
})(window.Typerefinery.Components, window.Typerefinery.VueData, document, window);