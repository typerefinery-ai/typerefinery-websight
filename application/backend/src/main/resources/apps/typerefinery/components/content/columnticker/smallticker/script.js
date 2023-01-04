function getDataFromDataSourceSmallTicker(
  defaultJson,
  path,
  id,
  bgColor,
  textColor
) {
  const fetchAndUpdateView = async () => {
    const jsonValue = defaultJson;
    try {
      const response = await fetch(path).then((res) => res.json());

      !response.value
        ? smallTickerUpdateView(jsonValue, id, bgColor)
        : smallTickerUpdateView(response, id, bgColor);
      console.log("data", response);
    } catch (error) {
      smallTickerUpdateView(jsonValue, id, bgColor, textColor);
    }
  };
  fetchAndUpdateView();
}
//
function smallTickerUpdateView(jsonValue, id, bgColor, textColor) {
  const smallTickerHtmlWithJsonValue = `
    <div class="smallticker">
    <div class="columnticker" style="background-color:${bgColor}">
      <div>
        <div class="ticker-value" style="color:${textColor}">${jsonValue.value}</div>
        <div class="ticker-title" style="color:${textColor}">${jsonValue.title}</div>
      </div>
    </div>
  </div>
    `;
  const smallTickerComponent = document.getElementById(id);
  smallTickerComponent.innerHTML = smallTickerHtmlWithJsonValue;
}

function smallTickerComponentMounted(id, component, bgColor, textColor) {
  var defaultJson = {
    value: component.getElementsByClassName("ticker-value")[0].innerHTML,
    title: component.getElementsByClassName("ticker-title")[0].innerHTML,
  };

  console.log("jsonValue", defaultJson);
  // getting the dataSource of the component
  var dataSourcePath =
    component.getElementsByClassName("ticker-path")[0].innerHTML;
  // Rendering the template
  getDataFromDataSourceSmallTicker(
    defaultJson,
    dataSourcePath,
    id,
    bgColor,
    textColor
  );
}

$(document).ready(function (e) {
  Array.from(document.querySelectorAll("#smallticker")).forEach(
    (smallTickerComponent) => {
      var componentDataPathticker =
        smallTickerComponent.getAttribute("data-path");
      var bgColor = smallTickerComponent.getAttribute("data-bgColor");
      var textColor = smallTickerComponent.getAttribute("data-textColor");
      smallTickerComponent.setAttribute("id", componentDataPathticker);
      smallTickerComponentMounted(
        componentDataPathticker,
        smallTickerComponent,
        bgColor,
        textColor
      );
    }
  );
});
