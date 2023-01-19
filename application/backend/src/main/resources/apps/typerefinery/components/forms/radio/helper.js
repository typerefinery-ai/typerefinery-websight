window.Typerefinery.Components.Forms.RadioButton = {
    getData: function() {
        let data = {};
        console.log("document.querySelectorAll", document.querySelectorAll('[data-module="vue-radioButton"]'))
        document.querySelectorAll('[data-module="vue-radioButton"]').forEach(_ => {
            let modelName = _.getAttribute("name");
            modelName.trim();
            _.setAttribute("v-model", modelName);
            data[modelName] = "";
        });
        return data;
    }
}