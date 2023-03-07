
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layout = Typerefinery.Components.Layout || {};
window.Typerefinery.Components.Layout.Sidebar = Typerefinery.Components.Layout.Sidebar || {};


;(function (ns, document, window) {
    "use strict";
    $(document).ready(function () {
        $("[component='sidebar']").each(function () {
            ns.init(this);
        });
    });
})(Typerefinery.Components.Layout.Sidebar, document, window);