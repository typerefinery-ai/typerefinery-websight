window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.ToggleComponent = Typerefinery.ToggleComponent || {};

(function ($, ns, document, window) {
  ns.init = ($component, componentConfig) => {

    console.group("ToggleComponent");
    console.log(["config", componentConfig, $component]);

    $component.attr(
      "data-action-target",
      `${componentConfig.toggleTarget}`
    );

    console.log(["target", componentConfig.toggleTarget]);

    $component.on("click", function () {
      var targetElement = $(this).attr("data-action-target");
      var $targetElement = $(targetElement);
      console.log("ToggleComponent Clicked", $targetElement);
      $targetElement.toggle();
      $targetElement.focus();
    });

    console.groupEnd();

  };
})(jQuery, Typerefinery.ToggleComponent, document, window);
