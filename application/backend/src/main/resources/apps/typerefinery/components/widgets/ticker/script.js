// Update the UI
function updateTickerComponent(tickerData, component) {
  const tickerHtml = `
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

  component.innerHTML = tickerHtml;
}

// Update ticker using tms connection and its payload
function tickerComponentConnectedViaTMS(topic, host) {
  setTimeout(() => {
    connectTMS(topic, host);
  }, 2500);
}

// TMS connection
function connectTMS(topic, host) {
  const components = document.querySelectorAll(`#${topic}`);
  // listen for messages
  window.addEventListener(
    window.MessageService.Client.events.MESSAGE,
    function (message) {
      const messageData = message?.detail?.data?.payload;
      if (messageData) {
        const payload = JSON.parse(messageData);
        const { data } = payload;
        localStorage.setItem(`${topic}`, JSON.stringify(payload));
        if (data) {
          components.forEach((component) => {
            updateTickerComponent(data, component);
          });
        }
      }
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

// Update ticker using dataSource JSON
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
  const model = component.getAttribute("data-model");
  const parsedModel = JSON.parse(model);

  const defaultData = {
    title: parsedModel.title,
    value: parsedModel.value,
    icon: parsedModel.icon,
    indicatorType: parsedModel.indicatorType,
    indicatorValue: parsedModel.indicatorValue,
  };

  updateTickerComponent(defaultData, component);
}

// Initial Function
$(document).ready(function (e) {
  Array.from(document.querySelectorAll("#ticker")).forEach((component) => {
    const componentTopic = component.getAttribute("data-topic");
    const componentHost = component.getAttribute("data-host");
    const componentDataSource = component.getAttribute("data-source");

    // Data can be updated via TMS Connection.
    if (componentTopic && componentHost) {
      component.setAttribute("id", componentTopic);
      var localStorageValue = window.localStorage.getItem(`${componentTopic}`);
      if (localStorageValue) {
        updateTickerComponent(JSON.parse(localStorageValue).data, component);
      } else {
        tickerComponentConnectedViaInitialData(component);
      }
      tickerComponentConnectedViaTMS(componentTopic, componentHost, component);
    }
    // Data can be updated via Data Source JSON
    else if (componentDataSource) {
      tickerComponentConnectedViaJSON(componentDataSource, component);
    }
    // Data can be updated via the default values from the model.
    else {
      tickerComponentConnectedViaInitialData(component);
    }
  });
});
