window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.VueData = Typerefinery.VueData || {};

(function ($, ns, vueDataNs, document, window) {
    "use strict";

    ns.attributeInit = "data-init";
    ns.selectorAttributeInit = `[${ns.attributeInit}]`;
    ns.selectorComponent = "[component]";

    ns.registry = new Map();

    ns.findExclude = function($component, selector, mask) {
        if (mask == null || mask == undefined) {
            console.warn("findExclude: mask is not defined, ignoring...");
            return $component.find(selector).not($component.find(selector));
        }
        return $component.find(selector).not($component.find(mask).find(selector));
    }

    ns.registerComponent = (componentData) => {
        vueDataNs.data = {
            ...vueDataNs.data,
            ...componentData
        }
    };

    ns.isTrue = function(value) {
      // if undefined or null return false
      if (value == null) {
        return false;
      }
      return new Boolean(value) == true;
    };

    ns.isJQuery = function(obj) {
      //test if object is a jQuery object
      return obj instanceof $ || (typeof obj === "object" && obj != null && obj.jquery != null);
    };
    ns.getComponentConfig = ($component) => {
      if (ns.isJQuery($component)) {
        return $component.data('model') || {};
      }
      return $($component).data('model') || {};
    };
    ns.hasRegex = (str) => {
        return str.match(/{{(\w+)}}/gm);
    };      
    ns.replaceRegex = (str, obj, debug) => {
        //find any {{key}} in the string and replace with value from obj
        return str.replace(/{{(.*?)}}/gm, function(match, key) {
          //get key value using json path from obj
          // if (!obj.hasOwnProperty(key)) {
          // console.warn(`replaceRegex: ${key} is not defined in the data object, ignoring...`);
          let jpName = "$." + key;
          if (debug) {
            console.log("find key in object using json path", match, key, jpName, obj);
          }
          let value = ns.jsonPath(obj, jpName);
          // return first value if found
          if (value.length > 0) {
            return value[0];
          }  
          // return empty string if not found
          return "";
          // }
          // return obj[key] || "";
        });
    };
    ns.queryToObject = (query) => {
        const result = {};
        query.split("&").forEach((param) => {
            const [key, value] = param.split("=");
            result[key] = value;
        });
        return result;
    };
    ns.objectToQuery = (obj) => {
        return Object.keys(obj).map(key => key + '=' + obj[key]).join('&');
    };
    ns.getQueryParams = () => {
        const query = window.location.search.substring(1);
        return ns.queryToObject(query);
    };
    ns.lightningCharge = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-lightning-charge" viewBox="0 0 16 16">
            <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09zM4.157 8.5H7a.5.5 0 0 1 .478.647L6.11 13.59l5.732-6.09H9a.5.5 0 0 1-.478-.647L9.89 2.41 4.157 8.5z"/>
        </svg>
    `;
    ns.lightningChargeFill = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-lightning-charge-fill" viewBox="0 0 16 16">
            <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"/>
        </svg>
    `;
    ns.init = () => {
        // namespace init
    };

    ns.initComponentActionIcons = ($component) => { 
        //TODO: this needs to be done with just a css class     
        // console.log("initComponentActionIcons", $component);  
        const componentConfig = ns.getComponentConfig($component);
        // console.log("componentConfig", componentConfig);
        // console.log("componentConfig.flowapi_enable", componentConfig.flowapi_enable);
        // console.log("componentConfig.flowapi_editurl", componentConfig.flowapi_editurl);
        if (componentConfig.flowapi_enable && componentConfig.flowapi_enable == true && componentConfig.flowapi_editurl) {
            const $flowEnabledFireBallDiv = $('<div class="flow-enabled-fire-ball-container"></div>');
            $flowEnabledFireBallDiv.append(`
                <a 
                    class="flow-enabled-fire-ball-button lightening-icon-enabled" 
                    id="lightningIcon"
                    style="cursor:pointer"
                    href="${componentConfig.flowapi_editurl}" 
                    target="_blank" 
                >
                    ${ns.lightningChargeFill}
                </a>
            `);
            
            $component.append($flowEnabledFireBallDiv[0]);
        }else if(componentConfig && componentConfig.flowapi_enable == false){
            const $flowEnabledFireBallDiv = $('<div class="flow-enabled-fire-ball-container"></div>');
            $flowEnabledFireBallDiv.append(`
                <div
                    class="flow-enabled-fire-ball-button lightening-icon-disabled" 
                    id="lightningIcon"
                    data-bs-toggle="tooltip" data-bs-placement="top" title="Flow is not enabled"
                >
                    ${ns.lightningCharge}
                </div>
            `);
            
            $component.append($flowEnabledFireBallDiv[0]);
        }
    };

    //find all selectors and run callbackFn
    ns.initComponentBySelector = (selector, callbackFn) => {
        if ((selector == null || selector == undefined) || (callbackFn == null || callbackFn == undefined)) {
          console.error("initComponent: selector and callbackFn is required");
          return;
        }
        //init component on all found instances
        var elements = document.querySelectorAll(selector);
        for (var i = 0; i < elements.length; i++) {
            //set init attribute to true
            // console.log("initComponentBySelector", selector, elements[i]);
            ns.setInitAttribute(elements[i]);
            ns.initComponentActionIcons($(elements[i]));
            callbackFn($(elements[i]));
        }
    }

    ns.setInitAttribute = (node) => {
        node.setAttribute(ns.attributeInit, "true");
    }

    ns.isInitAttribute = (node) => {
        let initAttr = node.getAttribute(ns.attributeInit);
        if (initAttr == null || initAttr == undefined) {
            return false;
        } else {
            return initAttr === "true";
        }
    }

    //observe DOM for new instances of a selector and run callbackFn
    ns.observeDOMForSelector = (selector, callbackFn) => {

      if ((selector == null || selector == undefined) || (callbackFn == null || callbackFn == undefined)) {
        console.error("observeDOMForSelector: selector and callbackFn is required");
        return;
      }

      //observe DOM for future instances of a selector
      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
      var body = document.querySelector("body");
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // console.log("mutation", mutation);
            var nodesArray = [].slice.call(mutation.addedNodes);
            // console.log("nodesArray", nodesArray);
            if (nodesArray.length > 0) {
                nodesArray.forEach(function(addedNode) {
                    // check if current node matches selector
                    if (addedNode.matches && addedNode.matches(selector)) {
                        // console.log("addedNode - matches selector", selector, addedNode, ns.isInitAttribute(addedNode));
                        if (ns.isInitAttribute(addedNode)) {
                            // console.warn("addedNode - already initialized", selector);
                            return;
                        }
                        ns.setInitAttribute(addedNode);
                        ns.initComponentActionIcons($(addedNode));
                        callbackFn($(addedNode));
                    }

                    // search for selector in child nodes
                    if (addedNode.querySelectorAll) {
                        var elementsArray = [].slice.call(addedNode.querySelectorAll(selector));
                        elementsArray.forEach(function(element) {
                            // console.log("element - child node added", selector, ns.isInitAttribute(element));
                            if (ns.isInitAttribute(element)) {
                                // console.warn("element - already initialized", selector);
                                return;
                            }
                            ns.setInitAttribute(addedNode);
                            ns.initComponentActionIcons($(element));
                            callbackFn($(element));
                        });
                    }
                });
            }
        });
      });

      observer.observe(body, {
          subtree: true,
          childList: true,
          characterData: true
      });
    }

    ns.onDocumentReady = (selector, callbackFn) => {
      if ((selector == null || selector == undefined) || (callbackFn == null || callbackFn == undefined)) {
        console.error("onDocumentReady: selector and callbackFn is required");
        return;
      }
    
      const pagePath = window.location.pathname;

      console.groupCollapsed("onDocumentReady for " + selector + " on " + pagePath);

        console.groupCollapsed("initComponentBySelector", selector);
            ns.initComponentBySelector(selector, callbackFn);
        console.groupEnd();

        console.groupCollapsed("observeDOMForSelector", selector);
            ns.observeDOMForSelector(selector, callbackFn);
        console.groupEnd();

        console.log("onDocumentReady done");

      console.groupEnd();

    }

    ns.watchDOMForComponent = (selector, callbackFn) => {
        //add selector to registry
        ns.registry.set(selector, {
                selector: selector,
                callbackFn: callbackFn
            }
        );
        //check if document is ready or wait for it
        if (document.readyState !== "loading") {
            ns.onDocumentReady(selector, callbackFn);
        } else {
            document.addEventListener("DOMContentLoaded", ns.onDocumentReady(selector, callbackFn));
        }
    }

    ns.jsonPath = function(obj, expr, arg) {
      // if window has jsonPath function use it
      if (window.jsonPath) {
        return window.jsonPath(obj, expr, arg);
      } else {
        console.warn("jsonPath function not found, using fallback");
      }
    }

    // ns.init();
    ns.watchDOMForComponent(`${ns.selectorComponent}`, ns.init);

})(jQuery, window.Typerefinery.Components, window.Typerefinery.VueData, document, window);
