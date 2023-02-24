window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layouts = Typerefinery.Components.Layouts || {};
window.Typerefinery.Components.Layouts.Sidebar = Typerefinery.Components.Layouts.Sidebar || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $("#sidebar").each(function () {
            ns.init(this);
        });
        // If sidebar doesn't exist, them remove the sidebar open button from the header.
        if(!document.getElementById("sidebar")) {
            document.getElementById("sidebarCollapse").style = "display: none";
        }
    });
})(window.Typerefinery.Components.Layouts.Sidebar, document);
