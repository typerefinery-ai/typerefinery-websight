window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.SmallTicker = Typerefinery.Components.Widgets.SmallTicker || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $("#smallticker").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Widgets.SmallTicker, document);
