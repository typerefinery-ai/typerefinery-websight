window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Graphs = Typerefinery.Components.Graphs || {};
window.Typerefinery.Components.Graphs.BarChart = Typerefinery.Components.Graphs.BarChart || {};
window.Typerefinery.Components.Graphs.Items = Typerefinery.Components.Graphs.Items || {};
window.Typerefinery.Theme = Typerefinery.Theme || {};


const DEFAULT_BAR_CHART_DATA = {
  chartData: [75000, 75000, 75000, 15000, 14000, 12000, 11000, 11500, 11000],
  labelName: "Typerefinery Bar Chart",
  barbackgroundcolor: [
    "#FFB94E",
    "#FFB94E",
    "#FFB94E",
    "#FFB94E",
    "#FFB94E",
    "#ED7117",
    "#FFB94E",
    "#228B22",
    "#228B22",
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
    dataSetBorderColor:"#0099DE",
    canvasBackgroundColor:"#99ffff"
}

    ; (function (ns, componentNs, themeNs, graphItemsNs, document, window) {
        "use strict";

        ns.updateComponentHTML = (data, $component) => {
            if (!$component) {
                console.log('[barchart/clientlibs/functions.js] component does not exist')
                return;
            }
            console.log("bardata",data)
            let componentConfig = componentNs.getComponentConfig($component);
            componentConfig = {
                ...componentConfig,
                ...DEFAULT_BAR_CHART_DATA
            }
            console.log("componentConfig-2",componentConfig)
            var componentDataPath = $component.getAttribute("data-resource-path");
            console.log("path",componentDataPath)
            const ctx =  document.getElementById(`${componentDataPath}-barChart`).getContext("2d");


            // Linear background for the chart.
        
            // Plugin to update the canvas Background.
            const plugin = {
              id: "customCanvasBackgroundColor",
              beforeDraw: (chart, args, options) => {
                const { ctx } = chart;
                ctx.save();
                ctx.globalCompositeOperation = "destination-over";
                ctx.fillStyle ="#99ffff";
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
                    backgroundColor:"blue",
                    borderColor: [
                      'rgb(255, 99, 132)',
                      'rgb(255, 159, 64)',
                      'rgb(255, 205, 86)',
                      'rgb(75, 192, 192)',
                      'rgb(54, 162, 235)',
                      'rgb(153, 102, 255)',
                      'rgb(201, 203, 207)'
                    ],
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
                      color: "#5D7183",
                    },
                    ticks: {
                      color:"#5D7183"
                    },
                  },
                },
                // customCanvasBackgroundColor: {
                //   color: canvasBackgroundColor,
                // },
                interaction: {
                  intersect: false,
                },
                radius: 0,
              },
              plugins: [plugin],
            });
          
            
            graphItemsNs[componentConfig.resourcePath] = chartInstance;
        }

        ns.jsonDataConnected = async (dataSourceURL, $component) => {
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
                host = !host && "ws://localhost:8112";
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

        ns.dataReceived = (data, $component) => {
            // Passing {} because, The values from the model obj are fetched in bellow function definition.
            ns.updateComponentHTML(data, $component);
        }

        ns.init = ($component) => {
            // parse json value from data-model attribute as component config
            const componentConfig = componentNs.getComponentConfig($component);
            const componentTopic = componentConfig.websocketTopic;
            const componentHost = componentConfig.websocketHost;
            const componentDataSource = componentConfig.dataSource;
            console.log("componentDataSource",componentDataSource)
            const componentPath = componentConfig.resourcePath;
            console.log("componentConfig-1",componentConfig)
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
        }
    })(window.Typerefinery.Components.Graphs.BarChart, window.Typerefinery.Components, window.Typerefinery.Theme, window.Typerefinery.Components.Graphs.Items, document, window);
