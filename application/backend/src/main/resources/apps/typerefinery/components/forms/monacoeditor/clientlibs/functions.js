window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.MonacoEditor = Typerefinery.Components.Forms.MonacoEditor || {};


(function (ns, componentNs, document, window) {
    "use strict";

    ns.createEditor = (editorContainer) => {
        monaco.editor.create(editorContainer, {
            value: "<div style=background-color:blue;>Hello World</div>",
            language: "html",
            minimap: { enabled: false },
            automaticLayout: true,
            contextmenu: false,
            fontSize: 14,
            scrollbar: {
                useShadows: true,
                vertical: "visible",
                horizontal: "visible",
                horizontalScrollbarSize: 12,
                verticalScrollbarSize: 12
            }
        });
    }

    ns.init = ($component) => {
        // parse json value from data-model attribute as component config
        const componentConfig = componentNs.getComponentConfig($component);

        console.log(componentConfig, "HELLO WORLD")

        // Monaco loader
        require.config({
            paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor/min/vs" }
        });

        window.MonacoEnvironment = {
            getWorkerUrl: function (workerId, label) {
                return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                    self.MonacoEnvironment = {
                    baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor/min/'
                    };
                    importScripts('https://cdn.jsdelivr.net/npm/monaco-editor/min/vs/base/worker/workerMain.js');`)}`;
            }
        };

        // Monaco init
        require(["vs/editor/editor.main"], function () {
            ns.createEditor(document.getElementById(componentConfig.id));
        });
    }

})(Typerefinery.Components.Forms.MonacoEditor, Typerefinery.Components, document, window);
