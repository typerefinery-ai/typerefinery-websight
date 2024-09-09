window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Select = Typerefinery.Components.Forms.Select || {};
window.Typerefinery.Components.Forms.Select.Instances = Typerefinery.Components.Forms.Select.Instances || {};

(function ($, ns, componentNs, selectInstances, window, document) {
    "use strict";

    ns.selectorComponent = '[component=select]';
    ns.selectorInit = '[data-choice]'
    ns.selectorInitNot = ':not([data-choice])'
    
    ns.getOptionsSelectedAsAnArray = ($component) => {
        const $selectedOption = $component.find('option[selected]');
        if($selectedOption) {
            return [$selectedOption.val()];
        } else {
            return [];
        }
    }

    ns.getDefaultOptionsSelected = (defaultSelectedOptions) => {
        // convert the defaultSelectedOptions to an array 
        // if the defaultSelectedOptions is a string, then split it by comma
        // if the defaultSelectedOptions is an array, then do nothing

        if(typeof defaultSelectedOptions === 'string') {
            return defaultSelectedOptions.split(',');
        }

        return defaultSelectedOptions;
    };

    ns.isValueSelectedAsDefault = (options, value) => {
        if(options) {
            if(Array.isArray(options)) {
                return options.includes(value?.trim()) ? 'selected' : '';
            }
        }
        return '';
    };

    ns.getOptionsFromDataSource = async (componentConfig) => {
        try{
            const {  readOptionsFromDataSource, readMethod , readPayloadType } = componentConfig;
            if(!readOptionsFromDataSource) {
                return [];
            }
            const response = await fetch(
                readOptionsFromDataSource, 
                {
                    method: readMethod || "GET",
                    headers: {
                        "Content-Type": readPayloadType || "application/json"
                    }
                }
            ).then(response => response.json());
            return Array.isArray(response) ? response : (response?.data || []);
        }catch(error) {
            console.error(error);
            return [];
        }
    };

    ns.addOptionsToSelect = ($component, defaultSelectedOptions, optionsList, keyName, labelName) => {
      console.log('options from data source', optionsList, defaultSelectedOptions, keyName, labelName);
      if(optionsList.length !== 0) {
          const selectOptions = optionsList.map((option) => {
              console.log(option);
              var html = `<option ${ns.isValueSelectedAsDefault(defaultSelectedOptions, option[keyName || 'key'])} value="${option[keyName || 'key']}">${option[labelName || 'label']}</option>`;
              console.log(html);
              return html;
          });
          var optionsHTML = selectOptions.join('');
          console.log(optionsHTML)
          $component.html(optionsHTML);
          return;
      } else {
        console.log("optionsList is empty");
      }
    };

    // public methods to interact with the select component instances
    ns.getValue = function (id) {
      console.group('select getValue');
      console.log('id', id);
      let returnValue = "";
      returnValue = selectInstances[id].getValue(true)
      console.log('returnValue', returnValue);
      console.groupEnd();
      return returnValue;
    }
    ns.setChoiceByValue = function (id, value) {
      console.group('select setChoiceByValue');
      console.log('id', id);
      console.log('value', value);
      selectInstances[id].setChoiceByValue(value);
      console.groupEnd();
    }
    ns.setValue = function (id, data) {
      console.group('select setValue');
      console.log('id', id);
      console.log('value', value);
      selectInstances[id].setValue(data);
      console.groupEnd();
    }

    ns.init = async ($component) => {
        console.group("select init");
        const componentConfig = componentNs.getComponentConfig($component);
        if(componentConfig.multipleSelection) {
            $component.attr('multiple', 'true');
        }


        console.log("componentConfig.id",componentConfig.id);
        console.log("component select",$component.get(0));

        console.log("loading options");

        const defaultSelectedOptions = ns.getDefaultOptionsSelected(componentConfig.defaultSelectedOptions);

        if(componentConfig.readOptionsFromDataSource) {
          console.log("loading options from data source, wait for response");
          console.groupEnd();
          var optionsList = await ns.getOptionsFromDataSource(componentConfig);
          console.groupCollapsed("select init, resume after response from data source on " + window.location);
          console.log("data source list", optionsList);
          ns.addOptionsToSelect($component, defaultSelectedOptions, optionsList, componentConfig.keyNameInOptionList, componentConfig.keyNameInOptionList, componentConfig.labelNameInOptionList);
          console.log($component.html());
          console.log("loaded options");

          console.log("init choices");

          selectInstances[componentConfig.id] = new Choices($component.get(0), {
              removeItemButton: true,
              maxItemCount: componentConfig.maxSelection || -1,
              allowHTML: false,
              shouldSort: true,
              loadingText: 'Loading...',
              itemSelectText: 'Press to select',
              uniqueItemText: 'Only unique values can be added',
              addItemText: (value) => {
                return `Press Enter to add <b>"${value}"</b>`;
              },
          }); 
          console.groupEnd();
        } else {
          console.log("loading options from config");
          
          if(componentConfig.selectOptions && Array.isArray(componentConfig.selectOptions)) {
            console.log("config options list", componentConfig.selectOptions)
            ns.addOptionsToSelect($component, defaultSelectedOptions, componentConfig.selectOptions, "value", "label");
          }
          console.log("loaded options");

          console.log("init choices");

          selectInstances[componentConfig.id] = new Choices($component.get(0), {
              removeItemButton: true,
              maxItemCount: componentConfig.maxSelection || -1,
              allowHTML: false,
              shouldSort: true,
              loadingText: 'Loading...',
              itemSelectText: 'Press to select',
              uniqueItemText: 'Only unique values can be added',
              addItemText: (value) => {
                return `Press Enter to add <b>"${value}"</b>`;
              },
          }); 
          
          console.groupEnd();
        }
        
    }

})(jQuery, Typerefinery.Components.Forms.Select, Typerefinery.Components, Typerefinery.Components.Forms.Select.Instances, window, document);
