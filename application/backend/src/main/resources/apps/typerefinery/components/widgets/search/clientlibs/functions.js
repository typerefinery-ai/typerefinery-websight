window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Table = Typerefinery.Components.Widgets.Table || {};
window.Typerefinery.Components.Widgets.Search = Typerefinery.Components.Widgets.Search || {};
window.Typerefinery.Components.Widgets.Treeview = Typerefinery.Components.Widgets.Treeview || {};
window.Typerefinery.Components.Widgets.Treeview.Instances = Typerefinery.Components.Widgets.Treeview.Instances || {};

; (function (ns, componentNs, tableNs, treeViewInstanceNs, document, window) {
    "use strict";

    ns.onTableSearch = ($component, componentConfig, componentIdToSearch) => {
        
        let data = { ...tableNs[componentIdToSearch] };

        // the value of the input to be searched.
        const valueToBeSearched = document.getElementById(componentConfig.id).value;


        // the rows which are matching the value of the input.
        data.data = tableNs[componentIdToSearch].data.filter((row) => {
            return Object.values(row).some((value) => {
                return value.toString().toLowerCase().includes(valueToBeSearched.toLowerCase());
            });
        });

        tableNs.updateComponentHTML(componentIdToSearch, data, document.getElementById(componentIdToSearch), true);
    };

    ns.debounce = (fn, delay) => {
        let timerId;
        return function (...args) {
            if (timerId) {
                clearTimeout(timerId);
            }
            timerId = setTimeout(() => {
                fn.apply(this, args);
                timerId = null;
            }, delay);
        };
    };

    ns.onInputEventListener = ($component, callbackFn) => {
       
        // if the input is not found, we don't need to add the event listener.
        if (!$component || callbackFn === undefined) {
            return;
        }
        // add the event listener to the input with debounce.
        $component.addEventListener("input", ns.debounce(callbackFn, 500));

    };

    ns.onTreeViewSearch = ($component, componentConfig, componentIdToSearch) => {
        const valueToBeSearched = document.getElementById(componentConfig.id).value;
        treeViewInstanceNs[componentIdToSearch].treeview('clearSearch');
        treeViewInstanceNs[componentIdToSearch].treeview('search', [valueToBeSearched, {
            ignoreCase: true,     // case insensitive
            exactMatch: false,    // like or equals
            revealResults: true,  // reveal matching nodes
        }]);
    };

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        const componentIdToSearch = componentConfig.componentId;


        if(componentConfig.componentType === "TABLE") {
            ns.onInputEventListener($component, () => ns.onTableSearch($component, componentConfig, componentIdToSearch));
        }else if(componentConfig.componentType === "TREEVIEW") {
            console.log("TREEVIEW")
            ns.onInputEventListener($component, () => ns.onTreeViewSearch($component, componentConfig, componentIdToSearch));
        }

        
    };
})(Typerefinery.Components.Widgets.Search, Typerefinery.Components, Typerefinery.Components.Widgets.Table, Typerefinery.Components.Widgets.Treeview.Instance, document, window);
