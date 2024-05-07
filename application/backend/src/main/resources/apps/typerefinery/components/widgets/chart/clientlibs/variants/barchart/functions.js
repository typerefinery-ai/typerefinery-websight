window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Chart = Typerefinery.Components.Widgets.Chart || {};
window.Typerefinery.Components.Widgets.Chart.Variants = Typerefinery.Components.Widgets.Chart.Variants || {};
window.Typerefinery.Components.Widgets.Chart.Variants.BarChart = Typerefinery.Components.Widgets.Chart.Variants.BarChart || {};
window.Typerefinery.Components.Widgets.Chart.Instances = Typerefinery.Components.Widgets.Chart.Instances || {};
window.Typerefinery.Page = Typerefinery.Page || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};


(function ($, ns, tmsNs, componentNs, themeNs, chartInstanceNs, document, window) {
    "use strict";

    ns.selectorComponent = "[component='chart'][data-module='barChart']";

    ns.defaultData = {
        chartData: [75000, 75000, 75000, 15000, 14000, 12000, 11000, 11500, 11000],
        labelName: "Typerefinery Bar Chart",
        backgroundColor: [
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
        ]
    };

    ns.updateComponentHTML = (data, $component) => {
        if (!$component) {
            return;
        }
        let componentConfig = componentNs.getComponentConfig($component);

        componentConfig = {
            ...componentConfig,
            ...ns.defaultData,
        };

        const ctx = document
            .getElementById(`${componentConfig.resourcePath}-${componentConfig.variant}`)
            .getContext("2d");

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
            type: "bar",
            data: {
                labels: data.labels || componentConfig.labels,
                datasets: [
                    {
                        axis: "y",
                        data: data.chartData || componentConfig.chartData,
                        fill: false
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                indexAxis: "y",
                plugins: {
                    legend: {
                        display: false,
                    },
                    customCanvasBackgroundColor: {
                        color: '#f8f9fa',
                      }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                        }
                    }
                },
                interaction: {
                    intersect: false
                },
                radius: 0
            },
            plugins: [plugin],
        }

        const chartInstance = new Chart(ctx, chartOptions);

        // Stored in the namespace in order to update them.
        chartInstanceNs[componentConfig.resourcePath] = chartInstance;
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
                    axis: "y",
                    data: data.chartData || componentConfig.chartData,
                    fill: false
                }
            ]
        };

        chartInstanceNs[componentConfig.resourcePath].update();
    };
    ns.callbackFn = (data, $component) => {
        // Passing {} because, The values from the model obj are fetched in bellow function definition.
        ns.updateChartInstance(data, $component);
    };

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
    };
})(jQuery, Typerefinery.Components.Widgets.Chart.Variants.BarChart, Typerefinery.Page.Tms, Typerefinery.Components, Typerefinery.Page.Theme, Typerefinery.Components.Widgets.Chart.Instances, document, window);
