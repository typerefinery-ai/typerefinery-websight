window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Chart = Typerefinery.Components.Widgets.Chart || {};
window.Typerefinery.Components.Widgets.Chart.Variants = Typerefinery.Components.Widgets.Chart.Variants || {};
window.Typerefinery.Components.Widgets.Chart.Variants.BarChart = Typerefinery.Components.Widgets.Chart.Variants.BarChart || {};



(function (ns, document, window) {
  "use strict";

  $(document).ready(function () {
    $("[component='chart'][data-module='barChart']").each(function () {
      ns?.init(this);
    });
  });


})(Typerefinery.Components.Widgets.Chart.Variants.BarChart, document, window);
