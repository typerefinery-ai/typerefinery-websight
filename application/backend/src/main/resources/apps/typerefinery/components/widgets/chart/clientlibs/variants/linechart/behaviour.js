window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Chart = Typerefinery.Components.Widgets.Chart || {};
window.Typerefinery.Components.Widgets.Chart.Variants = Typerefinery.Components.Widgets.Chart.Variants || {};
window.Typerefinery.Components.Widgets.Chart.Variants.LineChart = Typerefinery.Components.Widgets.Chart.Variants.LineChart || {};



(function (ns, document, window) {
  "use strict";

  $(document).ready(function () {
    $('[data-module="chartComponent-lineChart"]').each(function () {
      ns?.init(this);
    });
  });


})(Typerefinery.Components.Widgets.Chart.Variants.LineChart, document, window);
