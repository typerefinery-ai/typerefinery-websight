window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Dropdown = Typerefinery.Dropdown || {};

; (function (ns, document, window) {

    // Inner HTML for the Dropdown window.
    ns.getDropdownInnerHTML = (menuItems) => {
        return menuItems.map(menuItem => `<a class="dropdown-item" target="${menuItem.openInNewTab === true ? '_blank': '_self'}"  href="${menuItem.link}">${menuItem.name || menuItem.label}</a>`).join("");
    }

    ns.init = ($component, componentConfig) => {

        
        // Updating the component with Bootstrap Attributes.
        $component.setAttribute("data-bs-toggle", "dropdown");
        $component.setAttribute("type", "button");
        $component.setAttribute("aria-expanded", "false");
        const buttonId = $component.getAttribute("id");


        // Dropdown Container with default Attributes
        const newDropdownContainer = document.createElement("div");
        newDropdownContainer.setAttribute("class", "dropdown-menu dropdownMenu");
        newDropdownContainer.setAttribute("aria-labelledby", buttonId);


        const { dropdownItems } = componentConfig;

        newDropdownContainer.innerHTML = ns.getDropdownInnerHTML(dropdownItems);

        $component.parentNode.appendChild(newDropdownContainer);

    };
})(Typerefinery.Dropdown, document, window);