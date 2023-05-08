
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
                // NOTE: if title is empty then don't add it to the menu.
                if( _obj["jcr:content"].title?.trim() !== "" && _obj["jcr:content"].hideInNav != "true") {
                    result.push({
                        link: _obj["jcr:content"].key + ".html" ,
                        href: componentConfig.onNodeSelected === "TAB" ? "javascript:void(0)" : _obj["jcr:content"].key,
                        text: capitalizeFirstLetter(_obj["jcr:content"].title),
                        icon: _obj["jcr:content"].icon,
                        nodes: children.length === 0 ? null : children,
                        tags: [_obj["jcr:content"].key + ".html"],
                        state: {
                            selected: window.location.pathname === current
                        }
                    });
                }
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
            showTags: false,
            highlightSelected: true,
            onNodeSelected: function (event, node) {
                if (componentConfig.onNodeSelected === "TAB" && componentConfig.topic) {
                    eventNs.emitEvent(componentConfig.topic, {
                        tab: {
                            title: node.text,
                            url: node.link || node.tags[0],
                            icon: node.icon,
                            id: node.nodeId,
                            isCloseable: true,
                            active: "active",
                            html: "",
                            icon: ""
                        },
                        type: "ADD_TAB"
                    });
                }
            }
        });
        treeViewInstanceNs[componentConfig.id].treeview('enableAll', { silent: true });
        if (componentConfig.isNodeExpandedByDefault === false) {
            treeViewInstanceNs[componentConfig.id].treeview('collapseAll', { silent: true });
        }

        // register event if componentConfig.topic is present
        if (componentConfig.topic) {
            eventNs.registerEvents(`${componentConfig.topic}-TAB_CHANGE`, (data) => {
                if (data.type === "SELECT_TAB") {
                    const treeViewObject = $(`#${componentConfig.id}`).data('treeview');
                    const allCollapsedNodes = treeViewObject.getCollapsed();
                    const allExpandedNodes = treeViewObject.getExpanded();
                    const allNodes = allCollapsedNodes.concat(allExpandedNodes);


                    // filter data.tab.id from allNodes
                    const filteredNodes = allNodes.filter((node) => {
                        return node.nodeId == data.tab.id;
                    });


                    // if filteredNodes is not empty then select the node
                    if (filteredNodes.length > 0) {
                        treeViewObject.expandNode(filteredNodes[0].nodeId, { silent: true });
                        treeViewObject.selectNode(filteredNodes[0].nodeId, { silent: true });
                    }

                   
                    // if the data.tab.id is null then get the selected node and un select that node and collapse them
                    if (data.tab.id === null) {
                        const selectedNodes = treeViewObject.getSelected();
                        if(selectedNodes.length > 0){
                            treeViewObject.collapseNode(selectedNodes[0].nodeId, { silent: true });
                            treeViewObject.unselectNode(selectedNodes[0].nodeId, { silent: true });
                        }
                    }


                }else if(data.type === "CLOSE_TAB"){

                    const treeViewObject = $(`#${componentConfig.id}`).data('treeview');
                    const allCollapsedNodes = treeViewObject.getCollapsed();
                    const allExpandedNodes = treeViewObject.getExpanded();
                    const allNodes = allCollapsedNodes.concat(allExpandedNodes);

                    // filter data.tab.id from allNodes
                    const filteredNodes = allNodes.filter((node) => {
                        return node.nodeId == data.tab.id;
                    });
                    

                    // if filteredNodes is not empty then select the node
                    if (filteredNodes.length > 0) {
                        treeViewObject.collapseNode(filteredNodes[0].nodeId, { silent: true });
                        treeViewObject.unselectNode(filteredNodes[0].nodeId, { silent: true });
                    }

                    
                    
                    
                }
            });

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

    ns.eventOnFilter = ($component, data) => {
        // TODO: Need to filter nodes.
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


    ns.eventOnHighlight =  ($component, data) => {
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

    ns.eventHandlers = {
        'FILTER': ns.eventOnFilter,
        'HIGHLIGHT': ns.eventOnHighlight
    };

    ns.getEventHandlerCallBackFn = ($component, event) => {
        if(!event.topic) {
            return () => {};
        }
        return (data) => ns.eventHandlers[event.type]($component, data) || (() => {});
    };

    ns.registerEvents = ($component, componentId, events) => {
        events.forEach(event => {
            eventNs.registerEvents(event.topic, ns.getEventHandlerCallBackFn($component, event));
        });
    };

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        ns.addSidebarTreeNodes($component, componentConfig);

        ns.addEventListeners($component, componentConfig);

        const events = componentConfig?.events?.map(event => {
            return {
                topic: event.key,
                type: event.value
            }
        }) || [];

        // if componentConfig.events is defined then add event listeners to table.
        if (events) {
            ns.registerEvents($component, componentConfig.id, events);
        }
    }

})(Typerefinery.Components.Widgets.Treeview, Typerefinery.Components, Typerefinery.Components.Widgets.Treeview.Instance, Typerefinery.Page.Events, Typerefinery.Components.Widgets.Search, document, window);