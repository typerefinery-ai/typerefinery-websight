window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Ticker = Typerefinery.Components.Widgets.Ticker || {};
window.Typerefinery.Components.Widgets.Ticker.Variants = Typerefinery.Components.Widgets.Ticker.Variants || {};
window.Typerefinery.Components.Widgets.Ticker.Variants.SecondaryTicker = Typerefinery.Components.Widgets.Ticker.Variants.SecondaryTicker || {};


(function (ns, document, window) {
  "use strict";

  $(document).ready(function () {
    $("[component='ticker'][data-module='tickerComponent-secondaryTicker']").each(function () {
      ns?.init(this);
    });
  });


})(Typerefinery.Components.Widgets.Ticker.Variants.SecondaryTicker, document, window);
