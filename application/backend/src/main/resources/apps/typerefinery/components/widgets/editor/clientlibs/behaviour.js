window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Editor = Typerefinery.Components.Widgets.Editor || {};

(function (ns, document) {
    "use strict";
    $(document).ready(function () {
      console.log('Editor component Behaviour loaded');
        $('[component=editor]').each(function () {
            ns?.init(this);
        });
    });
})(Typerefinery.Components.Widgets.Editor, document);
