window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.MonacoEditor = Typerefinery.Components.Forms.MonacoEditor || {};

(function (ns, document) {
    "use strict";
    $(document).ready(function () {
        $('[component=monacoeditor]').each(function () {
            ns?.init(this);
        });
    });
})(Typerefinery.Components.Forms.MonacoEditor, document);
