window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Ticker = Typerefinery.Components.Widgets.Ticker || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};


(function ($, ns, tmsNs, componentNs, themeNs, document, window) {
    "use strict";

    ns.selectorComponent = '[component=ticker]';

    ns.updateComponentHTML = (data, $component) => {
        if (!$component) {
            return;
        }
        const componentConfig = componentNs.getComponentConfig($component);

        // From modal list
        const defaultConfigData = {};
        
        componentConfig?.keyValueList?.forEach(keyValue => {
            defaultConfigData[keyValue.key] = keyValue.value
        });

        const defaultData = {
            "title": "Number of active users",
            "value": "25.5k",
            "indicatorValue": "4.54K",
            "indicatorType": "success",
            "tickerIcon": "pi pi-database ",
            "indicatorIcon": "pi pi-arrow-up",
            "widgetIcon": "pi pi-briefcase",
            "indicatorPrecisionValue": "Since last quarter"
        };

        const htmlTemplate = componentConfig.templateString || `
            <div class="shadow-sm">
                <div class="card-body d-flex flex-row align-items-center flex-0">
                    <div class="d-block">
                        <div class="h6 fw-normal text-gray mb-2">{{title}}</div>
                        <div class="d-flex">
                            <h2 class="h3 me-3">{{value}}</h2>
                            <div class="mt-2">
                                <span class="{{indicatorIcon}} text-{{indicatorType}}"></span>
                                <span class="text-{{indicatorType}} fw-bold">{{indicatorValue}}</span>
                            </div>
                        </div>
                    </div>
                    <div class="d-block ms-auto">
                        <i class="{{tickerIcon}}"></i>
                    </div>
                </div>
            </div>
        `;

        const handlebarTemplate = Handlebars.compile(htmlTemplate);
        // merge all the objects.
        $component.innerHTML = handlebarTemplate({ ...defaultData, ...defaultConfigData, ...data });
    }

    ns.jsonConnected = async (dataSourceURL, $component) => {
        try {
            const response = await fetch(dataSourceURL).then((res) => res.json());
            if (response) {
                ns.updateComponentHTML(response, $component);
                return;
            }
            ns.modelDataConnected($component);
        }
        catch (error) {
            ns.modelDataConnected($component);
        }
    }

    ns.tmsConnected = async (host, topic, $component) => {
        try {
            if (!topic || !host) {
                ns.modelDataConnected($component);
                return;
            }
            
            let componentConfig = componentNs.getComponentConfig($component);
            tmsNs.registerToTms(host, topic, componentConfig.resourcePath, (data) => ns.callbackFn(data, $component));
            const componentData = localStorage.getItem(`${topic}`);
            if (!componentData) {
                ns.modelDataConnected($component);
                return;
            }
            ns.updateComponentHTML(JSON.parse(componentData), $component);
        }
        catch (error) {
            ns.modelDataConnected($component);
        }
    }

    ns.modelDataConnected = ($component) => {
        ns.updateComponentHTML({}, $component);
    }

    ns.callbackFn = (data, $component) => {
        let componentConfig = componentNs.getComponentConfig($component);
        ns.updateComponentHTML(data, document.getElementById(`${componentConfig.resourcePath}-${componentConfig.websocketTopic}`))
    }

    ns.init = ($component) => {
        // parse json value from data-model attribute as component config
        const componentConfig = componentNs.getComponentConfig($component);
        const componentTopic = componentConfig?.websocketTopic;
        const componentHost = componentConfig.websocketHost;
        const componentDataSource = componentConfig.dataSource;
        const componentPath = componentConfig.resourcePath;
        // TMS.
        if (componentHost && componentTopic) { 
            $component.attr("id", `${componentPath}-${componentTopic}`);
            ns.tmsConnected(componentHost, componentTopic, $component);
        }
        // JSON
        else if (componentDataSource) {
            ns.jsonConnected(componentDataSource, $component);
        }
        // MODEL 
        else {
            ns.modelDataConnected($component);
        }
    }
})(jQuery, Typerefinery.Components.Widgets.Ticker, Typerefinery.Page.Tms, Typerefinery.Components, Typerefinery.Page.Theme, document, window);
