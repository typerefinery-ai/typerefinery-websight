window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Graphs = Typerefinery.Components.Graphs || {};
window.Typerefinery.Components.Graphs.LineChart = Typerefinery.Components.Graphs.LineChart || {};


; (function (ns, document, window) {
    "use strict";

    $(document).ready(function () {
        $(".linechart").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Graphs.LineChart, document, window);