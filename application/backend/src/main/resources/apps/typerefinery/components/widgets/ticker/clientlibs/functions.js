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

        //TODO: add Handlebars to namesapce signature
        const handlebarTemplate = Handlebars.compile(htmlTemplate);
        // merge all the objects.
        $component.innerHTML = handlebarTemplate({ ...defaultData, ...defaultConfigData, ...data });
    }

    /**
     * @param onFailure optional fallback invoked when the fetch cannot produce a payload.
     *   docs/issues/0163 passes a cached-payload renderer here so an unreachable endpoint degrades
     *   to the last known payload rather than to the model default.
     */
    ns.jsonConnected = async (dataSourceURL, $component, onFailure) => {
        const fail = (why) => {
            if (typeof onFailure === "function") {
                console.warn(["ticker dataSource unavailable; falling back", dataSourceURL, why]);
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
            tmsNs.registerToTms(host, topic, componentConfig.resourcePath, (data) => ns.callbackFn(data, $component));
            const componentData = localStorage.getItem(`${topic}`);

            // ⚠️ docs/issues/0163 (0152's class): the cached payload used to win outright — a key
            // cached by ANY earlier session rendered unconditionally, with no freshness check, and
            // nothing publishes on page load so the live TMS subscription never corrected it. When
            // a cold-start route is configured it is AUTHORITATIVE on load; the cache is demoted to
            // the fallback for when that fetch cannot answer. Same pattern as table@0af13e67.
            const componentDataSource = componentConfig.coldStartDataSource;
            if (componentDataSource) {
                console.log(["ticker load: fetching authoritative payload", componentConfig.id, topic,
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
            console.warn(["ticker rendering CACHED payload of unknown age", topic, `${componentData.length} bytes`]);
            ns.updateComponentHTML(JSON.parse(componentData), $component);
        }
        catch (error) {
            console.error(["ticker cached payload is unreadable; discarding", topic, error]);
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
