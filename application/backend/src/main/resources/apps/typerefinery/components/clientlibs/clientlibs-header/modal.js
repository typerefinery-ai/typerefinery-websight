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
    }

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

        const ORIGIN = window.location.origin;

        const { actionModalTitle, hideFooter, actionUrl } = componentConfig;

        newModalDivContainer.innerHTML = ns.getModalInnerHTML(actionModalTitle, `${ORIGIN}${actionUrl}`, hideFooter);

        document.body.appendChild(newModalDivContainer);

        
        $(newModalDivContainer).on("click", "#maximizeModal", function () {
            const modalViewEvent = document.getElementById("modalView")
            const modalWindowIcon = $('.icon');
            $(modalViewEvent).toggleClass("modal-fullscreen");
            modalWindowIcon.toggleClass('pi pi-window-maximize pi pi-window-minimize');
        });

        $(newModalDivContainer).on("click", "#submitHandlerInModal", function () {
            const $iframeDocument = document.getElementById('modalIframe').contentDocument;
            const forms = $iframeDocument.getElementsByTagName('form');

            if(forms.length > 0) {
                // Trigger the modal iframe submit event of the form element.
                forms[0].requestSubmit();
            }
        });

    };
})(Typerefinery.Modal, document, window);