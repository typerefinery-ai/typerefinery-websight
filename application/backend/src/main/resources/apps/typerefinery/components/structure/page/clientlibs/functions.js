window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Theme = Typerefinery.Theme || {};
window.MessageService = window.MessageService || {};
window.MessageService.Client = MessageService.Client || {};

; (function (ns, clientNs, document, window) {
    
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
    ns.tmsConnection = () => {
        // TODO: Host should come as a arg.
        const host = "ws://localhost:8112/$tms";
        function payload_insert(data) {
            console.log("payload_insert", data);
        }
        // connect to websocket
        clientNs.connect(host, function () {
            console.log("tms connected cms.");
            window.MessageService.Client.subscribe("payload_insert", payload_insert);
        });

        // listen to messages.
        window.addEventListener(
            window.MessageService.Client.events.MESSAGE,
            function (message) {
                const messageData = message?.detail?.data?.payload;
                console.log("--------------------------MESSAGE RECEIVED ------------------------")
                console.log(messageData);
                if (messageData) {
                    const payload = JSON.parse(messageData);
                    if (payload.data) {
                        // Persisting data in the localStorage.
                        localStorage.setItem(payload.topic, JSON.stringify(payload.data));;
                        const $component = document.getElementById(payload.topic);
                        if ($component) {
                            // TODO: Need to find solution to update the module.
                            if ($component.getAttribute('data-module') === 'tickerModule') {
                                window.Typerefinery.Components.Widgets.Ticker.dataReceived(payload.data)
                            }
                        }
                    }
                }
            }
        );
    }
    ns.init = () => {
        const rootElement = document.querySelector(':root');
        ns.rootElementStyle = getComputedStyle(rootElement);
        ns.handleTheme();

        // TODO: Remove setTimeout.
        setTimeout(() => {
            ns.tmsConnection();
        }, 2500);

    };

})(window.Typerefinery.Theme, document, window);