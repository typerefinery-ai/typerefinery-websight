window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Chart = Typerefinery.Components.Widgets.Chart || {};
window.Typerefinery.Components.Widgets.Chart.Instances = Typerefinery.Components.Widgets.
  Chart.Instances || {};

(function (ns, chartInstances, document, window) {
  "use strict";
  ns.toggleTheme = () => {
    const currentPageTheme = localStorage.getItem("pageTheme") || "light";
    const newTheme = currentPageTheme == "light" ? "dark" : "light";
    const $body = document.getElementsByTagName("body")[0];

    if ($body) {
      $body.classList.remove(`bg-${currentPageTheme}`);
      $body.classList.add(`bg-${newTheme}`);
    }

   //to change the background of card class component
    let $card = document.querySelectorAll('.card');
    $card.forEach(function(el) {

      if(newTheme === 'dark'){
        el.classList.remove("bg-white");  
        el.classList.add("bg-dark","bg-gradient", "text-white");
      }
      else{
        el.classList.remove("bg-dark","bg-gradient", "text-white");
        el.classList.add("bg-white"); 
      }
    });
  
    
    localStorage.setItem("pageTheme", newTheme);

    setTimeout(() => {
      Object.entries(chartInstances)?.forEach(($chart) => {
        const gridAxisToBeValidated = ["x", "y", "r"];

        // TODO: Need to be as a seperate ns.
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
    }, 5);
  };

  ns.getColor = (theme, type) => {
    return type === "grid"
      ? theme === "dark"
        ? "#f8f9fa"
        : "#dee2e6"
      : type === "background"
      ? theme === "light"
        ? "#f8f9fa"
        : "#212529"
      : type === "legend"
      ? theme === "light"
        ? "#343a40"
        : "#f8f9fa"
      : null;
  };

  ns.setInitialTheme = ($component, componentConfig) => {
    const initialTheme = componentConfig.toggleTheme;
    const $body = document.getElementsByTagName("body")[0];

    if (initialTheme === "light") {
      $body.classList.add("bg-light");
    } else if (initialTheme === "dark") {
      $body.classList.add("bg-dark");
    }
  };

  ns.attachEventListener = ($component, componentConfig) => {
    // Event Listener for toggle theme (dark | light);
    $($component).on("click", ns.toggleTheme);
  };

  ns.init = ($component, componentConfig) => {
    ns.setInitialTheme($component, componentConfig);
    ns.attachEventListener($component, componentConfig);
  };
})(Typerefinery.Page.Theme, Typerefinery.Components.Widgets.Chart.Instances, document, window);
