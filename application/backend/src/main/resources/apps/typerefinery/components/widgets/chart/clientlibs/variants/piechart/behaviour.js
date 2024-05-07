window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Chart = Typerefinery.Components.Widgets.Chart || {};
window.Typerefinery.Components.Widgets.Chart.Variants = Typerefinery.Components.Widgets.Chart.Variants || {};
window.Typerefinery.Components.Widgets.Chart.Variants.PieChart = Typerefinery.Components.Widgets.Chart.Variants.PieChart || {};

(function ($, ns, componentsNs, document, window) {
  "use strict";

  //init and watch for new components
  componentsNs.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);

})(jQuery, Typerefinery.Components.Widgets.Chart.Variants.PieChart, window.Typerefinery.Components, document, window);
