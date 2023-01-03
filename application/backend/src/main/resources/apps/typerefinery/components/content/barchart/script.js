$(document).ready(function (e) {
  Chart.defaults.global.defaultFontFamily = "Lato";

  var horizontalBarChart = new Chart(horizontalBarChartCanvas, {
    type: "horizontalBar",
    data: {
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
      datasets: [
        {
          data: [75000, 75000, 75000, 15000, 14000, 12000, 11000, 11500, 11000],
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
          boxWidth: 10,
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
      },
    },
  });
});
