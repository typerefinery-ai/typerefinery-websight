
window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
Typerefinery.Components.Widgets.Treeview = Typerefinery.Components.Widgets.Treeview || {};
Typerefinery.Components.Widgets.Treeview.Instance = Typerefinery.Components.Widgets.Treeview.Instance || {};

(function (ns, componentNs, treeViewInstanceNs, document, window) {
    "use strict";


    String.prototype.insert = function (index, string) {
        if (index > 0) {
            return this.substring(0, index) + string + this.substring(index, this.length);
        }

        return string + this;
    };



    ns.addSidebarTreeNodes = ($component, componentConfig) => {
        const dataTree = JSON.parse($component.getAttribute('data-tree') || '{}');

        if (Object.keys(dataTree).length === 0) {
            return;
        }


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
                const children = fetchMenuItemHelper(_obj);
                let current = _obj["jcr:content"].key;
                if (current && current.indexOf('.html') === -1) {
                    current += '.html';
                }
                result.push({
                    href: _obj["jcr:content"].key,
                    text: capitalizeFirstLetter(_obj["jcr:content"].title),
                    icon: _obj["jcr:content"].icon,
                    nodes: children.length === 0 ? null : children,
                    state: {
                        selected: window.location.pathname === current 
                    }
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

        console.log(formattedMenuItems, componentConfig)

        treeViewInstanceNs[componentConfig.id] = $(sidebarComponentId).treeview({
            data: formattedMenuItems,
            levels: Number(componentConfig.numOfNodeLevelsToExpand) || 10,
            expandIcon: componentConfig.expandIcon,
            collapseIcon: componentConfig.collapseIcon,
            color: componentConfig.textColor,
            backColor: 'transparent',
            // onhoverColor: componentConfig.backgroundColor.insert(1, "40"),
            // borderColor: componentConfig.backgroundColor.insert(1, "40"),
            showBorder: false,
            showTags: true,
            highlightSelected: true,
            // selectedColor: (componentConfig.textColor),
            // selectedBackColor: componentConfig.backgroundColor.insert(1, "40")
        });
        treeViewInstanceNs[componentConfig.id].treeview('enableAll', { silent: true });
        if (componentConfig.isNodeExpandedByDefault === false) {
            treeViewInstanceNs[componentConfig.id].treeview('collapseAll', { silent: true });
        }
    };


    ns.addEventListeners = ($component, componentConfig) => {
        const sidebarComponentId = `#${componentConfig.id}`;
        $(sidebarComponentId).on('nodeSelected', function (event, data) {
            let href = data.href;
            // append .html if it is not present
            if (href && href.indexOf('.html') === -1) {
                href += '.html';
            }
            if (href) {
                // navigate to the page
                window.location.href = href;
            }
        });
    };



    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        // ns.updateBackgroundColor($component, componentConfig);
        // ns.addTitleAndLogo($component, componentConfig);
        ns.addSidebarTreeNodes($component, componentConfig);

        ns.addEventListeners($component, componentConfig);
    }

})(Typerefinery.Components.Widgets.Treeview, Typerefinery.Components, Typerefinery.Components.Widgets.Treeview.Instance, document, window);