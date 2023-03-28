window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Search = Typerefinery.Components.Widgets.Search || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $("[component='search']").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Widgets.Search, document);
