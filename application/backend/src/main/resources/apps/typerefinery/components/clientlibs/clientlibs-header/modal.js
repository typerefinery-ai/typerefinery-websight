window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Modal = Typerefinery.Modal || {};

; (function (ns, document, window) {

    // Inner HTML for the modal window.
    ns.getModalInnerHTML = (modalTitle, iframeURL, hideFooter) => {
        return `
            <div class="modal-dialog modal-lg" id="modalView">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${modalTitle}</h5>
                        <button type="button" class="maximizeButtonInModal" id="maximizeModal">
                            <i class="icon pi pi-window-maximize"></i>
                        </button>
                        <button type="button" class="closeButtonInModal" data-bs-dismiss="modal">
                            <i class="pi pi-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="loader" id="loader">
                            <div class="loader__figure"></div>
                            <p class="text-center">Loading...</p>
                        </div>
                        <iframe id="modalIframe" src="${iframeURL}" class="iframeClassName"></iframe>
                    </div>
                        ${hideFooter === true ? 
                                "" 
                            : 
                            `
                                <div class="modal-footer" >
                                    <button type="button" id="submitHandlerInModal" class="btn btn-primary">Save Changes</button>
                                </div>
                            `
                        }
                </div>
            </div>
        `;
    };

    ns.submitListenerForModal = (newModalDivContainer) => {
        $(newModalDivContainer).on("click", "#submitHandlerInModal", function () {
            const $iframeDocument = document.getElementById('modalIframe').contentDocument;
            const forms = $iframeDocument.getElementsByTagName('form');

            if(forms.length > 0) {
                // Trigger the modal iframe submit event of the form element.
                forms[0].requestSubmit();
            }
        });
    };

    ns.expandModalListener = (newModalDivContainer) => {
        
        $(newModalDivContainer).on("click", "#maximizeModal", function () {
            const modalViewEvent = document.getElementById("modalView")
            const modalWindowIcon = $('.icon');
            $(modalViewEvent).toggleClass("modal-fullscreen");
            modalWindowIcon.toggleClass('pi pi-window-maximize pi pi-window-minimize');
        });
    };

    ns.iframeLoaded = (iframe, callback) => {
        let state = iframe.contentDocument.readyState;
        let checkLoad = setInterval(() => {
            if (state !== iframe.contentDocument.readyState) {
                if (iframe.contentDocument.readyState === 'complete') {
                    clearInterval(checkLoad);
                    callback();
                }
                state = iframe.contentDocument.readyState;
            }
        }, 200)
    }

    ns.removeLoaderOnModalLoad = () => {
        const iframeList = document.querySelectorAll('#modalIframe');
        iframeList.forEach(iframe => {
            ns.iframeLoaded(iframe, () => {
                $("#loader").hide();
            });
        })

    };
    



    ns.init = ($component, componentConfig) => {


        // Modal Container with default Attributes
        const newModalDivContainer = document.createElement("div");
        const randIdForModal = Math.random().toString(16).slice(2);
        newModalDivContainer.setAttribute("class", "modal fade");
        newModalDivContainer.setAttribute("id", randIdForModal);

        // Updating the component with Bootstrap Attributes.
        $component.setAttribute("data-bs-toggle", "modal");
        $component.setAttribute("type", "button");
        $component.setAttribute("data-bs-target", `#${randIdForModal}`);

        // invoke remove  loader on modal load when a modal is opened.
        $component.addEventListener("click", ns.removeLoaderOnModalLoad);
        

        const ORIGIN = window.location.origin;

        const { actionModalTitle, hideFooter, actionUrl } = componentConfig;

        newModalDivContainer.innerHTML = ns.getModalInnerHTML(actionModalTitle, `${ORIGIN}${actionUrl}`, hideFooter);

        document.body.appendChild(newModalDivContainer);

        ns.expandModalListener(newModalDivContainer);

        ns.submitListenerForModal(newModalDivContainer);

        // on modal close show the loader.
        $(newModalDivContainer).on("hidden.bs.modal", function () {
            $("#loader").show();
        });

    };
})(Typerefinery.Modal, document, window);