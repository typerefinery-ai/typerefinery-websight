window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Button = Typerefinery.Components.Forms.Button || {};
window.Typerefinery.Modal = Typerefinery.Modal || {};
window.Typerefinery.Dropdown = Typerefinery.Dropdown || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};

(function (ns, componentNs, modalNs, dropdownNs, themeNs, document, window) {
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
            }


        });
    }
     ns.windowResizeListner = ($component) => {
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
        console.log($component,"$component2")
        const componentConfig = componentNs.getComponentConfig($component);
        const { buttonType, id, actionType } = componentConfig;

        if(buttonType === "submit") {
            return;
        }
        else if(buttonType === "action") {
            if(actionType === "openModal") {
                modalNs.init($component, componentConfig);
            }else if(actionType === "openDropdown") {
                dropdownNs.init($component, componentConfig);
            }else if(actionType === "initialTheme") {                
                themeNs.init($component, componentConfig);
            }
            return;
        }
        ns.addEventListener($component, id);
        ns.windowResizeListner($component)
    }
})(Typerefinery.Components.Forms.Button, Typerefinery.Components, Typerefinery.Modal, Typerefinery.Dropdown, window.Typerefinery.Page.Theme, document, window);