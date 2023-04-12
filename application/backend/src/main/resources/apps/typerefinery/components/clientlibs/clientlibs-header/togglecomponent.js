window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.ToggleComponent = Typerefinery.ToggleComponent || {};

(function (ns, document, window) {
  ns.init = ($component, componentConfig) => {
    // Updating the component with Bootstrap Attributes.
    $component.setAttribute("data-bs-toggle", "collapse");
    $component.setAttribute(
      "data-bs-target",
      `${componentConfig.toggleTarget}`
    );

    //Set class "collapse" to hide the elements intially, which need to be toggle.
    const targetElement = document.querySelectorAll(
      `${componentConfig.toggleTarget}`
    );
    targetElement.forEach((element) => {
      element.classList.add("collapse");
    });
  };
})(Typerefinery.ToggleComponent, document, window);
