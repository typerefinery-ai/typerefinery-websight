
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Radio = Typerefinery.Components.Forms.Radio || {};

; (function (ns, componentNs, window, document) {
    "use strict";

    ns.init = () => {

        const data = {};

        document.querySelectorAll('[data-module="vue-radioButton"]').forEach(_ => {
            let modelName = _.getAttribute("name");
            modelName?.trim();
            _.setAttribute("v-model", modelName);
            if(modelName){
                data[modelName] = "";
            }
        });

        // Register vue data.
        componentNs.registerComponent(data);
    }

})(window.Typerefinery.Components.Forms.Radio, window.Typerefinery.Components, window, document);
