window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Graphs = Typerefinery.Components.Graphs || {};
window.Typerefinery.Components.Graphs.PieChart = Typerefinery.Components.Graphs.PieChart || {};
; (function (ns, document, window) {
    "use strict";
console.log(this)
    $(document).ready(function () {
        $(".piechart").each(function() {
            ns.init(this);
        });
    });
})(window.Typerefinery.Components.Graphs.PieChart, document, window);
