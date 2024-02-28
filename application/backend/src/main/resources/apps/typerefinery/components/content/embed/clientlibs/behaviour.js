window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Content = Typerefinery.Components.Content || {};
window.Typerefinery.Components.Content.Embed = Typerefinery.Components.Content.Embed || {};

(function (ns, document, window) {
    "use strict";
    $(document).ready(function () {
        console.log('Embed component Behaviour loaded');
        $('[component="embed"]').each(function () {
            ns.init(this);
        });
    });
})(Typerefinery.Components.Content.Embed, document, window);
