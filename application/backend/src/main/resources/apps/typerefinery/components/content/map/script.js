$(document).ready(function (e) {
  if (document.getElementById("map")) {
    const key = "WTh8FTa6cT027rlVBBbG";
    var map = L.map('map').setView([9.145, 40.4897], 2);

    //To Add geoJSON
    
    L.geoJSON(polyJSON,{
      style:{
        fillColor:'#e76f51',
        fillOpacity:0.5,
        stroke:false
      }
    }).addTo(map)
    L.geoJSON(polyJSON1,{
      style:{
        fillColor:'#98b',
        fillOpacity:0.5,
        stroke:false
      }
    }).addTo(map)
    
    //add map style
        L.tileLayer('https://api.maptiler.com/maps/bright-v2/256/{z}/{x}/{y}.png?key=WTh8FTa6cT027rlVBBbG', {          
        maxZoom: 19,
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
    }).addTo(map); 
  }
});
