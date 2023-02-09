window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};


(function (ns, themeNs, tmsNs, document, window) {

    "use strict";
    ns.updateTheme = () => {
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


    ns.toggleTheme = () => {
        const themeStyles = document.getElementById("themeStyles");
        if (themeStyles) {
            const currentTheme = themeStyles.getAttribute('active') || 'dark';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            themeStyles.setAttribute("active", newTheme)
            themeStyles.setAttribute("href", `/apps/typerefinery/web_root/${newTheme}.css`)
            localStorage.setItem("theme", newTheme);
            setTimeout(() => {
                Object.entries(chartInstances).forEach($chart => {
                    $chart[1]?.update();
                })
            }, 15);
        }
    }

    ns.init = () => {
        const rootElement = document.querySelector(':root');
        themeNs.rootElementStyle = getComputedStyle(rootElement);

        // Event Listener for toggle theme (dark | light);
        $("#themeHandler").click(function () {
            ns.toggleTheme();
        });

        tmsNs.init();
        ns.updateTheme();
    };

    $(document).ready(function () {
        ns.init();
    });

})(Typerefinery.Page, Typerefinery.Page.Theme, Typerefinery.Page.Tms, document, window);