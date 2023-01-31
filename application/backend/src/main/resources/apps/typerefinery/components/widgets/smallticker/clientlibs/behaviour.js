window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.smallTicker = Typerefinery.Components.Widgets.smallTicker || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $("#smallticker").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Widgets.smallTicker, document);
