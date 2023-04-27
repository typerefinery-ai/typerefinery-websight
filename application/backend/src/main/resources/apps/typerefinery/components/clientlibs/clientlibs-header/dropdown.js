window.Typerefinery = window.Typerefinery || {};
Typerefinery.Dropdown = Typerefinery.Dropdown || {};
Typerefinery.Modal = Typerefinery.Modal || {};

; (function (ns, modalNs, document, window) {

    // Inner HTML for the Dropdown window.
    ns.getDropdownInnerHTML = (menuItems) => {
        return menuItems.map(menuItem => `<div class="dropdown-item" data-model=${JSON.stringify(menuItem)} id="__dropdown__" link="${menuItem.link}">${menuItem.name || menuItem.label}</div>`).join("");
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

    ns.dropDownButtonEventListener = () => {
        console.log("drop down button event listener")
        $(document).on("click", "#__dropdown__", function (e) {
            console.log("clicked on dropdown item", e.target );
            // get the component config from the data-model attribute.
            const componentConfig = JSON.parse(e.target.getAttribute("data-model"));
            console.log(componentConfig, "componentConfig")
            const { label, name, link, action, hideFooter = false } = componentConfig;
            // if this link as a form tag  then show the footer.
            if (link.includes("form.html")) {
                showFooter = true;
            }
            if(action === "modal") {
                modalNs.updateCommonModalAndOpen(label || name, link, hideFooter);
            }
            else if(action === "navigate") {
                // navigate to the link.
                window.location.href = link;
            }
        });
    };

    ns.dropDownButtonEventListener();
})(Typerefinery.Dropdown, Typerefinery.Modal, document, window);