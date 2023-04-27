window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.VueData = Typerefinery.VueData || {};

; (function (ns, vueDataNs, document, window) {
    "use strict";
    ns.registerComponent = (componentData) => {
        vueDataNs.data = {
            ...vueDataNs.data,
            ...componentData
        }
    };
    ns.getComponentConfig = ($component) => {
      return $($component).data('model') || {};
    };
    ns.replaceRegex = (str, obj) => {
        return str.replace(/{{(\w+)}}/gm, function(match, key) {
            return obj[key];
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
                            class="flow-enabled-fire-ball-button" 
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
    ns.init();
})(window.Typerefinery.Components, window.Typerefinery.VueData, document, window);
