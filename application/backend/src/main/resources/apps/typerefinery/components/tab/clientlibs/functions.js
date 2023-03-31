window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Tab = Typerefinery.Components.Tab || {};
// window.Typerefinery.Components.Widgets.Map.LeafletMap = Typerefinery.Components.Widgets.Map.LeafletMap || {};
// window.Typerefinery.Page = Typerefinery.Page || {};
// window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};
; (function (ns, componentNs,window, document) {
    "use strict";
    ns.updateComponentHTML = ($component) => {
        console.log("hello")
        if (!$component) {
            console.log('[Tabclientlibs/functions.js] component does not exist')
            return;
        }
        const componentConfig = componentNs.getComponentConfig($component);
        // const tab = document.getElementById(`${componentConfig.id}`)
        // const queryParams=componentNs.getQueryParams()
        // console.log("query",componentNs.getQueryParams())
        
        const listOfTab=componentConfig.tabList
        console.log("list",listOfTab)
            //html of list of tabs
        let listhtml=listOfTab.map((item)=>{ return  `<li class="nav-item" role="presentation">
        <button class="nav-link" id=${item.tabId} data-bs-toggle="tab" data-bs-target="#${item.tabId}" type="button" role="tab" aria-controls=${item.tabId} aria-selected="true">${item.title}</button>
      </li>`} ).join(" ")

       console.log("listhtml",listhtml)

       let list=`<ul  class="nav nav-tabs" id="myTab" role="tablist">${listhtml}</ul>`

      console.log("list",list)

      //html for tab content
      let tabContentHtml=listOfTab.map((item)=>{ return `<div class="tab-pane fade" id=${item.tabId} role="tabpanel" aria-labelledby=${item.tabId} tabindex="0">
      <p>Rahul</p>
      </div>`}).join(" ")

      let tabContent=`<div class="tab-content" id="myTabContent">${tabContentHtml}</div>`

      console.log("tabContent",tabContent)

      $component.innerHTML=list + tabContent
      console.log("$component.innerHTML",  $component)
    
         
    }
    ns.init = ($component) => {
        // TODO: Everything must be completed once polygson is completed.
        // parse json value from data-model attribute as component config
        const componentConfig = componentNs.getComponentConfig($component);
        console.log("componentConfig-tab",componentConfig)
        // TMS.
        ns.updateComponentHTML($component)
    }
})(window.Typerefinery.Components.Tab, window.Typerefinery.Components,window, document);

