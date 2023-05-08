window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};


(function (ns, themeNs, tmsNs, document, window) {

    "use strict";
    ns.init = () => {
        tmsNs.init();
        // Commenting this because themeNs init is invoked if the theme Button is linked to the page.
        // themeNs.init();
    };

    $(document).ready(function () {
        ns.init();
    });
})(Typerefinery.Page, Typerefinery.Page.Theme, Typerefinery.Page.Tms, document, window);