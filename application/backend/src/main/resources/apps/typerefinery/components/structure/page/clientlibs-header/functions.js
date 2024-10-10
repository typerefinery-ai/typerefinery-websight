window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};

(function ($, ns, themeNs, tmsNs, document, window) {

    "use strict";
    ns.init = () => {
        console.group("page init on " + window.location);
        tmsNs.init();
        // Commenting this because themeNs init is invoked if the theme Button is linked to the page.
        // themeNs.init();
        console.groupEnd();
    };

    $(document).ready(function () {
        ns.init();
    });
})(jQuery, Typerefinery.Page, Typerefinery.Page.Theme, Typerefinery.Page.Tms, document, window);