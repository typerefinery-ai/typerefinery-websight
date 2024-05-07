window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Chart = Typerefinery.Components.Widgets.Chart || {};
window.Typerefinery.Components.Widgets.Chart.Variants = Typerefinery.Components.Widgets.Chart.Variants || {};
window.Typerefinery.Components.Widgets.Chart.Variants.PieChart = Typerefinery.Components.Widgets.Chart.Variants.PieChart || {};
window.Typerefinery.Components.Widgets.Chart.Instances = Typerefinery.Components.Widgets.Chart.Instances || {};
window.Typerefinery.Page = Typerefinery.Page || {}; 
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};


(function ($, ns, tmsNs, componentNs, themeNs, chartInstanceNs, document, window) {
    "use strict";

    ns.selectorComponent = "[component='chart'][data-module='pieChart']";

    ns.defaultData = {
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
        ]
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
        if (!componentConfig.resourcePath) {
            componentConfig.resourcePath = data.resourcePath || $component.getAttribute(`data-resource-path`);
        }
        const ctx = document.getElementById(`${componentConfig.resourcePath}-pieChart`).getContext("2d");

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
            type: "polarArea",
            data: {
                labels: data.labels || componentConfig.labels,
                datasets: [
                    {
                        label: data.labelName || componentConfig.labelName,
                        data: data.chartData || componentConfig.chartData
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
                           usePointStyle: true
                        }
                    },
                    customCanvasBackgroundColor: {
                        color: '#f8f9fa',
                      }
                },
                maintainAspectRatio: false,
                scales: {
                    r: {
                        grid: {
                        },
                        ticks: {
                            z: 0,
                            showLabelBackdrop: false,
                            precision: 0
                        }
                    },
                },
                scale: {
                    ticks: {
                        z: 1
                    }
                }
            },
            plugins: [plugin],
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
        
        chartInstanceNs[componentConfig.resourcePath].data = { 
            labels: data.labels || componentConfig.labels, 
            datasets: [
                { 
                    label: data.labelName || componentConfig.labelName, 
                    data: data.chartData || componentConfig.chartData
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
})(jQuery, Typerefinery.Components.Widgets.Chart.Variants.PieChart, Typerefinery.Page.Tms, Typerefinery.Components, Typerefinery.Page.Theme, Typerefinery.Components.Widgets.Chart.Instances, document, window);
