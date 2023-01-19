function getDataFromDataSource(defaultData, path, id, refreshTime) {

    const fetchAndUpdateView = async () => {
        try {
            const response = await fetch(path).then(res => res.json());

            !response.value ? updateTickerComponent(defaultData, id) : updateTickerComponent(response, id);
        } catch (error) {
            updateTickerComponent(defaultData, id);
        }
    }

    // Check if path exists.
    if (path.trim().length > 0) {

        // min refresh time will be 1 sec.
        if (refreshTime <= 999) {
            refreshTime = 1000;
        }

        setInterval(() => {
            fetchAndUpdateView();
        }, refreshTime);
    }

    fetchAndUpdateView();
}

function updateTickerComponent(tickerData, id) {

    const tickerHtmlWithJsonValue = `
            <div class="body">
                 <div class="title">${tickerData.title}</div>
                 <div class="content">
                    <div class="value">
                        ${tickerData.value}
                    </div>
                    <div class="indicator">
                        <div class="icon pi pi-arrow-${tickerData.indicatorType} ${tickerData.indicatorType}"></div>
                        <div class="icon pi pi-minus ${tickerData.indicatorType}"></div>
                        <div class="indicator_value">
                            <span>${tickerData.indicatorValue}</span>
                            <span class="hours">(24 hours)</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="icon ${tickerData.icon}"></div>
    `;

    const component = document.getElementById(id);
    component.innerHTML = tickerHtmlWithJsonValue;

}

function tickerComponentMounted(id, component) {

    var defaultData = {
        "title": component.getElementsByClassName("heading")[0].innerHTML,
        "value": component.getElementsByClassName("value")[0].innerHTML,
        "icon": component.getElementsByClassName("icon")[0].innerHTML,
        "indicatorType": component.getElementsByClassName("indicator-type")[0].innerHTML,
        "indicatorValue": component.getElementsByClassName("indicator-value")[0].innerHTML
    }

    // getting the dataSource of the component
    var dataSourcePath = component.getAttribute("data-source") || "";

    // getting the dataSource of the component
    var dataSourceReferenceTime = component.getAttribute("data-source-refresh-time") || 5;
    // cast to number (ms)
    if (dataSourceReferenceTime) {
        dataSourceReferenceTime = Number(dataSourceReferenceTime) * 1000;
    } else {
        dataSourceReferenceTime = 5000;
    }

    // Rendering the template
    getDataFromDataSource(defaultData, dataSourcePath, id, dataSourceReferenceTime);

}

$(document).ready(function (e) {
    Array.from(document.querySelectorAll("#ticker")).forEach(component => {
        var componentDataPath = component.getAttribute("data-path");
        console.log(component)
        component.setAttribute("id", componentDataPath);
        tickerComponentMounted(componentDataPath, component);
    })
});