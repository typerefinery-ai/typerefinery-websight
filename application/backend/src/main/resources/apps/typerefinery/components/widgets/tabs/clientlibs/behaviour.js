window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
Typerefinery.Components.Widgets.Tab = Typerefinery.Components.Widgets.Tab || {};

;(function (ns, document, window) {
    "use strict";
    $(document).ready(function () {
        $("[component='tabs']").each(function() {
            ns.init(this);
        });
    });
})(Typerefinery.Components.Widgets.Tab, document, window);
