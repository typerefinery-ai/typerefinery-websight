function getFormData(form) {
    var formData = new FormData(form);

    // ...or output as an object
    return Object.fromEntries(formData);
}

$(document).ready(function (e) {
    Array.from(document.querySelectorAll("#form")).forEach(component => {
        component.addEventListener("submit", function (e) {
            e.preventDefault();
            // e.target.map(item => console.log(item))
            // e.target.querySelectorAll('input').forEach(item => {
            //     console.log(item, item.name, item.value)
            // })
            console.log(getFormData(e.target));
        })
    })
});
