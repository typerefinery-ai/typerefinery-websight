
console.log("client.js loaded")

window.MessageService = {}
// eslint-disable-next-line no-undef
window.MessageService.Config = MessageService.Config || {}
// eslint-disable-next-line no-undef
window.MessageService.Client = MessageService.Client || {}
  ; (function (ns, JSONSchemas, document, window) {
    ns.publishers = {}
    ns.subscribers = {}
    ns.callbacks = {}
    ns.metaReady = false
    ns.dataToSend = []
    ns.callTimeout = 10000
    ns.meta = undefined
    ns.events = {
      READY: "messageservice:ready",
      CLIENT_ID: "messageservice:clientid",
      MESSAGE: "messageservice:message",
      ERROR: "messageservice:error",
      emit: function (eventName, data) {
        if (eventName && document?.body) {
          document?.body?.dispatchEvent(
            new CustomEvent(eventName, {
              bubbles: true,
              cancelable: true,
              composed: true,
              detail: data || {},
            })
          )
        } else {
        }
      },
    }

    function init() {
      ns.client_id = Date.now()

      // output id to page
      ns.events.emit(ns.events.CLIENT_ID, ns.client_id)
    }

    //get metadata field messagehost
    ns.connect = function (host, callback) {
      if (typeof host !== "string") {
        ns.events.emit(ns.events.ERROR, `host "${host}" is not a string.`)
        return
      }
      ns.ws = new WebSocket(host)

      ns.ws.onopen = function (e) {
        ns.logMessage("[open] Connection established cms")
      }
      ns.ws.onerror = function (error) {
        var message = JSON.stringify(error)
        ns.logMessage(`[error] ${message}`)
      }
      ns.ws.onmessage = function (event) {
        var message = JSON.parse(event.data)
        var messageType = message.type
        if (messageType === "call") {
          var messageId = message.id
          var callbackId = message.callbackid
          let callback = ns.callbacks[callbackId]
          if (callbackId && callback) {
            callback.callback(
              message.error ? message.data : null,
              message.success ? message.data : null
            )
            if (callback.timeout) {
              clearTimeout(callback.timeout)
            }
            delete ns.callbacks[callbackId]
          }
        } else if (
          messageType === "publish" &&
          ns.subscribers[messageId] &&
          ns.publishers[messageId]
        ) {
          // TODO: handle publish - send message to server
          var publisherSchema = ns.publishers[messageId]
          var err = []
          var data = JSONSchemas.transform(
            publisherSchema,
            err,
            message.data,
            true
          )
          if (data) {
            for (var fn of ns.subscribers[messageId]) {
              fn(data)
            }
          }
        } else if (messageType === "meta") {
          ns.meta = message
          ns.publishers = {}
          //get list of pubishers schema from metadata
          for (var item of message.publish) {
            ns.publishers[item.id] = item.schema
          }
          //sync subscribers
          ns.syncSubscribers()
          ns.metaReady = true
          // call connect callback with websocket and metadata
          if (callback) {
            setTimeout(callback, 0)
          }
          ns.events.emit(ns.events.READY, message)
        }
        ns.logMessage(message)
      }
    }

    ns.logMessage = function (text) {
      ns.events.emit(ns.events.MESSAGE, text)
    }

    ns.isReady = function () {
      return ns.ws.readyState === WebSocket.OPEN && ns.metaReady
    }

    ns.startSendDataTimeout = function () {
      ns.sendDataTimeout = setTimeout(ns.sendData, 50, null)
    }
    ns.clearSendDataTimeout = function () {
      if (ns.sendDataTimeout) {
        clearTimeout(ns.sendDataTimeout)
        ns.sendDataTimeout = null
      }
    }

    ns.call = function (name, data, callback, timeout) {
      if (callback) {
        ns.sendCall(name, data, callback, timeout)
      } else {
        return new Promise(function (resolve, reject) {
          ns.sendCall(name, data, function (err, data) {
            if (err) {
              reject(err)
            } else {
              resolve(data)
            }
          })
        })
      }
    }

    ns.timeoutHandler = function (callbackId) {
      var callback = ns.callbacks[callbackId]
      if (callback) {
        callback.callback("Timeout")
        delete ns.callbacks[callbackId]
      }
    }

    ns.sendCall = function (name, data, callback, timeout) {
      if (ns.isReady()) {
        var callbackId = Date.now()
        ns.callbacks[callbackId] = {
          callback: callback,
          timeout: setTimeout(
            ns.timeoutHandler,
            timeout || ns.callTimeout,
            callbackId + ""
          ),
        }
        ns.sendData(
          JSON.stringify({
            type: "call",
            id: name,
            data: data,
            callbackid: callbackId,
          })
        )
      } else {
        callback("Not connected")
      }
    }

    ns.sendData = function (data, force) {
      if (ns.isReady() || force) {
        if (data === null && ns.dataToSend.length > 0) {
          ns.ws.send(ns.dataToSend.shift())
          ns.startSendDataTimeout()
        } else if (data !== null) {
          ns.ws.send(data)
        } else {
          ns.clearSendDataTimeout()
        }
      } else {
        ns.dataToSend.push(data)
      }
    }

    ns.startSyncSubscribersTimeout = function () {
      ns.syncSubscribersTimeout = setTimeout(ns.syncSubscribers, 50, true)
    }
    ns.clearSyncSubscribersTimeout = function () {
      if (ns.syncSubscribersTimeout) {
        clearTimeout(ns.syncSubscribersTimeout)
        ns.syncSubscribersTimeout = null
      }
    }

    //send data to server
    ns.publish = function (name, data) {
      ns.sendData(JSON.stringify({ type: "subscribe", id: name, data: data }))
    }
    //subscribe to data from server
    ns.subscribe = function (name, callback) {
      ns.clearSyncSubscribersTimeout()
      ns.startSyncSubscribersTimeout()
      if (ns.subscribers[name]) {
        ns.subscribers[name].push(callback)
      } else {
        ns.subscribers[name] = [callback]
      }
    }

    ns.syncSubscribers = function (force) {
      ns.clearSyncSubscribersTimeout()
      var keys = Object.keys(ns.subscribers)
      if (force || keys.length) {
        ns.sendData(
          JSON.stringify({ type: "subscribers", subscribers: keys }),
          force
        )
      } else {
        ns.sendData(JSON.stringify({ type: "subscribers", subscribers: [] }))
      }
    }

    init()
  })(window.MessageService.Client, window.JSONSchemas, document, window)