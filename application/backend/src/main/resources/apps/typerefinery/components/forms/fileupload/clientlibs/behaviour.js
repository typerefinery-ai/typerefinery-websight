window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
Typerefinery.Components.Forms.Fileupload = Typerefinery.Components.Forms.Fileupload || {};

(function (ns, document, window) {
    "use strict";
    $(document).ready(function () {
        $('[component="fileupload"]').each(function () {
            console.log('fileupload', this);
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Forms.Fileupload, document, window);
