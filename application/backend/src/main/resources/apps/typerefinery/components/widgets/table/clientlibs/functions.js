window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Table = Typerefinery.Components.Widgets.Table || {};
window.Typerefinery.Page = Typerefinery.Page || {}; 
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};

const DEFAULT_TABLE_DATA = {
    columns: ["Name", "Age", "Email",  "Phone Number", "Location"],
    data: [
        ["John", 25, "john@gmail.com", "91934399421", "India"],
        ["Mark", 34, "mark@gmail.com", "67734283123", "Australia"],
        ["Peter", 29, "peter@gmail.com", "67734283123", "Australia"],
        ["Murphy", 31, "murphy12@gmail.com", "5546546453", "Australia"],
        ["Curran", 24, "curran15@gmail.com", "565465464", "Australia"],
        ["Ben", 25, "ben10@gmail.com", "7434343447", "England"],
        ["Stokes", 23, "stokes41@gmail.com", "434234645", "England"],
        ["Nabil", 26, "nabil12@gmail.com", "566677442", "Australia"]
    ],
    sort: false,
    search: false
};

(function (ns, tmsNs, componentNs, DEFAULT_TABLE_DATA, document, window) {
    "use strict";

    ns.updateComponentHTML = (id, data, $component) => {
        if (!$component) {
            return;
        }
        if(!data?.columns || !data?.data) {
            data = DEFAULT_TABLE_DATA;
        }
        $(`#${id}`).empty();
        $(`#${id}`).Grid({
            ...data,
            className: {
                td: 'table-td-class',
                table: 'custom-table-class' 
              }
        });
    }

    ns.jsonConnected = async (dataSourceURL, componentPath, $component) => {
        try {
            
            const response = await fetch(dataSourceURL).then((res) => res.json());
            if (response) {
                ns.updateComponentHTML(componentPath, response, $component);
                return;
            }
            ns.modelDataConnected(componentPath, $component);
        }
        catch (error) {
            ns.modelDataConnected(componentPath, $component);
        }
    }

    ns.tmsConnected = async (host, topic, $component) => {
        try {
            host = host || "ws://localhost:8112/$tms";
            tmsNs.hostAdded(host);
            if (!topic) {
                ns.modelDataConnected($component);
                return;
            }
            let componentConfig = componentNs.getComponentConfig($component);
            tmsNs.registerToTms(componentConfig.resourcePath, ns.dataReceived);
            const componentData = localStorage.getItem(`${topic}`);
            if (!componentData) {
                ns.modelDataConnected(topic, $component);
                return;
            }
            ns.updateComponentHTML(topic, JSON.parse(componentData), $component);
        }
        catch (error) {
            ns.modelDataConnected(topic, $component);
        }
    }

    ns.modelDataConnected = (id, $component) => {
        ns.updateComponentHTML(id, {}, $component);
    }

    ns.dataReceived = (data, $component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        ns.updateComponentHTML(componentConfig.websocketTopic, data, $component);
    }

    ns.init = ($component) => {
        // parse json value from data-model attribute as component config
        const componentConfig = componentNs.getComponentConfig($component);
        const componentTopic = componentConfig?.websocketTopic;
        const componentHost = componentConfig.websocketHost;
        const componentDataSource = componentConfig.dataSource;
        const componentPath = componentConfig.resourcePatj;

        // TMS.
        if (componentHost && componentTopic) {
            $component.setAttribute("id", componentTopic);
            ns.tmsConnected(componentHost, componentTopic, $component);
        }
        // JSON
        else if (componentDataSource) {
            $component.setAttribute("id", componentPath);
            ns.jsonConnected(componentDataSource, componentPath, $component);
        }
        // MODEL 
        else {
            $component.setAttribute("id", componentPath);
            ns.modelDataConnected(componentPath, $component);
        }
    }

})(Typerefinery.Components.Widgets.Table, Typerefinery.Page.Tms, Typerefinery.Components, DEFAULT_TABLE_DATA, document, window);
