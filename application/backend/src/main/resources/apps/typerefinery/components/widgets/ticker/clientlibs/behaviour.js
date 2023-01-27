window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Ticker = Typerefinery.Components.Widgets.Ticker || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        // TODO: Need to test jquery itr.
        $("#ticker").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Widgets.Ticker, document);
