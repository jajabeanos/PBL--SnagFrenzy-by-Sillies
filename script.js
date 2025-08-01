// Loading screen function
function startLoading() {
    document.querySelector(".loading-progress").style.width = "100%";
    setTimeout(() => {
        document.getElementById("loadingScreen").style.display = "none";
        document.getElementById("mainContent").style.display = "block";
    }, 3000);
}

// Show game page when "Play Now" is clicked
function showGame() {
    document.getElementById("homepage").style.display = "none";
    document.getElementById("gamePage").style.display = "block";
}

// Open Pop-up
function openPopup(popupId) {
    document.getElementById(popupId).style.display = "block";
}

// Close Pop-up
function closePopup(popupId) {
    document.getElementById(popupId).style.display = "none";
}

// Start loading animation on page load
window.onload = startLoading;
