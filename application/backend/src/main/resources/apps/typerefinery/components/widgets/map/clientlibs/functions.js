window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Map = Typerefinery.Components.Widgets.Map || {};
window.Typerefinery.Components.Widgets.Map.LeafletMap = Typerefinery.Components.Widgets.Map.LeafletMap || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};
; (function (ns, componentNs,tmsNs,leafletMap,window, document) {
    "use strict";
    ns.updateComponentHTML = (data, $component) => {
        if (!$component) {
            console.log('[LeafletMap/clientlibs/functions.js] component does not exist')
            return;
        }
        const componentConfig = componentNs.getComponentConfig($component);
        var map = leafletMap.map(`${componentConfig.id}`).setView([componentConfig.mapLat || data.mapLat, componentConfig.mapLng || data.mapLng], componentConfig.zoomLevel || data.zoomLevel);
        // Create a Tile Layer and add it to the map
        var tiles = new leafletMap.tileLayer(`${componentConfig.tileTemplate}` || `${data.tileTemplate}`, {
            attribution: `&copy; <a href=${componentConfig.copyRightUrl}` || `${data.copyRightUrl}>OpenStreetMap</a> contributors`,
            minZoom: `${componentConfig.layerZoom}` || `${data.layerZoom}`
        }).addTo(map);
        const markerDetails = data.markers || componentConfig.markerList || []
        ns.addMarker(markerDetails, map)
    }
    ns.addMarker = (markerDetails, map) => {
        markerDetails.forEach(marker => {
            leafletMap.marker(
                [marker.markerLat, marker.markerLng]).addTo(map).bindPopup(marker.popupText).openPopup();
        })
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
})(window.Typerefinery.Components.Widgets.Map.LeafletMap,
     window.Typerefinery.Components,window.Typerefinery.Page.Tms,L,window, document);