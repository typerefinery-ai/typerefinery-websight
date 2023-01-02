function getDataFromDataSource(defaultJson, path, id, refreshTime) {

    const fetchAndUpdateView = async () => {
        const jsonValue = defaultJson;
        try {
            const response = await fetch(path).then(res => res.json());

            !response.value ? updateView(jsonValue, id) : updateView(response, id);
        } catch (error) {
            updateView(jsonValue, id);
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

function updateView(jsonValue, id) {

    const tickerHtmlWithJsonValue = `
        <div class="ticker">
            <div class="body">
                 <div class="title">${jsonValue.title}</div>
                 <div class="content">
                    <div class="value">
                        ${jsonValue.value}
                    </div>
                    <div class="indicator">
                        <div class="icon pi pi-arrow-${jsonValue.indicatorType} ${jsonValue.indicatorType}"></div>
                        <div class="icon pi pi-minus ${jsonValue.indicatorType}"></div>
                        <div class="indicator_value">
                            <span>${jsonValue.indicatorValue}</span>
                            <span class="hours">(24 hours)</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="icon ${jsonValue.icon}"></div>
        </div>
    `;

    const component = document.getElementById(id);
    component.innerHTML = tickerHtmlWithJsonValue;

}

function componentMounted(id, component) {



    var defaultJson = {
        "title": component.getElementsByClassName("heading")[0].innerHTML,
        "value": component.getElementsByClassName("value")[0].innerHTML,
        "icon": component.getElementsByClassName("icon")[0].innerHTML,
        "indicatorType": component.getElementsByClassName("indicator-type")[0].innerHTML,
        "indicatorValue": component.getElementsByClassName("indicator-value")[0].innerHTML
    }

    // getting the dataSource of the component
    var dataSourcePath = component.getElementsByClassName("path")[0].innerHTML;

    // getting the dataSource of the component
    var dataSourceReferenceTime = component.getElementsByClassName("refresh-time")[0].innerHTML;
    // cast to number (ms)
    if (dataSourceReferenceTime) {
        dataSourceReferenceTime = Number(dataSourceReferenceTime) * 1000;
    } else {
        dataSourceReferenceTime = 5000;
    }

    // Rendering the template
    getDataFromDataSource(defaultJson, dataSourcePath, id, dataSourceReferenceTime);

}

$(document).ready(function (e) {
    Array.from(document.querySelectorAll("#ticker")).forEach(component => {
        var componentDataPath = component.getAttribute("data-path");
        component.setAttribute("id", componentDataPath);
        componentMounted(componentDataPath, component);
    })
});