window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Chart = Typerefinery.Components.Chart || {};
window.Typerefinery.Components.Chart.Varients =
  Typerefinery.Components.Chart.Varients || {};
window.Typerefinery.Components.Chart.Varients.LineChart =
  Typerefinery.Components.Chart.Varients.LineChart || {};

(function (ns, componentNs,document, window) {
  "use strict";

  console.log("data2", ns);

  ns.init = ($component) => {
    // parse json value from data-model attribute as component config
    const componentConfig = componentNs.getComponentConfig($component);

    switch (componentConfig.chartVarient) {
      // case "barChartVertical":
      //   ns?.LineChart?.init();
      //   break;
      // case "barChartHorizontal":
      //   ns?.LineChart?.init();
      //   break;
      default:
        ns?.LineChart?.init($component);
    }
  };
})(window.Typerefinery.Components.Chart.Varients,window.Typerefinery.Components,document, window );

console.log("data7", window.Typerefinery.Components.Chart.Varients);
