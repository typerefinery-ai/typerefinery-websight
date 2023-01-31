window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.smallTicker = Typerefinery.Components.Widgets.smallTicker || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        console.log("hello smallticker")
        // TODO: Need to test jquery itr.
        $("#smallticker").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Widgets.smallTicker, document);
