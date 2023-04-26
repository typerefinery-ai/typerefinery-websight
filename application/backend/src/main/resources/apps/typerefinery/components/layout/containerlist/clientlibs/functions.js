window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Layout = Typerefinery.Components.Layout || {};
window.Typerefinery.Components.Layout.ContainerList =
  Typerefinery.Components.Layout.ContainerList || {};

(function (ns, componentNs, document, window) {
  ns.updateComponentHTML = ($component) => {
    if (!$component) {
      return;
    }
    const componentConfig = componentNs.getComponentConfig($component);
    const items = {
      listOfContainer: componentConfig.containers,
    };
    const source = $(`#${componentConfig.id}-template`).html();
    const template = Handlebars.compile(source);
    const newHTML = template({ items ,alignment:componentConfig.listAlignment});
    $component.innerHTML = newHTML;
var header = document.getElementById("containerItems");
var lis = header.getElementsByTagName("a");
console.log("lis",lis)
for (var i = 0; i < lis.length; i++) {
  lis[i].addEventListener("click", function() {
  var current = document.getElementsByClassName("active");
  if (current.length > 0) {
    current[0].className = current[0].className.replace(" active", "");
  }

  this.className += " active";
  });
}    
  };
  ns.init = ($component) => {
    // parse json value from data-model attribute as component config
    const componentConfig = componentNs.getComponentConfig($component);
    // MODEL
    ns.updateComponentHTML($component);
  };
})(Typerefinery.Components.Layout.ContainerList,Typerefinery.Components,document,window);
