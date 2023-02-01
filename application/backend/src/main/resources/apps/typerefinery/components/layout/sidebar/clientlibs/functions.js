
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layouts = Typerefinery.Components.Layouts || {};
window.Typerefinery.Components.Layouts.Sidebar = Typerefinery.Components.Layouts.Sidebar || {};

; (function (ns, componentNs, window, document) {
    "use strict";

    ns.init = () => {

        const data = {};

        const DEFAULT_MENU_ITEMS = [{
            "label": "Dashboard",
            "link": "path1",
            "parentName": "",
            "name": "dashboard",
            "icon": "pi pi-check"
          },
          {
            "label": "Search",
            "link": "path2",
            "parentName": "dashboard",
            "name": "dashboardChild1",
            "icon": "pi pi-check"
          }
        ];

        let menuItems = DEFAULT_MENU_ITEMS;

        const sidebarContainer = document.getElementsByClassName('sidebar-container');
        
        if(sidebarContainer.length !== 0) {
            const dataModel = JSON.parse(sidebarContainer[0].getAttribute('data-model') || '{}');
       
            if(dataModel?.navigation?.menuItems?.length > 0) {
                menuItems = dataModel?.navigation?.menuItems;
            }
        }
        let formattedMenuItems = [];
        menuItems.forEach(menuItem => {
            let children = [];
            menuItems.forEach(_ => {
                if(_.parentName === menuItem.name) {
                    children.push(
                        {
                            "key": `${menuItem.name}-${_.name}`,
                            "label": _.label,
                            "data": _.label,
                            "icon": _.icon
                        }
                    )
                }
            })
            if(menuItem.parentName.trim().length === 0) {
                formattedMenuItems.push({
                    "key": menuItem.name,
                    "label": menuItem.label,
                    "data": menuItem.label,
                    "icon": menuItem.icon,
                    "children": children
                })
            }
        })
        

        document.querySelectorAll('[data-module="vue-sidebar"]').forEach($component => {  
            data["sidebarRoutes"] = formattedMenuItems;
            $component.setAttribute(":value", "sidebarRoutes");
        });
        // Register vue data.
        componentNs.registerComponent(data);
    }

})(window.Typerefinery.Components.Layouts.Sidebar, window.Typerefinery.Components, window, document);
