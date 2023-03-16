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
        columns: [
            {
            field: 'Name',
            title: 'Name',
            sortable: true
        }, {
            field: 'Age',
            title: 'Age',
            sortable: true
        }, {
            field: 'Email',
            title: 'Email',
            sortable: false
        }, {
            field: 'Phone Number',
            title: 'Phone Number',
            sortable: false
        }, {
            field: 'Location',
            title: 'Location',
            sortable: false
        }
    ],
        data: [
            {
                "Name": "Peter",
                "Age": 25,
                "Email": "john@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            },
            {
                "Name": "Jane Doe",
                "Age": 23,
                "Email": "jane@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            },
            {
                "Name": "Smith",
                "Age": 26,
                "Email": "smith@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            },
            {
                "Name": "Henry",
                "Age": 26,
                "Email": "smith@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            },
            {
                "Name": "Nichols",
                "Age": 26,
                "Email": "smith@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            },
            {
                "Name": "Max",
                "Age": 26,
                "Email": "smith@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            },
            {
                "Name": "Murphy",
                "Age": 26,
                "Email": "smith@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            },
            {
                "Name": "Stokes",
                "Age": 26,
                "Email": "smith@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            },
            {
                "Name": "Hemsworth",
                "Age": 26,
                "Email": "smith@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            },
            {
                "Name": "Joe",
                "Age": 26,
                "Email": "smith@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            },
            {
                "Name": "William",
                "Age": 26,
                "Email": "smith@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            },
            {
                "Name": "Peter",
                "Age": 26,
                "Email": "smith@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            },
            {
                "Name": "Sophia",
                "Age": 26,
                "Email": "smith@gmail.com",
                "Phone Number": "1234567890",
                "Location": "New York"
            }
        ],
        search: false,
        pagination: false,
        resizable: true
    };


    ns.getActionButtonHTML = (actionButtons, row) => {

        if (!actionButtons || !actionButtons.length) {
            return '';
        }
        

        return actionButtons.map((actionButton) => {
            return `
                <button class="btn ${actionButton.background} btn-sm" data-model="${JSON.stringify(actionButton)}"  data-toggle="tooltip" data-placement="top" title="${actionButton.label}" row-id="${row.id}" type="button">
                    <i class="${actionButton.icon}"></i>
                </button>
            `;
        }).join('');
    };

    ns.addEventListenerToTableActionButtons = (id) => {
        $(`#${id}`).on('click', 'button', (event) => {
            const $button = event.currentTarget;
            console.log($button, "BUTTON IS CLICKED");
            const rowId = $button.getAttribute('row-id');
            console.log( rowId, "ROW ID")
        });
    };

    
    ns.hideColumns = (id, columns) => {
        if (!tableInstanceNs[id] || !columns || !columns.length) {
            return;
        }
        columns.forEach((column) => tableInstanceNs[id].bootstrapTable('hideColumn', column));
    };
    
    ns.getHiddenColumns = (columns) => {
        // if columns is not available, then return empty array.
        if (!columns || !columns.length) {
            return [];
        }

        // if columns is available, then return the columns which have type "HIDDEN"
        return columns.filter((column) => column.type === 'HIDDEN' || !column.type);
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


        // updating the html with empty string to avoid duplicate table.
        $(`#${id}`).empty();

        // table options.
        const tableOptions = {
            search: componentConfig.searchEnabled || data.search,
            pagination: componentConfig.paginationEnabled || data.pagination,
            resizable: componentConfig.resizableEnabled || data.resizable,
            multipleSelectRow: componentConfig.multipleSelectRowEnabled || data.multipleSelectRow || false,
            singleSelect : componentConfig.singleSelectEnabled  || data.singleSelect,
        };
        

        // if multipleSelectRow or singleSelect is enabled, then add checkbox column to table.
        if(tableOptions.multipleSelectRow || tableOptions.singleSelect) {
            // insert checkbox column to data.columns.
            data.columns.unshift({
                checkbox: true,
                field: 'checkboxState',
                align: 'center',
                valign: 'middle'
            });
        }

        // if componentConfig.showActionButtons.
        if (componentConfig.showActionButtons) {

            data.columns.push({
                field: 'action',
                title: 'Action',
                align: 'center',
                valign: 'middle',
                formatter: (value, row, index) => {
                    return ns.getActionButtonHTML(componentConfig.actionButtons, row);
                }
            });
        }


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



    ns.jsonConnected = async (dataSourceURL, componentPath, $component) => {
        try {

            const response = await fetch(dataSourceURL).then((res) => res.json());
            if (response) {
                ns.updateComponentHTML(componentPath, response, $component);
                return;
            }
            ns.modelDataConnected(componentPath, $component);
        }
        catch (error) {
            ns.modelDataConnected(componentPath, $component);
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
            ns.modelDataConnected(componentConfig.id, $component);
        }
    }

})(Typerefinery.Components.Widgets.Table, Typerefinery.Page.Tms, Typerefinery.Components, Typerefinery.Modal, Typerefinery.Components.Widgets.Table.Instances, document, window);
