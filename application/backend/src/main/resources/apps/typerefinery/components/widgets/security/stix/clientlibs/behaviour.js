window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Security = Typerefinery.Components.Widgets.Security || {};
window.Typerefinery.Components.Widgets.Security.Stix = Typerefinery.Components.Widgets.Security.Stix || {};



(function (ns, document, window) {
  "use strict";

  $(document).ready(function () {
    $('[component="stix"]').each(function () {
      ns.init(this);
    });
  });


})(window.Typerefinery.Components.Widgets.Security.Stix, document, window);
