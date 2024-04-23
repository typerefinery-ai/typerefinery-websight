window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Editor = Typerefinery.Components.Widgets.Editor || {};

(function (ns, componentsNs, document) {
    "use strict";

    //init and watch for new components
    componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);
    
})(Typerefinery.Components.Widgets.Editor, window.Typerefinery.Components, document);
