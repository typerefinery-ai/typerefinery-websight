window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Ticker = Typerefinery.Components.Widgets.Ticker || {};

(function (ns, document, window) {
  "use strict";
 
  $(document).ready(function () {
    $('[component=ticker]').each(function () {
      ns?.init(this);
    });
  });


})(Typerefinery.Components.Widgets.Ticker, document, window);
