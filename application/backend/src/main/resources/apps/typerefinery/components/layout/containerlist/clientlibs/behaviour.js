window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layout = Typerefinery.Components.Layout || {};
window.Typerefinery.Components.Layout.ContainerList = Typerefinery.Components.Layout.ContainerList || {};

(function (ns, document, window) {
  "use strict";
 
  $(document).ready(function () {
    $('[component=containerlist]').each(function () {
      ns?.init(this);
    });
  });


})(Typerefinery.Components.Layout.ContainerList, document, window);
