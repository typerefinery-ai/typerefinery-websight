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
function tickerComponentConnectedViaTMS(topic, host, component) {  
  setTimeout(() => {
    connectTMS( topic,host,component);
  }, 5000);
}
// TMS connection
function connectTMS(topic, host,component) {
  var topic = component.getAttribute("data-topic")
  window.addEventListener(
    window.MessageService.Client.events.ERROR,
    function (message) {
      console.log(
        `ui event: ${window.MessageService.Client.events.ERROR}`,
        message.detail
      );
    }
  );

  // listen when the client is ready
  window.addEventListener(
    window.MessageService.Client.events.READY,
    function (message) {
      console.log(
        `ui event: ${window.MessageService.Client.events.READY}`,
        message.detail
      );
    }
  );

  // listen for client id update
  window.addEventListener(
    window.MessageService.Client.events.CLIENT_ID,
    function (message) {
      console.log(
        `ui event: ${window.MessageService.Client.events.CLIENT_ID}`,
        message.detail
      );
      document.querySelector("#ws-id").textContent = message.detail;
    }
  );

  // listen for messages
  window.addEventListener(
    window.MessageService.Client.events.MESSAGE,
    function (message) {
      console.log(
        `ui event: ${window.MessageService.Client.events.MESSAGE}`,
        message.detail,
        "hello"
      );
      var messageText = message.detail;
      if (typeof message.detail === "object") {
        messageText = JSON.stringify(message.detail);
        var messageType = message.detail.type;

        if (messageType === "meta") {
          var subscribers = message.detail.subscribers;
          var publishers = message.detail.publish;
          var calls = message.detail.call;

          // for each object in subscribers add object id to subscribers select element
          for (var subscriber in subscribers) {
            let option = document.createElement("option");
            option.value = subscribers[subscriber];
            option.text = subscribers[subscriber];
            document.getElementsByName("subscribers")[0]?.add(option);
          }

          // for each object in publishers add object id to publishers select element
          for (var publisher in publishers) {
            let option = document.createElement("option");
            option.value = publishers[publisher].id;
            option.text = publishers[publisher].id;
            document.getElementsByName("publishers")[0]?.add(option);
          }

          // for each object in calls add object id to calls select element
          for (var call in calls) {
            let option = document.createElement("option");
            option.value = calls[call].id;
            option.text = calls[call].id;
            document.getElementsByName("calls")[0]?.add(option);
          }
        }
      }
      var messageItem = document.createElement("li");
      var content = document.createTextNode(messageText);
      messageItem?.appendChild(content);
      const payload = message.detail.data.payload;
      const parsedPayload = JSON.parse(payload);
      const resultPayload = parsedPayload.data;
      document.getElementById("messages")?.appendChild(messageItem);
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
function getDataFromDataSourceJson(jsonUrl,component){
  const fetchAndUpdateView = async () => {
    try {
      const response = await fetch(jsonUrl).then((res) => res.json());

      !response.value
        ? tickerComponentConnectedViaInitialData(component)
        : updateTickerComponent(response, component);
    } catch (error) {
      tickerComponentConnectedViaInitialData(component)
    }
  };
  fetchAndUpdateView();
}
// Update ticker using datasource JSON
function tickerComponentConnectedViaJSON(jsonUrl, component){
  // Rendering the template
  getDataFromDataSourceJson(jsonUrl,component);
}
// Default data
function tickerComponentConnectedViaInitialData(component){
  var model = component.getAttribute("data-model")
  const parsedModel=JSON.parse(model)
  var defaultData = {
    "title": parsedModel.title,
    "value": parsedModel.value,
    "icon": parsedModel.icon,
    "indicatorType": parsedModel.indicatorType,
    "indicatorValue": parsedModel.indicatorValue
}
// Rendering the template
updateTickerComponent(defaultData,component);
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
    } 
    else {
      tickerComponentConnectedViaInitialData(component);
    }
  });
});
