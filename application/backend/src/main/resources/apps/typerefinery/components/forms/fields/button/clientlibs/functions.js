window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Button = Typerefinery.Components.Forms.Button || {};
window.Typerefinery.Modal = Typerefinery.Modal || {};

(function (ns, componentNs, modalNs, document, window) {
    ns.addEventListener = (id) => {
        $(document).on("click", `#${id}`, (e) => {
            e.preventDefault();
            const componentConfig = componentNs.getComponentConfig(e.currentTarget);
            let { buttonType, url, openInNewTab } = componentConfig;

            if(buttonType === "navigate") {
                if(url) {
                    if(!url.endsWith(".html")) {
                        url += ".html";
                    }
                    
                    if(openInNewTab) {
                        window.open(url);
                        return;
                    }
                    window.location.href = url;
                }
            }
        });
    }
    ns.init = ($component) => {

        const componentConfig = componentNs.getComponentConfig($component);
        const { buttonType, id, actionType } = componentConfig;

        if(buttonType === "submit") {
            return;
        }
        else if(buttonType === "action") {
            if(actionType === "openModal") {
                modalNs.init($component, componentConfig);
            }else if(actionType === "openDropdown") {
                // TODO: Create a ns for the dropdown.
                // dropdownNs.init($component, componentConfig);
            }
            
        }
        ns.addEventListener(id);
    }
})(Typerefinery.Components.Forms.Button, Typerefinery.Components, Typerefinery.Modal, document, window);
