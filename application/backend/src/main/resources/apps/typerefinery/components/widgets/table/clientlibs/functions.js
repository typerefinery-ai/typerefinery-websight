window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Table = Typerefinery.Components.Widgets.Table || {};


; (function (ns, componentNs, window, document) {
    "use strict";


    ns.init = () => {
        console.log("[Table - functions.js] - Table Component");
        const data = {
            tableValues: [
                { serial: "1", name: "Report 1", description: "Penquins.", status: "RiskIQ", date: "12 Jan, 2021"},
                { serial: "2", name: "Report 2", description: "DiskKill", status: "RiskIQ", date: "14 Dec, 2022"},
                { serial: "3", name: "Report 3", description: "Malware", status: "RiskIQ", date: "21 Dec, 2018"},
                { serial: "4", name: "Report 4", description: "UNC1151", status: "RiskIQ", date: "21 Dec, 2019"},
                { serial: "5", name: "Report 5", description: "HermetricWiper", status: "AlienVault", date: "05 Jun, 2017"},
                { serial: "6", name: "Report 6", description: "UNC1151", status: "AlienVault", date: "01 Jun, 2020"},
                { serial: "7", name: "Report 7", description: "Malware", status: "RiskIQ", date: "03 Jun, 2017"}
            ],
            tableHeader: [
                { field: 'serial', header: 'Sr. No.' },
                { field: 'name', header: 'Type' },
                { field: 'description', header: 'Description' },
                { field: 'date', header: 'Date' }
            ]
        }
        componentNs.registerComponent(data);
    }

})(window.Typerefinery.Components.Widgets.Table, window.Typerefinery.Components, window, document);
