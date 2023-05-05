window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
Typerefinery.Components.Forms.Fileupload = Typerefinery.Components.Forms.Fileupload || {};


(function (ns, componentNs, document, window) {

    "use strict";

    ns.customDragAndDrop = ($component, componentConfig) => {
        // }
        let uploadButton = document.getElementById(`${componentConfig.id}-${componentConfig.name}`);
        let container = $component;
        let error = document.getElementById("error");
        let imageDisplay = document.getElementById("image-display");
        // close-icon handle click.
        $(document).on("click", ".close-icon", function () {
            if(this.id && this.id.split("-").length >= 2){
                document.getElementById(`figure-${this.id.split("-")[1]}`).remove();
            }
        });

        const fileHandler = (file, name, type) => {
            type = type.split("/").legnth >= 2 ? type.split("/")[1] : type; 
            if (componentConfig.accept !== "*" && componentConfig.accept && !componentConfig.accept.includes(type)) {
                //File Type Error
                error.innerText = "Please upload " + componentConfig.accept + " file type only";
                return false;
            }
            error.innerText = "";
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
                imageDisplay.appendChild(imageContainer);
            };
        };
        uploadButton.addEventListener("change", () => {
            imageDisplay.innerHTML = "";
            Array.from(uploadButton.files).forEach((file) => {
                fileHandler(file, file.name, file.type);
            });
        });
        container.addEventListener(
            "dragenter",
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                container.classList.add("active");
            },
            false
        );
        container.addEventListener(
            "dragleave",
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                container.classList.remove("active");
            },
            false
        );
        container.addEventListener(
            "drop",
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                container.classList.remove("active");
                let draggedData = e.dataTransfer;
                let files = draggedData.files;
                imageDisplay.innerHTML = "";
                Array.from(files).forEach((file) => {
                    fileHandler(file, file.name, file.type);
                });
            },
            false
        );
        window.onload = () => {
            error.innerText = "";
        };
    }

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        $component = document.getElementById(componentConfig.id);
        ns.customDragAndDrop($component, componentConfig);
    }
})(Typerefinery.Components.Forms.Fileupload, Typerefinery.Components, document, window);