
window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
Typerefinery.Components.Widgets.Treeview = Typerefinery.Components.Widgets.Treeview || {};
Typerefinery.Components.Widgets.Search = Typerefinery.Components.Widgets.Search || {};
Typerefinery.Components.Widgets.Treeview.Instance = Typerefinery.Components.Widgets.Treeview.Instance || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function (ns, componentNs, treeViewInstanceNs, eventNs, searchNs, document, window) {
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

    ns.onFilterNode = ($component, data) => {
        console.log("onFilterNode", data)
        const componentConfig = componentNs.getComponentConfig($component);
        const treeViewInstance = treeViewInstanceNs[componentConfig.id];
        treeViewInstance.treeview('collapseAll', { silent: true });
        treeViewInstance.treeview('enableAll', { silent: true });
        treeViewInstance.treeview('search', [data.value, {
            ignoreCase: true,     // case insensitive
            exactMatch: false,    // like or equals
            revealResults: true,  // reveal matching nodes
        }]);
    };


    ns.highlightComponent =  ($component, data) => {
        console.log("highlightComponent", data)
        const componentConfig = componentNs.getComponentConfig($component);
        const treeViewInstance = treeViewInstanceNs[componentConfig.id];
        treeViewInstance.treeview('collapseAll', { silent: true });
        treeViewInstance.treeview('enableAll', { silent: true });
        treeViewInstance.treeview('search', [data.value, {
            ignoreCase: true,     // case insensitive
            exactMatch: false,    // like or equals
            revealResults: true,  // reveal matching nodes
        }]);
    };

    ns.getEventHandlerCallBackFn = ($component, event) => {
        if(event.topic && event.type === 'FILTER') {
            return (data) => ns.onFilterNode($component, data);
        }else if(event.topic && event.type === 'HIGHLIGHT') {
            return (data) => searchNs.highlightComponent($component, data);
        }
        return () => {};
    };

    ns.registerEvents = ($component, componentId, events) => {
        events.forEach(event => {
            eventNs.registerEvents(event.topic, ns.getEventHandlerCallBackFn($component, event));
        });
    };

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        // ns.updateBackgroundColor($component, componentConfig);
        // ns.addTitleAndLogo($component, componentConfig);
        ns.addSidebarTreeNodes($component, componentConfig);

        ns.addEventListeners($component, componentConfig);

        const events = componentConfig?.events?.map(event => {
            return {
                topic: event.key,
                type: event.value
            }
        }) || [];

        console.log('events treeview', events)

        // if componentConfig.events is defined then add event listeners to table.
        if (events) {
            ns.registerEvents($component, componentConfig.id, events);
        }
    }

})(Typerefinery.Components.Widgets.Treeview, Typerefinery.Components, Typerefinery.Components.Widgets.Treeview.Instance, Typerefinery.Page.Events, Typerefinery.Components.Widgets.Search, document, window);