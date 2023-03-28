window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Table = Typerefinery.Components.Widgets.Table || {};
window.Typerefinery.Components.Widgets.Search = Typerefinery.Components.Widgets.Search || {};

; (function (ns, componentNs, tableNs, document, window) {
    "use strict";

    ns.onTableSearch = ($component, componentConfig, componentIdToSearch) => {
        
        let data = { ...tableNs[componentIdToSearch] };

        // the value of the input to be searched.
        const valueToBeSearched = document.getElementById(componentConfig.id).value;

        console.log(data, valueToBeSearched)

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

    }

    ns.init = ($component) => {
        console.log($component);
        const componentConfig = componentNs.getComponentConfig($component);
        const componentIdToSearch = componentConfig.componentId;


        if(componentConfig.componentType === "TABLE") {
            ns.onInputEventListener($component, () => ns.onTableSearch($component, componentConfig, componentIdToSearch));
        }

        
    };
})(Typerefinery.Components.Widgets.Search, Typerefinery.Components, Typerefinery.Components.Widgets.Table, document, window);
