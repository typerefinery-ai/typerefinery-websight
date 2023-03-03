window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Button = Typerefinery.Components.Forms.Button || {};

(function (ns, componentNs, document, window) {
    ns.addEventListener = (id) => {
        $(document).on("click", `#${id}`, (e) => {
            e.preventDefault();
            const componentConfig = componentNs.getComponentConfig(e.currentTarget);
            let { buttonType, url, openInNewTab, actionType } = componentConfig;

            if(buttonType === "navigate") {
                if(url) {
                    if(!url.endsWith(".html")) {
                        url += ".html";
                    }
                    
                    if(openInNewTab) {
                        window.open(url);
                        return;
                    }
                    window.location.href = url;
                }
            }
        });
    }
    ns.createModal = ($component,componentConfig) =>{

        const modalId = "id" + Math.random().toString(16).slice(2)

        $component.setAttribute("data-bs-toggle","modal");
        $component.setAttribute("type","button");
        $component.setAttribute("data-bs-target",`#${modalId}`);

        const modalContainer = document.createElement("div");

        modalContainer.setAttribute("class","modal fade")
        modalContainer.setAttribute("id",modalId)

        const modalUrlPrefix = window.location.origin

        $(document).on("click", "#maximumWidth", function() {
            const normalWidthEvent = document.getElementById("normalWidth")
            const modalWindowIcon = $('.icon');
            $(normalWidthEvent).toggleClass("modal-fullscreen");
            modalWindowIcon.toggleClass('bi bi-fullscreen bi bi-fullscreen-exit')
          });

          $(document).on("click", "#modelSubmitHandler", function() {
            const modalIFrameDOM = document.getElementById('modalIframe').contentDocument
            const modalIframForm = modalIFrameDOM.getElementsByTagName('form')
            modalIframForm[0].requestSubmit()
          });

        modalContainer.innerHTML = (`
            <div class="modal-dialog modal-lg" id="normalWidth">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${componentConfig.actionModalTitle}</h5>
                        <button type="button" class="maxbutton" id="maximumWidth"><i class="icon bi bi-fullscreen"></i></button>
                        <button type="button" id="closeButton" data-bs-dismiss="modal"><i class="bi bi-x-lg"></i></button>
                    </div>
                    <div class="modal-body">
                        <iframe id="modalIframe" src="${modalUrlPrefix}${componentConfig.actionUrl}" class="iframeClassName"></iframe>
                    </div>
                        ${componentConfig.displayModalFooter === false ? "": `
                    <div class="modal-footer" >
                        <button type="button" id="modelSubmitHandler" class="btn btn-primary">Save Changes</button>
                    </div>`}
                </div>
            </div>`)
        document.body.appendChild(modalContainer);
        
    }
    ns.init = ($component) => {

        const componentConfig = componentNs.getComponentConfig($component);
        const { buttonType, id, url, actionType} = componentConfig;

        if(buttonType === "submit") {
            return;
        }
        else if(buttonType === "action"){
            ns.createModal($component,componentConfig)
            
        }
        ns.addEventListener(id);

        // $component.addEventListener("click", function (e) {
        //     e.preventDefault();
        //     if(buttonType === "button") {
        //         if(url) {
        //             window.location.href = url;
    
        //             // To open in new tab.
        //             // window.open(url)
        //         }
        //     }else if(buttonType === "reset") {
        //         const inputFields = e.target?.parentElement?.parentElement?.parentElement?.getElementsByTagName("input")
        //         Array.from(inputFields)?.forEach(fieldInput => {
        //             fieldInput.value = "";
        //         })
        //     }
        // })
    }
})(Typerefinery.Components.Forms.Button, Typerefinery.Components, document, window);
