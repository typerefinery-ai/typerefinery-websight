window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Graphs = Typerefinery.Components.Graphs || {};
window.Typerefinery.Components.Graphs.LineChart = Typerefinery.Components.Graphs.LineChart || {};
window.Typerefinery.Components.Graphs.Items = Typerefinery.Components.Graphs.Items || {};
window.Typerefinery.Theme = Typerefinery.Theme || {};

const DEFAULT_LINE_CHART_DATA = {
  chartData: [1, 1, 2, 3, 55, 50, 44, 39, 6, 7, 9, 35],
  labelName: "Typerefinery Line Chart",
  labels: [
    "Jan 2021",
    "Feb 2021",
    "Mar 2021",
    "Apl 2021",
    "May 2021",
    "Jun 2021",
    "Jul 2021",
    "Aug 2021",
    "Sep 2021",
    "Oct 2021",
    "Nov 2021",
    "Dec 2021",
  ],
  dataSetBorderColor: Typerefinery?.Theme?.rootElementStyle?.getPropertyValue('--border-color') || "#0099DE",
  canvasBackgroundColor: Typerefinery?.Theme?.rootElementStyle?.getPropertyValue('--primary-object-background-color') || "#001E3C"
}

  ; (function (ns,typerefineryNs, componentNs, themeNs, graphItemsNs, DEFAULT_LINE_CHART_DATA, document, window) {
    "use strict";

    ns.updateComponentHTML = (data, $component) => {
      if (!$component) {
        console.log('[linechart/clientlibs/functions.js] component does not exist')
        return;
      }
      let componentConfig = componentNs.getComponentConfig($component);
      componentConfig = {
        ...componentConfig,
        ...DEFAULT_LINE_CHART_DATA
      }
      if(!componentConfig.resourcePath){
        componentConfig.resourcePath = data.resourcePath || $component.getAttribute(`data-resource-path`);
      }
      const ctx = document.getElementById(`${componentConfig.resourcePath}-linechart`).getContext("2d");
      
      // Linear background for the chart.
      const chartBackgroundGradientColor = ctx.createLinearGradient(0, 0, 0, 400);
      chartBackgroundGradientColor.addColorStop(0.2, "#1c92d2");
      chartBackgroundGradientColor.addColorStop(0.4, "rgba(27, 145, 209, 0.6)");
      chartBackgroundGradientColor.addColorStop(0.6, "rgba(27, 145, 209, 0.4)");
      chartBackgroundGradientColor.addColorStop(1, "rgba(27, 145, 209, 0)");

      // Plugin to update the canvas Background.
      const plugin = {
        id: "customCanvasBackgroundColor",
        beforeDraw: (chart, args, options) => {
          const { ctx } = chart;
          ctx.save();
          ctx.globalCompositeOperation = "destination-over";
          // data.canvasBackgroundColor
          ctx.fillStyle = themeNs?.rootElementStyle?.getPropertyValue('--primary-object-background-color') || "#001E3C";
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        },
      };

      // Line chart
      const chartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.labels || componentConfig.labels,
          datasets: [
            {
              label: data.labelName || componentConfig.labelName,
              data: data.chartData || componentConfig.chartData,
              fill: true,
              borderColor: themeNs?.rootElementStyle?.getPropertyValue('--border-color') || "#0099DE",
              tension: 0.3,
              backgroundColor: chartBackgroundGradientColor
            }
          ]
        },
        options: {
          plugins: {
            legend: {
              display: false,
            }
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                color:"#5D7183",
              }
            },
            y: {
              grid: {
                color: themeNs?.rootElementStyle.getPropertyValue('--grid-color'),
              },
              ticks: {
                color:"#5D7183"
              }
            }
          },
          customCanvasBackgroundColor: {
            color: themeNs?.rootElementStyle.getPropertyValue('--primary-object-background-color') ,
          },
          interaction: {
            intersect: false,
          },
          radius: 0
        },
        plugins: [plugin]
      });


      graphItemsNs[componentConfig.resourcePath] = chartInstance;
    }

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
        console.log(
          "[linechart/clientlibs/functions.js] component does not exist"
        );
        return;
      }
      let componentConfig = componentNs.getComponentConfig($component);
      componentConfig = {
        ...componentConfig,
        ...DEFAULT_LINE_CHART_DATA,
      };
      const ctx = document.getElementById(`${componentConfig.resourcePath}-linechart`).getContext("2d");
      // Linear background for the chart.
      const chartBackgroundGradientColor = ctx.createLinearGradient(0,0,0,400);
      chartBackgroundGradientColor.addColorStop(0.2, "#1c92d2");
      chartBackgroundGradientColor.addColorStop(0.4, "rgba(27, 145, 209, 0.6)");
      chartBackgroundGradientColor.addColorStop(0.6, "rgba(27, 145, 209, 0.4)");
      chartBackgroundGradientColor.addColorStop(1, "rgba(27, 145, 209, 0)");
      graphItemsNs[componentConfig.resourcePath].data = {
        labels: data.labels || componentConfig.labels,
        datasets: [
          {
            label: data.labelName || componentConfig.labelName,
            data: data.chartData || componentConfig.chartData,
            fill: true,
            borderColor:
              themeNs?.rootElementStyle?.getPropertyValue(
                "--border-color"
              ).trim() || "#0099DE",
            tension: 0.3,
            backgroundColor: chartBackgroundGradientColor,
          },
        ],
      };

      graphItemsNs[componentConfig.resourcePath].update();
    }

    ns.dataReceived = (data, $component) => {
      ns.updateChartInstance(data, $component);
    }

    ns.init = ($component) => {
      console.log("Line chart init function", $component)
      // parse json value from data-model attribute as component config
      const componentConfig = componentNs.getComponentConfig($component);
      console.log("componentConfig", componentConfig)
      const componentTopic = componentConfig.websocketTopic;
      const componentHost = componentConfig.websocketHost;
      const componentDataSource = componentConfig.dataSource;
      const componentPath = componentConfig.resourcePath;

      console.log("[linechart.js - functions.js] - Line Chart Component");
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
  })(window.Typerefinery.Components.Graphs.LineChart,window.Typerefinery, window.Typerefinery.Components, window.Typerefinery.Theme, window.Typerefinery.Components.Graphs.Items, DEFAULT_LINE_CHART_DATA, document, window);
