window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Chart = Typerefinery.Components.Widgets.Chart || {};
window.Typerefinery.Components.Widgets.Chart.Variants = Typerefinery.Components.Widgets.Chart.Variants || {};
window.Typerefinery.Components.Widgets.Chart.Variants.LineChart = Typerefinery.Components.Widgets.Chart.Variants.LineChart || {};
window.Typerefinery.Components.Widgets.Chart.Instances = Typerefinery.Components.Widgets.Chart.Instances || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};


(function (ns, tmsNs, componentNs, themeNs, chartInstanceNs, document, window) {
  "use strict";

  ns.defaultData = {
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
    dataSetBorderColor: themeNs?.rootElementStyle?.getPropertyValue('--border-color'),
    canvasBackgroundColor: themeNs?.rootElementStyle?.getPropertyValue('--card-bg-color')
  };

  ns.updateComponentHTML = (data, $component) => {
    if (!$component) {
      return;
    }
    let componentConfig = componentNs.getComponentConfig($component);
    componentConfig = {
      ...componentConfig,
      ...ns.defaultData
    }

    const ctx = document.getElementById(`${componentConfig.resourcePath}-${componentConfig.variant}`).getContext("2d");

    // TODO: Make them all dynamic.
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
        ctx.fillStyle = themeNs?.rootElementStyle?.getPropertyValue('--card-bg-color');
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      },
    };


    const chartOptions = {
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
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color:themeNs?.rootElementStyle.getPropertyValue("--chart-grid-color")
            }
          },
          y: {
            grid: {
              color: themeNs?.rootElementStyle.getPropertyValue('--chart-grid-color'),
            },
            ticks: {
              color:themeNs?.rootElementStyle.getPropertyValue("--chart-grid-color")
            }
          }
        },
        customCanvasBackgroundColor: {
          color: themeNs?.rootElementStyle.getPropertyValue('--card-bg-color')
        },
        interaction: {
          intersect: false
        },
        radius: 0
      },
      plugins: [plugin]
    };

    const chartInstance = new Chart(ctx, chartOptions);
    // Stored in the namespace in order to update them.
    chartInstanceNs[componentConfig.resourcePath] = chartInstance;
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
      if (!topic || !host) {
        ns.modelDataConnected($component);
        return;
      }

      let componentConfig = componentNs.getComponentConfig($component);
      tmsNs.registerToTms(host, topic, componentConfig.resourcePath, (data) => ns.updateChartInstance(data, $component));
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
    // Passing {} because, The values from the model obj are fetched in below function definition.
    ns.updateComponentHTML({}, $component);
  }

  ns.updateChartInstance = (data, $component) => {
    if (!$component) {
      return;
    }
    let componentConfig = componentNs.getComponentConfig($component);
    componentConfig = {
      ...componentConfig,
      ...ns.defaultData,
    };
    const ctx = document.getElementById(`${componentConfig.resourcePath}-${componentConfig.variant}`).getContext("2d");
    // Linear background for the chart.
    const chartBackgroundGradientColor = ctx.createLinearGradient(0, 0, 0, 400);
    chartBackgroundGradientColor.addColorStop(0.2, "#1c92d2");
    chartBackgroundGradientColor.addColorStop(0.4, "rgba(27, 145, 209, 0.6)");
    chartBackgroundGradientColor.addColorStop(0.6, "rgba(27, 145, 209, 0.4)");
    chartBackgroundGradientColor.addColorStop(1, "rgba(27, 145, 209, 0)");
    
    chartInstanceNs[componentConfig.resourcePath].data = {
      labels: data.labels || componentConfig.labels,
      datasets: [
        {
          label: data.labelName || componentConfig.labelName,
          data: data.chartData || componentConfig.chartData,
          fill: true,
          borderColor: themeNs?.rootElementStyle?.getPropertyValue("--border-color").trim(),
          tension: 0.3,
          backgroundColor: chartBackgroundGradientColor
        }
      ]
    };

    chartInstanceNs[componentConfig.resourcePath].update();
  }

  ns.callbackFn = (data, $component) => {
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
})(Typerefinery.Components.Widgets.Chart.Variants.LineChart, Typerefinery.Page.Tms, Typerefinery.Components, Typerefinery.Page.Theme, Typerefinery.Components.Widgets.Chart.Instances, document, window);
