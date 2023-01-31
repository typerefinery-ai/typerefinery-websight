window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Graphs = Typerefinery.Components.Graphs || {};
window.Typerefinery.Components.Graphs.BarChart = Typerefinery.Components.Graphs.BarChart || {};
; (function (ns, document, window) {
    "use strict";

    $(document).ready(function () {
        $(".barChart").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Graphs.BarChart, document, window);
