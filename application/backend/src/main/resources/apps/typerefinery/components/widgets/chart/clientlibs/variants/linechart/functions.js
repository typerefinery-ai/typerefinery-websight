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


(function ($, ns, tmsNs, componentNs, themeNs, chartInstanceNs, document, window) {
  "use strict";

  ns.selectorComponent = "[component='chart'][data-module='lineChart']";

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
      id: 'customCanvasBackgroundColor',
      beforeDraw: (chart, args, options) => {
        const {ctx} = chart;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = options.color || '';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      }
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
        
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          customCanvasBackgroundColor: {
            color: '#f8f9fa',
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: "#718096"
            }
          }
        },
        interaction: {
          intersect: false
        },
        radius: 0
      },
      plugins: [plugin],
    };

    const chartInstance = new Chart(ctx, chartOptions);
    // Stored in the namespace in order to update them.
    chartInstanceNs[componentConfig.resourcePath] = chartInstance;
  }

  /**
   * @param onFailure optional fallback invoked when the fetch cannot produce a payload.
   *   docs/issues/0163 passes a cached-payload renderer here so an unreachable endpoint degrades
   *   to the last known payload rather than to the model default.
   */
  ns.jsonConnected = async (dataSourceURL, $component, onFailure) => {
    const fail = (why) => {
      if (typeof onFailure === "function") {
        console.warn(["linechart dataSource unavailable; falling back", dataSourceURL, why]);
        onFailure();
        return;
      }
      ns.modelDataConnected($component);
    };
    try {
      const response = await fetch(dataSourceURL).then((res) => res.json());
      if (response) {
        ns.updateComponentHTML(response, $component);
        return;
      }
      fail("empty body");
    }
    catch (error) {
      fail(String((error && error.message) || error));
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

      // ⚠️ docs/issues/0163 (0152's class): the cached payload used to win outright — a key
      // cached by ANY earlier session rendered unconditionally, with no freshness check, and
      // nothing publishes on page load so the live TMS subscription never corrected it. When
      // a cold-start route is configured it is AUTHORITATIVE on load; the cache is demoted to
      // the fallback for when that fetch cannot answer. Same pattern as table@0af13e67.
      const componentDataSource = componentConfig.coldStartDataSource;
      if (componentDataSource) {
        console.log(["linechart load: fetching authoritative payload", componentConfig.id, topic,
          "coldStartDataSource:", componentDataSource,
          componentData ? "(cached payload held in reserve)" : "(no cached payload)"]);
        ns.jsonConnected(componentDataSource, $component,
          componentData
            ? () => ns.cachedPayloadConnected(componentData, topic, $component)
            : undefined);
        return;
      }
      // No live route configured — the cache is all there is.
      if (componentData) {
        ns.cachedPayloadConnected(componentData, topic, $component);
        return;
      }
      ns.modelDataConnected($component);
    }
    catch (error) {
      ns.modelDataConnected($component);
    }
  }

  /**
   * Render a payload previously cached in localStorage under the TMS topic. It has no freshness
   * information of any kind, so it may be arbitrarily old — the log line says so explicitly
   * (docs/issues/0163; same contract as table's cachedPayloadConnected).
   */
  ns.cachedPayloadConnected = (componentData, topic, $component) => {
    try {
      console.warn(["linechart rendering CACHED payload of unknown age", topic, `${componentData.length} bytes`]);
      ns.updateComponentHTML(JSON.parse(componentData), $component);
    }
    catch (error) {
      console.error(["linechart cached payload is unreadable; discarding", topic, error]);
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
 
    chartInstanceNs[componentConfig.resourcePath].data = {
      labels: data.labels || componentConfig.labels,
      datasets: [
        {
          label: data.labelName || componentConfig.labelName,
          data: data.chartData || componentConfig.chartData,
          fill: true,
          tension: 0.3,
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
      $component.attr("id", componentTopic);
      ns.tmsConnected(componentHost, componentTopic, $component);
    }
    // JSON
    else if (componentDataSource) {
      $component.attr("id", componentPath);
      ns.jsonConnected(componentDataSource, $component);
    }
    // MODEL 
    else {
      ns.modelDataConnected($component);
    }
  }
})(jQuery, Typerefinery.Components.Widgets.Chart.Variants.LineChart, Typerefinery.Page.Tms, Typerefinery.Components, Typerefinery.Page.Theme, Typerefinery.Components.Widgets.Chart.Instances, document, window);
