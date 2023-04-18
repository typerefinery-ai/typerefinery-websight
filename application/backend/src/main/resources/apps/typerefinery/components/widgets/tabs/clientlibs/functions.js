window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Events = Typerefinery.Page.Events || {};
Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
Typerefinery.Components.Widgets.Tab = Typerefinery.Components.Widgets.Tab || {};

(function (ns, componentNs, eventNs, document, window) {
    "use strict";



    ns.compileHandlerBar = ($component, componentConfig) => {
        const items = {
            listOfTab: componentConfig?.listOfTabAsIFrame?.map((tab, index) => {

                const isContentUrl = tab.contentUrl.startsWith("http");

                if (tab.useQueryParamsFromParent === true && isContentUrl) {
                
                    // append the query params from the parent page.
                    const url = new URL(tab.contentUrl);
                    const searchParams = new URLSearchParams(window.location.search);
                    for (const [key, value] of searchParams) {
                        url.searchParams.append(key, value);
                    }
                    tab.contentUrl = url.toString();
                };


                return {
                    tabTitle: tab.title,
                    tabContent: tab.contentUrl,
                    id: `${index}-${tab.title.replace(/[^a-zA-Z0-9 ]/g, '').trim()?.split(" ").join("-")}`,
                    active: index === 0 ? "active" : "",
                    icon: tab.icon,
                    isCloseable: tab.isCloseable,
                };
            }) || []
        };
        
        ns[componentConfig.id] = items.listOfTab;

        ns.updateComponentHtml($component, componentConfig, items.listOfTab);
    };

    ns.updateComponentHtml = ($component, componentConfig, listOfTab) => {
        
        const source = $(`#${componentConfig.id}-template`).html();
        Handlebars.registerHelper('length', function (obj) {
            return  obj ? (obj.length || 0) : 0;
        });   
        Handlebars.registerHelper('eq', (a, b) => a == b)
        const template = Handlebars.compile(source);
        

        const newHTML = template({listOfTab, placeholder: componentConfig.placeholderContent || '', contentHeight: componentConfig.contentHeight || '75vh'});

        $component.innerHTML = newHTML;
    };

    ns.addTab = ($component, componentConfig, tab) => { 
        // add tabs to the component

        const listOfTab = ns[componentConfig.id] || [];

        // if tab already exists then change its active state to true and change the rest to false.
        const tabExists = listOfTab.find((tabItr) => tabItr.id === tab.id);

        if(tabExists) {
            const newListOfTab = listOfTab.map((tabItr) => {
                if(tabItr.id === tab.id) {
                    tabItr.active = "active";
                } else {
                    tabItr.active = "";
                }
                return tabItr;
            });
            
            ns[componentConfig.id] = newListOfTab;

            ns.updateComponentHtml($component, componentConfig, newListOfTab);
            return;
        }
        

        const newListOfTab = [...listOfTab, tab];

        // set the last tab to active and the rest to false.
        newListOfTab.forEach((tabItr, index) => {
            if(index === newListOfTab.length - 1) {
                tabItr.active = "active";
                eventNs.emitEvent(`${componentConfig.topic}-TAB_CHANGE`, {type: "SELECT_TAB", tab: tabItr});
            
            } else {
                tabItr.active = "";
            }
        });
        

        ns[componentConfig.id] = newListOfTab;

        ns.updateComponentHtml($component, componentConfig, newListOfTab);
    };

    ns.removeTab = ($component, componentConfig, tabId) => {

        // remove tab from the component
        const newListOfTab = ns[componentConfig.id].filter((tab) => tab.id != tabId);
        
        ns[componentConfig.id] = newListOfTab;

        // set the last tab to active and the rest to false.
        newListOfTab.forEach((tabItr, index) => {
            if(index === newListOfTab.length - 1) {
                tabItr.active = "active";
                eventNs.emitEvent(`${componentConfig.topic}-TAB_CHANGE`, {type: "SELECT_TAB", tab: tabItr});
            } else {
                tabItr.active = "";
            }
        });

        ns.updateComponentHtml($component, componentConfig, newListOfTab);
    };

    ns.registerEvents = ($component, componentConfig, componentId) => {
        // register events for the component
        eventNs.registerEvents(`${componentConfig.topic}`, (data) => {
            if(data.type === "ADD_TAB") {
                ns.addTab($component, componentConfig, data.tab);
            } else if (data.type === "REMOVE_TAB") {
                ns.removeTab($component, componentConfig, data.tabId);
            }
        });

    };
    
    ns.closeIconListener = ($component, componentConfig) => {

        // add delegate event listener to close icon in jquery.

        $($component).on("click", ".close-icon", (event) => {
            if(event && event.stopPropagation) event.stopPropagation(); 
            const tabId = event.target.getAttribute("data-tab-id");
            if(!tabId) return;
            ns.removeTab($component, componentConfig, tabId);
            eventNs.emitEvent(`${componentConfig.topic}-TAB_CHANGE`, {type: "CLOSE_TAB", tab: {id: tabId}});
                
        });
    };

    ns.tabClickListener = ($component, componentConfig) => {
        // add delegate event listener to tab in jquery.
        $($component).on("click", ".nav-link", (event) => {
            const tabId = event.target.getAttribute("data-tab-id");
            if(!tabId) return;
            eventNs.emitEvent(`${componentConfig.topic}-TAB_CHANGE`, {type: "SELECT_TAB", tab: {id: tabId}});
           
        });
    };

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        if(componentConfig.variant === "reference") {
            return;
        }
        // const $tabComponent = $component.querySelector(".tab-content");
        // $tabComponent.innerHTML = componentConfig.listOfTab.map((tab, index) => {
        //     return `

        //     <div 
        //         class="tab-pane fade show ${index == 0 ? 'active': ''}" 
        //         id="${index}"
        //         role="tabpanel" 
        //         aria-labelledby="${index}-tab"
        //     >
        //         ${tab.content}
        //     </div>
        //     `
        // }).join('');

        if(componentConfig.events && componentConfig.events.length > 0) { 
            componentConfig['topic'] = componentConfig.events[0]?.key || '';
        }


        ns.compileHandlerBar($component, componentConfig);


        // if componentConfig.events is defined then add event listeners to table.
        ns.registerEvents($component, componentConfig, componentConfig.id);
        
        ns.closeIconListener($component, componentConfig);

        ns.tabClickListener($component, componentConfig);
    };


})(Typerefinery.Components.Widgets.Tab, Typerefinery.Components, Typerefinery.Page.Events, document, window);

                                                                                                                                                                                                                                                                                                                                