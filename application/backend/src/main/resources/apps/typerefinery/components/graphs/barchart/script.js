function barChartComponent(component, id) {
  const dataSourceURL = component.getAttribute("data-source");
  const defaultData = {
    chartData: [75000, 75000, 75000, 15000, 14000, 12000, 11000, 11500, 11000],
    labelName: "Typerefinery Bar Chart",
    barbackgroundcolor: [
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
    canvasBackgroundColor: "#343a40",
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
      ctx.fillStyle = window.rootEleStyle.getPropertyValue('--primary-object-background-color') || "#99ffff";
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };

  // Bar chart
  let chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          axis: "y",
          data: chartData,
          fill: false,
          backgroundColor: barbackgroundcolor,
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
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
  
  window.Typerefinery.Components.Graphs[id] = chartInstance;
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
