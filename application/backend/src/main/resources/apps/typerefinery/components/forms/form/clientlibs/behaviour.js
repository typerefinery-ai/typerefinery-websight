window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Form = Typerefinery.Components.Forms.Form || {};

(function ($, ns, componentsNs, document) {
    "use strict";

    //init and watch for new components
    componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);

})(jQuery, window.Typerefinery.Components.Forms.Form, window.Typerefinery.Components, document);
