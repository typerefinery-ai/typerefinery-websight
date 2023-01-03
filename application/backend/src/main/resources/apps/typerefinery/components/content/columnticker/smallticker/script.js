
function getDataFromDataSourceSmallTicker(defaultJson, path, id,bgColor) {
  const fetchAndUpdateView = async () => {
   const jsonValue = defaultJson;
    try {
      const response = await fetch(path).then((res) => res.json());

      !response.value ? smallTickerUpdateView(jsonValue, id,bgColor) : smallTickerUpdateView(response, id,bgColor);
      console.log("data", response);
    } catch (error) {
        smallTickerUpdateView(jsonValue, id,bgColor);
    }
  };

  fetchAndUpdateView();
}

function smallTickerUpdateView(jsonValue, id,bgColor) {
  const smallTickerHtmlWithJsonValue = `
    <div class="smallticker">
    <div class="columnticker" style="background-color:${bgColor}">
      <div>
        <div class="ticker-value">${jsonValue.value}</div>
        <div class="ticker-title">${jsonValue.title}</div>
      </div>
    </div>
  </div>
    `;
  const smallTickerComponent = document.getElementById(id);
  smallTickerComponent.innerHTML = smallTickerHtmlWithJsonValue;
}

function smallTickerComponentMounted(id, component,bgColor) {
  var defaultJson = {
    value: component.getElementsByClassName("ticker-value")[0].innerHTML,
    title: component.getElementsByClassName("ticker-title")[0].innerHTML,
  };

  console.log("jsonValue", defaultJson);
  // getting the dataSource of the component
  var dataSourcePath = component.getElementsByClassName("ticker-path")[0].innerHTML;
  console.log("datasource", dataSourcePath);
  // getting the dataSource of the component
  // Rendering the template
  getDataFromDataSourceSmallTicker(
    defaultJson,
    dataSourcePath,
    id,
    bgColor
  );
}

$(document).ready(function (e) {
  Array.from(document.querySelectorAll("#smallticker")).forEach(
    (smallTickerComponent) => {
      var componentDataPathticker =
        smallTickerComponent.getAttribute("data-path");
        var bgColor=smallTickerComponent.getAttribute("data-bgColor");
      smallTickerComponent.setAttribute("id", componentDataPathticker);
      smallTickerComponentMounted(
        componentDataPathticker,
        smallTickerComponent,
        bgColor
      );
    }
  );
});
