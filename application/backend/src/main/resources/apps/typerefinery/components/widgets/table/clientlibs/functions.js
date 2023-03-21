window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Table = Typerefinery.Components.Widgets.Table || {};
window.Typerefinery.Components.Widgets.Table.Instances = Typerefinery.Components.Widgets.Table.Instances || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};
window.Typerefinery.Modal = Typerefinery.Modal || {};

(function (ns, tmsNs, componentNs, modalNs, tableInstanceNs, document, window) {
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
                <button class="btn ${actionButton.background} btn-sm" data-model='${JSON.stringify(actionButton)}' row-id="${row[componentConfig.uniqueIdColumn]}" type="button">
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
        }


        return result;
    };

    ns.addEventListenerToTableActionButtons = (id) => {
        $(`#${id}`).on('click', 'button', (event) => {
            const $button = event.currentTarget;
            const rowId = $button.getAttribute('row-id');
            console.log( rowId, "ROW ID");
            const rowConfig = JSON.parse($button.getAttribute('data-model'));
            const row = tableInstanceNs[id].bootstrapTable('getRowByUniqueId', rowId);
            console.log(row, "row");
            
            const ORIGIN = window.location.origin;
        
            if(rowConfig.actionButtonModalContentURL?.trim()?.length > 0){
                document.querySelector("#tableModalContent iframe").setAttribute("src", `${ORIGIN}${rowConfig.actionButtonModalContentURL}`);
                $("#tableModalContent").modal("show");
            }

            if(rowConfig.actionButtonNavigateToPath?.trim()?.length > 0){
                if(rowConfig.actionButtonNavigateToPath?.trim()?.length > 0) {
                    window.open(`${ORIGIN}${rowConfig.actionButtonNavigateToPath}`, "_blank");
                }else{
                    window.location.href = `${ORIGIN}${rowConfig.actionButtonNavigateToPath}`;
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

    ns.updateComponentHTML = (id, data, $component) => {

        if (!$component) {
            return;
        }

        const componentConfig = componentNs.getComponentConfig($component);

        // if data is not available, then use default data.
        if (!data?.columns || !data?.data) {
            data = ns.defaultData;
        }

        console.log(componentConfig, "componentConfig")

        // if componentConfig.overRideColumns is not available then use the data.columns = componentConfig.columns.
        if (!componentConfig.overRideColumns) {
            data.columns = componentConfig.columns || [];
        }


        // if componentConfig.columnRules is available then add sortable to data.columns.
        if (componentConfig.columnRules) {
            data.columns = data.columns.map((column) => {
                const columnRule = componentConfig.columnRules.find((rule) => rule.field === column.field);
                column.sortable = columnRule?.rule === "SORTABLE" ? true : false;
                return column;
            });
        }



        // updating the html with empty string to avoid duplicate table.
        $(`#${id}`).empty();

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

        console.log(componentConfig, "componentConfig.componentConfig")
        // if componentConfig.showActionButtons.
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

        console.log(data.columns, "data.columns")

        // bootstrap table.
        tableInstanceNs[id] = $(`#${id}`).bootstrapTable({
            columns: data.columns,
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
            // ns.modelDataConnected(id, $component);
        }
    }

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
                ns.modelDataConnected(topic, $component);
                return;
            }
            ns.updateComponentHTML(topic, JSON.parse(componentData), $component);
        }
        catch (error) {
            ns.modelDataConnected(topic, $component);
        }
    }

    ns.modelDataConnected = (id, $component) => {
        ns.updateComponentHTML(id, {}, $component);
    }

    ns.callbackFn = (data, $component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        ns.updateComponentHTML(componentConfig.websocketTopic, data, $component);
    }

    ns.init = ($component) => {
        // parse json value from data-model attribute as component config
        const componentConfig = componentNs.getComponentConfig($component);
        const componentTopic = componentConfig?.websocketTopic;
        const componentHost = componentConfig.websocketHost;
        const componentDataSource = componentConfig.dataSource;

        // TMS.
        if (componentHost && componentTopic) {
            $component.setAttribute("id", componentTopic);
            ns.tmsConnected(componentHost, componentTopic, $component);
        }
        // JSON
        else if (componentDataSource) {
            ns.jsonConnected(componentDataSource, componentConfig.id, $component);
        }
        // MODEL 
        else {
            console.log("MODEL INCOKED")
            ns.modelDataConnected(componentConfig.id, $component);
        }
    }

})(Typerefinery.Components.Widgets.Table, Typerefinery.Page.Tms, Typerefinery.Components, Typerefinery.Modal, Typerefinery.Components.Widgets.Table.Instances, document, window);
