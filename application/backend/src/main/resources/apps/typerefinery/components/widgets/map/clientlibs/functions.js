window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Map = Typerefinery.Components.Widgets.Map || {};
window.Typerefinery.Components.Widgets.Map.LeafletMap = Typerefinery.Components.Widgets.Map.LeafletMap || {};
window.Typerefinery.Components.Widgets.Map.Instances = Typerefinery.Components.Widgets.Map.Instances || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};
(function ($, ns, componentNs, tmsNs, leafletMap, mapInstanceNs, window, document) {
    "use strict";

    ns.selectorComponent = "[component='map']";

    ns.updateComponentHTML = (data, $component) => {
        if (!$component) {
            console.log('[LeafletMap/clientlibs/functions.js] component does not exist')
            return;
        }
        const componentConfig = componentNs.getComponentConfig($component);
        var map = leafletMap.map(`${componentConfig.id}`).setView([componentConfig.mapLat || data.mapLat, componentConfig.mapLng || data.mapLng], componentConfig.zoomLevel || data.zoomLevel);
        // Create a Tile Layer and add it to the map
        leafletMap.tileLayer(`${componentConfig.tileTemplate}` || `${data.tileTemplate}`,
            {
                attribution: `&copy; <a href=${componentConfig.copyRightUrl}` || `${data.copyRightUrl}>OpenStreetMap</a> contributors`, minZoom: `${componentConfig.layerZoom}` || `${data.layerZoom}`
            }).addTo(map);
        mapInstanceNs[componentConfig.id] = map
        const markerDetails = data.markers || componentConfig.markerList || []
        ns.addMarker(markerDetails, map)

    }
    //For adding marker layer on the map
    ns.addMarker = (markerDetails, map) => {
        // layerGroup.clearLayers();
        markerDetails.forEach(marker => {
            leafletMap.marker(
                [marker.markerLat, marker.markerLng]).addTo(map).bindPopup(marker.popupText).openPopup();
        })
    }

    /**
     * @param onFailure optional fallback invoked when the fetch cannot produce a payload.
     *   docs/issues/0163 passes a cached-payload renderer here so an unreachable endpoint degrades
     *   to the last known payload rather than to the model default.
     */
    ns.jsonConnected = async (dataSourceURL, $component, onFailure) => {
        const fail = (why) => {
            if (typeof onFailure === "function") {
                console.warn(["map dataSource unavailable; falling back", dataSourceURL, why]);
                onFailure();
                return;
            }
            ns.modelDataConnected($component);
        };
        try {
            const response = await fetch(dataSourceURL).then((res) => res.json());
            if (response) {
                ns.updateComponentHTML(response, $component);
                return;
            }
            fail("empty body");
        }
        catch (error) {
            fail(String((error && error.message) || error));
        }
    }

    ns.tmsConnected = async (host, topic, $component) => {
        try {
            if (!topic || !host) {
                ns.modelDataConnected($component);
                return;
            }
            let componentConfig = componentNs.getComponentConfig($component);
            tmsNs.registerToTms(host, topic, componentConfig.resourcePath, (data) => ns.updateMapInstance(data, $component));
            const componentData = localStorage.getItem(`${topic}`);

            // ⚠️ docs/issues/0163 (0152's class): the cached payload used to win outright — a key
            // cached by ANY earlier session rendered unconditionally, with no freshness check, and
            // nothing publishes on page load so the live TMS subscription never corrected it. When
            // a cold-start route is configured it is AUTHORITATIVE on load; the cache is demoted to
            // the fallback for when that fetch cannot answer. Same pattern as table@0af13e67.
            const componentDataSource = componentConfig.coldStartDataSource;
            if (componentDataSource) {
                console.log(["map load: fetching authoritative payload", componentConfig.id, topic,
                    "coldStartDataSource:", componentDataSource,
                    componentData ? "(cached payload held in reserve)" : "(no cached payload)"]);
                ns.jsonConnected(componentDataSource, $component,
                    componentData
                        ? () => ns.cachedPayloadConnected(componentData, topic, $component)
                        : undefined);
                return;
            }
            // No live route configured — the cache is all there is.
            if (componentData) {
                ns.cachedPayloadConnected(componentData, topic, $component);
                return;
            }
            ns.modelDataConnected($component);
        }
        catch (error) {
            ns.modelDataConnected($component);
        }
    }

    /**
     * Render a payload previously cached in localStorage under the TMS topic. It has no freshness
     * information of any kind, so it may be arbitrarily old — the log line says so explicitly
     * (docs/issues/0163; same contract as table's cachedPayloadConnected).
     */
    ns.cachedPayloadConnected = (componentData, topic, $component) => {
        try {
            console.warn(["map rendering CACHED payload of unknown age", topic, `${componentData.length} bytes`]);
            ns.updateComponentHTML(JSON.parse(componentData), $component);
        }
        catch (error) {
            console.error(["map cached payload is unreadable; discarding", topic, error]);
            ns.modelDataConnected($component);
        }
    }
    //update map after tms connected
    ns.updateMapInstance = (data, $component) => {
        let componentConfig = componentNs.getComponentConfig($component);
        const map = mapInstanceNs[componentConfig.id]
        map.eachLayer((layer)=>{
                if (layer instanceof leafletMap.Marker){
                    map.removeLayer(layer)
                }                
        })
        if(data.mapLat && data.mapLng && data.zoomLevel){
            map.setView([data.mapLat, data.mapLng ], data.zoomLevel);
        }
        const markerDetails=data.markers
        if(markerDetails.length>0){
            ns.addMarker(markerDetails, map)
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
})(jQuery, window.Typerefinery.Components.Widgets.Map.LeafletMap, window.Typerefinery.Components, window.Typerefinery.Page.Tms, L, window.Typerefinery.Components.Widgets.Map.Instances, window, document);
