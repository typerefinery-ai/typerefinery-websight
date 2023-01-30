// Update the UI
//TODO: move all functions to namespace in clientlibs/functions.js
function updateTickerComponent(tickerData, component) {
  // handle default for data that might not be present
  const componentConfig = getComponentConfig(component);
  const tickerHtml = `
            <div class="body">
                 <div class="title">${tickerData.title || componentConfig.title}</div>
                 <div class="content">
                    <div class="value">
                        ${tickerData.value || componentConfig.value}
                    </div>
                    <div class="indicator">
                        <div class="icon pi pi-arrow-${tickerData.indicatorType || componentConfig.indicatorType} ${tickerData.indicatorType || componentConfig.indicatorType}"></div>
                        <div class="icon pi pi-minus ${tickerData.indicatorType || componentConfig.indicatorType}"></div>
                        <div class="indicator_value">
                            <span>${tickerData.indicatorValue || componentConfig.indicatorValue}</span>
                            <span class="hours">${tickerData.indicatorValuePrecision || componentConfig.indicatorValuePrecision}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="icon ${tickerData.icon || componentConfig.icon}"></div>
  `;

  component.innerHTML = tickerHtml;
}

// Update ticker using tms connection and its payload
function tickerComponentConnectedViaTMS(componentConfig) {
  setTimeout(() => {
    connectTMS(componentConfig.websocketTopic, componentConfig.websocketHost);
  }, 2500);
}


// TMS connection
function connectTMS(topic, host) {
  const $component = document.getElementById(topic);
  // listen for messages
  window.addEventListener(
    window.MessageService.Client.events.MESSAGE,
    function (message) {
      const messageData = message?.detail?.data?.payload;
      if (messageData) {
        const payload = JSON.parse(messageData);
        const { data } = payload;
        if (data) {
          //TODO: make this generic
          //callback && callback(data, $component);
          updateTickerComponent(data, $component);
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

function getComponentConfig($component) {
  const componentConfig = JSON.parse($component.getAttribute("data-model"));
  return componentConfig;
}

// Default data
function tickerComponentConnectedViaInitialData(component) {
  const componentConfig = JSON.parse(component.getAttribute("data-model"));
  console.log("tickerComponentConnectedViaInitialData",componentConfig);
  updateTickerComponent(componentConfig, component);
}

//TODO: move all functions to namespace in clientlibs/behaviour.js
// Initial Function
$(document).ready(function (e) {
  Array.from(document.querySelectorAll("#ticker")).forEach((component) => {
    // parse json value from data-model attribute as component config
    const componentConfig = JSON.parse(component.getAttribute("data-model"));
    const componentTopic = componentConfig.websocketTopic;
    const componentHost = componentConfig.websocketHost;
    const componentDataSource = componentConfig.dataSource;
    console.log("componentConfig",componentConfig);
    console.log("componentTopic",componentTopic);
    console.log("componentHost",componentHost);
    console.log("componentDataSource",componentDataSource);


    // Data can be updated via TMS Connection.
    if (componentTopic && componentHost) {
      component.setAttribute("id", componentTopic);
      tickerComponentConnectedViaTMS(componentConfig, component);
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
