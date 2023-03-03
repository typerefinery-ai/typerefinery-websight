window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Button = Typerefinery.Components.Forms.Button || {};

(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        document.querySelectorAll('[component="button"]').forEach(function ($component) {
            ns.init($component);
            console.log("$component",$component);
        });
    });
})(window.Typerefinery.Components.Forms.Button, document);
