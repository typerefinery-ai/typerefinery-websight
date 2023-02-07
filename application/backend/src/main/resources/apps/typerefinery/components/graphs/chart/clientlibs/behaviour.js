window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Graphs = Typerefinery.Components.Graphs || {};
window.Typerefinery.Components.Graphs.Chart = Typerefinery.Components.Graphs.Chart || {};
window.Typerefinery.Components.Graphs.Chart.Varients =
  Typerefinery.Components.Graphs.Chart.Varients || {};

(function (ns, document, window) {
  "use strict";

  $(document).ready(function () {
    $('[data-module="chart"]').each(function () {
      ns.init(this);
    });
  });
})(window.Typerefinery.Components.Graphs.Chart, document, window);
