window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Chart = Typerefinery.Components.Widgets.Chart || {};
window.Typerefinery.Components.Widgets.Chart.Instances = Typerefinery.Components.Widgets.
  Chart.Instances || {};

(function ($, ns, chartInstances, document, window) {
  "use strict";

  ns.toggleTheme = () => {
    const currentPageTheme = localStorage.getItem("pageTheme") || "light";
    const newTheme = currentPageTheme == "light" ? "dark" : "light";
    const $body = $("body")[0];

    if ($body) {
      $body.removeClass(`bg-${currentPageTheme}`);
      $body.addClass(`bg-${newTheme}`);
    }

    //to change the background of component
    const toggleTheme = $(`[toggleTheme]`);
    toggleTheme.each(function ($component) {
      var $component = $(this);

      const toggle = $component.attr("toggleTheme");


      const $body = document.getElementsByTagName("body")[0];

      if (newTheme === "light") {
        $body.addClass("bg-light");
      } else if (newTheme === "dark") {
        $body.addClass("bg-dark");
      }

      if (newTheme === 'dark') {
        if (toggle === "text") {
          $component.removeClass("text-dark");
          $component.addClass("text-white");
        } else if(toggle === "component") {
          $component.removeClass("bg-light", "shadow-lg");
          $component.addClass("bg-dark", "shadow-lg");
        
        }else if (toggle === "true") {
          $component.removeClass("bg-light", "shadow-lg", "text-dark");
          $component.addClass("bg-dark", "shadow-lg", "text-white");
        }

      }
      else {
        if (toggle === "text") {
          $component.removeClass("text-white");
          $component.addClass("text-dark");
        } else if (toggle === "true") {
          $component.removeClass("bg-dark", "shadow-lg", "text-white");
          $component.addClass("bg-light", "shadow-lg", "text-dark");
        }
      }
    });

    
    ns.updateATagColor(newTheme);
    
    //TODO: move this to chart component
    setTimeout(() => {
      Object.entries(chartInstances)?.forEach(($chart) => {
        const gridAxisToBeValidated = ["x", "y", "r"];

        // TODO: Need to be as a separate ns.
        var chartObj = {};

        // to update the grid lines
        gridAxisToBeValidated.forEach((axis) => {
          if ($chart[1].options.scales[axis]) {
            chartObj = {
              [axis]: {
                grid: {
                  color: ns.getColor(newTheme, "grid"),
                },
              },
            };
          }
        });

        $chart[1].options.scales = chartObj;

        // to update background color of a chart legend.
        $chart[1].options.plugins.legend.labels = {
          color: ns.getColor(newTheme, "legend"),
        };
        // to update background color of a chart canvas.
        $chart[1].options.plugins.customCanvasBackgroundColor = {
          color: ns.getColor(newTheme, "background"),
        };
        $chart[1].update();
      });
    }, 1);

    localStorage.setItem("pageTheme", newTheme);
  };

  ns.updateATagColor = (theme) => {
    const $aTags = $("a");
    $aTags.each(() => {
      var $aTag = $(this);
      if (theme === "dark") {
        $aTag.removeClass("text-dark");
        $aTag.addClass("text-white");
      } else {
        $aTag.removeClass("text-white");
        $aTag.addClass("text-dark");
      }
    });
  };


  ns.getColor = (theme, type) => {
    return type === "grid"
      ? theme === "dark"
        ? "#f8f9fa"
        : "#dee2e6"
      : type === "background"
        ? theme === "light"
          ? "#f8f9fa"
          : "#4f4f4f"
        : type === "legend"
          ? theme === "light"
            ? "#343a40"
            : "#f8f9fa"
          : null;
  };

  ns.setInitialTheme = (componentConfig) => {
    if (!componentConfig || !componentConfig.toggleTheme) return;
    const initialTheme = componentConfig.toggleTheme;
    localStorage.setItem("pageTheme", initialTheme === "dark" ? "light" : "dark");
    ns.toggleTheme();
  };

  ns.attachEventListener = ($component, componentConfig) => {
    // Event Listener for toggle theme (dark | light);
    $component.on("click", ns.toggleTheme);
  };

  ns.init = ($component, componentConfig) => {

    console.group("theme init");

    ns.setInitialTheme(componentConfig);
    ns.attachEventListener($component, componentConfig);

    console.groupEnd();
  };
})(jQuery, Typerefinery.Page.Theme, Typerefinery.Components.Widgets.Chart.Instances, document, window);
