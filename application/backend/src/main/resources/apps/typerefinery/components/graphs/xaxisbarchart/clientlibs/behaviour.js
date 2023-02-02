window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Graphs = Typerefinery.Components.Graphs || {};
window.Typerefinery.Components.Graphs.XAxisBarChart = Typerefinery.Components.Graphs.XAxisBarChart || {};


; (function (ns, document, window) {
    "use strict";

    $(document).ready(function () {
        $(".xaxisbarchart").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Graphs.XAxisBarChart, document, window);
