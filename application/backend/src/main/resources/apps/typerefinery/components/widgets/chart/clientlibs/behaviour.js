window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Charts = Typerefinery.Components.Widgets.Charts || {};

(function (ns, document, window) {
  "use strict";
  $(document).ready(function () {
    $('[data-module="chartComponent"]').each(function () {
      ns.init(this);
    });
  });
})(window.Typerefinery.Components.Widgets.Charts, document, window);
