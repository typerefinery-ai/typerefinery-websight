window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};
// Tms.Cb refers to callback.
window.Typerefinery.Page.Tms.Cb = Typerefinery.Page.Tms.Cb || {};
window.MessageService = window.MessageService || {};
window.MessageService.Client = MessageService.Client || {};

(function (ns, componentNs, clientNs, tmsCbNs, document, window) {
    "use strict";

    

    ns.persistData = (key, data) => {
        localStorage.setItem(key, data);
    };
    
    
    ns.hostAdded = (newHost) => {
        const listOfHost = JSON.parse(localStorage.getItem("tmsHost") || '[]');
        const filteredHost = listOfHost.filter(host => host === newHost);
        if (filteredHost.length === 0) {
            listOfHost.push(newHost);
            localStorage.setItem("tmsHost", JSON.stringify(listOfHost));
        }
    }

    ns.validateMessage = (message) => {
        message = message?.detail?.data?.payload || null;
        if (message) {
            const payload = JSON.parse(message);
            if (payload.data) {
                ns.persistData(payload.topic, JSON.stringify(payload.data));;
                const $component = document.getElementById(payload.topic);
                if($component) {
                    return {
                        data: payload.data,
                        $component
                    };
                }
            }
        }
        return null;
    };

    ns.registerToTms = (key, cb) => {
        tmsCbNs[key] = cb;
    };

    ns.getCbFromNs = (key) => {
        return tmsCbNs[key] || null;
    };

    ns.connect = () => {
        const listOfHost = JSON.parse(localStorage.getItem("tmsHost") || '');

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
                console.error(error);
            }

        });


            // listen to messages.
        window.addEventListener(
            clientNs?.events.MESSAGE,
            function (message) {
                console.log("--------------------------MESSAGE RECEIVED ------------------------")
                const validatedPayload = ns.validateMessage(message);
                if(validatedPayload !== null) {
                    const { $component, data } = validatedPayload;
                    const componentConfig = componentNs.getComponentConfig($component);
                    const cb = ns.getCbFromNs(componentConfig.path || componentConfig.resourcePath);
                    if(cb) {
                        cb(data, $component);
                    }
                }
            }
        );

        
    };

    ns.init = () => {
        ns.connect();
    };
})(Typerefinery.Page.Tms, Typerefinery.Components, MessageService.Client, Typerefinery.Page.Tms.Cb, document, window);