function updatePageCounter() {
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        const pageNumber = activePage.id.replace('page', '');
        document.getElementById('page-counter').innerHTML = `<span style="color: #ffae42">${pageNumber}</span> / 25`;
    }
}

setInterval(updatePageCounter, 100);
document.addEventListener('DOMContentLoaded', updatePageCounter);