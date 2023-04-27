window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Button = Typerefinery.Components.Forms.Button || {};
window.Typerefinery.Modal = Typerefinery.Modal || {};
window.Typerefinery.Dropdown = Typerefinery.Dropdown || {};
window.Typerefinery.ToggleComponent = Typerefinery.ToggleComponent || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};

(function (ns, componentNs, modalNs, dropdownNs, toggleComponentNs, themeNs, document, window) {
    ns.addEventListener = ($component, id) => {
        $component.addEventListener("click", (e) => {
            e?.preventDefault();
            const componentConfig = componentNs.getComponentConfig(e.currentTarget);
            let { buttonType, navigateTo, navigateToInNewWindow } = componentConfig;

            if(buttonType === "navigate") {
                if(navigateTo) {
                    
                    if(navigateToInNewWindow) {
                        window.open(navigateTo);
                        return;
                    }
                    window.location.href = navigateTo;
                }
            }else if(buttonType === "action") {
                const { actionType } = componentConfig;
                if(actionType === "openModal") {
                    modalNs.createModalAndOpen(componentConfig.actionModalTitle, componentConfig.actionUrl, componentConfig.hideFooter); 
                }
            }
        });
    }
     ns.windowResizeListener = ($component) => {
       const target = $component.getAttribute("data-bs-target");
       // remove the '#' from the value
       const targetId = target?.replace("#", "");
       // select all elements with the same id as targetId
       const elements = document.querySelectorAll(`#${targetId}`);

       $(window)
         .on("resize", function () {
           if ($(this).width() > 1000) {
             $(document).find(".collapse").removeClass("collapse");
           } else {
             elements.forEach((element) => {
               element.classList.add("collapse");
             });
           }
         })
         .resize();
     };
  
    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        const { buttonType, id, actionType } = componentConfig;

        if(buttonType === "submit") {
            return;
        }
        else if(buttonType === "action") {
            // if(actionType === "openModal") {
                // modalNs.init($component, componentConfig);
            // }else 
            if(actionType === "openDropdown") {
                dropdownNs.init($component, componentConfig);
                return;
            }else if(actionType === "initialTheme") {                
                themeNs.init($component, componentConfig);
                return;
            }else if(actionType === "toggleComponent") {               
                toggleComponentNs.init($component, componentConfig);
                return;
            }
        }
        ns.addEventListener($component, id);
        ns.windowResizeListener($component)
    }
})(Typerefinery.Components.Forms.Button, Typerefinery.Components, Typerefinery.Modal, Typerefinery.Dropdown, Typerefinery.ToggleComponent, window.Typerefinery.Page.Theme, document, window);