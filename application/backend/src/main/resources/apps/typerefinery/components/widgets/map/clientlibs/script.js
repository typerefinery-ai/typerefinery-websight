$(document).ready(function (e) {
  //$("[component='leafletmap']").each(function() {
  //  ns.init(this);
  //});
  if (document.getElementById("map")) {
    const key = "WTh8FTa6cT027rlVBBbG";
    const dataId = "dcb0900e-992a-4ff5-9819-861b4df293e9";
    const dataId1 = "b70a0972-99a0-4539-98eb-35e04f0c052d";
    const map = new maplibregl.Map({
      container: "map", // container's id or the HTML element in which MapLibre GL JS will render the map
      style: `https://api.maptiler.com/maps/bright-v2/style.json?key=${key}`, // style URL
      center: [9.145, 40.4897], // starting position [lng, lat]
      zoom: 1.5, // starting zoom
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    fetch(`https://api.maptiler.com/data/${dataId}/features.json?key=${key}`)
      .then(function (response) {
        return response.json();
      })
      .then(function (geojson) {
        map.on("load", function () {
          map.addSource("geojson-overlay", {
            type: "geojson",
            data: geojson,
          });
          map.addLayer({
            id: "20cada51-ac22-461a-b60d-ee895337314d",
            type: "fill",
            source: "geojson-overlay",
            layout: {},
            paint: {
              "fill-color": "#98b",
              "fill-opacity": 0.3,
            },
          });
        });
      });
    map.on("load", function () {
      map.addSource("gps_tracks", {
        type: "geojson",
        data: `https://api.maptiler.com/data/${dataId1}/features.json?key=${key}`,
      });
      map.addLayer({
        id: "gps_tracks",
        type: "fill",
        source: "gps_tracks",
        layout: {},
        paint: {
          "fill-color": "#f4a261",
          "fill-opacity": 0.3,
        },
      });
    });
    map.on("error", function (err) {
      console.log("MAP ERROR", err);
    });
  }
});
