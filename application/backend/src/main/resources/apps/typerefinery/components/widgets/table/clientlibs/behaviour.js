window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Table = Typerefinery.Components.Widgets.Table || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $("#table").each(function() {
            console.log("FETCHING TABLE 123");
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Widgets.Table, document);
