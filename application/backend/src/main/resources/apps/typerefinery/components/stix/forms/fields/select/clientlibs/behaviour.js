window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Stix = Typerefinery.Components.Stix || {};
window.Typerefinery.Components.Stix.Forms = Typerefinery.Components.Stix.Forms || {};
window.Typerefinery.Components.Stix.Forms.Select = Typerefinery.Components.Stix.Forms.Select || {};

(function ($, ns, componentsNs, document, window) {
    "use strict";

    //init and watch for new components
    componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);

})(jQuery, window.Typerefinery.Components.Stix.Forms.Select, window.Typerefinery.Components, document, window);
