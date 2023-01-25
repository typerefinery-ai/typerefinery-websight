const rootEle = document.querySelector(':root');
window.rootEleStyle = getComputedStyle(rootEle);
const currentTheme = localStorage.getItem('theme');
const style = document.getElementById('themeStyles');

if (!currentTheme) {
    localStorage.setItem('theme', 'dark');
}

if (currentTheme === 'light') {
    style.setAttribute('active', 'light');
} else {
    style.setAttribute('active', 'dark');
    style.setAttribute('href', `/apps/typerefinery/web_root/dark.css`);
}

setTimeout(() => {
    const host = "ws://localhost:8112/$tms";
    function payload_insert(data) {
        console.log("payload_insert", data);
    }

    // connect to websocket
    window.MessageService.Client.connect(host, function () {
        console.log("tms connected cms.");
        window.MessageService.Client.subscribe("payload_insert", payload_insert);
    });

    window.addEventListener(
        window.MessageService.Client.events.MESSAGE,
        function (message) {
          const messageData = message?.detail?.data?.payload;
          console.log("--------------------------MESSAGE RECEIVED------------------------")
          console.log(messageData);
        }
      );
}, 5000)