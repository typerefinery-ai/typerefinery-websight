window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Table = Typerefinery.Components.Widgets.Table || {};
window.Typerefinery.Components.Widgets.Table.Instances = Typerefinery.Components.Widgets.Table.Instances || {};
window.Typerefinery.Components.Widgets.Search = Typerefinery.Components.Widgets.Search || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};
window.Typerefinery.Page.Events = Typerefinery.Page.Events || {};
window.Typerefinery.Modal = Typerefinery.Modal || {};

(function ($, ns, tmsNs, eventNs, componentNs, modalNs, tableInstanceNs, searchNs, document, window) {
    "use strict";

    ns.selectorComponent = '[component=table]';    

    ns.defaultData = {
        columns: [],
        data: [],
        search: false,
        pagination: false,
        resizable: true
    };


    ns.getActionButtonHTML = ($component, actionButtons, row, componentConfig) => {

        if (!actionButtons || !actionButtons.length) {
            return '';
        }

        let hasModalContent = false;


        let result =  actionButtons.map((actionButton) => {
            if(actionButton.actionButtonNavigateToPath !== null){
                hasModalContent = true;
            }

            return `
                <button class="btn ${actionButton.background} btn-sm" data-model='${JSON.stringify(actionButton)}' row-model='${JSON.stringify(row)}' row-id="${row[componentConfig.uniqueIdColumn]}" type="button">
                    <i data-bs-toggle="tooltip" data-bs-placement="top" title="${actionButton.label}" class="${actionButton.icon}"></i>
                </button>
            `;
        }).join('');


        if(hasModalContent && !$component.find('#tableModalContent').length){
            // Guard: this runs inside a per-row column formatter, so without the length check a
            // table with N rows appended N modal containers per render and re-wired their
            // listeners each time. One shared modal per component is the intent (fixed id).
            const newModalDivContainer = document.createElement("div");
            newModalDivContainer.setAttribute("class", "modal fade");
            newModalDivContainer.setAttribute("id", "tableModalContent");
            newModalDivContainer.innerHTML = modalNs.getModalInnerHTML();
            $component.append(newModalDivContainer);
            // document.body.appendChild(newModalDivContainer);
            // Modal helpers take a jQuery-wrapped element ($modal.on/.find) - passing the raw
            // DOM node threw "$modal.on is not a function" from inside the row formatter,
            // aborting bootstrap-table's body render (headers painted, zero rows).
            const $newModal = $(newModalDivContainer);
            modalNs.addModalSubmitListener($newModal);
            modalNs.addModalMaximiseListener($newModal);
            $newModal.on('click', '.closeButtonInModal', function (e) {
              $component.find("#tableModalContent iframe").attr("src", ""); // was setAttribute on a jQuery object - always threw
              $newModal.find("#loader").show();
            });


        }


        return result;
    };


    ns.addEventListenerToTableActionButtons = (id) => {
        $(`#${id}`).on('click', 'button', async (event) => {
            const $button = event.currentTarget;
            const rowConfig = JSON.parse($button.getAttribute('data-model'));
            const row = JSON.parse($button.getAttribute('row-model'));
            console.log("---------------------------------ACTION BUTTON IS CLICKED---------------------------------")
            console.log(row);

            if(rowConfig.actionButtonModalContentURL?.trim()?.length > 0){
                const path = componentNs.replaceRegex(rowConfig.actionButtonModalContentURL, row);

                document.querySelector("#tableModalContent iframe").setAttribute("src", path);
                $("#tableModalContent").modal("show");
                modalNs.removeLoaderOnModalLoad();
            }

            // Optional pre-navigation action: POST the row object to a configured URL and only
            // navigate on success. Generic - the receiving service owns any interpretation of
            // the row (alpha-launch docs/decisions/0002). Status-checked per docs/issues/0014.
            if(rowConfig.actionButtonPostUrl?.trim()?.length > 0){
                const postUrl = componentNs.replaceRegex(rowConfig.actionButtonPostUrl, row);
                console.log(`action button POST ${postUrl}`);
                try {
                    const response = await fetch(postUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(row),
                        keepalive: true,
                        redirect: "follow"
                    });
                    if (!response.ok) {
                        console.error(`action button POST ${postUrl} failed with HTTP ${response.status}; not navigating`);
                        return;
                    }
                    console.log(`action button POST ${postUrl} ok`);
                } catch (error) {
                    console.error(`action button POST ${postUrl} error; not navigating`, error);
                    return;
                }
            }

            if(rowConfig.actionButtonNavigateToPath?.trim()?.length > 0){
                const path = componentNs.replaceRegex(rowConfig.actionButtonNavigateToPath, row);
                if(rowConfig.actionButtonNavigateToNewWindow === true || rowConfig.actionButtonNavigateToNewWindow === "true") {
                    window.open(`${path}`, "_blank");
                } else {
                    // Same-window by default: a drill-in should replace the current view.
                    // (The previous code compared the same truthy condition twice, so the
                    // same-window branch was unreachable and every navigate opened a new tab.)
                    window.location.href = path;
                }
            }
        });
    };

    
    ns.hideColumns = (id, columns) => {
        if (!tableInstanceNs[id] || !columns || !columns.length) {
            return;
        }
        columns.forEach((column) => tableInstanceNs[id].bootstrapTable('hideColumn', column.field));
    };
    
    ns.getHiddenColumns = (columns) => {
        // if columns is not available, then return empty array.
        if (!columns || !columns.length) {
            return [];
        }

        // if columns is available, then return the columns which have type "HIDDEN"
        return columns.filter((column) => column.rule === 'HIDDEN' || !column.rule);
    };

    ns.updateComponentHTML = (id, data, $component, isDataFiltered = false) => {
        if (!$component) {
            return;
        }

        const componentConfig = componentNs.getComponentConfig($component);

        // if componentConfig.overRideColumns is not available then use the data.columns = componentConfig.columns.
        if (!componentConfig.overRideColumns) {
            data.columns = componentConfig.columns || [];
        }

        // If no columns are available, then set data.data = [].
        if(data?.columns?.length === 0 || !data?.columns || !data?.data) {
            data.data = [];
            data.columns = [];
        }


        // if componentConfig.columnRules is available then add sortable to data.columns.
        if (componentConfig.columnRules) {
            data.columns = data.columns.map((column) => {
                const columnRule = componentConfig.columnRules.find((rule) => rule.field === column.field);
                column.sortable = columnRule?.rule === "SORTABLE" ? true : false;
                return column;
            });
        }

        // if data.columns has type then add a formatter to data.columns.
        if (data.columns?.length > 0 && data.columns.some((column) => column.type)) {
            data.columns = data.columns.map((column) => {

                // if column.type is DATE then add a formatter to column.
                if (column.type === 'DATE') {
                    column.formatter = (value) => {
                        return value ? moment(value).format('DD/MM/YYYY') : '';
                    };
                }

                // if column.type is DATETIME then add a formatter to column.
                if (column.type === 'DATETIME') {
                    column.formatter = (value) => {
                        return value ? moment(value).format('DD/MM/YYYY HH:mm:ss') : '';
                    };
                }

                // if column.type is TIME then add a formatter to column.
                if (column.type === 'TIME') {
                    column.formatter = (value) => {
                        return value ? moment(value).format('HH:mm:ss') : '';
                    };
                }

                // if column.type is NUMBER then add a formatter to column.
                if (column.type === 'NUMBER') {
                    column.formatter = (value) => {
                        return value ? value.toLocaleString() : '';
                    };

                    column.sorter = (a, b) => {
                        return a - b;
                    };
                }

                // if column.type is CURRENCY then add a formatter to column.
                if (column.type === 'CURRENCY') {
                    column.formatter = (value) => {
                        return value ? value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '';
                    };
                    
                    column.sorter = (a, b) => {
                        return a - b;
                    };
                }

                // if column.type is PERCENTAGE then add a formatter to column.
                if (column.type === 'PERCENTAGE') {
                    column.formatter = (value) => {
                        return value ? value.toLocaleString('en-IN', { style: 'percent', minimumFractionDigits: 2 }) : '';
                    };

                    column.sorter = (a, b) => {
                        return a - b;
                    };

                }


                // if column.type is IMAGE then add a formatter to column.
                if (column.type === 'IMAGE') {
                    column.formatter = (value) => {
                        return value ? `<img src="${value}" style="width: 100px; height: 100px; object-fit: contain;" />` : '';
                    };

                    column.sortable = false;
                }

                // if column.type is ICON then add a formatter to column.
                if (column.type === 'ICON') {
                    column.formatter = (value) => {
                        return value ? `<i class="${value}"></i>` : '';
                    };

                    column.sortable = false;
                }

                // if column.type is LINK then add a formatter to column.

                if (column.type === 'LINK') {
                    column.formatter = (value, row) => {
                        return value ? `<a href="${value}" target="_blank">${value}</a>` : '';
                    };
                    
                    column.sortable = false;
                }

                // if column.type is Badge then add a formatter to column.
                if (column.type === 'BADGE') {
                    column.formatter = (value, row) => {
                        return value ? `<span class="badge bg-${row.badgeColor || column.badgeColor || 'primary'}">${value}</span>` : '';

                    };
                
                    column.sortable = false;
                }


                return column;
            });
        }


        // table options.
        const tableOptions = {
            search: componentConfig.searchEnabled || data.search,
            pagination: componentConfig.paginationEnabled || data.pagination,
            resizable: componentConfig.resizableEnabled || data.resizable,
            multipleSelectRow: componentConfig.multipleSelectRowEnabled || data.multipleSelectRow || false,
            singleSelect : !(componentConfig.multipleSelectRowEnabled || data.multipleSelectRow || false) && (componentConfig.singleSelectEnabled  || data.singleSelect),
            uniqueId: componentConfig.uniqueIdColumn || data.uniqueId
        };
        

        // if multipleSelectRow or singleSelect is enabled, then add checkbox column to table.
        if(tableOptions.multipleSelectRow || tableOptions.singleSelect) {
            // insert checkbox column to data.columns.
            data.columns.unshift({
                checkbox: true,
                field: 'isSelected',
                align: 'center',
                valign: 'middle'
            });
        }

        if (componentConfig.showActionButtons) {
            data.columns.push({
                field: 'action',
                title: 'Action',
                align: 'center',
                valign: 'middle',
                formatter: (value, row, index) => {
                    return ns.getActionButtonHTML($component, componentConfig.actionButtons, row, componentConfig);
                }
            });
        }

        // destroy table if already exists.
        if(tableInstanceNs[id]) {
            tableInstanceNs[id].bootstrapTable('destroy');
        }

        // if data is not filtered then add data to ns.
        if(!isDataFiltered) {
            ns[id] = data;
        }
        
        // bootstrap table.
        tableInstanceNs[id] = $(`#${id}`).bootstrapTable({
            columns: data.data.length > 0 ? data.columns : [],
            data: data.data,
            ...tableOptions
        });

        // hide columns.
        ns.hideColumns(id, ns.getHiddenColumns(componentConfig.columnRules));


        // add event listener to table action buttons.
        ns.addEventListenerToTableActionButtons(id);

        // opt-in: make the row itself a drill-in target (alpha-launch decision 0037).
        ns.addRowClickNavigation(id, componentConfig);
    };

    /**
     * Make a table row itself trigger its navigating action button.
     *
     * alpha-launch **decision 0037 (Option 1)**. `Mini_App_Tasks.docx` Page 1 specifies the drill-in
     * gesture as *"Left-Select or Double-Click on an incident's row"*, but the build only ever exposed
     * it on a per-row `Open` button, so the specified gesture existed nowhere.
     *
     * ⚠️ **OPT-IN, deliberately.** Five authored tables use this component. Making every row navigate
     * whenever a navigating action button happens to exist would silently change behaviour for all of
     * them — wrong for a shared, generic component. Authors switch it on with `rowClickNavigates`.
     *
     * ⚠️ **Stays data-agnostic.** It selects the target button by the *generic* config key
     * `actionButtonNavigateToPath` — "the button that navigates" — never by a label like "Open" or by
     * any domain concept. This component must not learn what an incident is.
     *
     * 🔑 **Reuses the existing handler rather than duplicating it**: it triggers the button's own
     * click, so the modal / POST / navigate sequence (including the POST status check that decides
     * whether to navigate at all) stays in exactly one place.
     *
     * ⚠️ **Binds `click` only, not `dblclick`.** A double-click already delivers a `click` first, so
     * the docx's "or Double-Click" is satisfied without a second binding — and binding both would fire
     * the navigation twice. This also answers decision 0037's open question about a double-click
     * colliding with the table's own selection/sorting: nothing extra is bound, so nothing collides.
     */
    ns.addRowClickNavigation = (id, componentConfig) => {
        const enabled = componentConfig?.rowClickNavigates;
        if (enabled !== true && enabled !== "true") {
            return;
        }
        $(`#${id}`).on("click", "tbody tr", (event) => {
            // Never hijack a real control inside the row - the action buttons, links, and the
            // checkbox/sort/search affordances must keep behaving exactly as they did.
            if ($(event.target).closest("button, a, input, select, textarea, label").length) {
                return;
            }
            const $navigating = $(event.currentTarget).find("button").filter(function () {
                try {
                    return !!JSON.parse(this.getAttribute("data-model") || "{}").actionButtonNavigateToPath;
                } catch (error) {
                    console.warn("row-click navigation: unreadable data-model on a row button", error);
                    return false;
                }
            }).first();

            if (!$navigating.length) {
                // Honest no-op: the row has no navigating action, so there is nothing to drill into.
                console.log(`row-click navigation: no navigating action button in this row of #${id}`);
                return;
            }
            console.log(`row-click navigation: triggering the row's navigating action button in #${id}`);
            $navigating.trigger("click");
        });
    };



    /**
     * @param onFailure optional fallback invoked when the fetch cannot produce a payload. Defaults
     *   to the "waiting for data" state. docs/issues/0152 passes a cached-payload renderer here so
     *   an unreachable endpoint degrades to the last known rows rather than to an empty table.
     */
    ns.jsonConnected = async (dataSourceURL, id, $component, onFailure) => {
        const fail = (why) => {
            if (typeof onFailure === "function") {
                console.warn(["table dataSource unavailable; falling back", id, dataSourceURL, why]);
                onFailure();
                return;
            }
            ns.waitingForDataConnected(id, $component);
        };
        try {
            // Since decision 0003 (option B) this is also the cold-start path for TMS-backed
            // tables, not just the JSON-only case — so its failures are now user-visible and
            // worth logging with enough context to tell "endpoint down" from "wrong shape".
            const res = await fetch(dataSourceURL);
            if (!res.ok) {
                console.error(["table dataSource fetch failed", id, dataSourceURL, res.status, res.statusText]);
                fail(`HTTP ${res.status}`);
                return;
            }
            const response = await res.json();
            if (response) {
                console.log(["table dataSource loaded", id, dataSourceURL,
                    Array.isArray(response) ? `bare array of ${response.length}` : `keys: ${Object.keys(response).join(",")}`]);
                ns.updateComponentHTML(id, response, $component);
                return;
            }
            console.warn(["table dataSource returned an empty body", id, dataSourceURL]);
            fail("empty body");
        }
        catch (error) {
            console.error(["table dataSource error", id, dataSourceURL, error]);
            fail(String((error && error.message) || error));
        }
    };

    ns.tmsConnected = async (host, topic, $component) => {
        try {
            if (!topic || !host) {
                ns.modelDataConnected($component);
                return;
            }

            let componentConfig = componentNs.getComponentConfig($component);
            tmsNs.registerToTms(host, topic, componentConfig.resourcePath, (data) => ns.callbackFn(data, $component));
            const componentData = localStorage.getItem(`${topic}`);

            // The flow publishes its payload from a senddata node when the flow *starts*, and that
            // publish is fire-and-forget. A browser opened afterwards has nothing cached and used to
            // render an empty table for ever — the Mini App's landing page showed "No matching
            // records found" on every fresh machine and after every stack restart
            // (alpha-launch docs/issues/0029).
            //
            // decision 0003 = Option B: fall through to the component's own HTTP dataSource so first
            // paint no longer depends on flow timing. The TMS subscription registered above stays
            // live, so a later publish still updates the table through callbackFn.
            //
            // Data-agnostic: this is a URL from component config. The widget knows nothing about
            // what the rows mean — shaping into {columns, data} is the flow's job.
            //
            // Deliberately NOT `dataSource`: that property carries a component-level *mock* default
            // (mock/datasource1.json — fake people rows), so reusing it would paint invented data
            // onto a page whose flow simply had not published yet. The cold-start source is opt-in
            // per component; absent it, we say we are waiting.
            const componentDataSource = componentConfig.coldStartDataSource;

            // ⚠️ docs/issues/0152 — the cached payload used to win outright: this read was
            // `if (!componentData) { …fetch… }`, so a key cached by ANY earlier build was rendered
            // unconditionally and the fetch never happened. There is no freshness check on it — no
            // timestamp, no version — so a returning browser showed rows that had been withdrawn
            // from the data set, under columns that no longer existed, indefinitely (nothing
            // publishes on page load, so the live TMS subscription never corrected it). On Act 1's
            // opening screen that is invented data presented as live.
            //
            // 0029's author already refused to paint *mock* rows onto a page whose flow had not
            // published; a *stale* cache is worse, because withdrawn rows are indistinguishable from
            // live ones. So when a cold-start route is configured it is now AUTHORITATIVE on load,
            // and the cache is demoted to the fallback for when that fetch cannot answer.
            if (componentDataSource) {
                console.log(["table load: fetching authoritative payload", componentConfig.id, topic,
                    "coldStartDataSource:", componentDataSource,
                    componentData ? "(cached payload held in reserve)" : "(no cached payload)"]);

                // NOT asking over TMS here. That was decision 0003 option A, which was not taken:
                // no flow answers such a request, and calling it at this point throws inside the
                // MessageService client (the socket is not open yet), which logged an error on
                // every cold start for no benefit. ns.requestData remains in the TMS clientlib if
                // the handshake is ever revisited. See docs/issues/0029.

                ns.jsonConnected(componentDataSource, componentConfig.id, $component,
                    componentData
                        ? () => ns.cachedPayloadConnected(componentData, componentConfig.id, topic, $component)
                        : undefined);
                return;
            }

            // No live route configured — the cache is all there is.
            if (componentData) {
                ns.cachedPayloadConnected(componentData, componentConfig.id, topic, $component);
                return;
            }
            // Nothing cached and nothing to fetch: say so, rather than rendering a table that
            // looks empty when it is really still waiting (0029 option 3).
            ns.waitingForDataConnected(componentConfig.id, $component);
        }
        catch (error) {
            ns.modelDataConnected(topic, $component);
        }
    };

    ns.modelDataConnected = (id, $component) => {
        ns.updateComponentHTML(id, {}, $component);
    };

    /**
     * Render a payload previously cached in localStorage under the TMS topic.
     *
     * Since docs/issues/0152 this is a **fallback**, not the primary path: it runs when no live
     * route is configured, or when that route could not answer. The payload has no freshness
     * information of any kind, so it may be arbitrarily old — the log line says so explicitly and
     * names the topic, because "the table is showing last week's rows" is otherwise indistinguishable
     * from a working page.
     */
    ns.cachedPayloadConnected = (componentData, id, topic, $component) => {
        try {
            const parsedComponentData = JSON.parse(componentData);
            const rows = (parsedComponentData && parsedComponentData.data && parsedComponentData.data.length) || 0;
            console.warn(["table rendering CACHED payload of unknown age", id, topic,
                `${rows} row(s)`, `${componentData.length} bytes`]);
            ns.updateComponentHTML(id, parsedComponentData, $component);
        }
        catch (error) {
            console.error(["table cached payload is unreadable; discarding", id, topic, error]);
            ns.waitingForDataConnected(id, $component);
        }
    };

    /**
     * Render the table chrome in an explicit "waiting" state.
     *
     * A component that has not been sent data yet and a component whose data set is genuinely
     * empty are very different things, and rendering both as "No matching records found" made a
     * pending page look broken (docs/issues/0029 option 3, kept regardless of decision 0003).
     * Message text is generic — no knowledge of what the rows contain.
     */
    ns.waitingForDataConnected = (id, $component) => {
        console.warn(["table has no cached payload and no dataSource configured; waiting for data", id]);
        ns.modelDataConnected(id, $component);
        try {
            const $table = tableInstanceNs[id];
            if ($table && typeof $table.bootstrapTable === "function") {
                $table.bootstrapTable("updateFormatText", "formatNoMatches", () => "Waiting for data…");
                $table.bootstrapTable("load", []);
            }
        } catch (error) {
            // Never let a cosmetic empty-state tweak break the render path.
            console.error(["table waiting-state render failed", id, error]);
        }
    };

    ns.callbackFn = (data, $component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        ns.updateComponentHTML(componentConfig.id, data, $component);
    };

    ns.eventOnFilter = ($component, filter) => {

        const componentConfig = componentNs.getComponentConfig($component);

        const id = componentConfig.id;

        // This handler was unreachable from any authored event (alpha-launch docs/issues/0110).
        // It read `filter.value`, but the page event bus never delivers that shape: emitEvent carries
        // whatever compileEventData built, which is always the envelope
        //     { type, payload, action, componentId, config }
        // so `filter.value` was undefined and the handler threw
        // "Cannot read properties of undefined (reading 'toLowerCase')" before filtering anything.
        // Measured live on the Incidents page (e2e/probe-0110-filter-payload.mjs): envelope -> threw,
        // bare {value} -> 188 rows filtered to 2. Every other consumer in the codebase already reads
        // eventData.payload.* (see content/embed and widgets/modal), so the envelope is the norm and
        // this handler was the outlier. Both shapes are accepted rather than swapping one for the
        // other, because the bare shape is what the component's own tests and callers pass directly.
        const term = String(filter?.payload?.value ?? filter?.value ?? "");
        if (!term) {
            console.log(["eventOnFilter: no term in event, ignoring", id, filter]);
            return;
        }
        const needle = term.toLowerCase();

        const filteredData = ns[id].data.filter((row) => {
            return Object.keys(row).some((key) => {
                // A null/undefined cell used to throw here and kill the whole filter, not just
                // the row - same class of unguarded access as the term above.
                const cell = row[key];
                return cell !== null && cell !== undefined
                    && cell.toString().toLowerCase().includes(needle);
            });
        });
        console.log(["eventOnFilter", id, "term", term, "matched", filteredData.length, "of", ns[id].data.length]);
        tableInstanceNs[id].bootstrapTable('load', filteredData);
    };

    ns.eventHandlers = {
        'FILTER': ns.eventOnFilter,
        'HIGHLIGHT': ns.eventOnHighlight
    };

    ns.getEventHandlerCallBackFn = ($component, event) => {
        if(!event.topic) {
            return () => {};
        }
        return (data) => ns.eventHandlers[event.type]($component, data) || (() => {});
    };

    ns.registerEvents = ($component, id, events) => {
        events.forEach((event) => {
            eventNs.registerEvents(event.topic, ns.getEventHandlerCallBackFn($component, event));
        });

        const componentId = $component.attr("data-field-componentId");
        const fieldName = $component.attr("data-field-name");
        if(!componentId || !fieldName) {
            return;
        }
        // Listen to LOAD_DATA event. 
        const key = `${componentId}-${fieldName}`;
        
        eventNs.registerEvents(key, (data) => {
            if(data.type === eventNs.EVENTS.EVENT_READ_ACTION) {
                ns.updateComponentHTML(id, data.data.value, $component);
            }
        }); 
    };

    ns.init = ($component) => {
        // parse json value from data-model attribute as component config
        const componentConfig = componentNs.getComponentConfig($component);
        const componentTopic = componentConfig?.websocketTopic;
        const componentHost = componentConfig.websocketHost;
        const componentDataSource = componentConfig.dataSource;

        // TMS.
        if (componentHost && componentTopic) {
            ns.tmsConnected(componentHost, componentTopic, $component);
        }
        // JSON
        else if (componentDataSource) {
            ns.jsonConnected(componentDataSource, componentConfig.id, $component);
        }
        // MODEL 
        else {
            ns.modelDataConnected(componentConfig.id, $component);
        }

        // alpha-launch decision 0032 / docs/issues/0110. Authored events arrive as `EventsListItem`
        // (BaseComponent's `_events_` child resource), whose fields are `topic` / `type` / `action` —
        // there is no `key` or `value` on it at all. Reading `event.key` therefore produced
        // `{topic: undefined}`, and getEventHandlerCallBackFn below returns a no-op for a falsy
        // topic, so an authored FILTER event registered nothing and failed silently.
        //
        // This is the THIRD shape mismatch in the same chain: the handler read a bare payload where
        // the bus sends an envelope (fixed in f55c97c7), and now the registration read key/value
        // where the model sends topic/type. Both shapes are accepted rather than swapped, in case a
        // caller elsewhere really does pass key/value.
        const events = componentConfig?.events?.map(event => {
            return {
                topic: event.topic ?? event.key,
                type: event.type ?? event.value
            }
        }) || [];
        if (componentConfig?.events?.length) {
            console.log(["table registerEvents: authored events", componentConfig.events, "->", events]);
        }

        // if componentConfig.events is defined then add event listeners to table.
        if (events) {
            ns.registerEvents($component, componentConfig.id, events);
        }

    };

})(jQuery, Typerefinery.Components.Widgets.Table, Typerefinery.Page.Tms, Typerefinery.Page.Events, Typerefinery.Components, Typerefinery.Modal, Typerefinery.Components.Widgets.Table.Instances, Typerefinery.Components.Widgets.Search, document, window);
