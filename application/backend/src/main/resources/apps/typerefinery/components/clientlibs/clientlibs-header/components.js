window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.VueData = Typerefinery.VueData || {};

; (function (ns, vueDataNs, document, window) {
    "use strict";
    ns.registerComponent = (componentData) => {
        vueDataNs.data = {
            ...vueDataNs.data,
            ...componentData
        }
    };
    ns.getComponentConfig = ($component) => {
      return $($component).data('model') || {};
    };
})(window.Typerefinery.Components, window.Typerefinery.VueData, document, window);