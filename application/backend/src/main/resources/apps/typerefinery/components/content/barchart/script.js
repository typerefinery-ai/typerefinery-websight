function barChartComponent(component, id) {
  Chart.defaults.global.defaultFontFamily = "Lato";
  const dataSourceURL = component.getAttribute("data-source");
  const defaultData = {
    chartData: [75000, 75000, 75000, 15000, 14000, 12000, 11000, 11500, 11000],
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
    dataSetBorderColor: "#0099DE",
    canvasBackgroundColor: "#001E3C",
  };
  const fetchData = async () => {
    try {
      const response = await fetch(dataSourceURL).then((res) => res.json());
      !response ? drawBarChart(defaultData, id) : drawBarChart(response, id);
    } catch (error) {
      drawBarChart(defaultData, id);
    }
  };
  fetchData();
}

function drawBarChart(barChartData, id) {
  const {
    labels,
    chartData,
    dataSetBorderColor = "#0099DE",
    canvasBackgroundColor = "#001E3C",
  } = barChartData;

  const ctx = document.getElementById(`${id}-barChart`).getContext("2d");

  // Canvas Background.
  const plugin = {
    id: "customCanvasBackgroundColor",
    beforeDraw: (chart, args, options) => {
      const { ctx } = chart;
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#001E3C" || "#99ffff";
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };

  // Bar chart
  new Chart(ctx, {
    type: "horizontalBar",
    data: {
      labels: labels,
      datasets: [
        {
          data: chartData,
          backgroundColor: [
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
        },
      ],
    },
    options: {
      tooltips: {
        enabled: false,
      },
      responsive: true,
      legend: {
        display: false,
        position: "bottom",
        fullWidth: true,
        labels: {
          boxWidth: 50,
          padding: 50,
        },
      },
      scales: {
        yAxes: [
          {
            barPercentage: 0.75,
            gridLines: {
              display: true,
              drawTicks: true,
              drawOnChartArea: false,
            },
            ticks: {
              fontColor: "#555759",
              fontFamily: "Lato",
              fontSize: 11,
            },
          },
        ],
        xAxes: [
          {
            gridLines: {
              display: true,
              drawTicks: false,
              tickMarkLength: 5,
              drawBorder: false,
            },
            ticks: {
              padding: 5,
              beginAtZero: true,
              fontColor: "#555759",
              fontFamily: "Lato",
              fontSize: 11,
              callback: function (label, index, labels) {
                return label / 1000;
              },
            },
            scaleLabel: {
              display: true,
              padding: 10,
              fontFamily: "Lato",
              fontColor: "#555759",
              fontSize: 16,
              fontStyle: 700,
              labelString: "Scale Label",
            },
          },
        ],
        customCanvasBackgroundColor: {
          color: canvasBackgroundColor,
        },
      },
    },
    plugins: [plugin],
  });
}

$(document).ready(function (e) {
  Array.from(document.querySelectorAll("#barChartContainer")).forEach(
    (component) => {
      var componentDataPath = component.getAttribute("data-path");
      component.setAttribute("id", componentDataPath);
      barChartComponent(component, componentDataPath);
    }
  );
});
