window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Stix = Typerefinery.Components.Stix || {};
window.Typerefinery.Components.Stix.Forms = Typerefinery.Components.Stix.Forms || {};
window.Typerefinery.Components.Stix.Forms.Input = Typerefinery.Components.Stix.Forms.Input || {};

(function ($, ns, componentsNs, document, window) {
    "use strict";

    //init and watch for new components
    componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);

})(jQuery, window.Typerefinery.Components.Stix.Forms.Input, window.Typerefinery.Components, document, window);
