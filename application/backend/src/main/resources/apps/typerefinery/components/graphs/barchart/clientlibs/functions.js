window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Graphs = Typerefinery.Components.Graphs || {};
window.Typerefinery.Components.Graphs.BarChart =
  Typerefinery.Components.Graphs.BarChart || {};
window.Typerefinery.Components.Graphs.Items =
  Typerefinery.Components.Graphs.Items || {};
window.Typerefinery.Theme = Typerefinery.Theme || {};

const DEFAULT_BAR_CHART_DATA = {
  chartData: [75000, 75000, 75000, 15000, 14000, 12000, 11000, 11500, 11000],
  labelName: "Typerefinery Bar Chart",
  barbackgroundcolor: [
    "#3d405b",
    "#b9fbc0",
    "#FFB94E",
    "#228B22",
    "#FFB94E",
    "#ED7117",
    "#3d405b",
    "#005f73",
    "#52796f",
  ],
  labels: [
    "Trazen:Win32/Qakbot",
    "Ranson:Win32/Egre..",
    "Quakbot",
    "Android",
    "Emotet",
    "XAgentOSX",
    "Pteranodon",
    "PsExec",
    "Minikatz",
  ],
  dataSetBorderColor:
    Typerefinery?.Theme?.rootElementStyle?.getPropertyValue(
      "-border-color"
    ) || "#0099DE",
  canvasBackgroundColor:
    Typerefinery?.Theme?.rootElementStyle?.getPropertyValue(
      "--primary-bg-color"
    ) || "#343a40",
};

(function (
  ns,
  componentNs,
  typerefineryNs,
  themeNs,
  graphItemsNs,
  DEFAULT_BAR_CHART_DATA,
  document,
  window
) {
  "use strict";

  ns.updateComponentHTML = (data, $component) => {
    if (!$component) {
      console.log(
        "[barchart/clientlibs/functions.js] component does not exist"
      );
      return;
    }
    let componentConfig = componentNs.getComponentConfig($component);
    componentConfig = {
      ...componentConfig,
      ...DEFAULT_BAR_CHART_DATA,
    };
    if(!componentConfig.resourcePath){
      componentConfig.resourcePath = data.resourcePath || $component.getAttribute(`data-resource-path`);
    }
    const ctx = document
      .getElementById(`${componentConfig.resourcePath}-barChart`)
      .getContext("2d");

    // Plugin to update the canvas Background.
    const plugin = {
      id: "customCanvasBackgroundColor",
      beforeDraw: (chart, args, options) => {
        const { ctx } = chart;
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle =
        themeNs?.rootElementStyle?.getPropertyValue('--primary-bg-color') || "#343a40" || "#99ffff";
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      },
    };
    // Line chart
    const chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.labels || componentConfig.labels,
        datasets: [
          {
            axis: "y",
            data: data.chartData || componentConfig.chartData,
            fill: false,
            backgroundColor:
            data.barbackgroundcolor|| componentConfig.barbackgroundcolor,
            borderColor:
            themeNs?.rootElementStyle?.getPropertyValue('--border-color') || "#0099DE",
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color:"#5D7183",
            },
          },
          y: {
            grid: {
              color: themeNs?.rootElementStyle.getPropertyValue("--grid-color"),
            },
            ticks: {
              color:
                "#5D7183",
            },
          },
        },
        customCanvasBackgroundColor: {
          color:themeNs?.rootElementStyle.getPropertyValue('--primary-bg-color')||data.canvasBackgroundColor ,
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
        "[Barchart/clientlibs/functions.js] component does not exist"
      );
      return;
    }
    let componentConfig = componentNs.getComponentConfig($component);
    componentConfig = {
      ...componentConfig,
      ...DEFAULT_BAR_CHART_DATA,
    };

    graphItemsNs[componentConfig.resourcePath].data = {
      labels: data.labels || componentConfig.labels,
      datasets: [
        {
          axis: "y",
          data: data.chartData || componentConfig.chartData,
          fill: false,
          backgroundColor: data.dataSetBorderColor ||
          componentConfig.dataSetBorderColor ||
          themeNs?.rootElementStyle.getPropertyValue(
            "--primary-bg-color"
          ) ||
          "#001E3C",
          borderColor:
            data.dataSetBorderColor ||
            componentConfig.dataSetBorderColor ||
            themeNs?.rootElementStyle.getPropertyValue(
              "--border-color"
            ) ||
            "#001E3C",
          borderWidth: 1,
        },
      ],
    };

    graphItemsNs[componentConfig.resourcePath].update();
  };
  ns.dataReceived = (data, $component) => {
    // Passing {} because, The values from the model obj are fetched in bellow function definition.
    ns.updateChartInstance(data, $component);
  };

  ns.init = ($component) => {
    // parse json value from data-model attribute as component config
    const componentConfig = componentNs.getComponentConfig($component);
    //For reference of tms statc data
    // const componentTopic = "barchart1";
    // const componentHost = "ws://localhost:8112/$tms";
    const componentTopic = componentConfig.websocketTopic;
    const componentHost = componentConfig.websocketHost;
    const componentDataSource = componentConfig.dataSource;
    const componentPath = componentConfig.resourcePath;
    console.log("[barchart.js - functions.js] - Bar Chart Component");
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
  window.Typerefinery.Components.Graphs.BarChart,
  window.Typerefinery.Components,
  window.Typerefinery,
  window.Typerefinery.Theme,
  window.Typerefinery.Components.Graphs.Items,
  DEFAULT_BAR_CHART_DATA,
  document,
  window
);
