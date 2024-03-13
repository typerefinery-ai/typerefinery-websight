window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Stix = Typerefinery.Components.Stix || {};
window.Typerefinery.Components.Stix.Forms = Typerefinery.Components.Stix.Forms || {};
window.Typerefinery.Components.Stix.Forms.Input = Typerefinery.Components.Stix.Forms.Input || {};

(function (ns, document) {
    "use strict";
    $(document).ready(function () {
      console.log('Embed component Behaviour loaded');
      $('[component="stix-input"]').each(function () {
          ns.init(this);
      });
    });
})(window.Typerefinery.Components.Stix.Forms.Input, document);
