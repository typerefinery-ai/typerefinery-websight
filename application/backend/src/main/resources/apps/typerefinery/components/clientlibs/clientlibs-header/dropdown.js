window.Typerefinery = window.Typerefinery || {};
Typerefinery.Dropdown = Typerefinery.Dropdown || {};
Typerefinery.Modal = Typerefinery.Modal || {};

(function ($, ns, modalNs, document, window) {

    // Inner HTML for the Dropdown window.
    ns.getDropdownInnerHTML = (menuItems) => {
        return menuItems.map(menuItem => `
            <div 
                name="${menuItem.name}" 
                label="${menuItem.label}" 
                link="${menuItem.link}"
                action="${menuItem.action}"
                hideFooter="${menuItem.hideFooter}"
                data-model='${JSON.stringify(menuItem)}'

                id="__dropdown__" 
                class="dropdown-item" 
            >
                ${menuItem.name || menuItem.label}
            </div>
        `).join("");
    }

    ns.init = ($component, componentConfig) => {

        
        // Updating the component with Bootstrap Attributes.
        $component.attr("data-bs-toggle", "dropdown");
        $component.attr("type", "button");
        $component.attr("aria-expanded", "false");
        const buttonId = $component.asttr("id");


        // Dropdown Container with default Attributes
        const newDropdownContainer = document.createElement("div");
        newDropdownContainer.attr("class", "dropdown-menu dropdownMenu");
        newDropdownContainer.attr("aria-labelledby", buttonId);


        const { dropdownItems } = componentConfig;

        newDropdownContainer.innerHTML = ns.getDropdownInnerHTML(dropdownItems);

        $component.parentNode.appendChild(newDropdownContainer);

    };

    ns.dropDownButtonEventListener = () => {
        console.log("drop down button event listener")
        $(document).on("click", "#__dropdown__", function (e) {
            // console.log("again 1 clicked on dropdown item", e.target );
            const componentConfig = JSON.parse(e.target.getAttribute("data-model"));
            const { label, name, link, action, hideFooter = false } = componentConfig;
            // if this link as a form tag  then show the footer.
            if (link.includes("form.html")) {
                showFooter = true;
            }
            if(action === "modal") {
                modalNs.createModalAndOpen(label || name, link, hideFooter);
            }
            else if(action === "navigate") {
                // navigate to the link.
                window.location.href = link;
            }
        });
    };
    
    ns.dropDownButtonEventListener();
})(jQuery, Typerefinery.Dropdown, Typerefinery.Modal, document, window);