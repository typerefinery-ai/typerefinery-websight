window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.LeafletMap = Typerefinery.Components.Widgets.LeafletMap || {};

const DEFAULT_MAP_DATA = polyJson;

; (function (ns, typerefineryNs, componentNs, DEFAULT_MAP_DATA, L, window, document) {
    "use strict";

    ns.updateComponentHTML = (data, $component) => {
        if (!$component) {
            console.log('[LeafletMap/clientlibs/functions.js] component does not exist')
            return;
        }
        const componentConfig = componentNs.getComponentConfig($component);
        let leafletMapComponent =  L.map('leafletMap').setView([9.145, 40.4897], 2);
        // Polygon Layer over map.
        data.forEach(itr => {
            L.geoJSON(itr.coordinates, {
                style: itr.style,
            }).addTo(leafletMapComponent);
        });

        L.tileLayer(
            "https://api.maptiler.com/maps/bright-v2/256/{z}/{x}/{y}.png?key=WTh8FTa6cT027rlVBBbG",
            {
              maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(leafletMapComponent);
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
            ns.updateComponentHTML(JSON.parse(componentData), $component);
        }
        catch (error) {
            ns.modelDataConnected($component);
        }
    }

    ns.modelDataConnected = ($component) => {
        ns.updateComponentHTML(DEFAULT_MAP_DATA, $component);
    }

    ns.dataReceived = (data, $component) => {
        // Passing {} because, The values from the model obj are fetched in bellow function definition.
        ns.updateComponentHTML(data, $component);
    }

    ns.init = ($component) => {
        // TODO: Everything must be completed once polygson is completed.
        // parse json value from data-model attribute as component config
        const componentConfig = componentNs.getComponentConfig($component);
        const componentTopic = componentConfig?.websocketTopic;
        const componentHost = componentConfig.websocketHost;
        const componentDataSource = componentConfig.dataSource;
        

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
            ns.modelDataConnected($component);
        }
    }

})(window.Typerefinery.Components.Widgets.LeafletMap, window.Typerefinery, window.Typerefinery.Components, DEFAULT_MAP_DATA,L, window, document);
