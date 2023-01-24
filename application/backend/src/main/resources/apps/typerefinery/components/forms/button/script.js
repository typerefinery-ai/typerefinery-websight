$(document).ready(function (e) {
    Array.from(document.querySelectorAll("#button")).forEach(component => {
        var componentDataPath = component.getAttribute("data-path");
        component.setAttribute("id", componentDataPath);
        
        const buttonType = component.getAttribute("data-type");
        if(buttonType === "submit") {
            return;
        }
        component.addEventListener("click", function (e) {
            e.preventDefault();

            if(buttonType === "button") {
                const url = component.getAttribute("data-redirection-url");
                if(url) {
                    window.location.href = url;
    
                    // To open in new tab.
                    // window.open(url)
                }
            }else if(buttonType === "reset") {
                const inputFields = e.target?.parentElement?.parentElement?.parentElement?.getElementsByTagName("input")
                Array.from(inputFields)?.forEach(fieldInput => {
                    fieldInput.value = "";
                })
            }
        })
    })
});