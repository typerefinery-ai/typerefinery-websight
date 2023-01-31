window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.VueData = Typerefinery.VueData || {};

; (function (ns, vueDataNs, document, window) {
    "use strict";
    ns.registerComponent = (componentData) => {
        vueDataNs.data = {
            ...vueDataNs,
            ...componentData
        }
    };
    ns.getComponentConfig = ($component) => {

        return JSON.parse($component.getAttribute('data-model') || '{}');
    };
})(window.Typerefinery.Components, window.Typerefinery.VueData, document, window);