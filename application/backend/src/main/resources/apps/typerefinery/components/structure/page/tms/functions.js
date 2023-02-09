window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};
window.MessageService = window.MessageService || {};
window.MessageService.Client = MessageService.Client || {};

(function (ns, clientNs, document, window) {
    "use strict";

    ns.registery = {};

    ns.persistData = (key, data) => {
        localStorage.setItem(key, data);
    };
    
    
    ns.hostAdded = (newHost) => {
        console.log("new host", newHost)
        const listOfHost = JSON.parse(localStorage.getItem("tmsHost") || '[]');
        const filteredHost = listOfHost.filter(host => host === newHost);
        if (filteredHost.length === 0) {
            listOfHost.push(newHost);
            localStorage.setItem("tmsHost", JSON.stringify(listOfHost));
        }
    }

    ns.persistMessagePayloadData = (message) => {
        let payload = message?.detail?.data?.payload || null;
        if (payload) {
            payload = JSON.parse(payload);
            if (payload.data) {
                ns.persistData(payload.topic, JSON.stringify(payload.data));
                return payload;
            }
        }
        return null;
    };

    ns.registerToTms = (host, topic, key, callbackFn) => {
        ns.hostAdded(host);
        ns.registery[host] = ns.registery[host] || {};
        ns.registery[host][topic] = ns.registery[host][topic] || {};
        ns.registery[host][topic][key] = callbackFn;
    };

    ns.getCbFromNs = (key) => {
    };

    ns.connect = () => {
        const listOfHost = JSON.parse(localStorage.getItem("tmsHost") || '[]');

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
                let payload = message?.detail?.data?.payload || null;
                if (payload) {
                    payload = JSON.parse(payload);
                    if(!payload.topic || !payload.data) {
                        return;
                    }
                    ns.persistData(payload.topic, JSON.stringify(payload.data));
                    // TODO: get host from the message.
                    const host = Object.entries(ns.registery)[0];
                    
                    if(host) {
                        try{
                            const listOfRegisteredComponents = Object.entries(ns.registery[host[0]]);
                            listOfRegisteredComponents.forEach(item => {
                                if(item[0] === payload.topic) {
                                    const listOfCallbacks = Object.values(item[1]);
                                    listOfCallbacks.forEach(callback => callback(payload.data));
                                }
                            })
                        }catch(error){

                        }
                    }
                }
            }
        );

        
    };

    ns.init = () => {
        ns.connect();
    };
})(Typerefinery.Page.Tms, MessageService.Client, document, window);