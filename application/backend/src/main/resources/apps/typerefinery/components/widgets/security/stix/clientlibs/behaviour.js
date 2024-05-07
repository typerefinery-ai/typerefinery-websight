window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Security = Typerefinery.Components.Widgets.Security || {};
window.Typerefinery.Components.Widgets.Security.Stix = Typerefinery.Components.Widgets.Security.Stix || {};

(function ($, ns, componentsNs, document, window) {
  "use strict";

  //init and watch for new components
  componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);
  
})(jQuery, window.Typerefinery.Components.Widgets.Security.Stix, window.Typerefinery.Components, document, window);
