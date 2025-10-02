window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Select = Typerefinery.Components.Forms.Select || {};
window.Typerefinery.Components.Forms.Select.Instances = Typerefinery.Components.Forms.Select.Instances || {};

(function ($, ns, componentNs, selectInstances, eventNs, Choices, window, document) {
    "use strict";

    ns.selectorComponent = '[component=select]';
    ns.selectorInit = '[data-choice]'
    ns.selectorInitNot = ':not([data-choice])'
    
    ns.ACTION_SELECT_CHANGE = 'SELECT_CHANGE';
    ns.ACTION_SELECT_ITEM_ADD = 'SELECT_ITEM_ADD';
    ns.ACTION_SELECT_ITEM_REMOVE = 'SELECT_ITEM_REMOVE';
    ns.ACTION_SELECT_ITEM_SELECT = 'SELECT_ITEM_SELECT';

    ns.ACTIONS = {
        SELECT_CHANGE: ns.ACTION_SELECT_CHANGE,
        SELECT_ITEM_ADD: ns.ACTION_SELECT_ITEM_ADD,
        SELECT_ITEM_REMOVE: ns.ACTION_SELECT_ITEM_REMOVE,
        SELECT_ITEM_SELECT: ns.ACTION_SELECT_ITEM_SELECT
    };

    // map event types to handlers in component
    // this will indicate which events are supported by component
    // ns.eventMap = eventNs.genericEventsTopicMap();
    ns.eventMap = {};

    // this will add event listener to the component and register the event for all textareas with the same name
    ns.addEventListener = ($component, componentConfig) => {
        
      const { events, id } = componentConfig;
      const defaultTopic = componentConfig.name || id;
      const comonentEventId = componentConfig.name || id;
      console.group('addEventListener ' + comonentEventId);
      
      console.log(["config", events, comonentEventId, defaultTopic, componentConfig]);
      
      console.log("registering events");
      //register events
      if (events) {        
        events.forEach(event => {
          const { topic, type, name, nameCustom, action, config, value } = event;

          //if topic not set use component id as topic
          const topicName = topic || defaultTopic;
          // if type is not defined then its listen event
          let typeName = type || eventNs.EVENT_TYPE_LISTEN || "custom";

          let eventName = nameCustom || name || topic;
          
          console.groupCollapsed(`event ${typeName} - ${action}:${topic}`);
          console.log(["event config", topic, type, name, nameCustom, action, config]);

          console.log(["event to register", topicName, typeName, eventName, action]);

          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap), topicName, typeName, action, eventName, config]);
          eventNs.registerEventActionMapping(ns.eventMap, comonentEventId, topicName, typeName, action, eventName, config);
          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap)]);

          // if event type is listen then add event listener for the event

          if (typeName === eventNs.EVENT_TYPE_EMIT) {
              //emit do nothing here              
              console.log("adding event listener " + action);
              if (action === ns.ACTION_SELECT_CHANGE) {
                console.group(`adding change listener to component ${comonentEventId}`);
  
                $component.on("change", (e) => {
                    console.group("change");
                    console.log(["change", e]);
          
                    console.log(["config", componentConfig]);
                    const $instance = $(e.target);
                    const id = event.detail.id;
                    const value = event.detail.value;
                    const type = $instance.attr('type');
  
                    ns.handleEventAction($component, componentConfig, ns.ACTION_SELECT_CHANGE, { 
                      value: value,
                      type: type,
                      id: id,
                      action: action
                    });
          
                    console.groupEnd();
                });

                console.groupEnd();
              } else if (action === ns.ACTION_SELECT_ITEM_ADD) {
                console.group(`adding add item listener to component ${comonentEventId}`);
  
                $component.on("addItem", (e) => {
                    console.group("addItem");
                    console.log(["addItem", e]);
          
                    console.log(["config", componentConfig]);
                    const $instance = $(e.target);
                    const id = event.detail.id;
                    const value = event.detail.value;
                    const type = $instance.attr('type');
  
                    ns.handleEventAction($component, componentConfig, ns.ACTION_SELECT_ITEM_ADD, { 
                      value: value,
                      type: type,
                      id: id,
                      action: action
                    });
          
                    console.groupEnd();
                });

                console.groupEnd();
              } else if (action === ns.ACTION_SELECT_ITEM_REMOVE) {
                console.group(`adding remove item listener to component ${comonentEventId}`);
  
                $component.on("removeItem", (e) => {
                    console.group("removeItem");
                    console.log(["removeItem", e]);
          
                    console.log(["config", componentConfig]);
                    const $instance = $(e.target);
                    const id = event.detail.id;
                    const value = event.detail.value;
                    const type = $instance.attr('type');
  
                    ns.handleEventAction($component, componentConfig, ns.ACTION_SELECT_ITEM_REMOVE, { 
                      value: value,
                      type: type,
                      id: id,
                      action: action
                    });
          
                    console.groupEnd();
                });

                console.groupEnd();
              } else if (action === ns.ACTION_SELECT_ITEM_SELECT) {
                console.group(`adding select item listener to component ${comonentEventId}`);
  
                $component.on("choice", (e) => {
                    console.group("selectItem");
                    console.log(["selectItem", e]);
          
                    console.log(["config", componentConfig]);
                    const $instance = $(e.target);
                    const id = event.detail.id;
                    const value = event.detail.value;
                    const type = $instance.attr('type');
  
                    ns.handleEventAction($component, componentConfig, ns.ACTION_SELECT_ITEM_SELECT, { 
                      value: value,
                      type: type,
                      id: id,
                      action: action
                    });
          
                    console.groupEnd();
                });

                console.groupEnd();
              }
          } else {
              //listen register the event and listent for specific event on topic
              console.log(["register event listen", topicName, eventName]);
              eventNs.registerEvents(topicName, (data) => {
                  // check make sure the event is for this event
                  console.log(["registerEvents callback", topicName, eventName, data]);
                  if (data.type === eventName) {
                      ns.handleEventAction($component, componentConfig, action, data);
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

    ns.SELECT_CHANGE = ($component, componentConfig, data) => {
      console.group(ns.ACTION_SELECT_CHANGE);
      const { id } = componentConfig;
      const comonentEventId = componentConfig.name || id;

      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_ITEM_SELECT, ns.ACTION_SELECT_CHANGE, {id: comonentEventId});

      console.groupEnd();
    }

    ns.SELECT_ITEM_ADD = ($component, componentConfig, data) => {
      console.group(ns.ACTION_SELECT_ITEM_ADD);
      const { id } = componentConfig;
      const comonentEventId = componentConfig.name || id;
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_ITEM_CREATE, ns.ACTION_SELECT_ITEM_ADD, {id: comonentEventId});
      console.groupEnd();
    }

    ns.SELECT_ITEM_REMOVE = ($component, componentConfig, data) => {
      console.group(ns.ACTION_SELECT_ITEM_REMOVE);
      const { id } = componentConfig;
      const comonentEventId = componentConfig.name || id; 
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_ITEM_DELETE, ns.ACTION_SELECT_ITEM_REMOVE, {id: comonentEventId});
      console.groupEnd();
    }

    ns.SELECT_ITEM_SELECT = ($component, componentConfig, data) => {
      console.group(ns.ACTION_SELECT_ITEM_SELECT);
      const { id } = componentConfig;
      const comonentEventId = componentConfig.name || id;
      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_ITEM_SELECT, ns.ACTION_SELECT_ITEM_SELECT, {id: comonentEventId});
      console.groupEnd();
    }

    ns.handleEventAction = ($component, componentConfig, action, data) => {
      console.group('handleEventAction');
      console.log(["handleEventAction", action, data]);
      // if componentConfig is not passed then get it from the component
      if (!componentConfig) {
        componentConfig = componentNs.getComponentConfig($component);
      }
      switch (action) {
        case ns.ACTION_SELECT_CHANGE:
          ns.SELECT_CHANGE($component, componentConfig, data);
          break;
        case ns.ACTION_SELECT_ITEM_ADD:
          ns.SELECT_ITEM_ADD($component, componentConfig, data);
          break;
        case ns.ACTION_SELECT_ITEM_REMOVE:
          ns.SELECT_ITEM_REMOVE($component, componentConfig, data);
          break;
        case ns.ACTION_SELECT_ITEM_SELECT:
          ns.SELECT_ITEM_SELECT($component, componentConfig, data);
          break;
        default:
            console.log("no action found");
            break;
      }
      console.groupEnd();
    }

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
    ns.setValue = function (id, values, options) {
        //TODO: check if data is an array or string and add it to the select options if not already present
        console.group('select setValue');
        console.log('id', id);
        console.log('values', values);
        console.log('Choice', selectInstances[id]);

        // selectInstances[id].setValue(values);
        if (options) {
            console.log('options', options);
            let replaceItems = options?.replaceItems || false;
            console.log('replaceItems', replaceItems);
            console.log('current select.items', selectInstances[id].items);
            console.log('current select.choices', selectInstances[id].choices);

            //if selectInstances[id] has choices then select by value if not add them
            if (selectInstances[id].choices && replaceItems) {
                console.log('no choices found and replace requested, adding new choices');
                let choices = [];
                // check if value is an array or string
                if (Array.isArray(values)) {
                    choices = values.map((val) => {
                        return {
                            value: val,
                            label: val
                        }
                    });
                } else {
                    choices = [{
                        value: values,
                        label: values
                    }];
                }
                console.log('choices', choices);
                selectInstances[id].setChoices(choices, 'value', 'label', replaceItems);
            } else {
                console.log('choices found, setting value');
                selectInstances[id].setValue(values);    
            }
        } else {
            selectInstances[id].setValue(values);
        }

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

          console.log("add event listener");
          ns.addEventListener($component, componentConfig);
          console.log("event listener added");
  
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

          console.log("add event listener");
          ns.addEventListener($component, componentConfig);
          console.log("event listener added");
  
          console.groupEnd();
        }

        
    }

})(jQuery,  Typerefinery.Components.Forms.Select, Typerefinery.Components, Typerefinery.Components.Forms.Select.Instances, Typerefinery.Page.Events, Choices, window, document);
