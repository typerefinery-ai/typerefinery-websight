window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Input = Typerefinery.Components.Forms.Input || {};


(function ($, ns, componentNs, document, window) {
  "use strict";

  ns.selectorComponent = '[component="input"]';

  ns.init = ($component) => {
      const componentConfig = componentNs.getComponentConfig($component);
  }

})(jQuery, window.Typerefinery.Components.Forms.Input, document);