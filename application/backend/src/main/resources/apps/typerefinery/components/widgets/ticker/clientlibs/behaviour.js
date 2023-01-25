//this is the namespace for the functions for this component

; (function (document) {
    function init() {
        Array.from(document.querySelectorAll("#ticker")).forEach(($component) => {
            // parse json value from data-model attribute as component config
            const componentConfig = JSON.parse($component.getAttribute("data-model"));
            const componentTopic = componentConfig.websocketTopic;
            const componentHost = componentConfig.websocketHost;
            const componentDataSource = componentConfig.dataSource;

            console.log("[ticker - behavior.js] - Ticker Component");
            // TMS.
            if (componentHost && componentTopic) {
                $component.setAttribute("id", componentTopic);
                window.Typerefinery.Components.Widgets.Ticker.tmsConnected(componentHost, componentTopic, $component);
            }
            // JSON
            else if (componentDataSource) {
                window.Typerefinery.Components.Widgets.Ticker.jsonConnected(componentDataSource, $component);
            }
            // MODEL 
            else {
                window.Typerefinery.Components.Widgets.Ticker.modelDataConnected($component);
            }
        });
    }
    init();
})(document);
