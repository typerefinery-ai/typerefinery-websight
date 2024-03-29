window.Typerefinery = window.Typerefinery || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function (ns, document, window) {
    "use strict";

    ns.registery = {};

    ns.emitEvent = (topic, payload) => {
        const evt = document.createEvent('customEvent');
        evt.initCustomEvent('customEvent', false, false, { topic, payload });
        ns.socket.dispatchEvent(evt);
    };

    ns.createWebSocketConnection = () => {
        ns.socket = new EventTarget();
    };

    ns.socketListener = () => {
        ns.socket.addEventListener('customEvent', (e) => {
            const detail = e.detail;
            const { topic, payload } = detail;

            if (ns.registery[topic]) {
                ns.registery[topic].forEach((callbackFn) => {
                    if (typeof callbackFn === 'function') {
                        callbackFn(payload);
                    }
                });
            }
        });
    };

    ns.registerEvents = (topic, callbackFn) => {
        if (!ns.registery[topic]) {
            ns.registery[topic] = [callbackFn];
        } else {
            // push to array
            ns.registery[topic].push(callbackFn);
        }
    };


    ns.init = () => {
        // NOTE: socket in this ns is a custom event. It is not a websocket.
        ns.createWebSocketConnection();
        ns.socketListener();
    };

    // document ready jquery
    $(document).ready(() => {
        ns.init();
    });
})(Typerefinery.Page.Events, document, window);
