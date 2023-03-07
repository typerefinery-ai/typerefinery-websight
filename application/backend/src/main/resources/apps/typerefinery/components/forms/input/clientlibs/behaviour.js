window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Input = Typerefinery.Components.Forms.Input || {};

(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        // Input mask will be added for all input tag.
        $(":input").inputmask();
    });
})(window.Typerefinery.Components.Forms.Input, document);
