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
    // parse json value from data-model attribute as component config
    const componentConfig = componentNs.getComponentConfig($component);

    const source = $(`#${componentConfig.id}-template`).html();
    const template = Handlebars.compile(source);
    const str = window.location.href;
    const data = str.split("#")[1];
    componentConfig.containers = componentConfig.containers.map((el) => {
      return el.key == data
        ? { ...el, active: "active" }
        : { ...el, active: "" };
    });
    const newHTML = template({
      listOfContainer: componentConfig.containers,
      alignment: componentConfig.listAlignment,
    });
    $component.innerHTML = newHTML;
  };
  //function for active class of containerlist
  ns.containerListContent = () => {
    let containerDiv = document.getElementById("containerItems");
    let anchorTag = containerDiv.getElementsByTagName("a");
    for (let i = 0; i < anchorTag.length; i++) {
      anchorTag[i].addEventListener("click", function () {
        let current = document.getElementsByClassName("active");
        if (current.length > 0) {
          current[0].className = current[0].className.replace(" active", "");
        }
        this.className += " active";
      });
    }
    //Future reference
    // let sticky = containerDiv.offsetTop;
    // window.onscroll = function () {
    //   if (window.pageYOffset > sticky) {
    //     containerDiv.classList.add("sticky");
    //   } else {
    //     containerDiv.classList.remove("sticky");
    //   }
    // };
  };
  ns.init = ($component) => {
    // MODEL
    ns.updateComponentHTML($component);
    ns.containerListContent();
  };
})(Typerefinery.Components.Layout.ContainerList,Typerefinery.Components,document,window);
