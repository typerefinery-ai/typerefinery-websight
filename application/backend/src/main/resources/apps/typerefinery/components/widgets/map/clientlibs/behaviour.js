window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Map = Typerefinery.Components.Widgets.Map || {};
window.Typerefinery.Components.Widgets.Map.LeafletMap = Typerefinery.Components.Widgets.Map.LeafletMap || {};
console.log("behaviour.js")
;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $("[component='map']").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Widgets.Map.LeafletMap, document);
