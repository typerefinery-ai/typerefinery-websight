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
    ns.fireballSvg = `
        <img id="flowEnabledFireBallSvg" style="width:25px" src="https://freesvg.org/img/fireball.png" />
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
                            href="${componentConfig.flowapi_editurl}" 
                            target="_blank" 
                            id="flowEnabledFireBallButton"
                        >
                            ${ns.fireballSvg}
                        </a>
                    `);
                  
                    $component.append($flowEnabledFireBallDiv[0]);
                }
            });
        }, 1000);
    };
    ns.init();
})(window.Typerefinery.Components, window.Typerefinery.VueData, document, window);
