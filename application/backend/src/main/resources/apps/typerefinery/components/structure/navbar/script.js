async function switchTheme() {
    const style = document.getElementById("themeStyles");
    if(style) {
        const currentTheme = style.getAttribute('active') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        style.setAttribute("active", newTheme)
        style.setAttribute("href", `/apps/typerefinery/web_root/${newTheme}.css`)
        await localStorage.setItem("theme", newTheme);
        window.location.reload();
    }
}