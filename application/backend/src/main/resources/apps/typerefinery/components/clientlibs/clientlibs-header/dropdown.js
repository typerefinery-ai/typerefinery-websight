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

        console.group("dropdown init");
        
        // Updating the component with Bootstrap Attributes.
        $component.attr("data-bs-toggle", "dropdown");
        $component.attr("type", "button");
        $component.attr("aria-expanded", "false");
        const buttonId = $component.attr("id");


        // Dropdown Container with default Attributes
        const $newDropdownContainer = $("<div></div>");
        $newDropdownContainer.attr("class", "dropdown-menu dropdownMenu");
        $newDropdownContainer.attr("aria-labelledby", buttonId);


        const { dropdownItems } = componentConfig;

        if (!dropdownItems || dropdownItems.length === 0) {
            console.error("not dropdown items provided in component config.");
        } else {

          $newDropdownContainer.html(ns.getDropdownInnerHTML(dropdownItems));
          
        }
        
        // .after(), not .add(): jQuery add() only builds a new collection and never touches
        // the DOM, so the menu was never attached and the dropdown opened nothing. Bootstrap
        // resolves the menu as the toggle's next sibling.
        $component.after($newDropdownContainer);

        console.groupEnd();

    };

    ns.dropDownButtonEventListener = () => {
      //TODO: this has to be contained to this component only.
      $(document).on("click", "#__dropdown__", function (e) {
            console.groupCollapsed("drop down button event listener on " + window.location);
            // console.log("again 1 clicked on dropdown item", e.target );
            const componentConfig = JSON.parse(e.target.getAttribute("data-model"));
            const { label, name, link, action, hideFooter = false } = componentConfig;
            // if this link as a form tag  then show the footer.
            if (link.includes("form.html")) {
                showFooter = true;
            }
            if(action === "modal") {
                // Anchor the modal on <body>, not on the clicked item: a modal appended
                // inside the dropdown menu collapses to 0x0 as soon as the menu closes
                // (display:none ancestor), leaving only the backdrop visible.
                let options = {
                  modalTitle: label || name,
                  iframeURL: link,
                  hideFooter: hideFooter
                };
                modalNs.createModalAndOpen($("body"), options);
            }
            else if(action === "navigate") {
                // navigate to the link.
                window.location.href = link;
            }
            console.groupEnd();
        });
    };
    
    ns.dropDownButtonEventListener();
})(jQuery, Typerefinery.Dropdown, Typerefinery.Modal, document, window);