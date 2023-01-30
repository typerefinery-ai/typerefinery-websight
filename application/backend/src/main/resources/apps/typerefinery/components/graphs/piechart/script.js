function piechartComponentMounted(component, id) {
  const defaultData = {
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
    canvasBackgroundColor: "#343a40",
  };
  const dataSourceURL = component.getAttribute("data-source");
  const fetchData = async () => {
    try {
      const response = await fetch(dataSourceURL).then((res) => res.json());
      !response ? drawPieChart(defaultData, id) : drawPieChart(response, id);
    } catch (error) {
      drawPieChart(defaultData, id);
    }
  };

  fetchData();
}

function drawPieChart(piechartData, id) {
  const { labels, chartData, backgroundColorForData, labelName } = piechartData;

  const ctx = document.getElementById(`${id}-piechart`).getContext("2d");

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

  // Pie chart (Polar Area)
  let chartInstance = new Chart(ctx, {
    type: "polarArea",
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
      },
      scales: {
        r: {
          grid: {
            color: window.rootEleStyle.getPropertyValue('--grid-color'),
          },
          ticks: {
            color: window.rootEleStyle.getPropertyValue('--ticks-color'),
            z: 0,
            showLabelBackdrop: false,
            precision: 0,
          },
        },
      },
      scale: {
        ticks: {
          z: 1,
        },
      },
    },
    plugins: [plugin],
  });

  
  window.Typerefinery.Components.Graphs[id] = chartInstance;
}

$(document).ready(function (e) {
  Array.from(document.querySelectorAll("#piechartContainer")).forEach(
    (component) => {
      var componentDataPath = component.getAttribute("data-path");
      component.setAttribute("id", componentDataPath);
      piechartComponentMounted(component, componentDataPath);
    }
  );
});
