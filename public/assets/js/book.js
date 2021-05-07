const slider = document.getElementById('slider');
const body = document.querySelector('body');
const openChapters = document.getElementById('openChapters');
const tbl = document.querySelector('.tbl');


openChapters.addEventListener('click', () => {
    tbl.classList.toggle('active');
})

let bgC = 255;
slider.addEventListener('input', (e) => {
    bgC = e.target.value;
    body.style.backgroundColor = `rgb(${bgC}, ${bgC}, ${bgC})`;
});

const slider2 = document.getElementById('slider2');

let bgC2 = 0;
slider2.addEventListener('input', (e) => {
    bgC2 = e.target.value;
    body.style.color = `rgb(${bgC2}, ${bgC2}, ${bgC2})`;
});