function xAxisBarChartComponent(component, id) {
  const dataSourceURL = component.getAttribute("data-source");
  const defaultData = {
    chartData: [75000, 75000, 75000, 15000, 14000, 12000, 15200, 14200, 12450],
    labelName: "Typerefinery X-Axis Bar Chart",
    barbackgroundcolor: [
      "#FFB94E",
      "#228B22",
      "#FFB94E",
      "#228B22",
      "#FFB94E",
      "#ED7117",
      "#228B22",
      "#FFB94E",
      "#ED7117",
    ],
    labels: [
      "IPV4",
      "Email",
      "File",
      "IPV3",
      "Domain",
      "URL",
      "Database",
      "IPV2",
      "Store",
    ],
    dataSetBorderColor: "#0099DE",
    canvasBackgroundColor: "#343a40",
  };
  const fetchData = async () => {
    try {
      const response = await fetch(dataSourceURL).then((res) => res.json());
      !response
        ? drawXAxisBarChart(defaultData, id)
        : drawXAxisBarChart(response, id);
    } catch (error) {
      drawXAxisBarChart(defaultData, id);
    }
  };
  fetchData();
}

function drawXAxisBarChart(barChartData, id) {
  const {
    labels,
    labelName,
    chartData,
    barbackgroundcolor,
    dataSetBorderColor = "#0099DE",
    canvasBackgroundColor = "#343a40",
  } = barChartData;

  const ctx = document.getElementById(`${id}-barChart`).getContext("2d");

  // Canvas Background.
  const plugin = {
    id: "customCanvasBackgroundColor",
    beforeDraw: (chart, args, options) => {
      const { ctx } = chart;
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#343a40" || "#99ffff";
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };

  // Bar chart
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          data: chartData,
          fill: false,
          backgroundColor: barbackgroundcolor,
          borderWidth: 1,
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
        y: {
          beginAtZero: true,
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
  Array.from(document.querySelectorAll("#xAxisBarChartContainer")).forEach(
    (component) => {
      var componentDataPath = component.getAttribute("data-path");
      component.setAttribute("id", componentDataPath);
      xAxisBarChartComponent(component, componentDataPath);
    }
  );
});
