function leafletmapMounted(component, id) {
  const dataSourceURL = component.getAttribute("data-source");
  const defaultData = polyJson;
  const fetchData = async () => {
    try {
      const response = await fetch(dataSourceURL).then((res) => res.json());
      !response.mapData
        ? drawLeafletMapComponent(defaultData, id)
        : drawLeafletMapComponent(response.mapData, id);
    } catch (error) {
      drawLeafletMapComponent(defaultData, id);
    }
  };
  dataSourceURL ? fetchData() : drawLeafletMapComponent(defaultData, id);
}

function drawLeafletMapComponent(mapData, id) {
  var leafletmapComponent = L.map(id).setView([9.145, 40.4897], 2);

  // Polygon Layer over map.
  mapData.forEach(_ => {
    L.geoJSON(_.coordinates, {
      style: _.style,
    }).addTo(leafletmapComponent);
  }); 

  //add map style
  L.tileLayer(
    "https://api.maptiler.com/maps/bright-v2/256/{z}/{x}/{y}.png?key=WTh8FTa6cT027rlVBBbG",
    {
      maxZoom: 19,
      attribution:
        '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
    }
  ).addTo(leafletmapComponent);
}
$(document).ready(function (e) {
  Array.from(document.querySelectorAll("#leafletmap")).forEach((component) => {
    const componentDataPath = component.getAttribute("data-path");
    component.setAttribute("id", componentDataPath);
    leafletmapMounted(component, componentDataPath);
  });
});
