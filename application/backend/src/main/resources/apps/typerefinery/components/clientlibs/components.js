window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.VueData = Typerefinery.VueData || {};

; (function (ns, vueDataNs, document, window) {
    "use strict";
    ns.registerComponent = (componentData) => {
        vueDataNs = {
            ...vueDataNs,
            componentData
        }
    };
    ns.getComponentConfig = ($component) => {
        const lineChartDefaultData = JSON.stringify({
            resourcePath: $component.getAttribute("data-resource-path") || "/content/typerefinery-showcase/pages/components/widgets/ticker/jcr:content/rootcontainer/maincontainer/pagesection1/linechart",
            dataSource: "",
            websocketHost: "ws://localhost:8112/$tms",
            websocketTopic: "linechartdata1"
        });
        return JSON.parse($component.getAttribute('data-model') || lineChartDefaultData);
    };
})(window.Typerefinery.Components, window.Typerefinery.VueData, document, window);