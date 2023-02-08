window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Theme = Typerefinery.Theme || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Charts = Typerefinery.Components.Widgets.Charts || {};
window.Typerefinery.Components.Widgets.Charts.Variants = Typerefinery.Components.Widgets.Charts.Variants || {};
window.Typerefinery.Components.Widgets.Charts.Variants.PieChart = Typerefinery.Components.Widgets.Charts.Variants.PieChart || {};
window.Typerefinery.Components.Widgets.Charts.Instances = Typerefinery.Components.Widgets.Charts.Instances || {};

(function (ns, typerefineryNs, componentNs, themeNs, chartInstanceNs, document, window) {
    "use strict";

    const DEFAULT_DATA = {
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
        canvasBackgroundColor: themeNs?.rootElementStyle?.getPropertyValue("--primary-object-background-color") || "#343a40",
    };

    ns.updateComponentHTML = (data, $component) => {
        if (!$component) {
            return;
        }
        let componentConfig = componentNs.getComponentConfig($component);
        componentConfig = {
            ...componentConfig,
            ...DEFAULT_DATA
        }
        if (!componentConfig.resourcePath) {
            componentConfig.resourcePath = data.resourcePath || $component.getAttribute(`data-resource-path`);
        }
        const ctx = document.getElementById(`${componentConfig.resourcePath}-chart`).getContext("2d");

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

        const chartOptions = {
            type: "polarArea",
            data: {
                labels: data.labels || componentConfig.labels,
                datasets: [
                    {
                        label: data.labelName || componentConfig.labelName,
                        data: data.chartData || componentConfig.chartData,
                        backgroundColor: data.backgroundColorForData || componentConfig.backgroundColorForData,
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
                            color: "#5D7183",
                            usePointStyle: true
                        }
                    }
                },
                customCanvasBackgroundColor: {
                    color: themeNs?.rootElementStyle.getPropertyValue('--primary-object-background-color'),
                },
                scales: {
                    r: {
                        grid: {
                            color: themeNs?.rootElementStyle.getPropertyValue('--grid-color'),
                        },
                        ticks: {
                            color: "#5D7183",
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
            ...DEFAULT_DATA,
        };
        
        // TODO: Need to be completed.
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

        // TODO: Update the data-module for the TMS Connection.

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
})(window.Typerefinery.Components.Widgets.Charts.Variants.PieChart, window.Typerefinery, window.Typerefinery.Components, window.Typerefinery.Theme, window.Typerefinery.Components.Widgets.Charts.Instances, document, window);