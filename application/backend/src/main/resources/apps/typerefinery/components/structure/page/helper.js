
window.Typerefinery.Components = {
    getComponentData: function() {
        return {
            ...window.Typerefinery.Components.Forms.CheckBox.getData(),
            ...window.Typerefinery.Components.Forms.RadioButton.getData(),
        }
    },
    Forms: {
        CheckBox: {},
        RadioButton: {}
    }
};