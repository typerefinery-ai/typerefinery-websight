window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Table = Typerefinery.Components.Widgets.Table || {};

; (function (ns, typerefineryNs, componentNs, window, document) {
    "use strict";

    ns.updateComponentHTML = (id, data, $component) => {
        if (!$component) {
            console.log('[Table/clientlibs/functions.js] component does not exist')
            return;
        }
        const componentConfig = componentNs.getComponentConfig($component);
        $(`#${id}`).Grid({
            sort: true,
            columns: ["Name", "Age", "Email"],
            data: [
              ["John", 25, "john@k.com"],
              ["Mark", 59, "mark@e.com"]
            ]
          });
    }

    ns.jsonConnected = async (dataSourceURL, $component) => {
        try {
            const response = await fetch(dataSourceURL).then((res) => res.json());
            if (response) {
                ns.updateComponentHTML(dataSourceURL, response, $component);
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
            host = host || "ws://localhost:8112";
            typerefineryNs.hostAdded(host);
            if (!topic) {
                ns.modelDataConnected($component);
                return;
            }
            const componentData = localStorage.getItem(`${topic}`);
            if (!componentData) {
                ns.modelDataConnected($component);
                return;
            }
            ns.updateComponentHTML(topic, JSON.parse(componentData), $component);
        }
        catch (error) {
            ns.modelDataConnected($component);
        }
    }

    ns.modelDataConnected = ($component) => {
        // Passing {} because, The values from the model obj are fetched in bellow function definition.
        ns.updateComponentHTML($component.getAttribute(`id`), {}, $component);
    }

    ns.dataReceived = (data, $component) => {
        // Passing {} because, The values from the model obj are fetched in bellow function definition.
        ns.updateComponentHTML($component.getAttribute(`id`), data, $component);
    }

    ns.init = ($component) => {
        // parse json value from data-model attribute as component config
        const componentConfig = componentNs.getComponentConfig($component);
        const componentTopic = componentConfig?.websocketTopic;
        const componentHost = componentConfig.websocketHost;
        const componentDataSource = componentConfig.dataSource;
        const componentPath = componentConfig.resourcePath;

        console.log("[Table - functions.js] - Table Component");
        // TMS.
        if (componentHost && componentTopic) {
            $component.setAttribute("id", componentTopic);
            ns.tmsConnected(componentHost, componentTopic, $component);
        }
        // JSON
        else if (componentDataSource) {
            $component.setAttribute("id", componentDataSource);
            ns.jsonConnected(componentDataSource, $component);
        }
        // MODEL 
        else {
            $component.setAttribute("id", componentPath);
            ns.modelDataConnected($component);
        }
    }

})(window.Typerefinery.Components.Widgets.Table, window.Typerefinery, window.Typerefinery.Components, window, document);
