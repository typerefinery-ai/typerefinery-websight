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

        // alpha-launch docs/issues/0111 — anchor the menu to its own button.
        // `.dropdown-menu` is `position: absolute`, so it is placed against the nearest POSITIONED
        // ancestor. This component ships no `.dropdown` wrapper (Bootstrap's usual container, which
        // is what makes that ancestor the button's parent), so where the menu lands depends entirely
        // on the host page's markup. On the header the surrounding chrome happens to be positioned
        // and `+ Create` opens correctly; on the Composer page nothing near the button is, so the
        // menu resolved against a distant ancestor and rendered at x=0, y=510 — 15 correctly
        // populated items, drawn in empty space below the fold, which reads as "the button does
        // nothing".
        //
        // Set the parent to `relative` rather than wrapping the button in a new `<div class=
        // "dropdown">`: wrapping restructures the DOM under flex/grid parents and could move the
        // working `+ Create` button, and this achieves the same anchoring without touching layout.
        const $anchor = $component.parent();
        if ($anchor.length && $anchor.css("position") === "static") {
            console.log("dropdown: parent is statically positioned, setting position:relative so the menu anchors to the button", buttonId);
            $anchor.css("position", "relative");
        }

        // A long menu (15 object types on the Composer) is taller than a short viewport, so even a
        // correctly anchored menu can run off-screen. Cap it and scroll internally.
        $newDropdownContainer.css({ "max-height": "60vh", "overflow-y": "auto" });


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
            const { label, name, link, action, hideFooter = false, successNavigateTo } = componentConfig;
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
                if (successNavigateTo) {
                  // When the modal's form reports success, follow the item's configured
                  // destination (e.g. jump to the page that shows what was just created).
                  options.callbackFn = function ($modal, data, message) {
                    if (message === modalNs.MESSAGE_NAMES.FORM_SUCCESS) {
                      console.log("dropdown item form success, navigating to " + successNavigateTo);
                      window.location.href = successNavigateTo;
                    }
                  };
                }
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