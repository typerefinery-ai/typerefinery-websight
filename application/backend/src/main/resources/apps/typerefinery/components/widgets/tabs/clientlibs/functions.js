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
                    title: tab.title,
                    url: tab.contentUrl,
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
        
        // filter listOfTab if that li has no id and already exists in the $component.
        const $header = $component.querySelector("ul");
        const $tabContent = $component.querySelector("div.tab-content");
        const $headerTabs = $header.querySelectorAll("li");
        const $headerTabIds = [...$headerTabs].map((tab) => tab.id);

        // remove the active class from all the tabs.
        $headerTabs.forEach((tab) => {
            tab.classList.remove("active");
            tab.querySelector("button").classList.remove("active");
        });


        
        // remove the active class from all the tab contents.
        $tabContent.querySelectorAll("div.tab-pane").forEach((tab) => {
            tab.classList.remove("active");
        });

        
        // if the tab already exists in the $component, then remove it from the listOfTab.
        const filteredListOfTab = listOfTab.filter((tab) => {
            if($headerTabIds.includes(`${tab.id}`)) {
                return false;
            }
            return true;
        });
        
        const newHeaderTabs = `
            ${filteredListOfTab.map((tab, index) => {
                if(!tab.id && tab.id != 0) return ``;
                return `
                    <li class="${tab.active} nav-item" id="${tab.id}">
                        <button 
                            class="nav-link ${tab.active}"
                            data-tab-id="${tab.id}"
                            id="${tab.id}-tab" 
                            data-bs-toggle="tab"
                            data-bs-target="#${tab.id}-sidebar" 
                            type="button" 
                            role="tab" 
                        >
                            <sly data-sly-test="${tab.icon}">
                                <i class="icon ${tab.icon}"></i>
                            </sly>
                            ${tab.title}
                            <i data-tab-id="${tab.id}" class="close-icon pi pi-times"></i>
                        </button>
                    </li>`
            }).join("")}
        `;

        const newTabContents = `
            ${filteredListOfTab.map((tab, index) => {
                if(!tab.id && tab.id != 0) return ``;
                return `
                    <div 
                        class="tab-pane fade ${tab.active} show" 
                        id="${tab.id}-sidebar" 
                        role="tabpanel" 
                        aria-labelledby="${tab.id}-sidebar-tab"
                    >
                        ${
                            tab.url ?
                            `
                            <iframe 
                                src="${tab.url}" 
                                style="width: 100%; height: 100%; border: none;"
                            >
                            </iframe>`
                            :
                            tab.html
                        }
                    </div>
                `
            }).join("")}
        `;

        // get ul tag from $component and append the new tab to it.
        $header.insertAdjacentHTML('beforeend', newHeaderTabs);
        $tabContent.insertAdjacentHTML('beforeend',newTabContents);
    };

    ns.setActiveTabInDOM = ($component, componentConfig, tabId) => {
        const $header = $component.querySelector("ul");
        const $tabContent = $component.querySelector("div.tab-content");
        const $headerTabs = $header.querySelectorAll("li");
        
        let activeIndex = -1;
        // remove the active class from all the tabs.
        $headerTabs.forEach((tab, index) => {
            tab.classList.remove("active");
            tab.querySelector("button").classList.remove("active");
            if(tab.id == tabId) {
                activeIndex = index
            }
        });

        // remove the active class from all the tab contents.
        $tabContent.querySelectorAll("div.tab-pane").forEach((tab) => {
            tab.classList.remove("active");
            tab.classList.remove("show");
        });
        if(activeIndex == -1) return;
        // add the active class to the tab and tab content.
        $header.querySelectorAll("button")[activeIndex].classList.add("active");
        $tabContent.querySelectorAll("div.tab-pane")[activeIndex].classList.add("active");
        $tabContent.querySelectorAll("div.tab-pane")[activeIndex].classList.add("show");
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
            ns.setActiveTabInDOM($component, componentConfig, tab.id);
            
            ns[componentConfig.id] = newListOfTab;

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

        let $header = $component.querySelector("ul");
        let $tabContent = $component.querySelector("div.tab-content");
        let $headerTabs = $header.querySelectorAll("li");
        // remove tabId from the $component.
        $headerTabs.forEach((tab, index) => {
            const dataTabId = tab.getAttribute("data-tab-id");
            if(tab.id === tabId || dataTabId === tabId) {
                tab.remove();
                // then remove the tab content from the $component as well.
                const $tab = $tabContent.querySelectorAll(`.tab-pane`)[index];
                if(!$tab) {
                    return;
                }
                $tab.remove();
            }
        });

        // make the last tab active from $component.

        $header = $component.querySelector("ul");
        $tabContent = $component.querySelector("div.tab-content");
        $headerTabs = $header.querySelectorAll("li");

        $headerTabs.forEach((tab, index) => {
            if(index === $headerTabs.length - 1) {
                ns.setActiveTabInDOM($component, componentConfig, tab.id);
                const $tab = $tabContent.querySelectorAll(`.tab-pane`)[index];
                if(!$tab) {
                    return;
                }
                if(!$tab.getAttribute("data-tab-id")) {
                    eventNs.emitEvent(`${componentConfig.topic}-TAB_CHANGE`, {type: "SELECT_TAB", tab: {id: tab.id}});
                }
            }
        });

        // remove the tab from the listOfTab.
        const listOfTab = ns[componentConfig.id] || [];
        const filteredListOfTab = listOfTab.filter((tab) => {
            if(tab.id == tabId) {
                return false;
            }
            return true;
        });

        // set the last tab to active and the rest to false.
        filteredListOfTab.forEach((tabItr, index) => {
            if(index === filteredListOfTab.length - 1) {
                tabItr.active = "active";
            }
        });

        ns[componentConfig.id] = filteredListOfTab;
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
            eventNs.emitEvent(`${componentConfig.topic}-TAB_CHANGE`, {type: "CLOSE_TAB", tab: {id: tabId}});        
            ns.removeTab($component, componentConfig, tabId);
        });
    };

    ns.tabClickListener = ($component, componentConfig) => {
        // add delegate event listener to tab in jquery.
        $($component).on("click", ".nav-link", (event) => {
            const tabId = event.target.getAttribute("data-tab-id");
            eventNs.emitEvent(`${componentConfig.topic}-TAB_CHANGE`, {type: "SELECT_TAB", tab: {id: tabId}});
        });
    };

    ns.init = ($component) => {
        // initialize the component
        const componentConfig = componentNs.getComponentConfig($component);

        // if componentConfig.events is defined then add event listeners to this component.
        if(componentConfig.events && componentConfig.events.length > 0) { 
            componentConfig['topic'] = componentConfig.events[0]?.key || '';

            ns.registerEvents($component, componentConfig, componentConfig.id);
            ns.closeIconListener($component, componentConfig);
            ns.tabClickListener($component, componentConfig);
        }

        // pass query params from parent page to iframe
        // for all iframes that have addquerystring, get srchref append query params from the parent page and set as src.
        const iframes = $component.querySelectorAll("iframe");

        if(iframes && iframes.length > 0) {
            iframes.forEach((iframe) => {
                if(iframe.getAttribute("addquerystring") === "true") {

                    const srchref = iframe.getAttribute("srchref");
                    const url = new URL(srchref);
                    const params = new URLSearchParams(url.search);
                    const parentUrl = new URL(window.location.href);
                    const parentParams = new URLSearchParams(parentUrl.search);
                    parentParams.forEach((value, key) => {
                        params.set(key, value);
                    });
                    url.search = params.toString();
                    iframe.setAttribute("src", url.toString());
                }
            });
        }

        ns[componentConfig.id] = componentConfig.tabsList;

    };


})(Typerefinery.Components.Widgets.Tab, Typerefinery.Components, Typerefinery.Page.Events, document, window);

                                                                                                                                                                                                                                                                                                                                