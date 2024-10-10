
window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
Typerefinery.Components.Widgets.Treeview = Typerefinery.Components.Widgets.Treeview || {};

(function ($, ns, componentsNs, document, window) {
  "use strict";
  //init and watch for new components
  componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);

})(jQuery, Typerefinery.Components.Widgets.Treeview, window.Typerefinery.Components, document, window);