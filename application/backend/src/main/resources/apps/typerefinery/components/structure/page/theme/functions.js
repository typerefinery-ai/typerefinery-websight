window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Chart = Typerefinery.Components.Widgets.Chart || {};
window.Typerefinery.Components.Widgets.Chart.Instances = Typerefinery.Components.Widgets.Chart.Instances || {};

(function(ns, chartInstances, document, window) {
    "use strict";
    ns.toggleTheme = () => {
        const themeStyles = document.getElementById("themeStyles");
        if (themeStyles) {
            const currentTheme = themeStyles.getAttribute('active') || 'dark';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            themeStyles.setAttribute("href", `/apps/typerefinery/web_root/${newTheme}.css`)          
            themeStyles.setAttribute("active", newTheme)
            localStorage.setItem("theme", newTheme);
            setTimeout(() => {
                Object.entries(chartInstances)?.forEach($chart => {
                    $chart[1]?.update();
                })
            }, 250);
        }
    };

    ns.loadInitialTheme = () => {
        const currentTheme = localStorage.getItem('theme');
        const style = document.getElementById('themeStyles');
        if (!currentTheme) {
            localStorage.setItem('theme', 'dark');
        }
        if (currentTheme === 'light') {
            style.setAttribute('active', 'light');
        } else {
            style.setAttribute('active', 'dark');
            style.setAttribute('href', `/apps/typerefinery/web_root/dark.css`);
        }
    };

    ns.attachEventListener = () => {
        console.log("attachEventListener")
        // Event Listener for toggle theme (dark | light);
        $(document).on("click", "#themeHandler", ns.toggleTheme);
    };

    ns.init = () => {
        ns.loadInitialTheme();
        const rootElement = document.querySelector(':root');
        ns.rootElementStyle = getComputedStyle(rootElement);
        ns.attachEventListener();
    };


})(Typerefinery.Page.Theme, Typerefinery.Components.Widgets.Chart.Instances, document, window);