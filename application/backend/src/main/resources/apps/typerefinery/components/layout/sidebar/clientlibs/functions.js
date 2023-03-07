
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layout = Typerefinery.Components.Layout || {};
window.Typerefinery.Components.Layout.Sidebar = Typerefinery.Components.Layout.Sidebar || {};

; (function (ns, componentNs, document, window) {
    "use strict";

    ns.init = ($component) => {

        // sidebar 
        const dataTree = JSON.parse($component.getAttribute('data-tree') || '{}');

        if(Object.keys(dataTree).length === 0) {
            return;
        }

        const componentConfig = componentNs.getComponentConfig($component);

        let formattedMenuItems = [];

        function capitalizeFirstLetter(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        // Recursive function to fetch menu items.
        function fetchMenuItemHelper(obj) {
            const result = [];
            for (const keyItr in obj) {
                if (keyItr === "jcr:content") {
                    continue;
                }
                const _obj = obj[keyItr];
                result.push({
                    href: _obj["jcr:content"].key,
                    text: capitalizeFirstLetter(_obj["jcr:content"].title),
                    icon: _obj["jcr:content"].icon,
                    nodes: fetchMenuItemHelper(_obj)
                });
            }
            return result;
        }


        // Only this loops runs for one time.
        for (const key in dataTree) {
            formattedMenuItems = fetchMenuItemHelper(dataTree[key]);
            break;
        }

        const sidebarComponentId = `#${componentConfig.id}`;
        
        $(sidebarComponentId).treeview({
            data: formattedMenuItems, 
            levels: 10, 
            color: "#FFF",
            backColor: "#7386D5",
            onhoverColor: "#9aadff",
            borderColor: "#9aadff",
            showBorder: false,
            showTags: true,
            highlightSelected: true,
            selectedColor: "#000",
            selectedBackColor: "#7386D5"
        });

        $(id).treeview('enableAll', { silent: true });
        $(id).treeview('collapseAll', { silent: true });
    }

})(Typerefinery.Components.Layout.Sidebar, Typerefinery.Components, document, window);