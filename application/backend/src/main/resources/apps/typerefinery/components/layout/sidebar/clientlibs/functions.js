
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
        let breadcrumb = {
            home: {},
            items: []
        };

        // sidebar 
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

        // breadcrumb 
        const dataModel = JSON.parse(document.querySelector('.sidebar').getAttribute('data-model'));
        const currentPath = dataModel.currentPagePath;
        for(let i = 0; i < formattedMenuItems.length; i++) {
            const menuItem = formattedMenuItems[i];
            if(menuItem.key === currentPath) {
                breadcrumb.home = {
                    label: menuItem.label,
                    icon: menuItem.icon
                };
                breadcrumb.items = [];
                break;
            }
            function fetchBreadcrumbItemHelper(menuItems) {
                const result = [];
                for (let i = 0; i < menuItems.length; i++) {
                    const menuItem = menuItems[i];
                    if(menuItem.key === currentPath) {
                        result.push({
                            label: menuItem.label,
                            icon: menuItem.icon
                        });
                        return result;
                    }
                    result.push({
                        label: menuItem.label,
                        icon: menuItem.icon
                    });
                    const recResult = fetchBreadcrumbItemHelper(menuItem.children);
                    if(recResult.length === 0) {
                        result.pop();
                    }else {
                        return [
                            ...result,
                            ...recResult
                        ];
                    }
                }
                return result;
            }
            let tempBreadCrumbItems = fetchBreadcrumbItemHelper(formattedMenuItems[i].children);
            if(tempBreadCrumbItems.length > 0) {
                breadcrumb.home = {
                    label: menuItem.label,
                    icon: menuItem.icon
                };
                breadcrumb.items = tempBreadCrumbItems;
                break;
            }
        }



        document.querySelectorAll('[data-module="vue-sidebar"]').forEach($component => {
            data["sidebarRoutes"] = formattedMenuItems;
            $component.setAttribute(":value", "sidebarRoutes");
        });

        data["breadcrumb"] = breadcrumb;

        console.log("breadcrumb", data);

        // Register vue data.
        componentNs.registerComponent(data);
    }

})(window.Typerefinery.Components.Layouts.Sidebar, window.Typerefinery.Components, window, document);
