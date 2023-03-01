window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Input = Typerefinery.Components.Forms.Input || {};

(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $("#field").each(function () {
            const input = this.getElementsByTagName("input");
            if(input.length > 0)
                ns.init(input[0]);
        });
    });
})(window.Typerefinery.Components.Forms.Input, document);
