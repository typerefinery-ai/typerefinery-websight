window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Graphs = Typerefinery.Components.Graphs || {};
window.Typerefinery.Components.Graphs.PieChart = Typerefinery.Components.Graphs.PieChart || {};
window.Typerefinery.Components.Graphs.Items = Typerefinery.Components.Graphs.Items || {};
window.Typerefinery.Theme = Typerefinery.Theme || {};

const DEFAULT_PIE_CHART_DATA = {
  labels: ["Group A", "Group B", "Group C", "Group D", "Group E", "Group F"],
  labelName: "Typerefinery Pie Chart",
  chartData: [178, 53, 83, 15, 2, 4],
  backgroundColorForData: [
    "rgba(255, 84, 84, 0.24)",
    "rgba(93, 255, 84, 0.24)",
    "rgba(90, 84, 255, 0.14)",
    "rgba(255, 168, 84, 0.14)",
    "rgba(255, 255, 84, 0.24)",
    "rgba(171, 0, 125, 0.19)",
  ],
  borderColorForData: [
    "rgba(255, 84, 84, 2222)",
    "rgba(93, 255, 84, 1)",
    "rgba(89, 84, 255, 1)",
    "rgba(255, 168, 84, 1)",
    "rgba(255, 255, 84, 1)",
    "rgba(171, 0, 125, 1)",
  ],
  canvasBackgroundColor:Typerefinery?.Theme?.rootElementStyle?.getPropertyValue("--primary-object-background-color") || "#343a40",
};

; (function (
  ns,
  typerefineryNs,
  componentNs,
  themeNs,
  graphItemsNs,
  DEFAULT_PIE_CHART_DATA,
  document,
  window
) {
  "use strict";

  ns.updateComponentHTML = (data, $component) => {
    if (!$component) {
      console.log(
        "[piechart/clientlibs/functions.js] component does not exist"
      );
      return;
    }
    let componentConfig = componentNs.getComponentConfig($component);
    componentConfig = {
      ...componentConfig,
      ...DEFAULT_PIE_CHART_DATA,
    };
    if (!componentConfig.resourcePath) {
      componentConfig.resourcePath =
        data.resourcePath || $component.getAttribute(`data-resource-path`);
    }
    const ctx = document.getElementById(`${componentConfig.resourcePath}-piechart`).getContext("2d");

    // Plugin to update the canvas Background.
    const plugin = {
      id: "customCanvasBackgroundColor",
      beforeDraw: (chart, args, options) => {
        const { ctx } = chart;
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle =themeNs?.rootElementStyle?.getPropertyValue('--primary-object-background-color') ||"#99ffff";
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      },
    };

    // Pie chart
    const chartInstance = new Chart(ctx, {
      type: "polarArea",
      data: {
        labels: data.labels || componentConfig.labels,
        datasets: [
          {
            label: data.labelName || componentConfig.labelName,
            data: data.chartData || componentConfig.chartData,
            backgroundColor: data.backgroundColorForData ||  componentConfig.backgroundColorForData,
            borderColor: themeNs?.rootElementStyle?.getPropertyValue('--border-color') || "#0099DE",
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: "right",
            usePointStyle: true,
            labels: {
              color:   themeNs?.rootElementStyle.getPropertyValue("--labels-color") ||"#99ffff",
              usePointStyle: true,
            },
          },
        },
        customCanvasBackgroundColor: {
          color:  themeNs?.rootElementStyle.getPropertyValue('--primary-object-background-color'),
        },
        scales: {
          r: {
            grid: {
              color:themeNs?.rootElementStyle.getPropertyValue('--grid-color'),
            },
            ticks: {
              color: themeNs?.rootElementStyle.getPropertyValue('--ticks-color') ||"#99ffff",
              z: 0,
              showLabelBackdrop: false,
              precision: 0,
            },
          },
        },
        scale: {
          ticks: {
            z: 1,
          },
        },
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
    } catch (error) {
      ns.modelDataConnected($component);
    }
  };

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
    } catch (error) {
      ns.modelDataConnected($component);
    }
  };
  ns.modelDataConnected = ($component) => {
    // Passing {} because, The values from the model obj are fetched in bellow function definition.
    ns.updateComponentHTML({}, $component);
  };

  ns.updateChartInstance = (data, $component) => {
    if (!$component) {
      console.log(
        "[piechart/clientlibs/functions.js] component does not exist"
      );
      return;
    }
    let componentConfig = componentNs.getComponentConfig($component);
    componentConfig = {
      ...componentConfig,
      ...DEFAULT_PIE_CHART_DATA,
    };

    graphItemsNs[componentConfig.resourcePath].data = {
      labels: data.labels || componentConfig.labels,
      datasets: [
        {
          label: data.labelName || componentConfig.labelName,
          data: data.chartData || componentConfig.chartData,
          backgroundColor: data.backgroundColorForData ||  componentConfig.backgroundColorForData,
          borderColor: themeNs?.rootElementStyle?.getPropertyValue('--border-color') || "#0099DE",
        },
      ],
    };

    graphItemsNs[componentConfig.resourcePath].update();
  };

  ns.dataReceived = (data, $component) => {
    ns.updateChartInstance(data, $component);
  };


  ns.init = ($component) => {
    // parse json value from data-model attribute as component config
    const componentConfig = componentNs.getComponentConfig($component);
    const componentTopic = componentConfig.websocketTopic;
    const componentHost = componentConfig.websocketHost;
    const componentDataSource = componentConfig.dataSource;
    const componentPath = componentConfig.resourcePath;

    console.log("[piechart.js - functions.js ] - Pie Chart Component");
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
  };
})(
  window.Typerefinery.Components.Graphs.PieChart,
  window.Typerefinery,
  window.Typerefinery.Components,
  window.Typerefinery.Theme,
  window.Typerefinery.Components.Graphs.Items,
  DEFAULT_PIE_CHART_DATA,
  document,
  window
);
