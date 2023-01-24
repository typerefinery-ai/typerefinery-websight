function getDataFromDataSource(defaultData, path, id) {
  const fetchAndUpdateView = async () => {
    try {
      const response = await fetch(path).then((res) => res.json());

      !response.value
        ? updateTickerComponent(defaultData, id)
        : updateTickerComponent(response, id);
    } catch (error) {
      updateTickerComponent(defaultData, id);
    }
  };
  fetchAndUpdateView();
}

function updateTickerComponent(tickerData, component) {
  // const component = document.getElementById(id);
  // if (component.getAttribute("data-topic") === id) {
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

  component.innerHTML = tickerHtmlWithJsonValue;
  // }
}

//Update ticker using tms connection and its payload
function tickerComponentConnectedViaTMS(topic, host) {
  setTimeout(() => {
    connectTMS(topic, host);
  }, 5000);
}
// TMS connection
function connectTMS(topic, host) {
  var component = document.getElementById(topic);
  console.log("id", document.getElementById(topic));
  // listen for messages
  window.addEventListener(
    window.MessageService.Client.events.MESSAGE,
    function (message) {
      console.log(
        `ui event: ${window.MessageService.Client.events.MESSAGE}`,
        message.detail,
        "hello"
      );
      const payload = message.detail.data.payload;
      console.log("pay", payload);
      const parsedPayload = JSON.parse(payload);
      const resultPayload = parsedPayload.data;
      // document.getElementById("messages")?.appendChild(messageItem);
      updateTickerComponent(resultPayload, component);
    }
  );
  function payload_insert(data) {
    console.log("payload_insert", data);
  }
  // connect to websocket
  window.MessageService.Client.connect(host, function () {
    console.log("tms connected cms.");
    window.MessageService.Client.subscribe("payload_insert", payload_insert);
  });
}
// Update ticker using datasource JSON
function tickerComponentConnectedViaJSON(jsonUrl, component) {
  const fetchAndUpdateView = async () => {
    try {
      const response = await fetch(jsonUrl).then((res) => res.json());

      !response.value
        ? tickerComponentConnectedViaInitialData(component)
        : updateTickerComponent(response, component);
    } catch (error) {
      tickerComponentConnectedViaInitialData(component);
    }
  };
  fetchAndUpdateView();
}
// Default data
function tickerComponentConnectedViaInitialData(component) {
  var model = component.getAttribute("data-model");
  const parsedModel = JSON.parse(model);
  var defaultData = {
    title: parsedModel.title,
    value: parsedModel.value,
    icon: parsedModel.icon,
    indicatorType: parsedModel.indicatorType,
    indicatorValue: parsedModel.indicatorValue,
  };
  // Rendering the template

  updateTickerComponent(defaultData, component);
}

// ticker component
$(document).ready(function (e) {
  Array.from(document.querySelectorAll("#ticker")).forEach((component) => {
    var componentTopic = component.getAttribute("data-topic");
    var componentHost = component.getAttribute("data-host");
    var componentDataSource = component.getAttribute("data-source");
    if (componentTopic && componentHost) {
      component.setAttribute("id", componentTopic);
      tickerComponentConnectedViaTMS(componentTopic, componentHost, component);
    }
    //datasourcs json
    else if (componentDataSource) {
      tickerComponentConnectedViaJSON(componentDataSource, component);
    } else {
      tickerComponentConnectedViaInitialData(component);
    }
  });
});
