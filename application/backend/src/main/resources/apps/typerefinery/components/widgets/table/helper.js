window.Typerefinery.Components.Content.Table = {
    getData: function () {
        let data = {
            
            defaultValues: [
                { serial: "1", name: "Report 1", description: "Penquins.", status: "RiskIQ", date: "12 Jan, 2021", color: "TLP-WHITE" },
                { serial: "2", name: "Report 2", description: "DiskKill", status: "RiskIQ", date: "14 Dec, 2022", color: "TLP-WHITE" },
                { serial: "3", name: "Report 3", description: "Malware", status: "RiskIQ", date: "21 Dec, 2018", color: "TLP-WHITE", },
                { serial: "4", name: "Report 4", description: "UNC1151", status: "RiskIQ", date: "21 Dec, 2019", color: "TLP-WHITE", },
                { serial: "5", name: "Report 5", description: "HermetricWiper", status: "AlienVault", date: "05 Jun, 2017", color: "TLP-WHITE", },
                { serial: "6", name: "Report 6", description: "UNC1151", status: "AlienVault", date: "01 Jun, 2020", color: "TLP-WHITE", },
                { serial: "7", name: "Report 7", description: "Malware", status: "RiskIQ", date: "03 Jun, 2017", color: "TLP-WHITE", },
                { serial: "8", name: "Report 8", description: "DiskKill", status: "RiskIQ", date: "05 Jun, 2018", color: "TLP-WHITE", },
            ],
            defaultHeaders: [
                { field: 'serial', header: 'Sr. No.' },
                { field: 'name', header: 'Type' },
                { field: 'description', header: 'Description' },
                { field: 'date', header: 'Date' }
            ]
        };
        return data;
    }
}