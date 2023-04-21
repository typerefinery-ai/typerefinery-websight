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

(function (ns, tmsNs, eventNs, componentNs, modalNs, tableInstanceNs, searchNs, document, window) {
    "use strict";

    ns.defaultData = {
        columns: [],
        data: [],
        search: false,
        pagination: false,
        resizable: true
    };


    ns.getActionButtonHTML = (actionButtons, row, componentConfig) => {

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


        if(hasModalContent){
            const newModalDivContainer = document.createElement("div");
            newModalDivContainer.setAttribute("class", "modal fade");
            newModalDivContainer.setAttribute("id", "tableModalContent");
            newModalDivContainer.innerHTML = modalNs.getModalInnerHTML("", "", false);
            document.body.appendChild(newModalDivContainer);
            modalNs.submitListenerForModal(newModalDivContainer);
            modalNs.expandModalListener(newModalDivContainer);
            $(newModalDivContainer).on('click', '.closeButtonInModal', function (e) {
                document.querySelector("#tableModalContent iframe").setAttribute("src", "");
                $("#loader").show();
            });


        }


        return result;
    };


    ns.addEventListenerToTableActionButtons = (id) => {
        $(`#${id}`).on('click', 'button', (event) => {
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

            if(rowConfig.actionButtonNavigateToPath?.trim()?.length > 0){
                if(rowConfig.actionButtonNavigateToPath?.trim()?.length > 0) {
                    const path = componentNs.replaceRegex(rowConfig.actionButtonNavigateToPath, row);
                    window.open(`${path}`, "_blank");
                }else{
                    const path = componentNs.replaceRegex(rowConfig.actionButtonNavigateToPath, row);
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
                    return ns.getActionButtonHTML(componentConfig.actionButtons, row, componentConfig);
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
    };



    ns.jsonConnected = async (dataSourceURL, id, $component) => {
        try {

            const response = await fetch(dataSourceURL).then((res) => res.json());
            if (response) {
                ns.updateComponentHTML(id, response, $component);
                return;
            }
            ns.modelDataConnected(id, $component);
        }
        catch (error) {
            console.error(error)
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
            if (!componentData) {
                ns.modelDataConnected(componentConfig.id, $component);
                return;
            }
            const parsedComponentData =JSON.parse(componentData);
            ns.updateComponentHTML(componentConfig.id, parsedComponentData, $component);
        }
        catch (error) {
            ns.modelDataConnected(topic, $component);
        }
    };

    ns.modelDataConnected = (id, $component) => {
        ns.updateComponentHTML(id, {}, $component);
    };

    ns.callbackFn = (data, $component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        ns.updateComponentHTML(componentConfig.id, data, $component);
    };

    ns.eventOnFilter = ($component, filter) => {

        const componentConfig = componentNs.getComponentConfig($component);

        const id = componentConfig.id;

        const filteredData = ns[id].data.filter((row) => {
            return Object.keys(row).some((key) => {
                return row[key].toString().toLowerCase().includes(filter.value.toLowerCase());
            });
        });
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

        const events = componentConfig?.events?.map(event => {
            return {
                topic: event.key,
                type: event.value
            }
        }) || [];

        // if componentConfig.events is defined then add event listeners to table.
        if (events) {
            ns.registerEvents($component, componentConfig.id, events);
        }

    };

})(Typerefinery.Components.Widgets.Table, Typerefinery.Page.Tms, Typerefinery.Page.Events, Typerefinery.Components, Typerefinery.Modal, Typerefinery.Components.Widgets.Table.Instances, Typerefinery.Components.Widgets.Search, document, window);
