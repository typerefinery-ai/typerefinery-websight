window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Ticker = Typerefinery.Components.Widgets.Ticker || {};

; (function (ns, componentNs, window, document) {
    "use strict";

    ns.updateComponentHTML = (data, $component) => {
        if (!$component) {
            console.log('[ticker/clientlibs/functions.js] component does not exist')
            return;
        }
        const componentConfig = componentNs.getComponentConfig($component);
        console.log(componentConfig, "componentConfig", data)
        const innerHTML = `
                <div class="body">
                    <div class="title">${data.title || componentConfig.title}</div>
                    <div class="content">
                        <div class="value">
                            ${data.value || componentConfig.value}
                        </div>
                        <div class="indicator">
                            <div class="icon pi pi-arrow-${data.indicatorType || componentConfig.indicatorType} ${data.indicatorType || componentConfig.indicatorType}"></div>
                            <div class="icon pi pi-minus ${data.indicatorType || componentConfig.indicatorType}"></div>
                            <div class="indicator_value">
                                <span>${data.indicatorValue || componentConfig.indicatorValue}</span>
                                <span class="hours">${data.indicatorValuePrecision || componentConfig.indicatorValuePrecision}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="icon ${data.icon || componentConfig.icon}"></div>
            `;
        $component.innerHTML = innerHTML;
    }

    ns.jsonDataConnected = async (dataSourceURL, $component) => {
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
            host = !host && "ws://localhost:8112";
            if (!topic) {
                ns.modelDataConnected($component);
                return;
            }
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
        // Passing {} because, The values from the model obj are fetched in bellow function definition.
        ns.updateComponentHTML({}, $component);
    }

    ns.dataReceived = (data, $component) => {
        // Passing {} because, The values from the model obj are fetched in bellow function definition.
        ns.updateComponentHTML(data, $component);
    }

    ns.init = ($component) => {
        // parse json value from data-model attribute as component config
        const componentConfig = componentNs.getComponentConfig($component);
        const componentTopic = componentConfig?.websocketTopic;
        const componentHost = componentConfig.websocketHost;
        const componentDataSource = componentConfig.dataSource;

        console.log("[ticker - functions.js] - Ticker Component");
        // TMS.
        if (componentHost && componentTopic) {
            $component.setAttribute("id", componentTopic);
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

})(window.Typerefinery.Components.Widgets.Ticker, window.Typerefinery.Components, window, document);
