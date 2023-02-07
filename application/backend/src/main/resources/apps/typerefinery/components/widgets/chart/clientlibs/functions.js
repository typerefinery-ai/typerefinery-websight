window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Charts = Typerefinery.Components.Widgets.Charts || {};
window.Typerefinery.Components.Widgets.Charts.Variants = Typerefinery.Components.Widgets.Charts.Variants || {};

(function (ns, componentNs, document, window) {
  "use strict";
  ns.init = ($component) => {
    // parse json value from data-model attribute as component config
    const componentConfig = componentNs.getComponentConfig($component);
    console.log("init chart", componentConfig);
    switch (componentConfig.chartVariant) {
      default:
        ns?.LineChart?.init($component);
    }
  };
})(Typerefinery.Components.Widgets.Charts, Typerefinery.Components, document, window);

