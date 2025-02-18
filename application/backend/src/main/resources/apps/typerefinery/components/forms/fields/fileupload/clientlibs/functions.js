window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
Typerefinery.Components.Forms.Fileupload = Typerefinery.Components.Forms.Fileupload || {};


(function ($, ns, componentNs, document, window) {

    "use strict";

    ns.selectorComponent = '[component=fileupload]';

    ns.customDragAndDrop = ($component, componentConfig) => {
        const componentId = `#${componentConfig.id}-${componentConfig.name}`;
        console.log('componentId', componentId);
        let $fileInput = $component.find(componentId);
        let $container = $component;
        let $error = $component.find("#error");
        let $imageDisplay = $component.find("#image-display");
        console.log('$fileInput', $fileInput);
        console.log('$container', $container);
        console.log('$error', $error);
        console.log('$imageDisplay', $imageDisplay);
        // close-icon handle click.
        $($component).on("click", ".close-icon", function () {
            if(this.id && this.id.split("close-").length >= 2){
              $component.find(`#figure-${this.id.split("close-")[1]}`).remove();
            }
        });

        const fileHandler = (file, name, type) => {
            type = type.split("/").legnth >= 2 ? type.split("/")[1] : type; 
            if (componentConfig.accept !== "*" && componentConfig.accept && !componentConfig.accept.includes(type)) {
                //File Type Error
                $error.innerText = "Please upload " + componentConfig.accept + " file type only";
                return false;
            }
            $error.innerText = "";
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                //image and file name
                let imageContainer = document.createElement("figure");
                name = name?.trim()?.replace(/\s/g, "-");
                imageContainer.setAttribute("id", `figure-${name}`);
                let img = document.createElement("img");
                img.src = reader.result;
                // append a close icon which has position absolute styling.
                let closeIcon = document.createElement("span");
                closeIcon.classList.add("close-icon");
                closeIcon.classList.add("pi");
                closeIcon.classList.add("pi-times");
                closeIcon.id = `close-${name}`;
                // closeIcon.innerHTML = "&#10006;";
                imageContainer.appendChild(closeIcon);

                // add loader icon which is display none.
                let loaderIcon = document.createElement("span");
                loaderIcon.classList.add("loader-icon");
                loaderIcon.classList.add("pi");
                loaderIcon.classList.add("pi-spin");
                loaderIcon.classList.add("pi-spinner");
                loaderIcon.id = `loader-${name}`;
                // loaderIcon.innerHTML = "&#128339;";
                imageContainer.appendChild(loaderIcon);

                imageContainer.appendChild(img);
                imageContainer.innerHTML += `<figcaption >${name}</figcaption>`;
                $imageDisplay.append($(imageContainer));
            };
        };
        $fileInput[0].addEventListener("change", (event) => {
            $imageDisplay.innerHTML = "";
            Array.from(event.target.files).forEach((file) => {
                fileHandler(file, file.name, file.type);
            });
        });
        $container[0].addEventListener(
            "dragenter",
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                $container.addClass("active");
            },
            false
        );
        $container[0].addEventListener(
            "dragleave",
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                $container.removeClass("active");
            },
            false
        );
        $container[0].addEventListener(
            "drop",
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                $container.removeClass("active");
                let draggedData = e.dataTransfer;
                let files = draggedData.files;
                $imageDisplay.innerHTML = "";
                Array.from(files).forEach((file) => {
                    fileHandler(file, file.name, file.type);
                });
            },
            false
        );
        window.onload = () => {
            $error.innerText = "";
        };
    }

    ns.init = ($component) => {
        console.groupCollapsed('Fileupload init');
        const componentConfig = componentNs.getComponentConfig($component);
        ns.customDragAndDrop($component, componentConfig);
        console.groupEnd();
    }
})(jQuery, Typerefinery.Components.Forms.Fileupload, Typerefinery.Components, document, window);