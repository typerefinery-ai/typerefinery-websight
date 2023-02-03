$(document).ready(() => {
    const vueApp = Vue.createApp({
        data() {
            return window.Typerefinery.VueData.data;
        },
        methods: {
            onSidebarItemClicked(e) {
                const selectedNodeName = e.target.innerText || "";
                if (selectedNodeName.trim().length === 0) {
                    return;
                }
                const dataTree = JSON.parse(document.getElementById("sidebar").getAttribute("data-tree"))

                function fetchMenuItemHelper(obj) {
                    for (const keyItr in obj) {
                        if (keyItr === "jcr:content") {
                            continue;
                        }
                        const _obj = obj[keyItr];

                        if (_obj["jcr:content"].title === selectedNodeName) {
                            window.location.href = `${window.location.origin}/${_obj["jcr:content"].key}.html`;
                            return;
                        }
                        fetchMenuItemHelper(_obj)
                    }
                }
                for (const key1 in dataTree) {
                    fetchMenuItemHelper(dataTree[key1]);
                    // Only this loops runs for one time.
                    break;
                }
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