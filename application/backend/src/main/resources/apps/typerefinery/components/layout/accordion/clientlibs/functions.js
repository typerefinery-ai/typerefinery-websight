window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Button = Typerefinery.Components.Forms.Button || {};
window.Typerefinery.Modal = Typerefinery.Modal || {};
window.Typerefinery.Dropdown = Typerefinery.Dropdown || {};
window.Typerefinery.ToggleComponent = Typerefinery.ToggleComponent || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};

(function (ns, componentNs, modalNs, dropdownNs, toggleComponentNs, themeNs, document, window) {
    "use strict";

    ns.selectorComponent = '[component=accordion]';

    ns.addNewItem = ($component) => {
        // const $items = $component.querySelector('[component="accordion-items"]');
        // $items.appendChild($item);
    }

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);        
    }
})(Typerefinery.Components.Forms.Button, Typerefinery.Components, Typerefinery.Modal, Typerefinery.Dropdown, Typerefinery.ToggleComponent, window.Typerefinery.Page.Theme, document, window);