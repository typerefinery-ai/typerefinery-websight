
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layouts = Typerefinery.Components.Layouts || {};
window.Typerefinery.Components.Layouts.Sidebar = Typerefinery.Components.Layouts.Sidebar || {};

; (function (ns, componentNs, window, document) {
    "use strict";

    ns.renderMenuItemsInSidebar = (menuItems, componentConfig) => {
        const $menuItems = document.getElementById(`${componentConfig.id}-menuItems`);
        const activeURL = window.location.pathname;
        // TODO: Need to build sub menu items.
        const menuItemsInnerHTML = (menuItems.map((menuItem, index) => {
            return `
                <li ${menuItem.key === activeURL ? 'class="active"' : ''}>
                    <a href="${menuItem.key}" data-toggle="collapse" aria-expanded="false" class="dropdown-toggle">
                        <i class="${menuItem.icon}"></i>
                        ${menuItem.label}
                    </a>
                </li>
            `;
        })).join("");

        $menuItems.innerHTML = menuItemsInnerHTML;
    }

    ns.init = ($component) => {

        const componentConfig = componentNs.getComponentConfig($component);

        let formattedMenuItems = [];

        // sidebar 
        const dataTree = JSON.parse($component.getAttribute('data-tree') || '{}');

        // Recursive function to fetch menu items.
        function fetchMenuItemHelper(obj) {
            const result = [];
            for (const keyItr in obj) {
                if (keyItr === "jcr:content") {
                    continue;
                }
                const _obj = obj[keyItr];
                result.push({
                    key: _obj["jcr:content"].key,
                    label: _obj["jcr:content"].name,
                    data: _obj["jcr:content"].name,
                    icon: _obj["jcr:content"].icon,
                    children: fetchMenuItemHelper(_obj)
                })
            }
            return result;
        }

        // Only this loops runs for one time.
        for (const key in dataTree) {
            formattedMenuItems = fetchMenuItemHelper(dataTree[key]);
            break;
        }

        console.log(formattedMenuItems, "formattedMenuItems")
        // Update UI with formatted menu items.
        ns.renderMenuItemsInSidebar(formattedMenuItems, componentConfig);

    }

})(window.Typerefinery.Components.Layouts.Sidebar, window.Typerefinery.Components, window, document);
