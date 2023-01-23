function radarChartComponent(component, id) {
  const dataSourceURL = component.getAttribute("data-source");
  console.log("dataSourceURL", dataSourceURL);
  const defaultData = {
    labels: ["RAT", "Trojan", "Malware", "Phishing", "Ransomware"],
    datasets: [
      {
        label: "Ipv4",
        data: [65, 59, 90, 81, 56, 55, 40],
        fill: true,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgb(255, 99, 132)",
        pointBackgroundColor: "rgb(255, 99, 132)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(255, 99, 132)",
      },
      {
        label: "url",
        data: [28, 48, 40, 19, 96, 27, 100],
        fill: true,
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgb(54, 162, 235)",
        pointBackgroundColor: "rgb(54, 162, 235)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(54, 162, 235)",
      },
    ],
  };
  const fetchData = async () => {
    try {
      const response = await fetch(dataSourceURL).then((res) => res.json());
      console.log("respnse", response);
      !response
        ? drawRadarChart(defaultData, id)
        : drawRadarChart(response, id);
    } catch (error) {
      drawRadarChart(defaultData, id);
    }
  };
  fetchData();
}

function drawRadarChart(radarChartData, id) {
  const { labels, datasets, canvasBackgroundColor } = radarChartData;

  const ctx = document.getElementById(`${id}-radarChart`).getContext("2d");
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

  // Radar chart
  new Chart(ctx, {
    type: "radar",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      plugins: {
        legend: {
          display: true,
          position: "top",
          usePointStyle: false,
          labels: {
            color: "#ebedeb",
            usePointStyle: false,
          },
        },
        title: {
          display: true,
          text: "Tags",
          position: "top",
          color: "White",
        },
      },
      scales: {
        r: {
          grid: {
            color: "white",
          },
          ticks: {
            color: "white",
            z: 0,
            showLabelBackdrop: false,
            precision: 0,
          },
          pointLabels: {
            color: "white",
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
}

$(document).ready(function (e) {
  Array.from(document.querySelectorAll("#radarChartContainer")).forEach(
    (component) => {
      var componentDataPath = component.getAttribute("data-path");
      console.log("path", componentDataPath);
      component.setAttribute("id", componentDataPath);
      radarChartComponent(component, componentDataPath);
    }
  );
});
