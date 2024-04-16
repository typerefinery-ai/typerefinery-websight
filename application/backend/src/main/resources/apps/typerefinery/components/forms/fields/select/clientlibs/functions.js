window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Select = Typerefinery.Components.Forms.Select || {};
window.Typerefinery.Components.Forms.Select.Instances = Typerefinery.Components.Forms.Select.Instances || {};



;(function (ns, componentNs, selectInstances, window, document) {
    "use strict";

    ns.getOptionsSelectedAsAnArray = ($component) => {
        const $selectedOption = $component.querySelector('option[selected]');
        if($selectedOption) {
            return [$selectedOption.value];
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

    ns.addOptionsToSelect = async ($component, componentConfig, defaultSelectedOptions) => {
        
        if(componentConfig.readOptionsFromDataSource) {
            const options = await ns.getOptionsFromDataSource(componentConfig);
            console.log(options, 'options')
            if(options.length !== 0) {
                const selectOptions = options.map((option) => {
                    return `<option ${ns.isValueSelectedAsDefault(defaultSelectedOptions, option[componentConfig.keyNameInOptionList || 'key'])} value="${option[componentConfig.keyNameInOptionList || 'key']}">${option[componentConfig.labelNameInOptionList || 'label']}</option>`
                });
                $component.innerHTML = selectOptions.join('');
                return;
            }

        }
        
        if(componentConfig.selectOptions) {
            if(Array.isArray(componentConfig.selectOptions)) {
                const selectOptions = componentConfig.selectOptions.map((option) => {
                    return `<option ${ns.isValueSelectedAsDefault(defaultSelectedOptions, option.value)} value="${option.value}">${option.label}</option>`
                });
                $component.innerHTML = selectOptions.join('');
            } else {
                throw new Error('componentConfig.selectOptions is not an array');
            }
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
        const componentConfig = componentNs.getComponentConfig($component);
        if(componentConfig.multipleSelection) {
            $component.setAttribute('multiple', 'true');
        }

        const defaultSelectedOptions = ns.getDefaultOptionsSelected(componentConfig.defaultSelectedOptions);

        await ns.addOptionsToSelect($component, componentConfig, defaultSelectedOptions);
        

        selectInstances[componentConfig.id] = new Choices($component, {
            removeItemButton: true,
            maxItemCount: componentConfig.maxSelection || -1,
            labelId: componentConfig.id
        }); 
    }

})(Typerefinery.Components.Forms.Select, Typerefinery.Components, Typerefinery.Components.Forms.Select.Instances, window, document);
