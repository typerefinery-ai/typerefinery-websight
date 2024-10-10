window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Content = Typerefinery.Components.Content || {};
window.Typerefinery.Components.Content.Title = Typerefinery.Components.Content.Title || {};

(function ($, ns, componentsNs, document, window) {
    "use strict";

    //init and watch for new components
    componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);

})(jQuery, Typerefinery.Components.Content.Title, window.Typerefinery.Components, document, window);
