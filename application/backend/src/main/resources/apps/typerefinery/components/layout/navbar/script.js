async function switchTheme() {
    const themeStyles = document.getElementById("themeStyles");
    if(themeStyles) {
        const currentTheme = themeStyles.getAttribute('active') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        themeStyles.setAttribute("active", newTheme)
        themeStyles.setAttribute("href", `/apps/typerefinery/web_root/${newTheme}.css`)
        await localStorage.setItem("theme", newTheme);
        setTimeout(() => {
            Object.entries(window.Typerefinery.Components.Graphs.Items).forEach(_ => {
                _[1]?.update();
            })
        }, [100])
    }
}