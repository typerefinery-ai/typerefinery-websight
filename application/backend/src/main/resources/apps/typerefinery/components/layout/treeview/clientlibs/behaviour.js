
window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
Typerefinery.Components.Widgets.Treeview = Typerefinery.Components.Widgets.Treeview || {};


;(function (ns, document, window) {
    "use strict";
    $(document).ready(function () {
        $("[component='treeview']").each(function () {
            ns.init(this);
        });
    });
})(Typerefinery.Components.Widgets.Treeview, document, window);