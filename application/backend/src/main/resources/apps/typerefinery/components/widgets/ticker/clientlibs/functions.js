//this is the namespace for the functions for this component
window.Typerefinery.Components.Widgets.Ticker = {}
    ; (function (ns, window, document) {
        console.log('INIT Function')
        function init() {
            ns.updateComponentHTML = (data, $component) => {
                const componentConfig = getComponentConfig($component);
                console.log("updateComponentHTML", data, $component, componentConfig)
                const innerHTML = `
                    <div class="body">
                        <div class="title">${data.title || componentConfig.title}</div>
                        <div class="content">
                            <div class="value">
                                ${data.value || componentConfig.value}
                            </div>
                            <div class="indicator">
                                <div class="icon pi pi-arrow-${data.indicatorType || componentConfig.indicatorType} ${data.indicatorType || componentConfig.indicatorType}"></div>
                                <div class="icon pi pi-minus ${data.indicatorType || componentConfig.indicatorType}"></div>
                                <div class="indicator_value">
                                    <span>${data.indicatorValue || componentConfig.indicatorValue}</span>
                                    <span class="hours">${data.indicatorValuePrecision || componentConfig.indicatorValuePrecision}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="icon ${data.icon || componentConfig.icon}"></div>
                `;
                $component.innerHTML = innerHTML;
            }


            ns.jsonDataConnected = async (dataSourceURL, $component) => {
                try{
                    const response = await fetch(dataSourceURL).then((res) => res.json());
                    if(response) {
                        ns.updateComponentHTML(response, $component);
                        return;
                    }
                    ns.modelDataConnected($component);
                }
                catch(error) {
                    ns.modelDataConnected($component);
                }
            }

            ns.tmsConnected = async (host, topic, $component) => {
                try{
                    host = !host && "ws://localhost:8112";
                    if(!topic) {
                        ns.modelDataConnected($component);
                        return;
                    }
                    const componentData = localStorage.getItem(`${topic}`);
                    if(!componentData) {
                        ns.modelDataConnected($component);
                        return;
                    }
                    ns.updateComponentHTML(JSON.parse(componentData), $component);
                }
                catch(error) {
                    ns.modelDataConnected($component);
                }
            }

            ns.modelDataConnected = ($component) => {
                // Passing {} because, The values from the model obj are fetched in bellow function definition.
                ns.updateComponentHTML({}, $component);
            }
        }

        init();
    })(window.Typerefinery.Components.Widgets.Ticker, window, document);
