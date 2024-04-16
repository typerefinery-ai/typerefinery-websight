window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Composite = Typerefinery.Components.Forms.Composite || {};
window.Typerefinery.Components.Stix = Typerefinery.Components.Stix || {};
window.Typerefinery.Components.Stix.Forms = Typerefinery.Components.Stix.Forms || {};
window.Typerefinery.Components.Stix.Forms.Composite = Typerefinery.Components.Stix.Forms.Composite || {};

;(function ($, ns, componentNs, formsNs, compositeNs, document, window) {
    "use strict";


    ns.init = async ($component) => {
      const componentConfig = componentNs.getComponentConfig($component);

      $(document).ready(function () {

        $(compositeNs.selector).each(function(){
            //find all input fields that are not inside another composite input
            var $field = $(this).findExclude(compositeNs.selectorTemplate,compositeNs.selector).findExclude(compositeNs.selectorInput, compositeNs.selector);
            //remove isInput attribute and add isCompositeInput attribute, this will ensure that form fields are not processed by form submit
            $field.removeAttr(compositeNs.selectorInputAttribute);
            $field.attr(compositeNs.selectorCompositeInputAttribute,"true");
            //compile value for composite input
            compositeNs.compileValue($(this));
        });
        })
    
        //listen for change event on all input fields and compile value for composite input
        $(compositeNs.selector).on("change", function() {
          compositeNs.compileValue($(this));  
        });
    
    }


})(jQuery, Typerefinery.Components.Stix.Forms.Composite, Typerefinery.Components, Typerefinery.Components.Forms, Typerefinery.Components.Forms.Composite, document, window);
