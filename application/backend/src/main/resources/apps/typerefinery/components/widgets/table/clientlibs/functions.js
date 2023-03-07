window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Table = Typerefinery.Components.Widgets.Table || {};
window.Typerefinery.Page = Typerefinery.Page || {}; 
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};

(function (ns, tmsNs, componentNs, document, window) {
    "use strict";

    ns.defaultData = {
        columns: ["Name", "Age", "Email",  "Phone Number", "Location"],
        data: [
            ["John", 25, "john@gmail.com", "91934399421", "India"],
            ["Mark", 34, "mark@gmail.com", "67734283123", "Australia"],
            ["Peter", 29, "peter@gmail.com", "67734283123", "Australia"],
            ["Murphy", 31, "murphy12@gmail.com", "5546546453", "Australia"],
            ["Curran", 24, "curran15@gmail.com", "565465464", "Australia"],
            ["Ben", 25, "ben10@gmail.com", "7434343447", "England"],
            ["Stokes", 23, "stokes41@gmail.com", "434234645", "England"],
            ["Nabil", 26, "nabil12@gmail.com", "566677442", "Australia"],
            ["John", 25, "john@gmail.com", "91934399421", "India"],
            ["Mark", 34, "mark@gmail.com", "67734283123", "Australia"],
            ["Peter", 29, "peter@gmail.com", "67734283123", "Australia"],
            ["Murphy", 31, "murphy12@gmail.com", "5546546453", "Australia"],
            ["Curran", 24, "curran15@gmail.com", "565465464", "Australia"],
            ["Ben", 25, "ben10@gmail.com", "7434343447", "England"]
        ],
        sort: true,
        search: true,
        pagination: true,
        resizable: true,
    };

    ns.updateComponentHTML = (id, data, $component) => {
        if (!$component) {
            return;
        }
        if(!data?.columns || !data?.data) {
            data = ns.defaultData;
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
            if (!topic || !host) {
                ns.modelDataConnected($component);
                return;
            }
            
            let componentConfig = componentNs.getComponentConfig($component);
            tmsNs.registerToTms(host, topic, componentConfig.resourcePath, (data) => ns.callbackFn(data, $component));
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

    ns.callbackFn = (data, $component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        ns.updateComponentHTML(componentConfig.websocketTopic, data, $component);
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
            $component.setAttribute("id", componentTopic);
            ns.tmsConnected(componentHost, componentTopic, $component);
        }
        // JSON
        else if (componentDataSource) {
            ns.jsonConnected(componentDataSource, componentConfig.id, $component);
        }
        // MODEL 
        else {
            ns.modelDataConnected(componentConfig.id, $component);
        }
    }

})(Typerefinery.Components.Widgets.Table, Typerefinery.Page.Tms, Typerefinery.Components, document, window);
