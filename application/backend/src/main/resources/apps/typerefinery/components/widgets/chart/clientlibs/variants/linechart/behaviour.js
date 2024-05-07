window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Chart = Typerefinery.Components.Widgets.Chart || {};
window.Typerefinery.Components.Widgets.Chart.Variants = Typerefinery.Components.Widgets.Chart.Variants || {};
window.Typerefinery.Components.Widgets.Chart.Variants.LineChart = Typerefinery.Components.Widgets.Chart.Variants.LineChart || {};

(function ($, ns, componentsNs, document, window) {
  "use strict";

  //init and watch for new components
  componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);

})(jQuery, Typerefinery.Components.Widgets.Chart.Variants.LineChart, window.Typerefinery.Components, document, window);
