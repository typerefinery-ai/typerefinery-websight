window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Form = Typerefinery.Components.Forms.Form || {};
window.Typerefinery.Components.Forms.Composite = Typerefinery.Components.Forms.Composite || {};
window.Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, componentsNs, formNs, Sortable, componentNs, eventNs, document, window) {
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
    ns.selectorTypeField = "field";
    ns.selectorTypeList = "list";

    // map event types to handlers in component
    // this will indicate which events are supported by component
    // ns.eventMap = eventNs.genericEventsTopicMap();
    ns.eventMap = {};

    ns.addEventListener = ($component, componentConfig) => {
        
      const { events, id } = componentConfig;
      const defaultTopic = id;
      console.group('addEventListener ' + id);
      
      console.log(["config", events, id, defaultTopic]);
      
      console.log("registering events");
      //register events
      if (events) {        
        events.forEach(event => {
          const { topic, type, name, nameCustom, action, config } = event;
          //if topic not set use component id as topic
          const topicName = topic || defaultTopic;
          // if type is not defined then its listen event
          let typeName = type || eventNs.EVENT_TYPE_LISTEN || "custom";

          let eventName = nameCustom || name;
          console.group(action + " " + eventName);
          console.log(["event config", topic, type, name, nameCustom, action]);

          console.log(["event to register", topicName, typeName, eventName, action]);

          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap), topicName, typeName, action, eventName]);
          eventNs.registerEventActionMapping(ns.eventMap, id, topicName, typeName, action, eventName, config);
          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap)]);

          // if event type is listen then add event listener for the event

          if (typeName === eventNs.EVENT_TYPE_EMIT) {
              //emit do nothing here
          } else {
              //listen register the event and listent for specific event on topic
              console.log(["register event listen", topicName, eventName]);
              eventNs.registerEvents(topicName, (data) => {
                  // check make sure the event is for this event
                  console.log(["event data", data]);
                  if (data.type === eventName) {                  
                      ns.handleEventAction($component, action, data);
                  }
              });
          }
          console.groupEnd();
        });

        console.log(["eventMap", ns.eventMap]);

      } else {
        console.log("no events found");
      }

      console.groupEnd();
      
    }

    
    ns.addNewItem = ($component, data, once) => {
      console.group('addNewItem');

      console.log(["addNewItem", $component, data]);

      const componentId = $component.attr('id');
      const componentConfig = componentNs.getComponentConfig($component);
      const $componentBody = $component.find(ns.selectorTemplate);

      if ($componentBody.length === 0) {
        console.log(`component body ${ns.selectorTemplate} to insert into not found`);
        return;
      }

      const { config } = data;
      console.log('config', config);
      let $template;
      if (config) {
        let found = false;
        //look for template in current component first
        let $templateByConfig = $component.find(config);
        let $templateByConfigAsId = $component.find(`#${config}`);

        console.log('$templateByConfig', $templateByConfig);
        console.log('$templateByConfigAsId', $templateByConfigAsId);

        if ($templateByConfig.length > 0) {
          console.log('found template by config inside the component');
          $template = $templateByConfig;
          found = true;
        } else if ($templateByConfigAsId.length > 0) {
          console.log('found template by config as id inside the component');
          $template = $templateByConfigAsId;
          found = true;
        }
      
        if (!found) {
          $templateByConfig = $(config);
          $templateByConfigAsId = $(`#${config}`);

          console.log('$templateByConfig', $templateByConfig);
          console.log('$templateByConfigAsId', $templateByConfigAsId);

          if ($templateByConfig.length > 0) {
            console.log('found template by config outside of component');
            $template = $templateByConfig;
            found = true;
          } else if ($templateByConfigAsId.length > 0) {
            console.log('found template by config as id outside of component');
            $template = $templateByConfigAsId;
            found = true;
          }
        }

        if (!found) {
          console.log(`template ${config} not found, internaly or externaly`);
          return;
        }
      }

      console.log('$template', $template);

      // get the template id if set
      const templateId = $template.attr('id');

      // if once check if template not already added
      if (once && templateId !== undefined) {
        const $templateExists = $component.find(`[templateId='${templateId}']`);
        if ($templateExists.length > 0) {
          console.log("template already used once");
          ns.openItem($component, { config: $templateExists.attr('id') });
          return;
        }
      }
      
      var $newRow = $($template.html());
      const itemId = Math.random().toString(36).substring(2, 15);

      if (once) {
        $newRow.attr('templateId', templateId);  
      }
      $newRow.attr('state', "new");
      $newRow.attr('id', itemId);

      console.log('itemId', itemId);

      console.log('$newRow', $newRow);

      //insert into component
      $componentBody.append($newRow);
      
      //raise event that item is added
      ns.ADD_ITEM($component, componentConfig, { type: ns.selectorComponentName, action: "add_item" , "id": itemId } );

      console.groupEnd();
    }

    ns.handleEventAction = ($component, action, data) => {
      console.group('handleEvent');
      console.log(["handleEvent", $component, action, data]);

      if (action === "ADD_ITEM") {
          ns.addNewItem($component, data, false);
      }
      if (action === "ADDONCE_ITEM") {
          ns.addNewItem($component, data, true);
      }
      console.groupEnd();
    }

    // local actions representing the form actions
    ns.ADD_ITEM = ($component, componentConfig, data) => {
      console.group('ADD_ITEM');
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.ADD_ITEM, "ADD_ITEM");
      console.groupEnd();
    }     



    $.fn.findExclude = function(selector, mask) {
      return this.find(selector).not(this.find(mask).find(selector));
    }    

    $.fn.compositeVal = function(addFieldHint) {
      console.group('compositeVal');
      const type = this.attr('type') || ns.selectorTypeField;
      const isList = type === ns.selectorTypeList;
      console.log("type", type);
      console.log("isList", isList);

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
          console.log("rowData row", JSON.stringify(rowData));
          //get all immediate isCompositeParent components and add to data
          var $compositeParents = $rowContents.findExclude(ns.selector,ns.selector);
          console.log("compositeParents to process", $compositeParents, $compositeParents.length);
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
            console.log("rowData with compositeParents", JSON.stringify(rowData));
          });
          //add row data to data
          data.push(rowData);
          console.log("data", data);
        });
        console.log("data final", data);
        console.groupEnd();
        return data;
      }
    }

    ns.findFieldAndSetValue = function($compositeParent, key, value) {
      console.group(key);
      console.log("value", value);
      const $field = $compositeParent.find(`[${ns.selectorNameAttribute}=${key}]`);

      if ($field.length === 0) {
        console.log("field not found", key);
        console.groupEnd();
        return;
      }
      console.log("$field", $field);
      console.log("$field.is(ns.selectorInput)", ns.selectorInput, $field.is(ns.selectorInput));
      console.log("$field.is(ns.selectorValue)", ns.selectorValue, $field.is(ns.selectorValue));
      // if field is basic input field
      if ($field.is(ns.selectorValue)) {
        // if field is composite field
        ns.setValue($field, value);
        console.log("set composite value");      
      } else if ($field.is(ns.selectorInput)) {
        $field.val(value);
        console.log("set val()");
      } else {
        console.log("unknow field", $field);
      }           
      console.log("$field.val()", $field.val());
      console.groupEnd();
    }

    ns.setValue = function($compositeValue, data) {
      console.group('composite setValue');
      console.log("$compositeValue", $compositeValue);
      const $compositeParent = $compositeValue.parent(ns.selector);
      console.log("$compositeParent", $compositeParent);
      console.log("data", data);
      const type = $compositeParent.attr('type') || ns.selectorTypeField;
      const isList = type === ns.selectorTypeList;
      console.log("type", type);
      console.log("isList", isList);

      if (!isList) {
        Object.keys(data).forEach(function(key) {
          const value = data[key];
          ns.findFieldAndSetValue($compositeParent, key, value);
        });
      } else {
        //for each row in data add a new row
        data.forEach(function(rowData){
          console.group("list row");
          console.log("rowData", rowData);

          //get row id from data
          const rowId = rowData['id'];
          console.log("data rowId", rowId);
          //check if row already exists
          let $dataRow = $compositeParent.find(`.row#${rowId}`);

          if ($dataRow.length > 0) {
            console.log("row exists");
          } else {
            const newRowId = ns.addRow($compositeParent, rowId);
            console.log("newRowId", newRowId);
            $dataRow = $compositeParent.find(`.row#${newRowId}`);
          }
          console.log("$dataRow", $dataRow);

          //for rowData set value of fields
          //get all simple input fields and set value
          Object.keys(rowData).forEach(function(key) {
            const value = rowData[key];
            ns.findFieldAndSetValue($dataRow, key, value);
          });
          console.groupEnd();
        });
      }

      console.groupEnd();
      return;
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

    //add new row and return row id
    ns.addRow = function($compositeParent, id) {
      var $newRow = $($compositeParent.find("template.content").html());
      const $templateActions = $($compositeParent.find("template.actions").html());
      const $templateMove = $($compositeParent.find("template.move").html());

      //add move and actions to new row
      $newRow.prepend($templateMove.clone());
      $newRow.append($templateActions.clone());
      var rowId = id;
      if (!id) {
        rowId = 'row-' + Math.random().toString(36).substring(2, 15);
      }

      $newRow.attr('id', rowId);
      $newRow.attr('state', "new");

      var $resultRow = $compositeParent.find(".rows").append($newRow.clone());
      console.log("new row added", $resultRow);
      return rowId;
    }

    ns.init = async ($compositeParent) => {
      console.group("composite init");
      const componentConfig = componentsNs.getComponentConfig($compositeParent);

      console.log($compositeParent);
      console.log(componentConfig);

      const type = $compositeParent.attr('type') || ns.selectorTypeField;
      const isList = (type === ns.selectorTypeList) ? true : false;
      const listIsUserReadonly = $compositeParent.attr('listIsUserReadonly');

      console.log("type", type);
      console.log("isList", isList);

      if (isList) {
        console.group("composite list init");

        if (listIsUserReadonly && listIsUserReadonly === 'true') {
          console.log('composite list is user readonly');
        } else {
          //setup list variant
          var $newRow = $($compositeParent.find("template.content").html());
          const $templateActions = $($compositeParent.find("template.actions").html());
          const $templateMove = $($compositeParent.find("template.move").html());
            //add move and actions to new row
          $newRow.prepend($templateMove.clone());
          $newRow.append($templateActions.clone());
          $newRow.attr('state', "new");
          $newRow.attr('id', 'row-' + Math.random().toString(36).substring(2, 15));

          //add move and actions to all rows
          $compositeParent.find(".rows .row").each(function(){
            $(this).prepend($templateMove.clone());
            $(this).append($templateActions.clone());
            $(this).attr('state', "existing");
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
        }
        
        console.groupEnd();
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

      console.log("adding event listeners");
      ns.addEventListener($compositeParent, componentConfig);
      console.log(["ns.eventMap", ns.eventMap]);

      console.groupEnd();
    }


})(jQuery, Typerefinery.Components.Forms.Composite, Typerefinery.Components, Typerefinery.Components.Forms.Form, Sortable, Typerefinery.Components, Typerefinery.Page.Events, document, window);
