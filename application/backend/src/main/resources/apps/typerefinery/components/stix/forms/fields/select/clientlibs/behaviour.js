window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Stix = Typerefinery.Components.Stix || {};
window.Typerefinery.Components.Stix.Forms = Typerefinery.Components.Stix.Forms || {};
window.Typerefinery.Components.Stix.Forms.Select = Typerefinery.Components.Stix.Forms.Select || {};

;(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $("[component='stix-select']").each(function () {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Stix.Forms.Select, document);
