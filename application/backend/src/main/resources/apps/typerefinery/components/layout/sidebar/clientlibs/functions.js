
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layouts = Typerefinery.Components.Layouts || {};
window.Typerefinery.Components.Layouts.Sidebar = Typerefinery.Components.Layouts.Sidebar || {};

; (function (ns, componentNs, window, document) {
    "use strict";

    ns.init = ($component) => {


        // sidebar 
        const dataTree = JSON.parse($component.getAttribute('data-tree') || '{}');

        // Recursive function to fetch menu items.
        function fetchMenuItemHelper(obj) {
            let result = '';
            for (const keyItr in obj) {
                if (keyItr === "jcr:content") {
                    continue;
                }
                const _obj = obj[keyItr];
                const randId = `${_obj["jcr:content"].name}-menuItem`;
                const child = `${fetchMenuItemHelper(_obj)}`;
                if(child.trim().length !== 0) {
                    result += `
                        <li class="${_obj["jcr:content"].key === window.location.pathname ? 'active': ''}">
                            <a href="${_obj["jcr:content"].key}" data-bs-toggle="collapse" data-bs-target="#${randId}"  aria-expanded="false" class="dropdown-toggle">
                                <i class="${_obj["jcr:content"].icon}"></i>
                                ${(_obj["jcr:content"].name).toUpperCase().substring(0,1)}${_obj["jcr:content"].name.substring(1)}
                            </a>
                            <ul class="collapse list-unstyled" id="${randId}">
                                ${child}
                            </ul>
                        </li>
                    `;
                }else {
                    result += `
                        <li class="${_obj["jcr:content"].key === window.location.pathname ? 'active': ''}">
                            <a href="${_obj["jcr:content"].key}">
                                <i class="${_obj["jcr:content"].icon}"></i>
                                ${(_obj["jcr:content"].name).toUpperCase().substring(0,1)}${_obj["jcr:content"].name.substring(1)}
                            </a>
                        </li>
                    `;
                }
            }
            return result;
        }
        let sidebarMenuInnerHtml  = '';

        // Only this loops runs for one time.
        for (const key in dataTree) {
            sidebarMenuInnerHtml += fetchMenuItemHelper(dataTree[key]);
            break;
        }

        document.getElementById("sidebar-menuItems").innerHTML += sidebarMenuInnerHtml;
    }

})(window.Typerefinery.Components.Layouts.Sidebar, window.Typerefinery.Components, window, document);
