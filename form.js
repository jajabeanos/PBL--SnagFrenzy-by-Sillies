document.addEventListener("DOMContentLoaded", function () {
    // form elements
    const plushForm = document.getElementById("plushForm");
    const previewButton = document.getElementById("previewButton");
    const previewSection = document.getElementById("previewSection");
    const plushPreview = document.getElementById("plushPreview");
    const previewName = document.getElementById("previewName");
    const previewRarity = document.getElementById("previewRarity");
    const successMessage = document.getElementById("successMessage");
    const submitAnotherButton = document.getElementById("submitAnother");
    const fileInput = document.getElementById("plushImage");

    // preview plush functionality
    previewButton.addEventListener("click", function () {
        const plushName = document.getElementById("plushName").value;
        let plushImageFile = null;
        const rarityElements = document.getElementsByName("plushRarity");
        let selectedRarity = "";

        // check if any img has been added to plushImage 
        if (fileInput.files && fileInput.files[0]) {
            plushImageFile = fileInput.files[0];
        }

        for (const radio of rarityElements) {
            if (radio.checked) {
                selectedRarity = radio.value;
                break;
            }
        }

        // Validate required fields
        if (!plushName) {
            alert("Please enter a name for your plush!");
            return;
        }

        if (!selectedRarity) {
            alert("Please select a rarity for your plush!");
            return;
        }

        if (!plushImageFile) {
            alert("Please upload an image for your plush!");
            return;
        }

        // verify file type (SVG or PNG only)
        const validTypes = ['image/svg+xml', 'image/png'];
        if (!validTypes.includes(plushImageFile.type)) {
            alert("Only SVG or PNG files are accepted!");
            return;
        }

        // format rarity name for display
        let displayRarity = selectedRarity;
        if (selectedRarity === "ultraRare") {
            displayRarity = "Ultra Rare";
        } else {
            displayRarity = selectedRarity.charAt(0).toUpperCase() + selectedRarity.slice(1);
        }

        // update preview
        previewName.textContent = plushName;
        previewRarity.textContent = displayRarity;
        previewRarity.className = selectedRarity;

        // update preview image after we get the img file
        previewPlushImage(plushImageFile);

        // show preview 
        previewSection.classList.remove("hidden");
    });

    // function to preview the uploaded image
    function previewPlushImage(file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            plushPreview.innerHTML = "";
            const img = document.createElement("img");
            img.src = e.target.result;
            img.alt = "Plush Preview";
            img.style.maxWidth = "100%";
            img.style.maxHeight = "100%";
            plushPreview.appendChild(img);
        };

        // text if theres something wrong with getting the plushImage
        reader.onerror = function () {
            plushPreview.innerHTML = "<div class='preview-placeholder'>Error loading image. Please try again.</div>";
        };

        reader.readAsDataURL(file);
    }

    // submission
    plushForm.addEventListener("submit", function (e) {
        e.preventDefault();

        // set/get form values
        const plushName = document.getElementById("plushName").value;
        const submitterName = document.getElementById("name").value;
        const submitterEmail = document.getElementById("email").value;
        const description = document.getElementById("message").value;
        let selectedRarity = "";
        let plushImageFile = null;

        // check if file is selected
        if (fileInput.files && fileInput.files[0]) {
            plushImageFile = fileInput.files[0];
        }

        // get selected rarity value
        const rarityElements = document.getElementsByName("plushRarity");
        for (const radio of rarityElements) {
            if (radio.checked) {
                selectedRarity = radio.value;
                break;
            }
        }

        // validate required fields
        if (!plushName || !selectedRarity || !plushImageFile) {
            alert("Please fill in all required fields!");
            return;
        }

        // create form data as an object
        const formData = {
            submitterName: submitterName || "ANON",
            submitterEmail: submitterEmail || "",
            plushName: plushName,
            plushRarity: selectedRarity,
            description: description || "",
            timestamp: new Date().toISOString()
        };

        // save the plush to local storage so it can be accessed
        savePlushToLocalStorage(formData, plushImageFile);
        // we're using localStorage because it's on a different page
        // if the form and the game was on the same page, the code wouldve been a bit easierr

        // success message
        plushForm.style.display = "none";
        successMessage.classList.remove("hidden");

        console.log("Plush submission sent!", formData);
    });

    // save plush function
    function savePlushToLocalStorage(formData, imageFile) {
        // read existing plushes
        let savedPlushes = JSON.parse(localStorage.getItem("customPlushes")) || [];

        // turn img file into data URL
        const reader = new FileReader();

        reader.onload = function (e) {
            // create plush object with data
            const plushData = {
                ...formData,
                imageData: e.target.result
            };

            // Add to array
            savedPlushes.push(plushData);

            // Save back to localStorage
            localStorage.setItem("customPlushes", JSON.stringify(savedPlushes));
        };

        reader.readAsDataURL(imageFile);
    }

    // button to submit another plush
    submitAnotherButton.addEventListener("click", function () {
        plushForm.reset();
        previewSection.classList.add("hidden");
        plushForm.style.display = "block";
        successMessage.classList.add("hidden");
    });
});