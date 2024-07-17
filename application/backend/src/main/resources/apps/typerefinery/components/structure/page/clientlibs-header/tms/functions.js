window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};
window.MessageService = window.MessageService || {};
window.MessageService.Client = MessageService.Client || {};

(function ($, ns, clientNs, document, window) {
  "use strict";

  ns.registry = {};

  ns.persistData = (key, data) => {
     localStorage.setItem(key, data);
  };

  ns.hostAdded = (newHost) => {
    const listOfHost = JSON.parse(localStorage.getItem("tmsHost") || "[]");
    const filteredHost = listOfHost.filter((host) => host === newHost);
    if (filteredHost.length === 0) {
      listOfHost.push(newHost);
      localStorage.setItem("tmsHost", JSON.stringify(listOfHost));
    }
  };


  ns.registerToTms = (host, topic, key, callbackFn) => {
    ns.hostAdded(host);
    ns.registry[host] = ns.registry[host] || {};
    ns.registry[host][topic] = ns.registry[host][topic] || {};
    ns.registry[host][topic] = callbackFn;
    ns.registry[host][topic][key] = callbackFn;
  };

  ns.connect = () => {
    const listOfHost = JSON.parse(localStorage.getItem("tmsHost") || "[]");

    function payload_insert(data) {
      console.log(
        "--------------------------Payload Inserted ------------------------"
      );
    }

    listOfHost.forEach((host) => {
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
    window.addEventListener(clientNs?.events.MESSAGE, function (message) {
      console.groupCollapsed("tms message on " + window.location);

      console.log(["tms message", message]);
      let messagePayload = message?.detail?.data?.payload || null;
      let messageTopic = message?.detail?.data?.topic || null;
      if (messagePayload && messageTopic) {
        console.log(["tms message payload", messageTopic, messagePayload]);
        ns.persistData(messageTopic, messagePayload);
        console.log(["tms message save to local storage", messageTopic]);
        // TODO: get host from the message.
        const host = Object.entries(ns.registry)[0];
        console.log(["tms message host", host]);
        // first idx[key, values].
        if (host) {
          // grab the topic from the host.
          const hostCallbacks = host[1];
          console.log(["tms message host topic", hostCallbacks, messageTopic, hostCallbacks[messageTopic]]);
          if (hostCallbacks) {
            console.log(["tms message call topic callbacks", hostCallbacks]);
            if(hostCallbacks && hostCallbacks[messageTopic]) {
              hostCallbacks[messageTopic](JSON.parse(messagePayload));
            }
          }
        }
      }
      console.groupEnd();
    });
  };

  ns.init = () => {
    ns.connect();
  };
})(jQuery, Typerefinery.Page.Tms, MessageService.Client, document, window);
