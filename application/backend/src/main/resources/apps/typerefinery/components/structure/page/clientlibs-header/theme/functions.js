window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Chart = Typerefinery.Components.Widgets.Chart || {};
window.Typerefinery.Components.Widgets.Chart.Instances = Typerefinery.Components.Widgets.Chart.Instances || {};

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

      localStorage.setItem("pageTheme", newTheme);
      // setTimeout(() => {
      //     Object.entries(chartInstances)?.forEach($chart => {
      //         $chart[1]?.update();
      //     })
      // }, 250);
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