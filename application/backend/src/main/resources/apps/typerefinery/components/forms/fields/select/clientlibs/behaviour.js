window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Select = Typerefinery.Components.Forms.Select || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $("[component='select']").each(function () {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Forms.Select, document);
