window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Search = Typerefinery.Components.Widgets.Search || {};

(function ($, ns, componentsNs, document, window) {
    "use strict";

    //init and watch for new components
    componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);

})(jQuery, window.Typerefinery.Components.Widgets.Search, window.Typerefinery.Components, document, window);
