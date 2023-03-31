window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Tab = Typerefinery.Components.Tab || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $("[component='tab']").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Tab, document);
