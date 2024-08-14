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

  ns.isSystemMessage = (message) => {
    
    // if message?.detail is a type of string
    if (typeof message?.detail === "string") {
      // is message a connect message
      if (message?.detail.startsWith(ns.MESSAGE_PREFIX_OPEN)) {
        return true;
      }
      // is message a disconnect message
      if (message?.detail.startsWith(ns.MESSAGE_PREFIX_CLOSE)) {
        return true;
      }
      // is message a error message
      if (message?.detail.startsWith(ns.MESSAGE_PREFIX_ERROR)) {
        return true;
      }
    }
    //check is message has TMS welcome fields
    if (message?.detail?.call 
      && message?.detail?.name
      && message?.detail?.publish
      && message?.detail?.subscribe
      && message?.detail?.subscribers) {
        return true;
    }

    return false;
  } 

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

      //is this a message from the tms?
      if (!ns.isSystemMessage(message)) {        
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
      } else {
        console.log(["tms welcome message", message]);
      }

      console.groupEnd();
    });
  };

  ns.init = () => {
    ns.connect();
  };
})(jQuery, Typerefinery.Page.Tms, MessageService.Client, document, window);
