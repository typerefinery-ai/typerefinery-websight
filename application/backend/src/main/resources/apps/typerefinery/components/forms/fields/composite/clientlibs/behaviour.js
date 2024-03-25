window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Composite = Typerefinery.Components.Forms.Composite || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
      console.log('Composite component Behaviour loaded');
      $("[component='composite']").each(function () {
          ns.init(this);
      });
    });
})(window.Typerefinery.Components.Forms.Composite, document);
