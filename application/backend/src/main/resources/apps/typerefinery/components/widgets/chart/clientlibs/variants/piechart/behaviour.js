window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Chart = Typerefinery.Components.Widgets.Chart || {};
window.Typerefinery.Components.Widgets.Chart.Variants = Typerefinery.Components.Widgets.Chart.Variants || {};
window.Typerefinery.Components.Widgets.Chart.Variants.PieChart = Typerefinery.Components.Widgets.Chart.Variants.PieChart || {};



(function (ns, document, window) {
  "use strict";

  $(document).ready(function () {
    $("[component='chart'][data-module='pieChart']").each(function () {
      ns?.init(this);
    });
  });


})(Typerefinery.Components.Widgets.Chart.Variants.PieChart, document, window);
