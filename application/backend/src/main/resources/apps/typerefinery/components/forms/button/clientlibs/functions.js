window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Button = Typerefinery.Components.Forms.Button || {};

(function (ns, componentNs, document, window) {
    ns.addEventListener = (id) => {
        $(document).on("click", `#${id}`, (e) => {
            e.preventDefault();
            const componentConfig = componentNs.getComponentConfig(e.currentTarget);
            let { buttonType, url, openInNewTab } = componentConfig;
            if(buttonType === "button") {
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
            }else if(buttonType === "reset") {
                const inputFields = e.target?.parentElement?.parentElement?.parentElement?.getElementsByTagName("input")
                Array.from(inputFields)?.forEach(fieldInput => {
                    fieldInput.value = "";
                })
            }
        });
    }
    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        const { buttonType, id, url } = componentConfig;
        console.log("componentConfig", componentConfig);
        // $component.setAttribute("id", resourcePath);
        if(buttonType === "submit") {
            return;
        }
        ns.addEventListener(id);
        // $component.addEventListener("click", function (e) {
        //     e.preventDefault();
        //     if(buttonType === "button") {
        //         if(url) {
        //             window.location.href = url;
    
        //             // To open in new tab.
        //             // window.open(url)
        //         }
        //     }else if(buttonType === "reset") {
        //         const inputFields = e.target?.parentElement?.parentElement?.parentElement?.getElementsByTagName("input")
        //         Array.from(inputFields)?.forEach(fieldInput => {
        //             fieldInput.value = "";
        //         })
        //     }
        // })
    }
})(Typerefinery.Components.Forms.Button, Typerefinery.Components, document, window);
