window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layout = Typerefinery.Components.Layout || {};
window.Typerefinery.Components.Layout.ContainerList = Typerefinery.Components.Layout.ContainerList || {};

(function ($, ns, componentsNs, document, window) {
  "use strict";
 
  //init and watch for new components
  componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);

})(jQuery, Typerefinery.Components.Layout.ContainerList, window.Typerefinery.Components, document, window);
