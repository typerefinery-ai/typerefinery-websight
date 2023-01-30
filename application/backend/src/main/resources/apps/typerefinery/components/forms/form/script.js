function getFormData(form) {
    var formData = new FormData(form);

    // ...or output as an object
    return Object.fromEntries(formData);
}

const jsonRequest = (url, payload) => {
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    }).then((result) => {
        console.log(result, "result")
    }).catch((err) => {
        console.log(err, "err")
    });
}

const formRequest = (url, payload) => {
    const formData = new URLSearchParams();
    Object.entries(payload).map(item => {
        formData.append(item[0], item[1])
    })
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
    })
    .then((result) => { console.log(result); })
    .catch((err) => { console.log(err); })
}

const formHandler = (e) => {
    console.log("FormHandler")
    e.preventDefault();
    const jsonPayload = getFormData(e.target);

    const formType = e.target?.getAttribute("data-form-type");
    const url = e.target?.getAttribute("data-url");

    // JSON
    if (formType === "application/json") {
        jsonRequest(url, jsonPayload);
        return;
    }
    // FORM
    else if (formType === "application/x-www-form-urlencoded") {
        formRequest(url, jsonPayload);
    }
}


$(document).ready(function (e) {
    Array.from(document.querySelectorAll("#form")).forEach(component => {
        component.addEventListener("submit", formHandler)
    })
});
