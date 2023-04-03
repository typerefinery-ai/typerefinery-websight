window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Tab = Typerefinery.Components.Tab || {};

(function (ns, componentNs, window, document) {
    "use strict";
    ns.compileHandlerBar = ($component, componentConfig) => {


        const source = $(`#${componentConfig.id}-template`).html();


        const template = Handlebars.compile(source);

        const items = {
            listOfTab: componentConfig.listOfTab.map((tab, index) => {

                const isContentUrl = tab.content.startsWith("http");

                if (tab.useQueryParamsFromParent === true && isContentUrl) {
                
                    // append the query params from the parent page.
                    const url = new URL(tab.content);
                    const searchParams = new URLSearchParams(window.location.search);
                    for (const [key, value] of searchParams) {
                        url.searchParams.append(key, value);
                    }
                    tab.content = url.toString();
                };

                console.log("tab.content", tab.content);

                return {
                    tabTitle: tab.title,
                    tabContent: tab.content,
                    id: `${index}-${tab.title.replace(/[^a-zA-Z0-9 ]/g, '').trim()?.split(" ").join("-")}`,
                    active: index === 0 ? "active" : ""
                };
            }) || []
        }

        const newHTML = template({listOfTab: items.listOfTab});
        
        $component.innerHTML = newHTML;
    };

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        ns.compileHandlerBar($component, componentConfig);
    };

})(window.Typerefinery.Components.Tab, window.Typerefinery.Components,window, document);

