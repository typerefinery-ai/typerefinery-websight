window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.VueData = Typerefinery.VueData || {};

(function ($, ns, vueDataNs, document, window) {
    "use strict";

    ns.findExclude = function($component, selector, mask) {
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
    ns.replaceRegex = (str, obj) => {
        return str.replace(/{{(\w+)}}/gm, function(match, key) {
            if (!obj.hasOwnProperty(key)) {
              console.warn(`replaceRegex: ${key} is not defined in the data object, ignoring...`);
            }
            return obj[key] || "";
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
        setTimeout(() => {
            $("[component]").each(function () { 
                const componentConfig = ns.getComponentConfig(this);
                if (componentConfig.flowapi_enable && componentConfig.flowapi_enable == true && componentConfig.flowapi_editurl) {
                    const $component = this;
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
                    const $component = this;
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
            });
        }, 1000);
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
          callbackFn($(elements[i]));
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
              var nodesArray = [].slice.call(mutation.addedNodes);
              if (nodesArray.length > 0) {
                  nodesArray.forEach(function(addedNode) {
                      if (addedNode.querySelectorAll) {
                          var elementsArray = [].slice.call(addedNode.querySelectorAll(selector));
                          elementsArray.forEach(function(element) {
                            console.log("new element", selector);
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
    
      console.group("onDocumentReady for " + selector);

      ns.initComponentBySelector(selector, callbackFn);
      ns.observeDOMForSelector(selector, callbackFn);

      console.groupEnd();

    }

    ns.watchDOMForComponent = (selector, callbackFn) => {
      if (document.readyState !== "loading") {
          ns.onDocumentReady(selector, callbackFn);
      } else {
          document.addEventListener("DOMContentLoaded", ns.onDocumentReady(selector, callbackFn));
      }
    }

    ns.init();
})(jQuery, window.Typerefinery.Components, window.Typerefinery.VueData, document, window);
