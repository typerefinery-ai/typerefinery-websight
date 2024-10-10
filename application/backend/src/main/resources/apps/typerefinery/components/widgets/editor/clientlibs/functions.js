window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Editor = Typerefinery.Components.Widgets.Editor || {};
window.Typerefinery.Components.Widgets.Editor.Instances = Typerefinery.Components.Widgets.Editor.Instances || {};



(function ($, ns, componentNs, editorInstanceNs, document, window) {
    "use strict";

    ns.selectorComponent = '[component=editor]';

    ns.getCodeEditorTheme = (editor, theme) => {
        switch (editor) {
            case "MONACO":
                return theme === "light" ? "vs" : "vs-dark";
            case "CODEMIRROR":
                return theme === "light" ? "base16-light" : "base16-dark";
        }
    }

    ns.getDefaultCode = (language) => {
        // based on language create a hello world sample code.
        switch (language) {
            case "html":
                return "<!DOCTYPE html>\n<html>\n<head>\n<title>Page Title</title>\n</head>\n<body>\n\n<h1>This is a Heading</h1>\n<p>This is a paragraph.</p>\n\n</body>\n</html>";
            case "css":
                return "body {\n  background-color: lightblue;\n}\n\nh1 {\n  color: white;\n  text-align: center;\n}";
            case "javascript":
                return "console.log('Hello World')";
            case "json":
                return "{\n  \"firstName\": \"John\",\n  \"lastName\": \"Smith\",\n  \"age\": 25\n}";
            case "xml":
                return "<note>\n  <to>Tove</to>\n  <from>Jani</from>\n  <heading>Reminder</heading>\n  <body>Don't forget me this weekend!</body>\n</note>";
            case "php":
                return "<?php\n\necho \"Hello World!\";\n\n?>";
            case "python":
                return "print(\"Hello World\")";
            case "java":

                return "public class HelloWorld {\n  public static void main(String[] args) {\n    System.out.println(\"Hello World\");\n  }\n}";
            case "csharp":
                return "using System;\n\nnamespace HelloWorld\n{\n    class Hello \n    { \n        static void Main() \n        { \n            Console.WriteLine(\"Hello World!\");\n\n            // Keep the console window open in debug mode.\n            Console.WriteLine(\"Press any key to exit.\");\n            Console.ReadKey();\n        }\n    }\n}";
            case "cpp":
                return "#include <iostream>\n\nint main()\n{\n    std::cout << \"Hello World!\";\n}";
            case "ruby":
                return "puts 'Hello World'";
            case "go":
                return "package main\n\nimport \"fmt\"\n\nfunc main() {\n  fmt.Println(\"Hello World\")\n}";
            case "sql":
                return "SELECT * FROM Customers\nWHERE Country='Mexico';";
            case "markdown":
                return "# Hello World\n\nThis is a markdown example.";
            case "plaintext":
                return "Hello World";
            default:
                return "console.log('Hello World')";
        }
    };

    ns.createMonacoEditor = ($component, componentConfig) => {

        // const languages = ["html", "css", "javascript", "json", "xml", "php", "python", "java", "csharp", "cpp", "ruby", "go", "sql", "markdown", "plaintext"];

        // const themes = ["vs", "vs-dark", "hc-black"];
        // Monaco loader
        require.config({
            paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor/min/vs" }
        });

        // Monaco environment
        window.MonacoEnvironment = {
            getWorkerUrl: function (workerId, label) {
                return `
                    data:text/javascript;charset=utf-8,${encodeURIComponent(`
                        self.MonacoEnvironment = {
                            baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor/min/'
                        };
                    importScripts('https://cdn.jsdelivr.net/npm/monaco-editor/min/vs/base/worker/workerMain.js');
                    `)}
                `;
            }
        };


        // Monaco init and create editor
        require(["vs/editor/editor.main"], function () {
            editorInstanceNs[componentConfig.id] = monaco.editor.create($component, {
                value: ns.getDefaultCode(componentConfig.editorLanguage),
                mode: componentConfig.editorLanguage,
                minimap: { enabled: false },
                automaticLayout: true,
                contextmenu: false,
                fontSize: 14,
                theme: ns.getCodeEditorTheme(componentConfig.codeEditor, componentConfig.editorTheme),
                scrollbar: {
                    useShadows: true,
                    vertical: "visible",
                    horizontal: "visible",
                    horizontalScrollbarSize: 12,
                    verticalScrollbarSize: 12
                },
                lineNumbers: 'on'
            });
        });
    };



    ns.createCodeMirrorEditor = ($component, componentConfig) => {

        editorInstanceNs[componentConfig.id] = new CodeMirror(
            (node) => {                
                $component.replaceWith(node);
                node.setAttribute('id', componentConfig.id);
                node.setAttribute('component', 'editor');
                node.setAttribute('data-model', JSON.stringify(componentConfig));
                node.style.overflow = 'hidden';
            }, {
            value: ns.getDefaultCode(componentConfig.editorLanguage),
            lineNumbers: true,
            tabSize: 4,
            mode: componentConfig.editorLanguage,
            theme: ns.getCodeEditorTheme(componentConfig.codeEditor, componentConfig.editorTheme),
            styleActiveSelected: true,
            styleActiveLine: true,
            indentWithTabs: true,
            matchBrackets: true,
            highlightMatches: true
        });
    };


    ns.createCodeEditor = ($component, componentConfig) => {
        if (componentConfig.codeEditor === "CODEMIRROR") {
            ns.createCodeMirrorEditor($component, componentConfig);
        }
        else if (componentConfig.codeEditor === "MONACO") {
            ns.createMonacoEditor($component, componentConfig);
        }
    };


    ns.createTextEditor = ($component, componentConfig) => {
        editorInstanceNs[componentConfig.id] = new EditorJS({
            /**
             * Id of Element that should contain Editor instance
             */
            holder: componentConfig.id,
            placeholder: 'Let`s write an awesome story!',
            tools: {
                header: {
                    class: Header,
                    inlineToolbar : true
                  },
                list: List,
                linkTool: LinkTool,
                image: SimpleImage,
                embed: Embed,
                table: Table,
                quote: Quote,
                warning: Warning,
                marker: Marker,
                code: CodeTool,
                delimiter: Delimiter,
                raw: RawTool,
                checklist: Checklist
            },
        },

        );
    };

    // public methods to interact with the editor component instances
    ns.getValue = async function (id) {
      console.group('editor getValue');
      console.log('id', id);
      console.log('editorInstanceNs', editorInstanceNs);
      const editorObject = editorInstanceNs[id];
      console.log('editorObject', editorObject);
      let returnValue = "";
      if (editorObject) {
        if (editorObject instanceof CodeMirror) {
          console.log('CodeMirror getValue');
          // get value from codemirror editor
          returnValue = editorObject.getValue();
        } else if (Object.keys(editorObject).includes("save")) {
          console.log('save sync');
          returnValue = await editorObject.save().then((outputData) => {
            console.log('save getValueAsync', outputData);
            return outputData;
          });
        }
      }
      console.log('returnValue', returnValue);
      console.groupEnd();
      return returnValue;
    }

    ns.setEditorData = function (id, data) {
      console.group('editor setEditorData');
      console.log('id', id);
      console.log('data', data);
      console.log('editorInstanceNs', editorInstanceNs);
      const editorObject = editorInstanceNs[id];
      if (editorObject instanceof CodeMirror) {
          // set value to codemirror editor
          editorObject.setValue(data);
      } else if (Object.keys(editorObject).includes("render")) {
          editorObject.render(data);
      }
      console.log('returnValue', returnValue);
      console.groupEnd();
    }

    ns.init = ($component) => {

      console.groupCollapsed("Editor init");
      console.log($component);
      // parse json value from data-model attribute as component config
      const componentConfig = componentNs.getComponentConfig($component);

      console.log(componentConfig.variant);

      if (componentConfig.variant === "CODE_EDITOR") {
          ns.createCodeEditor($component, componentConfig);
      } else if (componentConfig.variant === "TEXT_EDITOR") {
          ns.createTextEditor($component, componentConfig);
      }
      console.groupEnd();

    }

})(jQuery, Typerefinery.Components.Widgets.Editor, Typerefinery.Components, Typerefinery.Components.Widgets.Editor.Instances, document, window);
