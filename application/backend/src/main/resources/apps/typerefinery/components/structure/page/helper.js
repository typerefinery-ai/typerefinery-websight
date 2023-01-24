
window.Typerefinery.Components = {
    getComponentData: function() {
        return {
            ...window.Typerefinery.Components.Forms.CheckBox.getData(),
            ...window.Typerefinery.Components.Forms.RadioButton.getData(),
            ...window.Typerefinery.Components.Common.BreadCrumbs.getData(),
            ...window.Typerefinery.Components.Content.DataTable.getData(),
            ...window.Typerefinery.Components.Structure.Sidebar.getData()
        }
    },
    Forms: {
        CheckBox: {},
        RadioButton: {}
    },
    Common: {
        BreadCrumbs: {}
    },
    Content: {
        DataTable: {}
    },
    Structure: {
        Sidebar: {}
    }
};

let rootEle = document.querySelector(':root');
window.rootEleStyle = getComputedStyle(rootEle);
const currentTheme = localStorage.getItem('theme');
const style = document.getElementById("themeStyles");
    
if(!currentTheme) {
    localStorage.setItem("theme", "dark");
}

if(currentTheme === 'light') {
    style.setAttribute("active", "light");
}else{
    style.setAttribute("active", "dark");
    style.setAttribute("href", `/apps/typerefinery/web_root/dark.css`);
}