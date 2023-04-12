window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.HideButtonElement = Typerefinery.HideButtonElement || {};

; (function (ns, document, window) {
    
    ns.init = ($component, componentConfig) => {

        // Updating the component with Bootstrap Attributes.
        $component.setAttribute("data-bs-toggle", "collapse");
        $component.setAttribute("data-bs-target", `${componentConfig.hideButtonElementTarget}`);

        //Set collapse clase to target component which need to hhide.
        const targetComponent= document.getElementById(`${componentConfig.hideButtonElementTarget}`)
        targetComponent.classList.add("collapse")
    };
})(Typerefinery.HideButtonElement, document, window);