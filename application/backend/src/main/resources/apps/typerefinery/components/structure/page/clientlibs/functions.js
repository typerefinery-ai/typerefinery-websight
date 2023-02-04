window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Theme = Typerefinery.Theme || {};
window.MessageService = window.MessageService || {};
window.MessageService.Client = MessageService.Client || {};

; (function (ns, themeNs, clientNs, componentNs, document, window) {
    
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
        const listOfHost = JSON.parse(localStorage.getItem("tmsHost") || '');
        const filteredHost = listOfHost.filter(host => host === newHost);
        if(filteredHost.length === 0) {
            listOfHost.push(newHost);
            localStorage.setItem(JSON.parse(listOfHost));
        }
    }
    ns.tmsConnection = () => {
        const listOfHost = JSON.parse(localStorage.getItem("tmsHost") || '["ws://localhost:8112/$tms"]')
        
        function payload_insert(data) {
            console.log("--------------------------Payload Inserted ------------------------");
        }

        listOfHost.forEach(host => {
            // connect to websocket
            clientNs?.connect(host, function () {
                clientNs?.subscribe("payload_insert", payload_insert);
            });
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
                            }else if ($component.getAttribute('data-module') === 'linechartComponent') {
                                componentNs?.Graphs?.LineChart?.dataReceived(payload.data, $component)
                            }else if ($component.getAttribute('data-module') === 'piechartComponent') {
                                componentNs?.Graphs?.PieChart?.dataReceived(payload.data, $component)
                            }else if ($component.getAttribute('data-module') === 'xaxisbarchartComponent') {
                                componentNs?.Graphs?.XAxisBarChart?.dataReceived(payload.data, $component)
                            }else if ($component.getAttribute('data-module') === 'barchartComponent') {
                                componentNs?.Graphs?.BarChart?.dataReceived(payload.data, $component);
                            }else if ($component.getAttribute('data-module') === 'tableComponent') {
                                componentNs?.Widgets?.Table?.dataReceived(payload.data, $component);
                            }
                        }
                    }
                }
            }
        );
    }
    ns.init = () => {
        const rootElement = document.querySelector(':root');
        themeNs.rootElementStyle = getComputedStyle(rootElement);
        ns.handleTheme();

        // TODO: Remove setTimeout.
        setTimeout(() => {
            ns.tmsConnection();
        }, 5000);

    };

})(window.Typerefinery, window.Typerefinery.Theme, window.MessageService.Client, window.Typerefinery.Components, document, window);