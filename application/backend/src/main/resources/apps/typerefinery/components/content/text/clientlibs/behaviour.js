window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Content = Typerefinery.Components.Content || {};
window.Typerefinery.Components.Content.Text = Typerefinery.Components.Content.Text || {};

(function (ns, document, window) {
    "use strict";
    $(document).ready(function () {
        console.log('Text component Behaviour loaded');
        $('[component="text"]').each(function () {
            ns.init(this);
        });
    });
})(Typerefinery.Components.Content.Text, document, window);
