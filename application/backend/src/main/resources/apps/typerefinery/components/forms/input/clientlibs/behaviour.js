window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Input = Typerefinery.Components.Forms.Input || {};

(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        document.querySelectorAll("#field").forEach(($fieldComponent) => {
            const $input = $fieldComponent.querySelector("input");
            ns.init($input);
        })
    });
})(window.Typerefinery.Components.Forms.Input, document);
