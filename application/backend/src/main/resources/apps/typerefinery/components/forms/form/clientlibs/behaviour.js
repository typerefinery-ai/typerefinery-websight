window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Form = Typerefinery.Components.Forms.Form || {};

(function ($, ns, document) {
    "use strict";
    $(document).ready(function () {
        $('[component="form"]').each(function () {
            ns.init($(this));
        });
    });
})(jQuery, window.Typerefinery.Components.Forms.Form, document);
