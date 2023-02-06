function labelLineChartComponentMounted(component, id) {
  const dataSourceURL = component.getAttribute("data-source");
  const defaultData = {
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
  };
  const fetchData = async () => {
    try {
      const response = await fetch(dataSourceURL).then((res) => res.json());
      !response ? drawLabelLineChart(defaultData, id) : drawLabelLineChart(response, id);
    } catch (error) {
      drawLabelLineChart(defaultData, id);
    }
  };
  fetchData();
}
function drawLabelLineChart(linechartData, id) {
  const {
    labels,
    labelName,
    chartData,
  } = linechartData;
  const ctx = document.getElementById(`${id}-linechart`).getContext("2d");
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
      ctx.fillStyle = window.rootEleStyle.getPropertyValue('--primary-bg-color') || "#99ffff";
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };
  // Line chart
  let chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: labelName,
          data: chartData,
          fill: false,
          tension: 0.3,
        },
      ],
    },
    plugins: [ChartDataLabels,plugin],
    options: {
      elements: {
        line:{borderColor: "#0099DE",},
        point: {
          borderWidth: 1,
          backgroundColor:"#0099DE",
          radius: 10,
        },
      },
      plugins: {       
        legend: {
          display: false,
        },
        datalabels: {
           labels: {
            title: {
              font: {
                weight: 'bold'
              }
            },
            value: {
              color: 'white'
            }
          },
        },
    },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: window.rootEleStyle.getPropertyValue('--ticks-color') || "#5D7183",
          },
        },
        y: {
          grid: {
            color: window.rootEleStyle.getPropertyValue('--grid-color'),
          },
          ticks: {
            color: window.rootEleStyle.getPropertyValue('--ticks-color') || "#5D7183",
          },
        },
      },
    },
  });

  
  window.Typerefinery.Components.Graphs[id] = chartInstance;
}
$(document).ready(function (e) {
  Array.from(document.querySelectorAll("#linechartLabelContainer")).forEach(
    (component) => {
      var componentDataPath = component.getAttribute("data-path");
      component.setAttribute("id", componentDataPath);
      labelLineChartComponentMounted(component, componentDataPath);
    }
  );
});