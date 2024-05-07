window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Stix = Typerefinery.Components.Stix || {};
window.Typerefinery.Components.Stix.Forms = Typerefinery.Components.Stix.Forms || {};
window.Typerefinery.Components.Stix.Forms.Composite = Typerefinery.Components.Stix.Forms.Composite || {};

(function ($, ns, document) {
    "use strict";
    $(document).ready(function () {
        console.log('Stix Composite component Behaviour loaded');
        $("[component='stix-composite']").each(function () {
            ns.init(this);
        });
    });
})(jQuery, window.Typerefinery.Components.Stix.Forms.Composite, document);
