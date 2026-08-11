// @ts-check
window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Content = Typerefinery.Components.Content || {};
Typerefinery.Components.Content.Embed =
    Typerefinery.Components.Content.Embed || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Events = Typerefinery.Page.Events || {};

(function (
    $,
    ns,
    componentNs,
    eventNs,
    tmsNs,
    modalNs,
    formNs,
    document,
    window
) {
    "use strict";

    ns.selectorComponent = "[component=embed]";

    ns.selectorFrame = "iframe";

    ns.ACTION_EVENT_PROXY = "EVENT_PROXY"; //emmit event from iframe as if it was raised by this component
    ns.ACTION_DATA_REQUEST = "DATA_REQUEST"; //request data by iframe
    ns.ACTION_DATA_PAYLOAD = "DATA_PAYLOAD"; //deliver data to iframe
    ns.ACTION_DATA_SOURCE = "DATA_SOURCE"; //change source for iframe
    ns.ACTION_DATA_REFRESH = "DATA_REFRESH"; //notify iframe to refresh data
    ns.ACTION_OPEN_FORM_MODAL = "OPEN_FORM_MODAL"; //open form in iframe

    //actions supported by this component
    ns.ACTIONS = {
        EVENT_PROXY: ns.ACTION_EVENT_PROXY,
        DATA_REQUEST: ns.ACTION_DATA_REQUEST,
        DATA_PAYLOAD: ns.ACTION_DATA_PAYLOAD,
        DATA_SOURCE: ns.ACTION_DATA_SOURCE,
        DATA_REFRESH: ns.ACTION_DATA_REFRESH,
        OPEN_FORM_MODAL: ns.ACTION_OPEN_FORM_MODAL,
    };

    ns.messageNameFormSubmit = "ts.form.submit";
    ns.messageNameFormSuccess = "ts.form.success";
    ns.messageNameFormCancel = "ts.form.cancel";
    ns.messageNameFormError = "ts.form.error";
    ns.messageNameFormUnknown = "ts.form.unknown";
    ns.messageNameFormLoadData = "ts.form.loaddata";

    ns.MESSAGE_NAMES = {
        FORM_SUBMIT: ns.messageNameFormSubmit,
        FORM_SUCCESS: ns.messageNameFormSuccess,
        FORM_CANCEL: ns.messageNameFormCancel,
        FORM_ERROR: ns.messageNameFormError,
        FORM_UNKNOWN: ns.messageNameFormUnknown,
        FORM_LOAD_DATA: ns.messageNameFormLoadData,
    };

    ns.WINDOW_LISTENER_MESSAGE = "message";
    ns.COMPONENT_LISTENER_LOAD = "load";

    //TODO: need to add code to allow for this, if event has this in config
    ns.EVENT_CONFIG_NAME_MONITOR_FORM_EVENTS = "monitorformevents";

    // if event has this in config then we need to monitor page events for this event
    ns.EVENT_CONFIG_NAME_MONITOR_PAGE_EVENTS = "monitorpageevents";

    // map of component listeners to hold abortcontrollers for each listener across all components in this namespace on this page
    ns.componentListeners = new Map();

    // map event types to handlers in component
    // this will indicate which events are supported by component
    ns.eventMap = eventNs.genericEventsTopicMap();

    // change src for iframe
    ns.updateDataSource = ($component, eventData) => {
        console.group("updateDataSource");
        console.log(["updateDataSource", $component, eventData]);

        //try find some source url in the eventData, under config is prefered
        let sourceUrl = eventData.config.source || eventData.source;

        console.log(["sourceUrl", sourceUrl]);

        let payloadData = eventData.payload || {};

        //this will replace all the variables in the sourceUrl with values from payloadData
        if (sourceUrl) {
            console.log(["resolve sourceUrl", sourceUrl, payloadData]);
            sourceUrl = componentNs.replaceRegex(sourceUrl, payloadData);
            console.log(["updating iframe source to", sourceUrl]);

            //check if eventData has payload
            if (eventData.payload) {
                let formData = eventData?.payload.payload;
                if (formData) {
                    console.log(["formData exists", formData]);
                    //need to wait for form to load and send FORM_LOAD to iframe
                    ns.componentUnregisterAllEvents($component);
                    ns.addComponentFormListeners($component, {
                        name: ns.MESSAGE_NAMES.FORM_LOAD_DATA,
                        callbackFn: ($component, data, statusMessage) => {
                            console.log([
                                "embed form callback",
                                $component,
                                data,
                                statusMessage,
                                sourceUrl,
                            ]);
                        },
                        callbackFnData: () => {
                            console.log([
                                "embed form callbackFnData",
                                $component,
                                eventData,
                                sourceUrl,
                            ]);
                            return formData;
                        },
                    });
                }
            }

            $component.find("iframe").attr("src", sourceUrl);
        } else {
            console.error("no source was specified");
        }
        console.groupEnd();
    };

    /** Class used for the "embedded page failed to load" surface, so it can be cleared again. */
    ns.classFrameError = "embed-frame-error";

    /**
     * Show or clear a visible message when an embedded page fails to load.
     *
     * alpha-launch docs/issues/0084. The load handlers below already detect a non-200 embed and
     * `return`, which leaves the frame blank and says nothing. Measured consequence: left-selecting
     * a node whose form does not exist left the pane on its placeholder, and the failure was
     * indistinguishable from "still loading" - it took a Playwright trace to find out the request
     * had 404'd. Anyone demoing this had no way to tell.
     *
     * Deliberately generic: this component is a **generic CMS component** and must stay
     * data-agnostic (CLAUDE.md), so the message names the status and the address and nothing about
     * what kind of content was expected.
     *
     * @param {object} $component jQuery-wrapped component
     * @param {number|null} status HTTP status of the embedded navigation, or null to clear
     * @param {string} [url] address that was loaded, shown for diagnosis
     */
    ns.setFrameError = function ($component, status, url) {
        if (!$component || !$component.length) {
            return;
        }
        // Always clear first, so a later successful load removes a stale message.
        $component.find("." + ns.classFrameError).remove();
        if (status === null || status === undefined) {
            return;
        }
        const detail = url ? " (" + url + ")" : "";
        const $message = $(
            '<div class="' +
                ns.classFrameError +
                '" role="alert" style="padding:12px;font-size:13px;line-height:1.4;">' +
                "<strong>This content could not be loaded.</strong><br>" +
                "The embedded page returned status " +
                status +
                "." +
                "</div>"
        );
        $message.attr("title", "status " + status + detail);
        $component.append($message);
        console.warn(
            "embed: showing load-failure message, status " + status + detail
        );
    };

    //send message to iframe
    ns.sendMessageToiFrame = function ($component, action, eventData) {
        console.group("sendMessageToiFrame on " + window.location);

        //ensure that eventData is object
        var parsedEventData = eventData;
        if (typeof parsedEventData === "string") {
            parsedEventData = JSON.parse(eventData);
        }

        if (!parsedEventData) {
            console.error("no data to send");
            console.groupEnd();
            return;
        }

        // Label the message with the action being sent.
        // A reply is built by spreading the widget's own inbound event
        // (`{ ...eventData, data: responseJson }`), so without this it still carries the
        // request's action - DATA_REQUEST - and the widget never recognises it as the
        // DATA_PAYLOAD response. It keeps waiting and times out with "Parent application
        // is taking longer than expected to respond or may not support this event type",
        // even though the fetched data is sitting in the message.
        if (action) {
            parsedEventData = { ...parsedEventData, action: action };
        }

        // console.log(["sendMessageToiFrame", data]);
        var $iframe = $component.find("iframe");
        var iframe = $iframe[0];
        console.log([
            "sendMessageToiFrame using postMessage",
            action,
            parsedEventData,
            $iframe,
            iframe,
        ]);
        //if iframe does not have TypeRefinery then it will need to manage its own events
        iframe.contentWindow.postMessage(parsedEventData, "*");

        console.log(["sendMessageToiFrame using postMessage, done"]);
        //call events
        //TODO: this will trigger CORS issue, disable to acoid double events?
        // try {
        //   if (iframe.contentWindow.Typerefinery.Page.Events) {
        //     console.log(["sendMessageToiFrame using events call, expect possible cors issue."]);
        //     const topic = sourceData.type;
        //     iframe.contentWindow.Typerefinery.Page.Events.emitEvent(topic, sourceData);
        //   }
        // } catch (error) {
        //   console.error("sendMessageToiFrame", error);
        // }
        console.groupEnd();
    };

    ns.autoLoad = ($component) => {
        console.group("autoLoad");
        // if autoResize is set to true, then register the autoResize event.
        const componentConfig = componentNs.getComponentConfig($component);
        console.log(["autoLoad", componentConfig.autoResize]);
        if (componentConfig.autoResize) {
            console.log(["register outo resie event"]);
            $component.on("load", function () {
                ns.autoResize($component);
            });
        }
        console.groupEnd();
    };

    ns.autoResize = ($component) => {
        if (!$component) {
            return;
        }
        const $iframe = $component.find("iframe");
        //console.log(["autoResize", embedid, $iframe]);
        var newHeight = $iframe.contents().height() + 200;
        var maxHeight = $iframe.attr("max-height");

        // set new height to maxheight if its specified.
        if (maxHeight && parseInt(maxHeight, 10)) {
            if (parseInt(maxHeight, 10) < newHeight) {
                newHeight = maxHeight;
            }
        }
        //console.log(["autoResize newHeight", embedid, newHeight]);
        $iframe.height(newHeight);
    };

    // local actions
    ns.EVENT_PROXY = ($component, componentConfig, data) => {
        console.group(`embed - ${ns.ACTION_EVENT_PROXY} - ${data.topic || data.type}`);
        console.log([ns.ACTION_EVENT_PROXY, $component, componentConfig, data]);

        //TODO: if we wrapping/mapping an event we need to merge out config over theirs.

        //ns.emitLocalEvent = ($component, componentConfig, eventMap,    payload, eventName,                  componentAction,        options)
        eventNs.emitLocalEvent(
            $component,
            componentConfig,
            ns.eventMap,
            data,
            eventNs.EVENTS.EVENT_PROXY,
            ns.ACTIONS.EVENT_PROXY
        );
        console.groupEnd();
    };

    ns.DATA_PAYLOAD = ($component, eventData, doNotSave) => {
        console.group(ns.ACTION_DATA_PAYLOAD);
        console.log([ns.ACTION_DATA_PAYLOAD, $component, eventData, doNotSave]);

        //TODO: save data to local storage
        // if (ns.useLocalStorage && !doNotSave) {
        //   const { topic, data } = eventData;
        //   console.log("save data to local storage");
        //   //save data to local storage to load nexr time
        //   localStorage.setItem(`${topic}`, JSON.stringify(data));
        // }

        console.log("send data to iframe");
        //TODO: send data to iframe
        ns.sendMessageToiFrame($component, ns.ACTION_DATA_PAYLOAD, eventData);
        console.log("data sent to iframe");
        console.groupEnd();
    };

    ns.DATA_REFRESH = ($component, componentConfig, eventData) => {
        console.group(ns.ACTION_DATA_REFRESH);
        console.log([
            ns.ACTION_DATA_REFRESH,
            $component,
            componentConfig,
            eventData,
        ]);
        console.log("send data refresh to iframe");
        ns.sendMessageToiFrame($component, ns.ACTION_DATA_REFRESH, eventData);
        console.log("data refresh sent to iframe");
        console.groupEnd();
    };

    ns.OPEN_FORM_MODAL = ($component, componentConfig, eventData) => {
        console.group(ns.ACTION_OPEN_FORM_MODAL);
        console.log([
            ns.ACTION_OPEN_FORM_MODAL,
            $component,
            componentConfig,
            eventData,
        ]);
        //open modal
        //check if config has source or config.config.source then get is value
        // Guarded: componentConfig here is the *merged* event config, which can arrive as a
        // string or without a nested config. Reading .config.url blindly threw a TypeError
        // that aborted the handler, so the modal never opened and nothing said why.
        let formUrl = componentConfig && (componentConfig.url || (componentConfig.config && componentConfig.config.url));

        if (!formUrl) {
            console.error(
                "OPEN_FORM_MODAL has no url to open. Merged event config was " +
                `${typeof componentConfig}: ${JSON.stringify(componentConfig)}. ` +
                "Expected an object with a url, e.g. {\"url\": \"/content/.../form.html\"}.",
                componentConfig
            );
            console.groupEnd();
            return;
        }

        console.log(["formUrl", formUrl]);

        //this will replace all the variables in the sourceUrl with values from payloadData
        if (formUrl !== "") {
            // console.log(["update iframe source", sourceUrl, payloadData]);
            formUrl = componentNs.replaceRegex(formUrl, eventData);
            console.log(["update iframe source done", formUrl]);

            let options = {
                modalTitle: componentConfig.actionModalTitle,
                iframeURL: formUrl,
                hideFooter: componentConfig.hideFooter,
                backdropIsStatic: componentConfig.backdropIsStatic,
                // load this data into the form
                callbackFnData: () => {
                    console.log(["callbackFnData", eventData]);
                    return eventData.payload;
                },
                callbackFn: ($modal, data, statusMessage) => {
                    //run this when modal is closed
                    console.log([
                        "modal callback",
                        $modal,
                        data,
                        statusMessage,
                    ]);
                    //return data and original eventData to iFrame
                    let modalOutcome = {
                        ...data,
                        eventData: eventData,
                        statusMessage: statusMessage,
                    };

                    let eventName =
                        eventData.eventName || ns.ACTION_OPEN_FORM_MODAL;
                    let eventAction =
                        eventData.action || ns.ACTION_OPEN_FORM_MODAL;

                    //payload, eventName, action, componentId, config
                    const eventPayloadData = eventNs.compileEventData(
                        modalOutcome,
                        eventName,
                        eventAction,
                        $component.componentId,
                        null
                    );
                    console.log([
                        "send modal callback event back to iframe",
                        eventPayloadData,
                    ]);
                    ns.sendMessageToiFrame(
                        $component,
                        ns.ACTION_OPEN_FORM_MODAL,
                        eventPayloadData
                    );
                },
            };
            //open modal, pass data to it and return message to iFrame on callback
            let $modal = modalNs.createModalAndOpen($component, options);
        } else {
            console.error("no formUrl was specified.");
        }

        //then send message to iframe
        console.groupEnd();
    };

    /**
     * Get data from endpoint
     * @param {*} $component component instance
     * @param {*} componentConfig component configuration
     * @param {*} eventData event data
     * @param {*} endpointConfig endpoint configuration to make request, needs to have at least url
     */
    ns.DATA_REQUEST = (
        $component,
        componentConfig,
        eventData,
        endpointConfig
    ) => {
        console.group(ns.ACTION_DATA_REQUEST);
        console.log([
            ns.ACTION_DATA_REQUEST,
            $component,
            componentConfig,
            eventData,
            endpointConfig,
        ]);
        console.log(["endpointConfig", endpointConfig]);
        //TODO: get data - make a get request to the url
        let url = endpointConfig.url;
        let requestMethod = endpointConfig.method || "GET";
        let responseContentType =
            endpointConfig.responseContentType || "application/json";
        let payload = eventData?.payload?.data || null;
        if (payload && typeof payload === "object") {
            payload = JSON.stringify(payload);
        }
        console.log([
            "payload",
            requestMethod,
            responseContentType,
            url,
            payload,
        ]);
        ns.getRequest(
            $component,
            eventData,
            url,
            ($component, eventData) => {
                console.log(["getData success", $component, eventData]);
                // raise event - ns.ACTION_DATA_PAYLOAD
                ns.sendMessageToiFrame(
                    $component,
                    ns.ACTION_DATA_PAYLOAD,
                    eventData
                );
                console.log(["getData done"]);
                return eventData;
            },
            ($component, eventData) => {
                console.log(["getData error", $component, eventData]);
                ns.sendMessageToiFrame(
                    $component,
                    ns.ACTION_DATA_PAYLOAD,
                    eventData
                );
                console.log(["getData error done"]);
                return eventData;
            },
            requestMethod,
            responseContentType,
            payload
        );
        console.log([
            "DATA_REQUEST initiated",
            $component,
            componentConfig,
            url,
        ]);
        //eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.DATA_REQUEST, ns.ACTIONS.DATA_REQUEST);
        console.groupEnd();
    };

    // json form post
    ns.getRequest = async (
        $component,
        eventData,
        url,
        successCallbackFn,
        errorCallbackFn,
        requestMethod,
        responseContentType,
        payload
    ) => {
        const contentType = responseContentType || "application/json";
        const method = requestMethod || "GET";
        const responseData = await ns.fetch(
            $component,
            url,
            method,
            contentType,
            eventData,
            payload,
            successCallbackFn,
            errorCallbackFn
        );
        return responseData;
    };

    // send the request to the server
    ns.fetch = async (
        $component,
        url,
        method,
        contentType,
        eventData,
        body,
        successCallback = ($component, data) => {},
        errorCallback = ($component, data) => {}
    ) => {
        console.group(["fetch", url, method, contentType, body]);
        console.log([url, method, contentType, body]);
        // Check the HTTP status before parsing, and retry transient gateway errors.
        // Previously a 502/503 (Traefik or the flow service re-registering after a deploy)
        // fed its plain-text "Bad Gateway" body straight into response.json(), so the user
        // saw "SyntaxError: Unexpected token 'B'" and the panel stayed empty with no retry -
        // even though the service recovers within seconds (alpha-launch docs/issues/0014).
        const maxAttempts = 3;
        const retryDelayMs = 1500;
        const retryableStatus = [502, 503, 504];
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await window.fetch(url, {
                    method: method || "GET",
                    headers: {
                        "Content-Type":
                            contentType || "application/x-www-form-urlencoded",
                    },
                    body: body,
                    keepalive: true,
                    redirect: "follow",
                });
                if (!response.ok) {
                    const bodyText = (await response.text()).substring(0, 200);
                    if (retryableStatus.includes(response.status) && attempt < maxAttempts) {
                        console.warn(`fetch ${url} -> HTTP ${response.status}, retrying (attempt ${attempt}/${maxAttempts})`);
                        await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
                        continue;
                    }
                    console.error(`fetch ${url} failed with HTTP ${response.status} after ${attempt} attempt(s): ${bodyText}`);
                    errorCallback($component, {
                        ...eventData,
                        url: url,
                        method: method,
                        payloadType: contentType,
                        body: body,
                        status: response.status,
                        error: `HTTP ${response.status}`,
                    });
                    break;
                }
                const responseJson = await response.json();
                console.group("fetch response");
                successCallback($component, {
                    ...eventData,
                    url: url,
                    method: method,
                    payloadType: contentType,
                    body: body,
                    ok: true,
                    data: responseJson,
                });
                console.groupEnd();
                break;
            } catch (error) {
                // network failure, or an OK response whose body was not valid JSON
                if (attempt < maxAttempts) {
                    console.warn(`fetch ${url} error (${error}), retrying (attempt ${attempt}/${maxAttempts})`);
                    await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
                    continue;
                }
                console.group("Error in submitting the request");
                console.error(error);
                errorCallback($component, {
                    ...eventData,
                    url: url,
                    method: method,
                    payloadType: contentType,
                    body: body,
                    error: error,
                });
                console.groupEnd();
                break;
            }
        }
        console.groupEnd();
        return;
    };

    //listen for data from TMS and run callback
    ns.useLocalStorage = false;
    ns.tmsConnected = function ($component, host, topic, callbackFn) {
        console.group(`tmsConnected ${host} ${topic} on ${window.location}`);
        try {
            let componentConfig = componentNs.getComponentConfig($component);
            tmsNs.registerToTms(
                host,
                topic,
                componentConfig.resourcePath,
                callbackFn
            );
            if (ns.useLocalStorage) {
                const componentData = localStorage.getItem(`${topic}`);
                if (!componentData) {
                    console.warn("no data found in local storage");
                } else {
                    callbackFn(JSON.parse(componentData));
                }
            }
        } catch (error) {
            console.error("tmsConnected", host, topic, error);
        }
        console.groupEnd();
    };

    // // iframe has requested data
    // ns.handleDataRequest = ($component, componentConfig, event) => {
    //   console.group("handleDataRequest getData");
    //   console.log(["handleDataRequest getData", $component, componentConfig, event]);
    //   ns.DATA_REQUEST($component, componentConfig, event);
    //   console.groupEnd();
    // }

    // decide which action to take based on action name
    ns.handleEventAction = ($component, action, data) => {
        console.log(["handleEventAction", $component, action, data]);
        //load data into form
        if (action === ns.ACTION_EVENT_PROXY) {
            //send message to iframe
            ns.sendMessageToiFrame($component, action, data);
        } else if (action === ns.ACTION_DATA_PAYLOAD) {
            ns.sendMessageToiFrame($component, action, data);
            // } else if (action === ns.ACTION_DATA_REQUEST) {
            //   ns.handleDataRequest($component, data);
        } else if (action === ns.ACTION_DATA_SOURCE) {
            ns.updateDataSource($component, data);
        } else if (action === ns.ACTION_DATA_REFRESH) {
            ns.sendMessageToiFrame($component, action, data);
        } else {
            console.error(["handleEventAction unsupported action", action]);
        }
    };

    // function to check if string is JSON
    ns.isJsonString = (str) => {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    };

    //function to convert string to JSON or return string
    ns.parseJson = (str) => {
        if (ns.isJsonString(str)) {
            return JSON.parse(str);
        }
        return str;
    };

    ns.addEventListener = ($component, componentConfig) => {
        console.group("addEventListener embed");
        const { events, id } = componentConfig;
        const defaultTopic = id;

        console.log(["config", events, id, defaultTopic]);

        console.log("registering events");
        //register events
        if (events) {
            events.forEach((event) => {
                const { topic, type, name, nameCustom, action, config } = event;
                const configData = ns.parseJson(config) || "";
                //if topic not set use component id as topic
                const topicName = topic || defaultTopic;
                // if type is not defined then its listen event
                let typeName = type || eventNs.EVENT_TYPE_LISTEN || "custom";

                //custom name takes precidence over name, this will be raised as event name
                let eventName = nameCustom || name;

                let isMonitorFormEvents =
                    configData[ns.EVENT_CONFIG_NAME_MONITOR_FORM_EVENTS] ||
                    false;
                let isMonitorPageEvents =
                    configData[ns.EVENT_CONFIG_NAME_MONITOR_PAGE_EVENTS] ||
                    false;

                console.groupCollapsed(
                    `event ${typeName} - ${action}:${topic}`
                );
                console.log(["event", event]);

                // if action is EVENT_PROXY

                // if action is EVENT_PROXY then add the event to registry
                // does ns.ACTIONS have this action
                if (ns.ACTIONS[action]) {
                    console.log([
                        "registerEventActionMapping",
                        JSON.stringify(ns.eventMap),
                        topicName,
                        typeName,
                        action,
                        eventName,
                    ]);
                    eventNs.registerEventActionMapping(
                        ns.eventMap,
                        id,
                        topicName,
                        typeName,
                        action,
                        eventName,
                        configData
                    );
                    console.log([
                        "registerEventActionMapping",
                        JSON.stringify(ns.eventMap),
                    ]);

                    // if event type is listen then add event listener for the event
                    if (typeName === eventNs.EVENT_TYPE_EMIT) {
                        //NOTE: this is the event that will be raised by iFrame
                        // iframe will raise events and this component will emit them

                        //TODO: add new event to allow sending data to tms
                        //NOTE: handle all different actions in windowListeneriFrameEvent
                        if (action === ns.ACTION_EVENT_PROXY) {
                            console.log([
                                "add windowListeneriFrameEvent for this component",
                                action,
                                id,
                                configData,
                            ]);
                            //listen for global message events that are emited by iframe
                            ns.addEventEmitter(
                                $component,
                                componentConfig,
                                topicName,
                                eventName,
                                action,
                                configData,
                                (data) => {
                                    console.log([
                                        "windowListeneriFrameEvent callback",
                                        topicName,
                                        eventName,
                                        action,
                                        data,
                                        configData,
                                    ]);

                                    // get possible config from data sent
                                    let dataConfig = data.config || {};
                                    let configDataObject = configData || {};

                                    console.log([ "dataConfig", dataConfig ]);
                                    console.log([ "configDataObject", configDataObject ]);

                                    const eventDataConfig = eventNs.mergeTrustedEventConfig(event, dataConfig, configDataObject);
                                    
                                    console.log([ "eventDataConfig", eventDataConfig ]);

                                    const unwrapMessage = eventNs.getOption(
                                        eventDataConfig,
                                        "unwrap",
                                        false
                                    ); // default is to wrap all proxy events
                                    const isCatchAll = eventNs.getOption(
                                        eventDataConfig,
                                        "catchAll",
                                        false
                                    ); // default is to not catch all, events have to match topic and action to be caught
                                    const isProxyEvent =
                                        action === ns.ACTION_EVENT_PROXY;

                                    console.log([
                                        "unwrapMessage",
                                        unwrapMessage,
                                    ]);
                                    console.log(["isCatchAll", isCatchAll]);
                                    console.log(["isProxyEvent", isProxyEvent]);

                                    if (unwrapMessage) {
                                        // unwrap the proxy event data
                                        const proxyEventData = data.payload;
                                        const proxyEventTopic =
                                            proxyEventData.topic ||
                                            proxyEventData.type;
                                        const proxyEventAction =
                                            proxyEventData.action;
                                        const proxyEventComponentId =
                                            proxyEventData.componentId;
                                        const proxyEventConfig =
                                            proxyEventData.config;

                                        console.log([ "proxyEventData", proxyEventData ]);
                                        console.log([ "proxyEventTopic", proxyEventTopic ]);
                                        console.log([ "proxyEventAction", proxyEventAction ]);
                                        console.log([ "proxyEventComponentId", proxyEventComponentId ]);
                                        console.log([ "proxyEventConfig", proxyEventConfig ]);

                                        console.log( `call embed with unwrapped event`, proxyEventData );
                                        //TODO: pre-refactor raising proxied event as local event
                                        // ns.EVENT_PROXY($component, componentConfig, data);
                                        // raise proxied event as local event
                                        // eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, proxyEventData,    proxyEventTopic, proxyEventAction);
                                        eventNs.emitEvent( proxyEventTopic, proxyEventData );

                                    } else {
                                        console.log(
                                            `call embed with wrapped event`,
                                            data
                                        );
                                        // proxy all events
                                        console.log([
                                            "raising",
                                            data.topic || data.type,
                                            action,
                                            $component,
                                            componentConfig,
                                            eventDataConfig,
                                            data,
                                        ]);

                                        // wrap the data in a new event data object
                                        // merge current event data with data we are wrapping
                                        const eventData = {
                                            ...data,
                                            topicName: data.topic || data.type,
                                            eventName: eventName,
                                            action: action,
                                            config: eventDataConfig,
                                        };

                                        ns.EVENT_PROXY(
                                            $component,
                                            componentConfig,
                                            eventData
                                        );



                                        // console.log([ "emitting event eventData", eventData ]);

                                        // eventNs.emitEvent( data.topic || data.type, eventData );


                                    }

                                    // proxy all events
                                    //   console.log(["raising", ns.ACTION_EVENT_PROXY, $component, componentConfig, eventDataConfig, data]);
                                    //   ns.EVENT_PROXY($component, componentConfig, data);
                                }
                            );
                        } else if (action === ns.ACTION_DATA_REQUEST) {
                            console.log([
                                "add windowListeneriFrameEvent for this component",
                                action,
                                id,
                                configData,
                            ]);
                            //listen for data request that are emited by iframe and conver these to data request events
                            ns.addEventEmitter(
                                $component,
                                componentConfig,
                                topicName,
                                eventName,
                                action,
                                configData,
                                (data) => {
                                    console.log([
                                        "windowListeneriFrameEvent callback",
                                        topicName,
                                        eventName,
                                        action,
                                        data,
                                    ]);
                                    console.log([
                                        "DATA_REQUEST",
                                        $component,
                                        componentConfig,
                                        configData,
                                    ]);

                                    // get url from config or use config as url
                                    let endpointConfig = {};
                                    if (typeof configData === "string") {
                                        endpointConfig.url = configData;
                                    } else {
                                        endpointConfig = configData;
                                    }

                                    const eventData = {
                                        ...data,
                                        topicName: topicName,
                                        eventName: eventName,
                                        action: action,
                                        endpointConfig: endpointConfig,
                                    };
                                    eventData.target = "iframe-" + id;
                                    //check if config is possible JSON string

                                    ns.DATA_REQUEST(
                                        $component,
                                        componentConfig,
                                        eventData,
                                        endpointConfig
                                    );
                                }
                            );
                        } else if (action === ns.ACTION_OPEN_FORM_MODAL) {
                            // listen for open modal event
                            console.log([
                                "add windowListeneriFrameEvent for this component",
                                action,
                                id,
                                configData,
                            ]);
                            ns.addEventEmitter(
                                $component,
                                componentConfig,
                                topicName,
                                eventName,
                                action,
                                configData,
                                (data, event) => {
                                    console.log([
                                        "windowListeneriFrameEvent callback",
                                        topicName,
                                        eventName,
                                        action,
                                        data,
                                    ]);
                                    console.log([
                                        "OPEN_FORM_MODAL",
                                        $component,
                                        componentConfig,
                                        configData,
                                    ]);

                                    // get possible config from data sent
                                    let eventConfig = data.config;
                                    // get config from configData or use config from component if trusted source
                                    let eventDataConfig =
                                        eventNs.mergeTrustedEventConfig(
                                            event,
                                            configData,
                                            eventConfig
                                        );

                                    console.log([
                                        "eventDataConfig",
                                        eventDataConfig,
                                    ]);

                                    const eventData = {
                                        ...data,
                                        topicName: topicName,
                                        eventName: eventName,
                                        action: action,
                                        config: eventDataConfig,
                                    };
                                    eventData.target = "iframe-" + id;

                                    console.log([
                                        "OPEN_FORM_MODAL",
                                        $component,
                                        eventDataConfig,
                                        eventData,
                                    ]);

                                    ns.OPEN_FORM_MODAL(
                                        $component,
                                        eventDataConfig,
                                        eventData
                                    );
                                }
                            );
                        }
                    } else {
                        //listen register the event and listent for specific event on topic
                        console.log(["registerEvents", topicName, eventName]);

                        if (eventName === eventNs.EVENTS.EVENT_TOPIC_PAYLOAD) {
                            //if config is string then use it as host
                            const host =
                                (typeof configData === "string"
                                    ? configData
                                        ? configData
                                        : false
                                    : typeof configData === "object"
                                    ? configData.host
                                    : false) || "ws://localhost:8112/$tms"; //TODO: get host default value from config
                            //add warning if host is not set
                            if (!host) {
                                console.warn("host not set for TMS address.");
                            }
                            console.log(["register with TMS", host, topicName]);

                            const url =
                                typeof configData === "string"
                                    ? configData
                                    : configData.url;
                            //add warning if url is not set
                            if (!url) {
                                console.warn("url is not set for Payload.");
                            }

                            ns.tmsConnected(
                                $component,
                                host,
                                topicName,
                                (data) => {
                                    const eventData = {
                                        topicName: topicName,
                                        eventName: eventName,
                                        action: action,
                                        url: url,
                                        data: data,
                                        target: "iframe-" + id,
                                        source: host,
                                    };
                                    console.log([
                                        "tms data callback",
                                        topicName,
                                        eventName,
                                        data,
                                    ]);
                                    // check make sure the event is for this event
                                    // ns.handleEventAction($component, action, data);
                                    ns.DATA_PAYLOAD($component, eventData);
                                }
                            );
                            //console.warn("register with TMS, not implemented");
                        } else {
                            eventNs.registerEvents(topicName, (data) => {
                                console.log([
                                    "registerEvents callback",
                                    topicName,
                                    eventName,
                                    data,
                                ]);
                                // check make sure the event is for this event
                                if (data.type === eventName) {
                                    // get possible config from data sent
                                    let eventConfig = data.config;
                                    // get config from configData or use config from component if trusted source
                                    let eventDataConfig =
                                        eventNs.mergeTrustedEventConfig(
                                            event,
                                            configData,
                                            eventConfig
                                        );

                                    console.log([
                                        "eventDataConfig",
                                        eventDataConfig,
                                    ]);

                                    const eventData = {
                                        ...data,
                                        config: eventDataConfig,
                                    };

                                    console.log(["eventData", eventData]);

                                    ns.handleEventAction(
                                        $component,
                                        action,
                                        eventData
                                    );
                                }
                            });
                        }
                        //need to reach into the frame and register message event
                        //this will ensure that only messages from this frame are listened
                        //windowListener
                    }
                } else {
                    console.error(["unsupported action", action]);
                }

                console.log(["addEventListener done"]);
                console.groupEnd();
            });
        }

        console.log(["eventMap", ns.eventMap]);

        console.groupEnd();
    };

    ns.isProxyEnabled = ($component, componentConfig) => {
        //for all keys in eventMap check if any action is EVENT_PROXY
        for (const key in ns.eventMap) {
            if (ns.eventMap.hasOwnProperty(key)) {
                const events = ns.eventMap[key];
                for (const key in events) {
                    if (events.hasOwnProperty(key)) {
                        const event = events[key];
                        if (event.action === eventNs.EVENTS.EVENT_PROXY) {
                            //does this event has maping to this component
                            if (events.hasOwnProperty(componentConfig.id)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        return false;
    };

    //all the callbacks for events, these are the actions to be taken when event is raised
    ns.windowListeneriFrameEventCallBacks = new Map();
    ns.addEventEmitter = function (
        $component,
        componentConfig,
        topicName,
        eventName,
        action,
        configData,
        callbackFn
    ) {
        console.groupCollapsed(
            `embed addEmitter for ${topicName},${eventName},${action}, on ${window.location}`
        );
        console.log([
            "addEmitter",
            topicName,
            eventName,
            action,
            configData,
            callbackFn,
        ]);

        const { id } = componentConfig;
        const callbackId = `${id}-${topicName}-${eventName}-${action}`;

        ns.windowListeneriFrameEventCallBacks.set(callbackId, {
            $component: $component,
            componentConfig: componentConfig,
            topicName: topicName,
            eventName: eventName,
            action: action,
            config: configData,
            callbackFn: callbackFn,
        });
        console.log([
            "windowListeneriFrameEventCallBacks",
            ns.windowListeneriFrameEventCallBacks,
        ]);
        ns.bindWindowListeneriFrameEvent($component);
        console.groupEnd();
    };

    ns.windowListeneriFrameEventBoundComponent = new Map();
    ns.bindWindowListeneriFrameEvent = function ($component) {
        const componentId = $component.attr("id");
        console.groupCollapsed(
            `bindWindowListeneriFrameEvent on ${window.location}`
        );
        console.log([
            "bindWindowListeneriFrameEvent",
            $component,
            ns.windowListeneriFrameEventBoundComponent,
        ]);
        if (ns.windowListeneriFrameEventBoundComponent.has(componentId)) {
            console.warn(
                "windowListeneriFrameEvent already bound",
                componentId
            );
            console.groupEnd();
            return;
        }
        console.log([
            "bindWindowListeneriFrameEvent calling windowListeneriFrameEvent",
            componentId,
        ]);
        ns.windowListeneriFrameEvent($component);
        ns.windowListeneriFrameEventBoundComponent.set(
            $component.attr("id"),
            $component
        );
        console.log([
            "bindWindowListeneriFrameEvent",
            ns.windowListeneriFrameEventBoundComponent,
        ]);
        console.groupEnd();
    };

    ns.processWindowListenerEvent = function ($component, event, sourceData) {
        console.groupCollapsed(
            `processWindowListenerEvent ${sourceData.topic || sourceData.type}`
        );
        console.log([
            "processWindowListenerEvent",
            $component,
            event,
            sourceData,
        ]);
        const eventTopic = sourceData.topic || sourceData.payload?.topic;
        const eventType = sourceData.type || sourceData.payload?.type;
        const eventAction = sourceData.action || sourceData.payload?.action;
        console.log(["eventTopic", eventTopic]);
        console.log(["eventType", eventType]);
        console.log(["eventAction", eventAction]);
        console.log(["sourceData", sourceData]);
        const countofCallbacks = ns.windowListeneriFrameEventCallBacks.size;
        console.log(
            `find matching callbacks for event ${eventAction}:${eventType} in ${countofCallbacks} callbacks`
        );

        let hasCatchAll = false;

        const matchedCallbacksArray = [
            ...ns.windowListeneriFrameEventCallBacks,
        ].sort((a, b) => {
            // sort by catchAll, all catch all callbacks should be at the end of the array
            if (a[1].config && a[1].config.catchAll) {
                return 1;
            }
            if (b[1].config && b[1].config.catchAll) {
                return -1;
            }
            return 0;
        });

        console.log(["matchedCallbacksArray", matchedCallbacksArray]);

        let isTopicMatchFound = null;

        //find all callbacks that match the event
        const matchedCallbacks = [...ns.windowListeneriFrameEventCallBacks]
            .sort((a, b) => {
                // sort by catchAll, all catch all callbacks should be at the end of the array
                if (a[1].config && a[1].config.catchAll) {
                    return 1;
                }
                if (b[1].config && b[1].config.catchAll) {
                    return -1;
                }
                return 0;
            })
            .filter(([key, callBack]) => {
                const callBackAction = callBack.action; //action component supports
                const callBackTopicName = callBack.topicName; //topic name, should match event type
                // const eventName = callBack.eventName; //named or custom event name
                console.groupCollapsed(
                    `callBack action ${callBackAction}:${callBackTopicName}`
                );
                console.log(["callBack key", key]);
                console.log(["callBack", callBack]);
                console.log(["callBackAction", callBackAction]);
                console.log(["callBackTopicName", callBackTopicName]);
                // console.log(["eventName", eventName]);
                const isProxyEvent = callBackAction === ns.ACTION_EVENT_PROXY;
                const isActionMatch = callBackAction === eventAction;
                const isTopicMatch = callBackTopicName === eventType;
                const unwrapMessage = eventNs.getOption(
                    callBack.config,
                    "unwrap",
                    false
                ); // default is to wrap all proxy events
                const isCatchAll = eventNs.getOption(
                    callBack.config,
                    "catchAll",
                    false
                ); // default is to not catch all, events have to match topic and action to be caught

                var isSkip = false;
                if (isProxyEvent) {
                    console.warn(["isProxyEvent", isProxyEvent]);
                } else {
                    console.log(["isProxyEvent", isProxyEvent]);
                }
                if (isActionMatch) {
                    console.warn(["isActionMatch", isActionMatch]);
                } else {
                    console.log(["isActionMatch", isActionMatch]);
                }
                if (isTopicMatch) {
                    console.warn(["isTopicMatch", isTopicMatch]);
                } else {
                    console.log(["isTopicMatch", isTopicMatch]);
                }

                console.log(["unwrapMessage", unwrapMessage]);
                console.log(["isCatchAll", isCatchAll]);
                console.log(["isTopicMatchFound", isTopicMatchFound]);

                // set topic match found if topic match is found
                if (isTopicMatch) {
                    isTopicMatchFound = true;
                    console.log([
                        "isTopicMatchFound set to true",
                        isTopicMatchFound,
                    ]);
                } else {
                    // if topic match is found then skip proxy event if not catch all
                    if (isTopicMatchFound) {
                        console.log([
                            "isTopicMatchFound is true, skipping proxy event",
                            isTopicMatchFound,
                            isProxyEvent,
                        ]);
                        if (isProxyEvent) {
                            console.warn(
                                "topic match found, skipping proxy event",
                                isProxyEvent
                            );
                            isSkip = true;
                        }
                    }
                }

                console.log(["isTopicMatchFound", isTopicMatchFound]);

                if (isSkip) {
                    console.warn(["isSkip", isSkip]);
                } else {
                    console.log(["isSkip", isSkip]);
                }
                

                if (isCatchAll) {
                    console.warn(["isCatchAll", isCatchAll]);
                    hasCatchAll = true;
                } else {
                    console.log(["isCatchAll", isCatchAll]);
                }

                // if event is proxy and is catch all then match all events
                // if event is proxy then match topic only
                // if action is match and topic is match then match
                if (
                    (!isSkip && isProxyEvent && isCatchAll) ||
                    (isProxyEvent && isTopicMatch) ||
                    (isActionMatch && isTopicMatch) ||
                    (isTopicMatch && !isActionMatch)
                ) {
                    console.log(["match"]);
                    console.groupEnd();
                    return true;
                    //callBack.callbackFn(sourceData);
                } else {
                    console.warn("no match");
                }

                console.groupEnd();
                return false;
            });

        console.log(["matchedCallbacks", matchedCallbacks]);

        if (matchedCallbacks.length > 0) {
            if (matchedCallbacks.length == 1) {
                console.log(["matchedCallbacks", matchedCallbacks]);
                const callBackItem = matchedCallbacks[0];
                const callBack = callBackItem[1];
                const callBackKey = callBackItem[0];
                console.log([`callBack exec ${callBackKey}`, callBack]);
                // if callbackFn is set then call it
                if (callBack.callbackFn) {
                    callBack.callbackFn(sourceData, event);
                    console.log([`callBack done ${callBackKey}`]);
                } else {
                    console.error(`no callback function found ${callBackKey}`);
                }
            } else {
                //order the to have the catch all last
                matchedCallbacks.sort((a, b) => {
                    if (a.config && a.config.catchAll) {
                        return 1;
                    }
                    return 0;
                });

                console.log(["matchedCallbacks", matchedCallbacks]);

                //run callbacks
                matchedCallbacks.forEach(([key, callBack]) => {
                    //skip catch all but not if catchAllAlways is set
                    if (
                        callBack.config &&
                        callBack.config.catchAll &&
                        !callBack.config.catchAllAlways
                    ) {
                        return;
                    }

                    console.log([`callBack exec ${key}`, callBack]);
                    // if callbackFn is set then call it
                    if (callBack.callbackFn) {
                        callBack.callbackFn(sourceData, event);
                        console.log([`callBack done ${key}`]);
                    } else {
                        console.error(`no callback function found ${key}`);
                    }
                });
            }
        } else {
            console.warn("no matching callbacks found");
        }
        console.groupEnd();
    };

    /* listen for window post messages sent by iframe to this component */
    ns.windowListeneriFrameEvent = function ($component) {
        console.groupCollapsed(
            `windowListeneriFrameEvent embed on ${window.location}`
        );
        const iFrame = $component.find("iframe");
        const iFrameContentWindow = $component.find("iframe")[0].contentWindow;
        const iframeContentWindowSrc = iFrame.attr("src");
        let iFrameContentWindowUrl = null;
        try {
            iFrameContentWindowUrl = iFrameContentWindow.location.href;
        } catch (error) {
            console.error("error getting iFrameContentWindow", error);
        }
        console.log([
            "iFrameContentWindow",
            iframeContentWindowSrc,
            iFrameContentWindow,
        ]);

        //listen for global message events that are emited by iframe
        // Named so the same logic can be replayed over messages that arrived before this
        // listener was bound - see the early message buffer near the top of this file.
        const handleIFrameMessage = function (event) {
            console.groupCollapsed(
                `embed windowListeneriFrameEvent on ${window.location}`
            );

            // const sourceHost = event.source.location?.host;
            // const iframeHost = iFrameContentWindow.location.host;
            // console.log(["sourceHost", sourceHost, "iframeHost", iframeHost]);
            
            console.log([
                "event",
                event.data,
                ns.eventMap,
                iframeContentWindowSrc,
                event.source == iFrameContentWindow,
                event.source,
                iFrameContentWindow,
            ]);

            if (event.source == iFrameContentWindow) {
                //this message is from component iframe
                // the widget is talking to us, so the readiness nudges can stop
                ns.iFrameHasResponded.add($component.attr("id"));
                console.log(["event", event]);
                var eventData = event.data;
                var sourceWindow = event.source;
                var sourceOrigin = event.origin;
                console.log([
                    "sourceWindow",
                    sourceWindow,
                    "sourceOrigin",
                    sourceOrigin,
                    "eventData",
                    eventData,
                ]);

                var sourceData = eventData;
                if (typeof eventData === "string") {
                    sourceData = JSON.parse(eventData);
                }

                if (sourceData) {
                    console.log(["sourceData", sourceData]);

                    ns.processWindowListenerEvent(
                        $component,
                        event,
                        sourceData
                    );
                }
            } else {
                console.warn(
                    "event.source does not match component iframe, ignoring"
                );
            }
            console.groupEnd();
        };

        window.addEventListener("message", handleIFrameMessage);
        ns.notifyIFrameReady($component);

        console.groupEnd();
    };

    /**
     * Tell the widget the host page is ready to answer it.
     *
     * On a cold load the widget issues its initial data requests before this page can answer
     * them, and those requests never arrive here at all - the widget is left showing
     * "Loading ... from parent" until it times out. Replaying buffered messages cannot help,
     * because there is nothing to replay.
     *
     * DATA_REFRESH is the existing "notify iframe to refresh data" action, so sending it once
     * the listeners are bound prompts the widget to re-issue its requests, which this page
     * then serves normally. Sent on every iframe load, plus once shortly after binding to
     * cover an iframe that finished loading before the component initialised.
     */
    ns.notifyIFrameReady = function ($component) {
        const iframe = $component.find("iframe")[0];
        if (!iframe) {
            return;
        }

        const componentId = $component.attr("id");

        const notify = function () {
            try {
                ns.sendMessageToiFrame($component, ns.ACTION_DATA_REFRESH, {
                    action: ns.ACTION_DATA_REFRESH,
                    type: ns.ACTION_DATA_REFRESH,
                });
            } catch (error) {
                console.error("notifyIFrameReady failed", error);
            }
        };

        iframe.addEventListener("load", notify);

        // The iframe may already have loaded before this component initialised, in which case
        // the load event above never fires for it - and a single nudge can still land before
        // the widget is listening. Retry on a short backoff until the widget starts talking
        // to us, then stop. ns.iFrameHasResponded is set by the message handler.
        const retryDelays = [500, 1500, 3000, 6000, 10000];
        retryDelays.forEach(function (delay) {
            setTimeout(function () {
                if (ns.iFrameHasResponded.has(componentId)) {
                    return;
                }
                console.log(["notifyIFrameReady retry", componentId, delay]);
                notify();
            }, delay);
        });
    };

    /** Component ids whose iframe has sent us at least one message. */
    ns.iFrameHasResponded = new Set();

    //used for event id
    ns.generateEventControllerId = (componentId, name) => {
        return `ts.embed.frame.event.${componentId}.${name}`;
    };

    //create a new function for this component and store it ns.componentListeners map that will use abortcontroller to abort listener when component is closed.
    // componentRegisterEvent($component, window, "message", "eventName", handler, callback) - will add listener for message generated by postMessage
    // componentRegisterEvent($component, iframe, "load", "eventName", handler, callback, {frame: iFrameContentWindow}) - will add listener for load event from iframe
    ns.componentRegisterEvent = (
        $component,
        listenerTarget,
        listenerType,
        name,
        handler,
        callback,
        options
    ) => {
        console.groupCollapsed(`registering component event ${name}`);
        if (!listenerTarget) {
            console.warn("listenerTarget not set, using $component");
            listenerTarget = $component;
        }
        if (!listenerType) {
            console.warn("listenerType not set, using message");
            listenerType = "message";
        }

        console.log([
            "$component",
            $component,
            "listenerType",
            listenerType,
            "name",
            name,
            "handler",
            handler,
            "callback",
            callback,
        ]);

        //listen for global message events that are emited by iframe
        let componentId =
            $component.attr("id") || $component.parent().attr("id");
        let eventHandlerId = ns.generateEventControllerId(componentId, name);
        console.log([
            "componentId",
            componentId,
            "eventHandlerId",
            eventHandlerId,
        ]);
        let controller = new AbortController();
        // create a new function for this component and store it ns.componentListeners map
        ns.componentListeners.set(eventHandlerId, {
            ...options,
            id: eventHandlerId,
            componentId: componentId,
            handler: handler,
            $component: $component,
            callback: callback,
            controller: controller,
        });

        // add event listener for message event from ns.componentListeners map
        listenerTarget.addEventListener(
            listenerType,
            ns.componentListeners.get(eventHandlerId).handler,
            {
                signal: ns.componentListeners.get(eventHandlerId).controller
                    .signal,
            }
        );

        console.groupEnd();
    };

    /**
     * Unregister named event for the component by removing the event listener and aborting the controller.
     * @param {*} $component
     * @param {*} eventName
     */
    ns.componentUnregisterEvent = ($component, eventName) => {
        console.log("unregistering component");
        let componentId = $component.attr("id");
        let eventHandlerId = ns.generateEventControllerId(
            componentId,
            eventName
        );
        let { controller } = ns.componentListeners.get(eventHandlerId);
        controller.abort();
        ns.componentListeners.delete(eventHandlerId); // Remove it from the map
    };

    /**
     * Unregister all events for the component by removing all event listeners and aborting all controllers.
     * @param {*} $component
     */
    ns.componentUnregisterAllEvents = ($component) => {
        console.log("unregistering all component events");
        let componentId = $component.attr("id");
        let eventHandlerId = ns.generateEventControllerId(componentId, "");
        // find all event that start with this componentId and abort them.
        ns.componentListeners.forEach((value, key) => {
            if (key.startsWith(eventHandlerId)) {
                console.log(["aborting event", key]);
                value.controller.abort();
                ns.componentListeners.delete(key);
            }
        });
    };

    // translate the event payload action to message name
    ns.getMessageNameFromEventAction = (eventAction) => {
        console.log(["eventDataPayloadAction", eventAction]);
        let messageName = null;

        if (eventAction === formNs.ACTIONS.FORM_SUCCESS) {
            messageName = ns.MESSAGE_NAMES.FORM_SUCCESS;
        } else if (eventAction === formNs.ACTIONS.FORM_CANCEL) {
            messageName = ns.MESSAGE_NAMES.FORM_CANCEL;
        } else if (eventAction === formNs.ACTIONS.FORM_ERROR) {
            messageName = ns.MESSAGE_NAMES.FORM_ERROR;
        } else {
            messageName = ns.MESSAGE_NAMES.FORM_UNKNOWN;
            console.warn("eventDataPayloadAction not found");
        }
        console.log(["messageName", messageName]);
        return messageName;
    };

    /**
     * this is the handler for messages from the component iframe
     * @param {*} event generic event object
     */
    ns.frameMessageHandler = (event) => {
        console.groupCollapsed(
            `embed frameMessageHandler on ${window.location}`
        );
        console.log(["event", event]);

        var eventType = event.type;
        var eventSource = event.source;
        var eventOrigin = event.origin;
        var eventData = event.data;

        console.log([
            "eventType",
            eventType,
            "eventSource",
            eventSource,
            "eventOrigin",
            eventOrigin,
            "eventData",
            eventData,
        ]);
        console.log([
            "componentListeners",
            ns.componentListeners,
            ns.componentListeners.has(event.source),
        ]);

        let eventDataPayloadAction = eventData?.payload?.action;
        console.log(["eventDataPayloadAction", eventDataPayloadAction]);

        //this is the suffix for event name
        let messageName = ns.getMessageNameFromEventAction(
            eventDataPayloadAction
        );
        console.log(["messageName", messageName]);

        try {
            let $component = eventSource?.frameElement?.closest(
                ns.selectorComponent
            );
            let componentId = $component?.id || $component?.parentElement?.id;
            console.log(["componentId", componentId]);
            let eventHandlerId = ns.generateEventControllerId(
                componentId,
                messageName
            );
            console.log([
                "eventHandlerId",
                eventHandlerId,
                ns.componentListeners.has(eventHandlerId),
            ]);

            // find the componentListener in componentListeners map by looking for  event source
            if (ns.componentListeners.has(eventHandlerId)) {
                let { $component, callback } =
                    ns.componentListeners.get(eventHandlerId);
                console.log(["component", $component, "callback", callback]);
                //this message is from component iframe
                var eventData = event.data;
                var sourceWindow = event.source;
                var sourceOrigin = event.origin;
                console.log([
                    "sourceWindow",
                    sourceWindow,
                    "sourceOrigin",
                    sourceOrigin,
                    "eventData",
                    eventData,
                ]);

                var sourceData = eventData;
                if (typeof eventData === "string") {
                    sourceData = JSON.parse(eventData);
                }

                if (sourceData) {
                    console.log(["sourceData", sourceData]);

                    // ns.processWindowListenerEvent($component, event, sourceData);
                    if (callback) {
                        callback($component, sourceData, eventHandlerId);
                    }
                }
            } else {
                console.warn(
                    `eventHandlerId ${eventHandlerId} does not match component iframe, ignoring`
                );
            }
        } catch (e) {
            console.log(
                "could not read frame status, iframe is from different origin."
            );
            console.log(e);
        }
        console.groupEnd();
    };

    /**
     * Add event listener for the component to show loader when iframe is loading.
     * @param {*} $component component element
     * @param {*} callbackFnData($component, data, message) callback to get data to be passed to the iframe.
     */
    ns.addComponentLoaderEventListener = ($component, callbackFnData) => {
        console.log("adding loader event listener for component");

        let iframe = $component.find(ns.selectorFrame).get(0);

        console.log([ns.selectorFrame, iframe]);

        iframe.addEventListener(
            "load",
            function (event) {
                console.log("iframe loaded");

                let frameStatusAccessed = false;
                try {
                    var frameStatus = iframe.contentWindow.performance
                        .getEntries()
                        .find((e) => e.entryType === "navigation")[
                        "responseStatus"
                    ];
                    frameStatusAccessed = true;
                    if (frameStatus !== 200) {
                        console.log(
                            "iframe loaded with error status",
                            frameStatus
                        );
                        // alpha-launch docs/issues/0084 - a blank frame is indistinguishable from
                        // one still loading. Say so instead of returning silently.
                        ns.setFrameError(
                            $component,
                            frameStatus,
                            iframe && iframe.getAttribute
                                ? iframe.getAttribute("src")
                                : ""
                        );
                        return;
                    } else {
                        console.log("iframe loaded successfully");
                        // Clear any message left by a previous failed load.
                        ns.setFrameError($component, null);
                        if (callbackFnData) {
                            // send message to iframe to load data into the form, the form should already have the event listener to handle this event.
                            let data = callbackFnData();
                            console.log(["callbackFnData", data]);
                            const eventPayloadData = eventNs.compileEventData(
                                data,
                                formNs.ACTIONS.FORM_LOAD,
                                formNs.ACTIONS.FORM_LOAD,
                                $component.componentId,
                                null
                            );
                            console.log([
                                "send eventPayloadData to iframe",
                                eventPayloadData,
                            ]);
                            ns.sendMessageToiFrame(
                                $component,
                                formNs.ACTIONS.FORM_LOAD,
                                eventPayloadData
                            );
                        }
                    }
                } catch (e) {
                    console.log(
                        "could not read frame status, iframe is from different origin."
                    );
                    console.log(e);
                }
            },
            true
        );
    };

    // add listeners callback to the component, these will be used when we need to ns.EVENT_CONFIG_NAME_MONITOR_FORM_EVENTS flag is set
    ns.addComponentFormListeners = ($component, options) => {
        console.log("adding form callback event listeners");

        // ns.addComponentLoaderEventListener($component, options.callbackFnData);

        let iframe = $component.find(ns.selectorFrame).get(0);
        console.log([ns.selectorFrame, iframe]);

        ns.componentRegisterEvent(
            $component,
            iframe,
            ns.COMPONENT_LISTENER_LOAD,
            ns.MESSAGE_NAMES.FORM_LOAD_DATA,
            function (event) {
                console.log(["event", event]);
                console.log("iframe loaded");

                let frameStatusAccessed = false;
                try {
                    var frameStatus = iframe.contentWindow.performance
                        .getEntries()
                        .find((e) => e.entryType === "navigation")[
                        "responseStatus"
                    ];
                    frameStatusAccessed = true;
                    if (frameStatus !== 200) {
                        console.log(
                            "iframe loaded with error status",
                            frameStatus
                        );
                        // alpha-launch docs/issues/0084 - a blank frame is indistinguishable from
                        // one still loading. Say so instead of returning silently.
                        ns.setFrameError(
                            $component,
                            frameStatus,
                            iframe && iframe.getAttribute
                                ? iframe.getAttribute("src")
                                : ""
                        );
                        return;
                    } else {
                        console.log("iframe loaded successfully");
                        // Clear any message left by a previous failed load.
                        ns.setFrameError($component, null);
                        if (options.callbackFnData) {
                            // send message to iframe to load data into the form, the form should already have the event listener to handle this event.
                            let data = options.callbackFnData();
                            console.log(["callbackFnData", data]);
                            let componentId = $component.attr("id");
                            const eventPayloadData = eventNs.compileEventData(
                                data,
                                formNs.ACTIONS.FORM_LOAD,
                                formNs.ACTIONS.FORM_LOAD,
                                componentId,
                                null
                            );
                            console.log([
                                "send eventPayloadData to iframe",
                                eventPayloadData,
                            ]);
                            ns.sendMessageToiFrame(
                                $component,
                                formNs.ACTIONS.FORM_LOAD,
                                eventPayloadData
                            );
                        }
                    }
                } catch (e) {
                    console.log(
                        "could not read frame status, iframe is from different origin."
                    );
                    console.log(e);
                }
            },
            function () {
                console.log("form data loaded");
            }
        );

        ns.componentRegisterEvent(
            $component,
            window,
            ns.WINDOW_LISTENER_MESSAGE,
            ns.MESSAGE_NAMES.FORM_SUCCESS,
            ns.frameMessageHandler,
            ($component, data, eventHandlerId) => {
                console.log("form submitted");
                console.log(["$component", $component, "data", data]);

                if (options.callbackFn) {
                    options.callbackFn(
                        $component,
                        data,
                        ns.MESSAGE_NAMES.FORM_SUCCESS
                    );
                }
            }
        );
        ns.componentRegisterEvent(
            $component,
            window,
            ns.WINDOW_LISTENER_MESSAGE,
            ns.MESSAGE_NAMES.FORM_CANCEL,
            ns.frameMessageHandler,
            ($component, data, eventHandlerId) => {
                console.log("form cancelled");
                console.log(["$component", $component, "data", data]);

                if (options.callbackFn) {
                    options.callbackFn(
                        $component,
                        data,
                        ns.MESSAGE_NAMES.FORM_CANCEL
                    );
                }
            }
        );
        ns.componentRegisterEvent(
            $component,
            window,
            ns.WINDOW_LISTENER_MESSAGE,
            ns.MESSAGE_NAMES.FORM_ERROR,
            ns.frameMessageHandler,
            ($component, data, eventHandlerId) => {
                console.log("form error");
                console.log(["$component", $component, "data", data]);

                if (options.callbackFn) {
                    options.callbackFn(
                        $component,
                        data,
                        ns.MESSAGE_NAMES.FORM_ERROR
                    );
                }
            }
        );
    };

    ns.init = ($component) => {
        console.groupCollapsed("embed init");
        const componentConfig = componentNs.getComponentConfig($component);
        // check if the component have a data attribute with the name "data-field-componentId" and "data-field-name" then register eventNs
        // const componentId = $component.attr("data-field-componentId");
        // const fieldName = $component.attr("data-field-name");
        console.log(["embed init", componentConfig]);

        //run events for this component when it loads
        ns.autoLoad($component);

        console.log(["addEventListener"]);
        // add event listener that have been configured for this component
        ns.addEventListener($component, componentConfig);

        console.log(["embed init done"]);
        console.groupEnd();
    };
})(
    // @ts-ignore
    window.jQuery,
    Typerefinery.Components.Content.Embed,
    Typerefinery.Components,
    Typerefinery.Page.Events,
    Typerefinery.Page.Tms,
    Typerefinery.Modal,
    Typerefinery.Components.Forms.Form,
    document,
    window
);
