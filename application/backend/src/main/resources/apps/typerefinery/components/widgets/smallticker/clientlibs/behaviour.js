window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.SmallTicker = Typerefinery.Components.Widgets.SmallTicker || {};

; (function (ns, document) {
    "use strict";
    $(document).ready(function () {
        document.querySelectorAll('#smallticker').forEach(function ($component) {
            ns.init($component)
        })
    });
})(window.Typerefinery.Components.Widgets.SmallTicker, document);


