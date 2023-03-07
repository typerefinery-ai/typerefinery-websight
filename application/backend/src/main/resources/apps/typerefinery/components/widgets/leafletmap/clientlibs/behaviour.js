window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.LeafletMap = Typerefinery.Components.Widgets.LeafletMap || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $("[component='leafletmap']").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Widgets.LeafletMap, document);
