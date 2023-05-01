window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
Typerefinery.Components.Forms.Fileupload = Typerefinery.Components.Forms.Fileupload || {};


(function (ns, componentNs, document, window) {

    "use strict";

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        if(componentConfig.variant === 'DRAG_AND_DROP') {
            $component.imageuploadify();
        }
    }
})(Typerefinery.Components.Forms.Fileupload, Typerefinery.Components, document, window);