
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layouts = Typerefinery.Components.Layouts || {};
window.Typerefinery.Components.Layouts.Sidebar = Typerefinery.Components.Layouts.Sidebar || {};

; (function (ns, componentNs, window, document) {
    "use strict";

    ns.init = ($component) => {


        // sidebar 
        const dataTree = JSON.parse($component.getAttribute('data-tree') || '{}');

        const componentConfig = componentNs.getComponentConfig($component);

        let formattedMenuItems = [];

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
                    text: _obj["jcr:content"].title.substring(0, 1).toUpperCase() + _obj["jcr:content"].title.substring(1),
                    icon: _obj["jcr:content"].icon,
                    nodes: fetchMenuItemHelper(_obj)
                })
            }
            return result;
        }
        for (const key1 in dataTree) {
            formattedMenuItems = fetchMenuItemHelper(dataTree[key1]);
            // Only this loops runs for one time.
            break;
        }

        const id = `#${componentConfig.id}`;
        $(id).treeview({
            data: formattedMenuItems, 
            levels: 5, 
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

})(window.Typerefinery.Components.Layouts.Sidebar, window.Typerefinery.Components, window, document);
