window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Content = Typerefinery.Components.Content || {};
Typerefinery.Components.Content.Embed = Typerefinery.Components.Content.Embed || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function ($, ns, componentNs, eventNs, document, window) {
    "use strict";

    ns.selectorComponent = '[component=embed]';

    ns.registerEvent = ($component, componentId, fieldName) => {
        const key = `${componentId}-${fieldName}`;
        eventNs.registerEvents(key, (data) => {
            if(data.type === eventNs.EVENTS.EVENT_READ_ACTION) {
                // get the first children and set the inner html.
                const $firstChild = $component.children[0];
                const componentConfig = componentNs.getComponentConfig($component);
                if (componentConfig.variant === "iframe") {
                  $component.find("iframe").attr("src", data.data.value);
                }
            }
        });      
    }

    ns.sendMessage = function($component, data) {
      console.log(["sendMessage", data]);
      var $iframe = $component.find("iframe");
      var iframe = $iframe[0];
      iframe.contentWindow.postMessage(data, "*");
    }

    ns.autoLoad = ($component) => {
      // if autoResize is set to true, then register the autoResize event.
      const componentConfig = componentNs.getComponentConfig($component);
      if (componentConfig.autoResize) {
        $component.on("load", function() {
            ns.autoResize($component);
        });
      }
    }

    ns.autoResize = ($component) => {
      if (!$component) {
          return;
      }
      const $iframe = $component.find("iframe");
      //console.log(["autoResize", embedid, $iframe]);
      var newHeight = $iframe.contents().height()+200;
      var maxHeight = $iframe.attr("max-height");

      // set new height to maxheight if its specified.
      if (maxHeight && parseInt(maxHeight, 10)) {
          if (parseInt(maxHeight, 10) < newHeight) {
              newHeight = maxHeight;
          }
      }
      //console.log(["autoResize newHeight", embedid, newHeight]);
      $iframe.height(newHeight);
  }

    ns.init = ($component) => {
        // check if the component have a data attribute with the name "data-field-componentId" and "data-field-name" then register eventNs
        const componentId = $component.attr("data-field-componentId");
        const fieldName = $component.attr("data-field-name");
        if (componentId && fieldName) {
            ns.registerEvent($component, componentId, fieldName);
        };
        ns.autoLoad($component);
    }
}
)(jQuery, Typerefinery.Components.Content.Embed, Typerefinery.Components, Typerefinery.Page.Events, document, window);
