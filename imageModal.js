const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("imageModalElement");
const captionText = document.getElementById("caption");

function modalImage(target) {
    const classes = target.className;

    if (classes.includes('modalImage')) {
        console.log(target);

        modal.style.display = "block";
        modalImg.src = target.src;
        captionText.innerHTML = target.alt;
    }
}

document.addEventListener('click', (event) => {
    modalImage(event.target);
})

const span = document.querySelector(".modal .close");
span.onclick = function () {
    modal.style.display = "none";
}