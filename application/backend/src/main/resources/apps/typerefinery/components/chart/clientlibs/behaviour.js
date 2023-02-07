window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Chart = Typerefinery.Components.Chart || {};
window.Typerefinery.Components.Chart.Varients =
  Typerefinery.Components.Chart.Varients || {};

(function (ns, document, window) {
  "use strict";

  $(document).ready(function () {
    $('[data-module="chart"]').each(function () {
      ns.init(this);
    });
  });
})(window.Typerefinery.Components.Chart, document, window);

console.log("data1", window.Typerefinery.Components.Chart);
