function lineChartComponentMounted(component, id) {
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
    dataSetBorderColor: "#0099DE",
    canvasBackgroundColor: "#343a40",
  };
  const fetchData = async () => {
    try {
      const response = await fetch(dataSourceURL).then((res) => res.json());
      !response ? drawLineChart(defaultData, id) : drawLineChart(response, id);
    } catch (error) {
      drawLineChart(defaultData, id);
    }
  };
  fetchData();
}

function drawLineChart(lineChartData, id) {
  const {
    labels,
    labelName,
    chartData,
    dataSetBorderColor = "#0099DE",
    canvasBackgroundColor = "#343a40",
  } = lineChartData;

  const ctx = document.getElementById(`${id}-lineChart`).getContext("2d");

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
      ctx.fillStyle = window.rootEleStyle.getPropertyValue('--primary-object-background-color') || "#99ffff";
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };

  // Line chart
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: labelName,
          data: chartData,
          fill: true,
          borderColor: dataSetBorderColor,
          tension: 0.3,
          backgroundColor: chartBackgroundGradientColor,
        },
      ],
    },
    options: {
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
            color: window.rootEleStyle.getPropertyValue('--ticks-color') || "#5D7183",
          },
        },
        y: {
          grid: {
            color: window.rootEleStyle.getPropertyValue('--grid-color'),
          },
          ticks: {
            color: window.rootEleStyle.getPropertyValue('--ticks-color') || "#5D7183",
            // font: {
            //     size: 13
            // }
          },
        },
      },
      customCanvasBackgroundColor: {
        color: canvasBackgroundColor,
      },
      interaction: {
        intersect: false,
      },
      radius: 0,
    },
    plugins: [plugin],
  });
}

$(document).ready(function (e) {
  Array.from(document.querySelectorAll("#lineChartContainer")).forEach(
    (component) => {
      var componentDataPath = component.getAttribute("data-path");
      component.setAttribute("id", componentDataPath);
      lineChartComponentMounted(component, componentDataPath);
    }
  );
});
