window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Ticker = Typerefinery.Components.Widgets.Ticker || {};

(function ($, ns, componentsNs, document, window) {
  "use strict";
 
  //init and watch for new components
  componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);

})(jQuery, Typerefinery.Components.Widgets.Ticker, window.Typerefinery.Components, document, window);
