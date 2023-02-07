window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Charts = Typerefinery.Components.Widgets.Charts || {};
window.Typerefinery.Components.Widgets.Charts.Variants = Typerefinery.Components.Widgets.Charts.Variants || {};

(function (ns, componentNs, variantNs, document, window) {
  "use strict";

  ns.renderChart = ($component) => {
    
  }

  ns.dataReceived = (data, $component) => {
    // parse json value from data-model attribute as component config.
    const componentConfig = componentNs.getComponentConfig($component);
   
    // switch case for chart variants.
    switch (componentConfig.chartVariant) {
      case "barChart":
        variantNs?.BarChart?.dataReceived(data, $component);
        break;
      case "pieChart":
        variantNs?.PieChart?.dataReceived(data, $component);
        break;
      default:
        variantNs?.LineChart?.dataReceived(data, $component);
    }
  };

  ns.init = ($component) => { 
    // parse json value from data-model attribute as component config.
    const componentConfig = componentNs.getComponentConfig($component);
   
    // switch case for chart variants.
    switch (componentConfig.chartVariant) {
      case "barChart":
        variantNs?.BarChart?.init($component);
        break;
      case "pieChart":
        variantNs?.PieChart?.init($component);
        break;
      default:
        variantNs?.LineChart?.init($component);
    }
  };
})(Typerefinery.Components.Widgets.Charts, Typerefinery.Components, Typerefinery.Components.Widgets.Charts.Variants, document, window);

