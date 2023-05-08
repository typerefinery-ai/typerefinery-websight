
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Checkbox = Typerefinery.Components.Forms.Checkbox || {};

; (function (ns, componentNs, window, document) {
    "use strict";

    ns.init = () => {

        const data = {};

        document.querySelectorAll('[data-module="vue-checkBox"]').forEach($component => {
            let modelName = $component.getAttribute("name");
            let value = $component.getAttribute("value");
            modelName.trim();
            $component.setAttribute("v-model", modelName);
            data[modelName] = [value] || "";
        });

        // Register vue data.
        componentNs.registerComponent(data);
    }

})(window.Typerefinery.Components.Forms.Checkbox, window.Typerefinery.Components, window, document);
