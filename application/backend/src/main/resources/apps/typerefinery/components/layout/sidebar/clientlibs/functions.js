
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layouts = Typerefinery.Components.Layouts || {};
window.Typerefinery.Components.Layouts.Sidebar = Typerefinery.Components.Layouts.Sidebar || {};

; (function (ns, componentNs, window, document) {
    "use strict";

    ns.init = () => {

        const data = {};

        const sidebarContainer = document.getElementById('sidebar');

        let formattedMenuItems = [];

        if (sidebarContainer) {
            const dataTree = JSON.parse(sidebarContainer.getAttribute('data-tree') || '{}');

            function fetchMenuItemHelper(obj) {
                const result = [];
                for (const keyItr in obj) {
                    if (keyItr === "jcr:content") {
                        continue;
                    }
                    const _obj = obj[keyItr];
                    result.push({
                        key: _obj["jcr:content"].key,
                        label: _obj["jcr:content"].title,
                        data: _obj["jcr:content"].title,
                        icon: _obj["jcr:content"].icon,
                        children: fetchMenuItemHelper(_obj)
                    })
                }
                return result;
            }
            for (const key1 in dataTree) {
                formattedMenuItems = fetchMenuItemHelper(dataTree[key1]);
                // Only this loops runs for one time.
                break;
            }

        }
        console.log(formattedMenuItems, "formattedMenuItems")



        document.querySelectorAll('[data-module="vue-sidebar"]').forEach($component => {
            data["sidebarRoutes"] = formattedMenuItems;
            $component.setAttribute(":value", "sidebarRoutes");
        });
        // Register vue data.
        componentNs.registerComponent(data);
    }

})(window.Typerefinery.Components.Layouts.Sidebar, window.Typerefinery.Components, window, document);
