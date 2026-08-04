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

  /**
   * Marks a message as a *request for data* rather than data itself.
   *
   * A flow publishes its payload when it starts, fire-and-forget, so a browser opened afterwards
   * receives nothing and the widget renders empty for ever (alpha-launch docs/issues/0029).
   * Decision 0003 Option A closes that with a handshake: a client with no cached payload asks on
   * its own topic, and the flow re-triggers its senddata node in response.
   *
   * The marker is what makes that safe. The flow both publishes to and subscribes on the same
   * channel, so a request must be distinguishable from a payload at both ends or the two sides
   * feed each other. This is the guard the decision calls for — the flow must only re-emit for
   * messages carrying it, and the client must never treat one as data (see the handler below).
   *
   * Deliberately generic: the platform knows nothing about what any topic carries.
   */
  ns.REQUEST_MARKER = "__typerefinery_data_request";

  ns.isDataRequest = (payload) => {
    if (!payload) return false;
    try {
      const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
      return !!(parsed && parsed[ns.REQUEST_MARKER]);
    } catch (error) {
      // A payload that is not JSON cannot be one of our requests.
      return false;
    }
  };

  /**
   * Ask whoever publishes `topic` to send its current payload.
   * No-ops (loudly) when the client cannot publish, so a cold start never fails silently.
   */
  ns.requestData = (host, topic) => {
    if (!topic) {
      console.warn("tms requestData: no topic, cannot ask for data");
      return false;
    }
    if (typeof clientNs?.publish !== "function") {
      console.warn(`tms requestData: MessageService.Client.publish unavailable, cannot ask for '${topic}'`);
      return false;
    }
    try {
      const request = { [ns.REQUEST_MARKER]: true, topic: topic, requestedAt: new Date().toISOString() };
      clientNs.publish(topic, request);
      console.log(["tms requestData: asked for a payload on cold start", host, topic, request]);
      return true;
    } catch (error) {
      console.error(["tms requestData failed", host, topic, error]);
      return false;
    }
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
        // Half of the loop guard for decision 0003 Option A: a cold-start request published by
        // this page (or by another tab) comes back on the same topic. Persisting it would
        // overwrite the cache with a request envelope and render it as data.
        if (ns.isDataRequest(messagePayload)) {
          console.log(["tms message is a data request, not data — ignoring", messageTopic]);
          console.groupEnd();
          return;
        }
        if (messagePayload && messageTopic) {
          console.log(["tms message payload", messageTopic, messagePayload]);
          ns.persistData(messageTopic, messagePayload);
          console.log(["tms message save to local storage", messageTopic]);
          // TODO: get host from the message.
          const host = Object.entries(ns.registry)[0];
          console.log(["tms message host", host, ns.registry]);
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
