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

    /**
     * Has an author actually declared a default selection for this field?
     *
     * docs/issues/0156 — the empty first row is added only when they have NOT, so every existing
     * authored default keeps working exactly as before. Mirrors `isValueSelectedAsDefault`'s
     * contract: an array of values, already normalised by `getDefaultOptionsSelected`. Blank
     * strings do not count as a declaration.
     */
    ns.hasAuthoredDefault = (defaultSelectedOptions) =>
        Array.isArray(defaultSelectedOptions) &&
        defaultSelectedOptions.some((value) => String(value ?? '').trim() !== '');

    ns.getOptionsFromDataSource = async (componentConfig) => {
        try{
            const {  readOptionsFromDataSource, readMethod , readPayloadType, readPayload } = componentConfig;
            if(!readOptionsFromDataSource) {
                return [];
            }
            // `readPayload` is an authored request body, sent when the method takes one.
            //
            // alpha-launch decision 0011: the component stays data-agnostic — it does not know what
            // is in the payload, only how to send it. Which URL and which parameters are authored
            // per field, so no domain vocabulary enters this file. (The os-triage reference fields
            // author `{"object_type":"identity","object_field":"created_by_ref"}` against
            // `/stix-orm/utils/connections`, but this component never names any of that.)
            const method = (readMethod || "GET").toUpperCase();
            const options = {
                method: method,
                headers: {
                    "Content-Type": readPayloadType || "application/json"
                }
            };
            if (readPayload && method !== "GET" && method !== "HEAD") {
                options.body = typeof readPayload === "string" ? readPayload : JSON.stringify(readPayload);
            }
            const response = await fetch(readOptionsFromDataSource, options).then(response => response.json());
            const list = Array.isArray(response) ? response : (response?.data || []);
            // A flow algorithm answers 200 with an error envelope when it throws
            // (alpha-launch docs/issues/0026), and that is an object, not a list — so it lands here
            // as an empty list rather than as rows made of error text.
            if (!Array.isArray(list)) {
                console.warn("select getOptionsFromDataSource: response was not a list", response);
                return [];
            }
            return list;
        }catch(error) {
            console.error(error);
            return [];
        }
    };

    /**
     * Rich option rows — icon, heading, description — for a data source that supplies them.
     *
     * alpha-launch decision 0011 / GitHub #62. The row contract (`icon_url`, `heading`,
     * `description`, `tooltip`) is **generic UI vocabulary**, not domain vocabulary: any
     * application can return rows of that shape. The component renders whatever it is given and
     * falls back to the plain label when the extra fields are absent.
     *
     * ⚠️ **Built as DOM nodes, not an HTML string.** Choices' `allowHTML` stays `false`, which is
     * what previously made rich rows impossible — but turning it on would have parsed
     * server-supplied markup (`description` arrives as `First Name -&gt;Naive&lt;br&gt;…`) and
     * opened an injection surface for the sake of a line break. Building nodes gives the same
     * result with none of that.
     */
    ns.richChoiceTemplates = (strToEl) => ({
        // ⚠️ Choices calls a template as `template.call(this, this.config, ...args)` — the first
        // argument is the **config**, not `classNames`, and `selectText` arrives third. Reading it
        // as `classNames` produces rows whose every class is the string "undefined": they render,
        // but nothing can highlight, select or style them.
        choice: function (config, data, selectText) {
            const classNames = config.classNames;
            const props = (data && data.customProperties) || {};
            const row = document.createElement("div");
            row.id = data.elementId;
            // Mirror the stock template's classes and dataset exactly — Choices' own event handling
            // reads them back — and only change what goes *inside* the row.
            row.className = classNames.item + " " + classNames.itemChoice;
            if (data.selected) row.classList.add(classNames.selectedState);
            if (data.placeholder) row.classList.add(classNames.placeholder);
            row.setAttribute("role", data.groupId > 0 ? "treeitem" : "option");
            Object.assign(row.dataset, { choice: "", id: data.id, value: data.value, selectText: selectText });
            if (data.disabled) {
                row.classList.add(classNames.itemDisabled);
                row.dataset.choiceDisabled = "";
                row.setAttribute("aria-disabled", "true");
            } else {
                row.classList.add(classNames.itemSelectable);
                row.dataset.choiceSelectable = "";
            }
            if (props.tooltip) {
                // Indented when it is an object: a `title` renders newlines, and one long line of
                // JSON is unreadable at the size a tooltip gets.
                row.setAttribute("title", typeof props.tooltip === "string" ? props.tooltip : JSON.stringify(props.tooltip, null, 1));
            }

            if (props.icon_url) {
                const icon = document.createElement("img");
                icon.src = props.icon_url;
                icon.alt = "";
                icon.width = 20;
                icon.height = 20;
                icon.className = "choices__icon me-2 align-middle";
                row.appendChild(icon);
            }

            const text = document.createElement("span");
            const heading = document.createElement("strong");
            heading.textContent = props.heading || data.label;
            text.appendChild(heading);

            if (props.description) {
                const description = document.createElement("small");
                description.className = "d-block text-muted";
                // `description` may carry <br> separators. Split rather than parse: same reading,
                // no markup interpreted.
                String(props.description).split(/<br\s*\/?>/i).forEach((line, index) => {
                    if (index) description.appendChild(document.createElement("br"));
                    description.appendChild(document.createTextNode(line));
                });
                text.appendChild(description);
            }
            row.appendChild(text);
            return row;
        },
    });

    /**
     * Read `path` out of `option`, following dots so a nested field can be named.
     *
     * A data source is free to nest the value it wants used as the option key — the os-triage
     * connections source returns the identifier under `tooltip.id`, for instance. Resolving a
     * dotted path here keeps that an authoring detail rather than a reason to reshape the
     * response (alpha-launch decision 0011). A plain name still works unchanged.
     */
    ns.readOptionField = (option, path) => {
      if (!option || !path) return undefined;
      if (String(path).indexOf('.') === -1) return option[path];
      return String(path).split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), option);
    };

    ns.addOptionsToSelect = ($component, defaultSelectedOptions, optionsList, keyName, labelName) => {
      console.log('options from data source', optionsList, defaultSelectedOptions, keyName, labelName);
      if(optionsList.length !== 0) {
          const select = $component.get(0);
          if (!select) {
            console.warn("addOptionsToSelect: no select element");
            return;
          }
          // Built as DOM nodes rather than an HTML string: the values are server-supplied and
          // hand-escaping them into `value="…"` is a bug waiting to happen (a label containing a
          // quote used to break the whole option list). Same output, no escaping to get wrong.
          select.replaceChildren();

          // ⚠️ alpha-launch docs/issues/0156 — an empty first row, unless a default is authored.
          //
          // Without this, a single-value <select> that has options but none marked `selected` gets
          // its FIRST option selected by the browser, and Choices renders that as a chosen item. The
          // field therefore arrives already "filled in" and the value is submitted. Measured: creating
          // an identity with only the NAME typed stored identity_class:"individual", roles:["soc"]
          // and sectors:["agriculture"] - three attributes nobody chose, persisted to disk.
          //
          // This is what runsheet step P5-S5 has always specified ("Empty first row, then the full
          // vocabulary"), and the component already has a deliberate mechanism for real defaults
          // (`defaultSelectedOptions` / `isValueSelectedAsDefault`) - which is what makes the implicit
          // first-option default clearly unintended rather than a design choice.
          //
          // Skipped when an author HAS declared a default, so existing authored defaults are
          // untouched. Multi-value selects never had the problem (the browser selects nothing), so
          // they are left exactly as they were.
          if (!select.multiple && !ns.hasAuthoredDefault(defaultSelectedOptions)) {
            const blank = document.createElement('option');
            blank.value = '';
            // Choices shows this as the placeholder row; the text comes from the authored
            // `placeholder` attribute so no wording is invented here.
            blank.textContent = select.getAttribute('placeholder') || '';
            blank.setAttribute('selected', 'selected');
            blank.dataset.placeholder = 'true';
            select.appendChild(blank);
          }

          optionsList.forEach((option) => {
            const value = ns.readOptionField(option, keyName || 'key');
            const label = ns.readOptionField(option, labelName || 'label');
            const el = document.createElement('option');
            el.value = value == null ? '' : String(value);
            el.textContent = label == null ? el.value : String(label);
            // `isValueSelectedAsDefault` calls `.trim()` on the value, so hand it the string form.
            if (ns.isValueSelectedAsDefault(defaultSelectedOptions, el.value)) {
              el.setAttribute('selected', 'selected');
            }
            // Carry any extra per-row fields through to Choices as `customProperties`, so a rich
            // template can render them (alpha-launch decision 0011). Absent on ordinary sources,
            // in which case Choices renders its default row exactly as before.
            const extras = {};
            ['icon_url', 'heading', 'description', 'tooltip'].forEach((field) => {
              if (option[field] !== undefined) extras[field] = option[field];
            });
            if (Object.keys(extras).length) {
              el.dataset.customProperties = JSON.stringify(extras);
            }
            select.appendChild(el);
          });
          console.log("added " + optionsList.length + " options, first value: " + (select.options[0] && select.options[0].value));
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
      // Same exposure as setValue: a select in a modal frame may not have been registered yet.
      const getInstance = selectInstances[id] || ns.ensureInstance(id);
      if (!getInstance) {
        console.error(`select getValue: no instance for ${id}, returning ""`);
        console.groupEnd();
        return returnValue;
      }
      returnValue = getInstance.getValue(true)
      console.log('returnValue', returnValue);
      console.groupEnd();
      return returnValue;
    }
    ns.setChoiceByValue = function (id, value) {
      console.group('select setChoiceByValue');
      console.log('id', id);
      console.log('value', value);
      const instance = selectInstances[id] || ns.ensureInstance(id);
      if (!instance) {
        console.error(`select setChoiceByValue: no instance for ${id}, skipped`);
        console.groupEnd();
        return;
      }
      instance.setChoiceByValue(value);
      console.groupEnd();
    }
    /**
     * Choices options used by init() for both of its branches. Kept here so ensureInstance()
     * below builds an identical instance rather than a subtly different one.
     */
    ns.choicesOptions = (maxSelection) => ({
        removeItemButton: true,
        maxItemCount: maxSelection || -1,
        allowHTML: false,
        shouldSort: true,
        loadingText: 'Loading...',
        itemSelectText: 'Press to select',
        uniqueItemText: 'Only unique values can be added',
        addItemText: (value) => {
            return `Press Enter to add <b>"${value}"</b>`;
        },
    });

    /**
     * Return the Choices instance for a select, creating it if init() has not registered one.
     *
     * A select rendered inside a **modal frame** can be asked to take values before (or without)
     * the page's component-init sweep having reached it — the Create Connection modal is exactly
     * that case. setValue() then threw `Cannot read properties of undefined (reading 'items')`
     * and the field list stayed empty, so the connection could never be completed
     * (alpha-launch docs/issues/0030).
     *
     * Returns null when the element genuinely is not on the page, so callers can log and skip
     * instead of throwing.
     */
    ns.ensureInstance = function (id) {
        if (selectInstances[id]) {
            return selectInstances[id];
        }
        const $el = $(`#${id}`);
        if (!$el.length || !$el.get(0)) {
            console.warn(`select ensureInstance: no element for id ${id}, cannot create a Choices instance`);
            return null;
        }
        console.warn(`select ensureInstance: no Choices instance registered for ${id} — creating one now (see docs/issues/0030)`);
        selectInstances[id] = new Choices($el.get(0), ns.choicesOptions());
        return selectInstances[id];
    };

    /**
     * The options this select already holds, or [] if it has none yet.
     *
     * Choices keeps them on its internal store, and the shape has moved between versions — read
     * both, and never let a shape change here throw inside setValue().
     */
    ns.currentChoices = function (instance) {
        try {
            const store = instance && (instance._currentState || instance._store);
            const choices = store && (store.choices || (store.state && store.state.choices));
            return Array.isArray(choices) ? choices : [];
        } catch (error) {
            console.warn('select currentChoices: could not read the choice store', error);
            return [];
        }
    };

    ns.setValue = function (id, values, options) {
        console.group('select setValue');
        console.log('id', id);
        console.log('values', values);
        console.log('Choice', selectInstances[id]);

        if (!ns.ensureInstance(id)) {
            console.error(`select setValue: skipped for ${id} — no select element and no Choices instance`);
            console.groupEnd();
            return;
        }

        // selectInstances[id].setValue(values);
        if (options) {
            console.log('options', options);
            let replaceItems = options?.replaceItems || false;
            console.log('replaceItems', replaceItems);
            console.log('current select.items', selectInstances[id].items);
            console.log('current select.choices', selectInstances[id].choices);

            //if selectInstances[id] has choices then select by value if not add them
            // Was `if (selectInstances[id].choices && replaceItems)`. A freshly-created instance
            // (see ensureInstance) has no `choices` yet, so that fell through to setValue(),
            // which cannot introduce options that do not exist — leaving the list empty. When the
            // caller asks to replace items, always go through setChoices.
            if (replaceItems) {
                const wanted = (Array.isArray(values) ? values : [values]).filter((v) => v !== undefined && v !== null && v !== '');
                const existing = ns.currentChoices(selectInstances[id]);

                if (existing.length) {
                    // ⚠️ This select already has options — it reads them from a data source — so
                    // **merge**, never replace.
                    //
                    // `replaceItems: true` came from the Create Connection modal, where the select
                    // is empty and the caller has to introduce the options (alpha-launch
                    // docs/issues/0030). Applying it to a data-source select instead **wiped the
                    // whole candidate list** and left one option labelled with a raw id: the value
                    // survived, but the author could no longer pick a different one. On an update
                    // form that is most of the point of the field.
                    //
                    // Merging is also what the original TODO on this function asked for — "add it
                    // to the select options if not already present".
                    const known = new Set(existing.map((choice) => choice.value));
                    const missing = wanted.filter((val) => !known.has(val)).map((val) => ({ value: val, label: val }));
                    if (missing.length) {
                        // The stored value may point at an object the source does not offer — on an
                        // update form it often references something outside the candidate set. Carry
                        // it as its own option so the control can always represent what is saved.
                        console.log(`merging ${missing.length} value(s) not offered by the data source`, missing);
                        selectInstances[id].setChoices(missing, 'value', 'label', false);
                    }
                    console.log(`selecting ${wanted.length} value(s) from ${existing.length + missing.length} option(s)`);
                    selectInstances[id].setChoiceByValue(wanted);
                } else {
                    console.log('no choices found and replace requested, adding new choices');
                    const choices = wanted.map((val) => ({ value: val, label: val }));
                    console.log('choices', choices);
                    selectInstances[id].setChoices(choices, 'value', 'label', replaceItems);
                }
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
          // ⚠️ This used to pass `keyNameInOptionList` twice and `labelNameInOptionList` third, but
          // `addOptionsToSelect` takes five arguments — so the label name was silently dropped and
          // every data-source option was labelled with its key. That is why authored
          // `labelNameInOptionList` values appeared to have no effect (alpha-launch decision 0011).
          ns.addOptionsToSelect($component, defaultSelectedOptions, optionsList, componentConfig.keyNameInOptionList, componentConfig.labelNameInOptionList);
          console.log($component.html());
          console.log("loaded options");

          console.log("init choices");

          // Render rich rows only when the data source actually supplies them, so every existing
          // data-source select keeps exactly its current appearance (alpha-launch decision 0011).
          const hasRichRows = optionsList.some((option) => option && (option.icon_url || option.heading || option.description));
          const choicesConfig = {
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
              // docs/issues/0156 — render the empty first row as a placeholder rather than as a
              // selected (and therefore submitted) value. The text comes from the authored
              // `placeholder` attribute, so no wording is invented in this generic component.
              placeholder: true,
              placeholderValue: $component.attr('placeholder') || '',
          };
          if (hasRichRows) {
              console.log("data source supplies icon/heading/description - using rich option rows");
              choicesConfig.callbackOnCreateTemplates = ns.richChoiceTemplates;
          }
          selectInstances[componentConfig.id] = new Choices($component.get(0), choicesConfig);

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
              // docs/issues/0156 — same placeholder handling as the data-source branch above.
              placeholder: true,
              placeholderValue: $component.attr('placeholder') || '',
          });

          console.log("add event listener");
          ns.addEventListener($component, componentConfig);
          console.log("event listener added");
  
          console.groupEnd();
        }

        
    }

})(jQuery,  Typerefinery.Components.Forms.Select, Typerefinery.Components, Typerefinery.Components.Forms.Select.Instances, Typerefinery.Page.Events, Choices, window, document);
