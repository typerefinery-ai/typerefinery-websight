window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Form = Typerefinery.Components.Forms.Form || {};
window.Typerefinery.Components.Forms.Composite = Typerefinery.Components.Forms.Composite || {};


;(function ($, ns, componentsNs, formNs, Sortable, document, window) {
    "use strict";
    
    ns.selectorComponentName = "composite";
    ns.selectorComponent = "[component=composite]";
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
    ns.selectorNameAttribute = "name";
    ns.selectorName = `[${ns.selectorNameAttribute}]`;
    ns.selectorIdAttribute = "id";
    ns.selectorTypeList = "list";

    $.fn.findExclude = function(selector, mask) {
      return this.find(selector).not(this.find(mask).find(selector));
    }    

    $.fn.compositeVal = function(addFieldHint) {
      console.group('compositeVal');
      const type = this.attr('type');
      const isList = type === ns.selectorTypeList;
      console.group("type", type);
      console.group("isList", isList);

      if (!isList) {
        //get all immediate isCompositeParent components
        var $compositeParents = this.parent(ns.selector).findExclude(ns.selector,ns.selector);
        var data = {};
      
        console.log("this.value", this.val());
        //add current field values to data
        Object.assign(data,JSON.parse(this.val()));

        console.log("compositeParents", $compositeParents);
        //for each get their values and merge their composites in
        $compositeParents.each(function(){
          //find composite value input field
          var $compositeValue = $(this).findExclude(ns.selectorValue,ns.selector);        
          console.log("compositeValue", $compositeValue);
          if ($compositeValue) {
            const compositeValueName = $compositeValue.attr(ns.selectorNameAttribute);
            console.log("compositeValueName", compositeValueName);
            // create placeholder for composite value
            data[compositeValueName] = {};
            // get composite value for this field, this will cascade to other composite fields
            Object.assign(data[compositeValueName],$compositeValue.compositeVal(addFieldHint));
          }
        });
        console.groupEnd();
        return data;
      } else {
        var data = [];
        console.log("parent", this.parent(ns.selector));
        console.log("rows", this.parent(ns.selector).find('.row'));
        this.parent(ns.selector).find('.row').each(function() {
          console.log("row", this);
          const $row = $(this);
          const $rowContents = $row.find('.content');
          console.log("contents", $rowContents);
          
          var rowData = {};
          //get all simple input fields and add to data
          $rowContents.find(ns.selectorInput).each(function() {
            const $field = $(this);
            console.log("$field", $field);
            rowData[$field.attr(ns.selectorNameAttribute)] = $field.val();
          });
          console.log("rowData", JSON.stringify(rowData));
          //get all immediate isCompositeParent components and add to data
          var $compositeParents = $rowContents.findExclude(ns.selector,ns.selector);
          console.log("compositeParents", $compositeParents);
          $compositeParents.each(function(){
            //find composite value input field
            var $compositeValue = $(this).findExclude(ns.selectorValue,ns.selector);        
            console.log("compositeValue", $compositeValue);
            if ($compositeValue) {
              const compositeValueName = $compositeValue.attr(ns.selectorNameAttribute);
              console.log("compositeValueName", compositeValueName);
              // create placeholder for composite value
              var data = {};
              // get composite value for this field, this will cascade to other composite fields
              Object.assign(data,$compositeValue.compositeVal(addFieldHint));
              rowData[compositeValueName] = data;
            }
            console.log("rowData", JSON.stringify(rowData));
          });
          //add row data to data
          data.push(rowData);
        });
        console.groupEnd();
        return data;
      }    
    }

    ns.setValue = function($compositeParent, data) {

      const type = $compositeParent.attr('type');
      const isList = type === ns.selectorTypeList;

      //get all immediate isCompositeParent
      var $compositeParents = $compositeParent.parent(ns.selector).findExclude(ns.selector,ns.selector);
      //set value of composite input
      $compositeParent.val(JSON.stringify(data));
      //for each get their values and merge their composites in
      $compositeParents.each(function(){
        //find composite value input field
        var $compositeValue = $(this).findExclude(ns.selectorValue,ns.selector);
        if ($compositeValue) {
          // get composite value for this field, this will cascade to other composite fields
          $compositeValue.setValue(data[$compositeValue.attr(ns.selectorNameAttribute)]);
        }
      });
    }

    ns.compileValue = function($compositeParent, addFieldHint) {
      var $field = $compositeParent.findExclude(ns.selectorValue,ns.selector);
      var $templateFields = $compositeParent.findExclude(ns.selectorTemplate,ns.selector).findExclude(ns.selectorCompositeInput,ns.selector);
      var data = {};
  
      if (addFieldHint) {
        //add hint to component
        formNs.addFieldHint($field, $field.attr(ns.selectorNameAttribute), $field.attr(ns.selectorIdAttribute));
      }

      $templateFields.each(function(){
        //get name and value of each input field
        var name = $(this).attr(ns.selectorNameAttribute);
        var value = $(this).val();
        data[name] = value;

        if (addFieldHint) {
          //add hint to component
          formNs.addFieldHint($(this), $(this).attr(ns.selectorNameAttribute), $(this).attr(ns.selectorIdAttribute));
        }
      });
      //set value of composite input
      $field.val(JSON.stringify(data));
    }

    ns.addRow = function($compositeParent) {
      var $newRow = $($compositeParent.find("template.content").html());
      const $templateActions = $($compositeParent.find("template.actions").html());
      const $templateMove = $($compositeParent.find("template.move").html());

      //add move and actions to new row
      $newRow.prepend($templateMove.clone());
      $newRow.append($templateActions.clone());
      $newRow.attr('id', 'row-' + Math.random().toString(36));
      $newRow.attr('state', "new");

      $compositeParent.find(".rows").append($newRow.clone());
    }

    ns.init = async ($compositeParent) => {
      console.group("composite init");
      const componentConfig = componentsNs.getComponentConfig($compositeParent);

      console.log($compositeParent);
      console.log(componentConfig);

      const type = $compositeParent.attr('type');
      const isList = type === ns.selectorTypeList;

      console.log(type);
      console.log(isList);

      if (isList) {
        console.log('Composite List component Behaviour loading');
        //setup list variant
        var $newRow = $($compositeParent.find("template.content").html());
        const $templateActions = $($compositeParent.find("template.actions").html());
        const $templateMove = $($compositeParent.find("template.move").html());

        //add move and actions to new row
        $newRow.prepend($templateMove.clone());
        $newRow.append($templateActions.clone());
        $newRow.attr('id', 'row-' + Math.random().toString(36));
        $newRow.attr('state', "new");

        //add move and actions to all rows
        $compositeParent.find(".rows .row").each(function(){
          $(this).prepend($templateMove.clone());
          $(this).append($templateActions.clone());
        });
        console.log("sortable target",$compositeParent.get(0), $compositeParent.find(".rows").get(0));
        //initialize sortable on rows
        new Sortable($compositeParent.find(".rows").get(0), {
          handle: '.move', // handle's class
          animation: 150
        });
        
        //add new row listener
        $compositeParent.find(".add").on("click", function() {
          $compositeParent.find(".rows").append($newRow.clone());
        });
        console.log('Composite List component Behaviour loaded');
      }
      
      // compile current values for all input fields
      //find all input fields that are not inside another composite input
      var $field = $compositeParent.findExclude(ns.selectorTemplate,ns.selector).findExclude(ns.selectorInput, ns.selector);
      console.log('remove input attribute and add composite input attribute', $field);
      //remove isInput attribute and add isCompositeInput attribute, this will ensure that form fields are not processed by form submit
      $field.removeAttr(ns.selectorInputAttribute);
      $field.attr(ns.selectorCompositeInputAttribute,"true");
      //compile value for composite input
      ns.compileValue($compositeParent);

      //find all input fields that are not inside another composite input
      // var $field = $(this).findExclude(ns.selectorTemplate,ns.selector).findExclude(ns.selectorInput, ns.selector);
      // console.log('remove input attribute and add composite input attribute', $field);
      // //remove isInput attribute and add isCompositeInput attribute, this will ensure that form fields are not processed by form submit
      // $field.removeAttr(ns.selectorInputAttribute);
      // $field.attr(ns.selectorCompositeInputAttribute,"true");
      //compile value for composite input
      // ns.compileValue($(this));

      // //compile all values within this parent now for all input fields
      // $compositeParent.find(ns.selector).each(function(){
      //   //find all input fields that are not inside another composite input
      //   var $field = $(this).findExclude(ns.selectorTemplate,ns.selector).findExclude(ns.selectorInput, ns.selector);
      //   //remove isInput attribute and add isCompositeInput attribute, this will ensure that form fields are not processed by form submit
      //   $field.removeAttr(ns.selectorInputAttribute);
      //   $field.attr(ns.selectorCompositeInputAttribute,"true");
      //   //compile value for composite input
      //   ns.compileValue($(this));
      // });

      console.groupEnd();
    }


})(jQuery, Typerefinery.Components.Forms.Composite, Typerefinery.Components, Typerefinery.Components.Forms.Form, Sortable, document, window);
