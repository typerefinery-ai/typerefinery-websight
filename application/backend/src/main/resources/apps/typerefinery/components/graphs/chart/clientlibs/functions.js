window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Graphs = Typerefinery.Components.Graphs || {};
window.Typerefinery.Components.Graphs.Chart = Typerefinery.Components.Graphs.Chart || {};
window.Typerefinery.Components.Graphs.Chart.Varients =
  Typerefinery.Components.Graphs.Chart.Varients || {};
window.Typerefinery.Components.Graphs.Chart.Varients.LineChart =
  Typerefinery.Components.Chart.Varients.LineChart || {};

(function (ns, componentNs) {
  "use strict";

  ns.init = ($component) => {
    // parse json value from data-model attribute as component config
    const componentConfig = componentNs.getComponentConfig($component);

    switch (componentConfig.chartVarient) {
      case "barChartVertical":
        ns?.LineChart?.init();
        break;
      case "barChartHorizontal":
        ns?.LineChart?.init();
        break;
      default:
        ns?.LineChart?.init($component);
    }
  };
})(window.Typerefinery.Components.Graphs.Chart, document, window);
