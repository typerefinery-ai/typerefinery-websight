window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Table = Typerefinery.Components.Widgets.Table || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $("[component='table']").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Widgets.Table, document);
