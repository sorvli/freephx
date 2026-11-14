window.addEventListener('load', () => {
    const loader = document.getElementById('loader');

    setTimeout(() => {
        loader.classList.add('hidden');

        setTimeout(() => {
            loader.remove();
        }, 700);
    }, 400);
});

function toggleMenu() {
    document.querySelector(".nav-links").classList.toggle("show");
}