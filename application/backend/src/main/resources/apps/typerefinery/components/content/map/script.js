$(document).ready(function (e) {
  if (document.getElementById("map")) {
    const key = "WTh8FTa6cT027rlVBBbG";
    const map = new maplibregl.Map({
      container: "map", // container's id or the HTML element in which MapLibre GL JS will render the map
      style: `https://api.maptiler.com/maps/hybrid/style.json?key=${key}`, // style URL
      center: [16.62662018, 49.2125578], // starting position [lng, lat]
      zoom: 0, // starting zoom
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.on("error", function (err) {
      console.log("MAP ERROR", err)
    });
  }

});
