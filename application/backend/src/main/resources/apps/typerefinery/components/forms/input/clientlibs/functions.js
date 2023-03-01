window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Input = Typerefinery.Components.Forms.Input || {};


(function (ns, componentNs, document, window) {
    "use strict";

    ns.init = ($component) => {
        const inputMask = $component.getAttribute("data-inputmask");
        if(inputMask) {
            $(`#${$component.getAttribute("id")}`).inputmask(inputMask);
        }
    }

})(Typerefinery.Components.Forms.Input, Typerefinery.Components, document, window);