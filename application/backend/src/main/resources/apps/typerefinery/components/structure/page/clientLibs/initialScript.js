
window.Typerefinery = {};
window.Typerefinery.Components = {};
window.Vue = Vue;
window.Typerefinery.Components = {
    getComponentData: function() {
        return {
            ...window.Typerefinery.Components.Forms.CheckBox.getData(),
            ...window.Typerefinery.Components.Forms.RadioButton.getData(),
            ...window.Typerefinery.Components.Common.BreadCrumbs.getData(),
            ...window.Typerefinery.Components.Content.DataTable.getData(),
            ...window.Typerefinery.Components.Structure.Sidebar.getData()
        }
    },
    Forms: {
        CheckBox: {},
        RadioButton: {}
    },
    Common: {
        BreadCrumbs: {}
    },
    Content: {
        DataTable: {}
    },
    Structure: {
        Sidebar: {}
    },
    Graphs: {},
    Widgets: {
        Ticker: {}
    }
};