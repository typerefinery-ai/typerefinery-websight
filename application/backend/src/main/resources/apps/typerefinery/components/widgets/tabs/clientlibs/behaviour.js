window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
Typerefinery.Components.Widgets.Tab = Typerefinery.Components.Widgets.Tab || {};

(function ($, ns, componentsNs, document, window) {
    "use strict";

    //init and watch for new components
    componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);

  })(jQuery, Typerefinery.Components.Widgets.Tab, window.Typerefinery.Components, document, window);
