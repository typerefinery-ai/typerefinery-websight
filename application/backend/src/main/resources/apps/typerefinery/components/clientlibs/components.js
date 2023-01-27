window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.VueData = Typerefinery.VueData || {};

;(function(ns, vueDataNs, document, window) {
    ns.registerComponent = (componentData) => {
        vueDataNs = {
            ...vueDataNs,
            componentData
        }
    };
    // TODO: Need to be removed.
    ns.getComponentData = () => {
        return {
            ...window.Typerefinery.Components.Forms.CheckBox.getData(),
            ...window.Typerefinery.Components.Forms.RadioButton.getData(),
            ...window.Typerefinery.Components.Common.BreadCrumbs.getData(),
            ...window.Typerefinery.Components.Content.DataTable.getData(),
            ...window.Typerefinery.Components.Structure.Sidebar.getData()
        }
    };
    ns.getComponentConfig = ($component) => {
        return JSON.parse($component.getAttribute('data-model') || '{}');
    };
})(window.Typerefinery.Components, window.Typerefinery.VueData, document, window);