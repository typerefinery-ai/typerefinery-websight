window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Ticker = Typerefinery.Components.Widgets.Ticker || {};
window.Typerefinery.Components.Widgets.Ticker.Variants = Typerefinery.Components.Widgets.Ticker.Variants || {};
window.Typerefinery.Components.Widgets.Ticker.Variants.SecondaryTicker = Typerefinery.Components.Widgets.Ticker.Variants.SecondaryTicker || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};


(function (ns, tmsNs, componentNs, themeNs, document, window) {
    "use strict";

    ns.updateComponentHTML = (data, $component) => {
      if (!$component) {
        console.log(
          "[smallticker/clientlibs/functions.js] component does not exist"
        );
        return;
      }
      const componentConfig = componentNs.getComponentConfig($component);
      const innerHTML = `
          <div class="smallticker ${data.backGroundClass || componentConfig.backGroundClass}">
            <div>
              <div class="ticker-value">${data.value || componentConfig.value}</div>
              <div class="ticker-title">${data.title || componentConfig.title}</div>
            </div>
        </div>
              `;
      $component.innerHTML = innerHTML;
    };
  
    ns.jsonConnected = async (dataSourceURL, $component) => {
      try {
        const response = await fetch(dataSourceURL).then((res) => res.json());
        if (response) {
          ns.updateComponentHTML(response, $component);
          return;
        }
        ns.modelDataConnected($component);
      } catch (error) {
        ns.modelDataConnected($component);
      }
    };
  
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
      } catch (error) {
        ns.modelDataConnected($component);
      }
    };
  
    ns.modelDataConnected = ($component) => {
      // Passing {} because, The values from the model obj are fetched in bellow function definition.
      ns.updateComponentHTML({}, $component);
    };
    ns.callbackFn = (data, $component) => {
        let componentConfig = componentNs.getComponentConfig($component);
        ns.updateComponentHTML(data, document.getElementById(`${componentConfig.resourcePath}-${componentConfig.websocketTopic}`))
    }  
    ns.init = ($component) => {
      // parse json value from data-model attribute as component config
      const componentConfig = componentNs.getComponentConfig($component);
      const componentTopic = componentConfig.websocketTopic;
      const componentHost = componentConfig.websocketHost;
      const componentDataSource = componentConfig.dataSource
      const componentPath = componentConfig.resourcePath;
      
      // TMS.
      if (componentHost && componentTopic) {
        $component.setAttribute("id", `${componentPath}-${componentTopic}`);
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
    };
})(Typerefinery.Components.Widgets.Ticker.Variants.SecondaryTicker,Typerefinery.Page.Tms, Typerefinery.Components, Typerefinery.Page.Theme, document, window);
