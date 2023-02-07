window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Graphs = Typerefinery.Components.Graphs || {};
window.Typerefinery.Components.Charts.Varients.BarChartVertical =
  Typerefinery.Components.Charts.Varients.BarChartVertical || {};
window.Typerefinery.Components.Graphs.Items =
  Typerefinery.Components.Graphs.Items || {};
window.Typerefinery.Theme = Typerefinery.Theme || {};
const DEFAULT_XAXISBAR_CHART_DATA = {
  chartData: [75000, 75000, 75000, 15000, 14000, 12000, 15200, 14200, 12450],
  labelName: "Typerefinery X-Axis Bar Chart",
  barbackgroundcolor: [
    "#FFB94E",
    "#228B22",
    "#FFB94E",
    "#228B22",
    "#FFB94E",
    "#ED7117",
    "#228B22",
    "#FFB94E",
    "#ED7117",
  ],
  labels: [
    "IPV4",
    "Email",
    "File",
    "IPV3",
    "Domain",
    "URL",
    "Database",
    "IPV2",
    "Store",
  ],
  dataSetBorderColor: Typerefinery?.Theme?.rootElementStyle?.getPropertyValue('--border-color') || "#0099DE",
  canvasBackgroundColor: Typerefinery?.Theme?.rootElementStyle?.getPropertyValue('--primary-object-background-color') || "#343a40",
};

(function (
  ns,
  typerefineryNs,
  componentNs,
  themeNs,
  graphItemsNs,
  DEFAULT_XAXISBAR_CHART_DATA,
  document,
  window
) {
  "use strict";

  ns.updateComponentHTML = (data, $component) => {
    if (!$component) {
      console.log("Component Not Found");
      return;
    }
    let componentConfig = componentNs.getComponentConfig($component);
    componentConfig = { ...componentConfig, ...DEFAULT_XAXISBAR_CHART_DATA };
    if (!componentConfig.resourcePath) {
      componentConfig.resourcePath =
        data.resourcePath || $component.getAttribute(`data-resource-path`);
    }
    const ctx = document.getElementById(`${componentConfig.resourcePath}-barChart`).getContext("2d");

    const plugin = {
      id: "customCanvasBackgroundColor",
      beforeDraw: (chart, args, options) => {
        const { ctx } = chart;
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = themeNs?.rootElementStyle?.getPropertyValue('--primary-object-background-color') || "#343a40" || "#99ffff";
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      },
    }

    let chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.labels|| componentConfig.labels,
        datasets: [
          {
            data: data.chartData || componentConfig.chartData,
            fill: false,
            borderColor: themeNs?.rootElementStyle?.getPropertyValue('--border-color') || "#0099DE",
            backgroundColor: data.barbackgroundcolor|| componentConfig.barbackgroundcolor,
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
        customCanvasBackgroundColor: {
          color:  themeNs?.rootElementStyle.getPropertyValue('--primary-object-background-color')||data.canvasBackgroundColor ,
        },
        interaction: {
          intersect: false,
        },
        radius: 0,
      },
      plugins: [plugin],
    });
    
    graphItemsNs[componentConfig.resourcePath] = chartInstance;
  };

  ns.jsonConnected = async (dataSourceURL, $component) => {
    try {
      const response = await fetch(dataSourceURL).then((res) => res.json());
      if (response) {
        ns.updateComponentHTML(response, $component);
        return;
      }
      ns.modelDataConnected($component);
    }
    catch (error) {
      ns.modelDataConnected($component);
    }
  }
  ns.tmsConnected = async (host, topic, $component) => {
    try {
      host = host || "ws://localhost:8112";
      typerefineryNs.hostAdded(host);
      if (!topic) {
        ns.modelDataConnected($component);
        return;
      }
      const componentData = localStorage.getItem(`${topic}`);
      if (!componentData) {
        ns.modelDataConnected($component);
        return;
      }
      ns.updateComponentHTML(JSON.parse(componentData), $component);
    }
    catch (error) {
      ns.modelDataConnected($component);
    }
  }


  ns.modelDataConnected = ($component) => {
    // Passing {} because, The values from the model obj are fetched in bellow function definition.
    ns.updateComponentHTML({}, $component);
  }
  ns.updateChartInstance = (data, $component) => {
    if (!$component) {
      console.log('Component not found')
      return;
    }
    let componentConfig = componentNs.getComponentConfig($component);
    componentConfig = {
      ...componentConfig,
      ...DEFAULT_XAXISBAR_CHART_DATA
    }

    graphItemsNs[componentConfig.resourcePath].data = {
      labels: data.labels || componentConfig.labels,
      datasets: [
        {
          data: data.chartData || componentConfig.chartData,
          fill: false,
          borderColor: themeNs?.rootElementStyle?.getPropertyValue('--border-color') || "#0099DE",
          backgroundColor: data.barbackgroundcolor|| componentConfig.barbackgroundcolor,
          borderWidth: 1,
        },
      ],
    }

    graphItemsNs[componentConfig.resourcePath].update();
  }
  ns.dataReceived = (data, $component) => {
    ns.updateChartInstance(data, $component);
  }

  ns.init = ($component) => {
    // parse json value from data-model attribute as component config
    const componentConfig = componentNs.getComponentConfig($component);
    const componentTopic = componentConfig.websocketTopic;
    const componentHost = componentConfig.websocketHost;
    const componentDataSource = componentConfig.dataSource;
    const componentPath = componentConfig.resourcePath;
    // TMS.
    if (componentHost && componentTopic) {
      $component.setAttribute("id", componentTopic);
      ns.tmsConnected(componentHost, componentTopic, $component);
    }
    // JSON
    else if (componentDataSource) {
      $component.setAttribute("id", componentPath);
      ns.jsonConnected(componentDataSource, $component);
    }
    // MODEL 
    else {
      ns.modelDataConnected($component);
      
    }
  }

})(
  window.Typerefinery.Components.Graphs.XAxisBarChart,
  window.Typerefinery,
  window.Typerefinery.Components,
  window.Typerefinery.Theme,
  window.Typerefinery.Components.Graphs.Items,
  DEFAULT_XAXISBAR_CHART_DATA,
  document,
  window
);
