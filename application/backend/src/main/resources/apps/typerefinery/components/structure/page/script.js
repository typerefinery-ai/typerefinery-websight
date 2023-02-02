$(document).ready(() => {
    const vueApp = Vue.createApp({
        data() {
            return window.Typerefinery.VueData.data;
        },
        methods: {
            onSidebarItemClicked(e) {
                const selectedNodeName = e.target.innerText || "";
                if (selectedNodeName.trim().length === 0 ) {
                    return;
                }

                const DEFAULT_MENU_ITEMS = [{
                    "label": "Dashboard",
                    "link": "content/typerefinery-showcase/pages/pages/dashboard",
                    "parentName": "",
                    "name": "dashboard",
                    "icon": "pi pi-inbox"
                  },
                  {
                    "label": "Search",
                    "link": "content/typerefinery-showcase/pages/pages/search",
                    "parentName": "dashboard",
                    "name": "search",
                    "icon": "pi pi-search"
                  },
                  {
                    "label": "Feeds",
                    "link": "content/typerefinery-showcase/pages/pages/feeds",
                    "parentName": "",
                    "name": "search",
                    "icon": "pi pi-book"
                  }
                ];
                let menuItems = DEFAULT_MENU_ITEMS;
                
                const sidebarContainer = document.getElementsByClassName('sidebar-container');
                if(sidebarContainer.length !== 0) {
                    const dataModel = JSON.parse(sidebarContainer[0].getAttribute('data-model') || '{}');
            
                    if(dataModel?.navigation?.menuItems?.length > 0) {
                        menuItems = dataModel?.navigation?.menuItems;
                    }
                }
                menuItems.forEach(menuItem => {
                    if(menuItem.label === selectedNodeName) {
                        window.location.href = `${window.location.origin}/${menuItem.link}.html`;
                        return;
                    }
                })
            }
        }
    });


    const vueComponents = [
        {
            name: "p-button",
            component: primevue.button
        },
        {
            name: "p-accordion",
            component: primevue.accordion
        },
        {
            name: "p-accordiontab",
            component: primevue.accordiontab
        },
        {
            name: "p-inputtext",
            component: primevue.inputtext
        },
        {
            name: "p-checkbox",
            component: primevue.checkbox
        },
        {
            name: "p-radiobutton",
            component: primevue.radiobutton
        },
        {
            name: "p-card",
            component: primevue.card
        },
        {
            name: "p-textarea",
            component: primevue.textarea
        },
        {
            name: "p-password",
            component: primevue.password
        },
        {
            name: "p-divider",
            component: primevue.divider
        },
        {
            name: "p-datatable",
            component: primevue.datatable
        },
        {
            name: "p-column",
            component: primevue.column
        },
        {
            name: "p-menubar",
            component: primevue.menubar
        },
        {
            name: "p-tree",
            component: primevue.tree
        },
        {
            name: "p-breadcrumb",
            component: primevue.breadcrumb
        }
    ]


    vueComponents.forEach(vueComponent => {
        vueApp.component(vueComponent.name, vueComponent.component);
    });


    const router = VueRouter.createRouter({
        history: VueRouter.createWebHashHistory(),
        routes: [{ path: "/" }]
    });

    vueApp.use(router).use(primevue.config.default).mount('#app');
});