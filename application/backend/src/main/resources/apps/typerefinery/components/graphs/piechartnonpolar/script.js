function piechartnonpolarComponentMounted(component, id) {
  const defaultData = {
    labels: ['Red', 'Orange', 'Yellow', 'Green', 'Blue'],
    labelName: "Typerefinery Pie Chart Non Polar",
    chartData: [25, 28, 30, 24, 20],
    backgroundColorForData: [
      "rgba(255, 84, 84, 0.24)",
      "rgba(93, 255, 84, 0.24)",
      "rgba(90, 84, 255, 0.14)",
      "rgba(255, 168, 84, 0.14)",
      "rgba(255, 255, 84, 0.24)",
    ],
    borderColorForData: [
      "rgba(255, 84, 84, 2222)",
      "rgba(93, 255, 84, 1)",
      "rgba(89, 84, 255, 1)",
      "rgba(255, 168, 84, 1)",
      "rgba(255, 255, 84, 1)",
    ],
    canvasBackgroundColor: "#343a40",
  };
  const dataSourceURL = component.getAttribute("data-source");
  const fetchData = async () => {
    try {
      const response = await fetch(dataSourceURL).then((res) => res.json());
      !response ? drawPieChartNonPolar(defaultData, id) : drawPieChartNonPolar(response, id);
    } catch (error) {
      drawPieChartNonPolar(defaultData, id);
    }
  };

  fetchData();
}

function drawPieChartNonPolar(piechartData, id) {
  const { labels, chartData, backgroundColorForData, labelName } = piechartData;

  const ctx = document.getElementById(`${id}-piechartnonpolar`).getContext("2d");

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

  // Pie chart (Non Polar Area)
  let chartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: labelName,
          data: chartData,
          backgroundColor: backgroundColorForData,
          borderColor: backgroundColorForData,
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
            color: window.rootEleStyle.getPropertyValue('--label-color'),
            usePointStyle: true,
          },
        },
      },
      customCanvasBackgroundColor: {
        color: "white",
      }
    },
    plugins: [plugin],
  });

  
  window.Typerefinery.Components.Graphs[id] = chartInstance;
}

$(document).ready(function (e) {
  Array.from(document.querySelectorAll("#piechartnonpolarContainer")).forEach(
    (component) => {
      var componentDataPath = component.getAttribute("data-path");
      component.setAttribute("id", componentDataPath);
      piechartnonpolarComponentMounted(component, componentDataPath);
    }
  );
});
