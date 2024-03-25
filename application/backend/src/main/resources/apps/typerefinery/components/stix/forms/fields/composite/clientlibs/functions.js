window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Stix = Typerefinery.Components.Stix || {};
window.Typerefinery.Components.Stix.Forms = Typerefinery.Components.Stix.Forms || {};
window.Typerefinery.Components.Stix.Forms.Composite = Typerefinery.Components.Stix.Forms.Composite || {};


;(function ($, ns, componentNs, window, document) {
    "use strict";

    ns.selectorAttribute = "isCompositeParent";
    ns.selector = `[${ns.selectorAttribute}]`;
    ns.selectorValueAttribute = "isCompositeValue";
    ns.selectorValue = `[${ns.selectorValueAttribute}]`;
    //how to find all form input fields
    ns.selectorInputAttribute = "isInput";
    ns.selectorInput = `[${ns.selectorInputAttribute}]`;
    //how to find all input fields that are part of this composite input
    ns.selectorCompositeInputAttribute = "isCompositeInput";
    ns.selectorCompositeInput = `[${ns.selectorCompositeInputAttribute}]`;
    //template for form components in parent
    ns.selectorTemplate = "> [template]";
    ns.selectonNameAttribute = "name";

    $.fn.findExclude = function(selector, mask) {
      return this.find(selector).not(this.find(mask).find(selector));
    }    

    $.fn.compositeVal = function() {
      //get all immediate isCompositeParent
      var $compositeParents = this.parent(ns.selector).findExclude(ns.selector,ns.selector);
      var data = {};
    
      //add current field values to data
      Object.assign(data,JSON.parse(this.val()));
      
      //for each get their values and merge their composites in
      $compositeParents.each(function(){
        //find composite value input field
        var $compositeValue = $(this).findExclude(ns.selectorValue,ns.selector);        
        if ($compositeValue) {
          // create placeholder for composite value
          data[$compositeValue.attr(ns.selectonNameAttribute)] = {};
          // get composite value for this field, this will cascade to other composite fields
          Object.assign(data[$compositeValue.attr(ns.selectonNameAttribute)],$compositeValue.compositeVal());
        }
      });
      return data;
    }

    ns.compileValue = function($compositeParent) {
      var $field = $compositeParent.findExclude(ns.selectorValue,ns.selector);
      var $templateFields = $compositeParent.findExclude(ns.selectorTemplate,ns.selector).findExclude(ns.selectorCompositeInput,ns.selector);
      var data = {};
  
      $templateFields.each(function(){
        //get name and value of each input field
        var name = $(this).attr(ns.selectonNameAttribute);
        var value = $(this).val();
        data[name] = value;
      });
      //set value of composite input
      $field.val(JSON.stringify(data));
    }

    ns.init = async ($component) => {
      const componentConfig = componentNs.getComponentConfig($component);

      $(document).ready(function () {

        $(ns.selector).each(function(){
            //find all input fields that are not inside another composite input
            var $field = $(this).findExclude(ns.selectorTemplate,ns.selector).findExclude(ns.selectorInput, ns.selector);
            //remove isInput attribute and add isCompositeInput attribute, this will ensure that form fields are not processed by form submit
            $field.removeAttr(ns.selectorInputAttribute);
            $field.attr(ns.selectorCompositeInputAttribute,"true");
            //compile value for composite input
            ns.compileValue($(this));
        });
        })
    
        //listen for change event on all input fields and compile value for composite input
        $(ns.selector).on("change", function() {
          ns.compileValue($(this));  
        });
    
    }


})(jQuery, Typerefinery.Components.Stix.Forms.Composite, Typerefinery.Components, window, document);
