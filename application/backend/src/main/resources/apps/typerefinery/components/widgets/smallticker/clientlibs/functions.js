window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.SmallTicker =
  Typerefinery.Components.Widgets.SmallTicker || {};

(function (ns, componentNs,typerefineryNs, window, document) {
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
        <div class="smallticker">
        <div class="columnticker" style="background-color:${
          data.bgColor || componentConfig.bgColor
        }">
          <div>
            <div class="ticker-value" style="color:${
              data.textColor || componentConfig.textColor
            }">${data.value || componentConfig.value}</div>
            <div class="ticker-title" style="color:${
              data.textColor || componentConfig.textColor
            }">${data.title || componentConfig.title}</div>
          </div>
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
      host = host || "ws://localhost:8112";
      typerefineryNs.hostAdded(host);
      if (!topic) {
        ns.modelDataConnected($component);
        return;
      }
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

  ns.dataReceived = (data, $component) => {
    // Passing {} because, The values from the model obj are fetched in bellow function definition.
    ns.updateComponentHTML(data, $component);
  };

  ns.init = ($component) => {
    // parse json value from data-model attribute as component config
    const componentConfig = componentNs.getComponentConfig($component);
    const componentTopic = componentConfig.websocketTopic;
    const componentHost = componentConfig.websocketHost;
    const componentDataSource = componentConfig.dataSource
    
    // TMS.
    if (componentHost && componentTopic) {
      $component.setAttribute("id", componentTopic);
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
})(
  window.Typerefinery.Components.Widgets.SmallTicker,
  window.Typerefinery.Components,
  window.Typerefinery,
  window,
  document
);
