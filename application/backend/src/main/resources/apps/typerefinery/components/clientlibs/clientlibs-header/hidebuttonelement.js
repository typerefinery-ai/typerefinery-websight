window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.HideButtonElement = Typerefinery.HideButtonElement || {};

(function (ns, document, window) {
  ns.init = ($component, componentConfig) => {
    // Updating the component with Bootstrap Attributes.
    $component.setAttribute("data-bs-toggle", "collapse");
    $component.setAttribute(
      "data-bs-target",
      `${componentConfig.hideButtonElementTarget}`
    );

    //Set class "collapse" to hide the elements intially, which need to be toggle.
    const targetElement = document.querySelectorAll(
      `${componentConfig.hideButtonElementTarget}`
    );
    targetElement.forEach((element) => {
      element.classList.add("collapse");
    });
  };
})(Typerefinery.HideButtonElement, document, window);
