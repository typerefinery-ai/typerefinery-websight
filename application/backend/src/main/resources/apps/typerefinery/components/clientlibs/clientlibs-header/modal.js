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
            const id = newModalDivContainer.getAttribute("id");
            let modalViewEvent = document.getElementById(id);
            modalViewEvent = modalViewEvent.getElementsByClassName('modal-dialog');
            if(modalViewEvent.length === 0) {
                return;
            }
            modalViewEvent = modalViewEvent[0];
            
            let modalWindowIcon = modalViewEvent.getElementsByClassName("icon");
            if(modalWindowIcon.length === 0) {
                modalViewEvent.classList.toggle('modal-fullscreen');
                return;
            }
            modalWindowIcon = modalWindowIcon[0];
            modalViewEvent.classList.toggle('modal-fullscreen');
            modalWindowIcon.classList.toggle('pi-window-maximize');
            modalWindowIcon.classList.toggle('pi-window-minimize');
        });
    };

    ns.iframeLoaded = (iframe, callback) => {
        let state = iframe?.contentDocument?.readyState || null;
        if(!state || state === 'complete') {
            callback();
            return;
        }
        let checkLoad = setInterval(() => {
            if (state !== iframe.contentDocument?.readyState) {
                if (iframe?.contentDocument?.readyState === 'complete') {
                    clearInterval(checkLoad);
                    callback();
                }
                state = iframe.contentDocument?.readyState;
            }
        }, 200);
    }

    ns.removeLoaderOnModalLoad = () => {
        const iframeList = document.querySelectorAll('#modalIframe');
        const lastIndex = iframeList.length - 1;
        if(lastIndex < 0) {
            return;
        }
        
        ns.iframeLoaded(iframeList[lastIndex], () => {
            // hide the loader.
            setTimeout(() => {
                const loaders = document.querySelectorAll('#loader');
                loaders.forEach(loader => {
                    loader.style.display = 'none';
                });
            }, 2500);
        });

    };

    ns.isParentView = () => {
        // check if this is from iframe or not.
        return window.self === window.top;
        
    }

    ns.isUpdateModalAvailable = false;

    ns.iframeEventListener = () => {
        window.document.addEventListener("showModal", function (event) {
            console.log('-----------event.detail-----------', event.detail);
            const { modalTitle, iframeURL, hideFooter } = event.detail;
    
            ns.createModalAndOpen(modalTitle, iframeURL, hideFooter);
        }, false);
    }

    ns.initCommonModal = () => {
        // check if this is from iframe or not.
        const isParentView = ns.isParentView(); 

        // if this is not a parent view then return.
        if(!isParentView) {
            console.log("This is not a parent view");
            return;
        }

        // This is the Iframe Event Listener.
        ns.iframeEventListener();
        
        // This is the parent view event listener.
        ns.isUpdateModalAvailable = true;
        const modalDivContainer = document.createElement("div");
        const id = '__common_modal__';
        modalDivContainer.setAttribute("class", "modal fade");
        modalDivContainer.setAttribute("id", `${id}`);
        modalDivContainer.innerHTML = ns.getModalInnerHTML("Modal", "", false);
        document.body.appendChild(modalDivContainer);
        ns.expandModalListener(modalDivContainer);
        ns.submitListenerForModal(modalDivContainer);
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

    ns.updateCommonModalAndOpen = (modalTitle, iframeURL, hideFooter) => {
        const modalDivContainer = document.getElementById('__common_modal__');
        modalDivContainer.innerHTML = ns.getModalInnerHTML(modalTitle, iframeURL, hideFooter);
        $("#loader").show();
        const modal = new bootstrap.Modal(modalDivContainer);
        modal.show();

        // invoke remove  loader on modal load when a modal is opened.
        ns.removeLoaderOnModalLoad();
    };

    ns.createModalAndOpen = (modalTitle, iframeURL, hideFooter) => {
        if(ns.isUpdateModalAvailable === false) {
            // dispatch parent
            const event = new CustomEvent('showModal', { detail: { modalTitle, iframeURL, hideFooter } });
            window.parent.document.dispatchEvent(event);

            return;
        }
        const modalDivContainer = document.createElement("div");
        const randIdForModal = Math.random().toString(16).slice(2);
        modalDivContainer.setAttribute("class", "modal fade modal-default");
        modalDivContainer.setAttribute("id", randIdForModal);
        modalDivContainer.innerHTML = ns.getModalInnerHTML(modalTitle, iframeURL, hideFooter);
        document.body.appendChild(modalDivContainer);
        ns.expandModalListener(modalDivContainer);
        ns.submitListenerForModal(modalDivContainer);
        

        const modal = new bootstrap.Modal(modalDivContainer);
        modal.show();

        // invoke remove  loader on modal load when a modal is opened.
        ns.removeLoaderOnModalLoad();
    };

    // A common modals for all the components.
    ns.initCommonModal();
})(Typerefinery.Modal, document, window);