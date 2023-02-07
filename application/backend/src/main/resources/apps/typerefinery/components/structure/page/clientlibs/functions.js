window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Theme = Typerefinery.Theme || {};
window.MessageService = window.MessageService || {};
window.MessageService.Client = MessageService.Client || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Charts = Typerefinery.Components.Widgets.Charts || {};
window.Typerefinery.Components.Widgets.Charts.Instances = Typerefinery.Components.Widgets.Charts.Instances || {};

; (function (ns, themeNs, clientNs, componentNs, chartInstances, document, window) {

    "use strict";
    ns.handleTheme = () => {
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
    ns.hostAdded = (newHost) => {
        const listOfHost = JSON.parse(localStorage.getItem("tmsHost") || '[]');
        const filteredHost = listOfHost.filter(host => host === newHost);
        if (filteredHost.length === 0) {
            listOfHost.push(newHost);
            localStorage.setItem("tmsHost", JSON.stringify(listOfHost));
        }
    }
    ns.tmsConnection = () => {
        const listOfHost = JSON.parse(localStorage.getItem("tmsHost") || '["ws://localhost:8112/$tms"]')

        function payload_insert(data) {
            console.log("--------------------------Payload Inserted ------------------------");
        }

        listOfHost.forEach(host => {
            try {
                // connect to websocket
                clientNs?.connect(host, function () {
                    clientNs?.subscribe("payload_insert", payload_insert);
                });
            } catch (error) {
                console.log("page/clientlibs/functions");
                console.error(error);
            }

        })


        // listen to messages.
        window.addEventListener(
            clientNs?.events.MESSAGE,
            function (message) {
                const messageData = message?.detail?.data?.payload;
                console.log("--------------------------MESSAGE RECEIVED ------------------------")
                if (messageData) {
                    const payload = JSON.parse(messageData);
                    if (payload.data) {
                        // Persisting data in the localStorage.
                        localStorage.setItem(payload.topic, JSON.stringify(payload.data));;
                        const $component = document.getElementById(payload.topic);
                        if ($component) {
                            if ($component.getAttribute('data-module') === 'tickerComponent') {
                                componentNs?.Widgets?.Ticker?.dataReceived(payload.data, $component)
                            } else if ($component.getAttribute('data-module') === 'chartComponent') {
                                componentNs?.Widgets?.Chart?.dataReceived(payload.data, $component)
                            } else if ($component.getAttribute('data-module') === 'tableComponent') {
                                componentNs?.Widgets?.Table?.dataReceived(payload.data, $component);
                            }
                        }
                    }
                }
            }
        );
    }

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
        ns.handleTheme();

        $("#themeHandler").click(function () {
            ns.toggleTheme();
        });

        // TODO: Remove setTimeout.
        setTimeout(() => {
            ns.tmsConnection();
        }, 5000);

    };

})(window.Typerefinery, window.Typerefinery.Theme, window.MessageService.Client, window.Typerefinery.Components, window.Typerefinery.Components.Widgets.Charts.Instances, document, window);