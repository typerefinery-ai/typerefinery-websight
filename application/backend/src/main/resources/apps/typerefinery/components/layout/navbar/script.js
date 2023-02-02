async function switchTheme() {
    const themeStyles = document.getElementById("themeStyles");
    if(themeStyles) {
        const currentTheme = style.getAttribute('active') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        style.setAttribute("active", newTheme)
        style.setAttribute("href", `/apps/typerefinery/web_root/${newTheme}.css`)
        await localStorage.setItem("theme", newTheme);
        setTimeout(() => {
            Object.entries(window.Typerefinery.Components.Graphs.Items).forEach(_ => {
                _[1]?.update();
            })
        }, [100])
    }
}