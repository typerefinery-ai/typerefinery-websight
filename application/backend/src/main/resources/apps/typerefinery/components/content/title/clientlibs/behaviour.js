window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Content = Typerefinery.Components.Content || {};
window.Typerefinery.Components.Content.Title = Typerefinery.Components.Content.Title || {};

(function (ns, document, window) {
    "use strict";
    $(document).ready(function () {
        console.log('Title component Behaviour loaded');
        $('[component="title"]').each(function () {
            ns.init(this);
        });
    });
})(Typerefinery.Components.Content.Title, document, window);
