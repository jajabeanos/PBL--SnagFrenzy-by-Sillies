document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("keydown", handleKeyPress);

    // Game state
    const gameState = {
        coins: 5,
        isPlaying: false,
        clawX: 50,
        hasGrabbed: false,
        timerId: null,
        timeRemaining: 10,
        inventory: {},
        customPlushes: [] // Store custom plushes
    };

    // Game elements
    const elements = {
        claw: document.getElementById("claw"),
        coinSlot: document.getElementById("coin-slot"),
        resultDiv: document.getElementById("result"),
        container: document.getElementById("container"),
        coinsDisplay: document.getElementById("coins-display"),
        timerDisplay: document.getElementById("timer-display"),
        timerProgress: document.querySelector(".timer-progress"),
        inventory: document.getElementById("inventory"),
        collectiblesList: document.querySelector(".collectibles-list")
    };

    // Collectibles with rarity weights
    const rarityWeights = {
        common: 50,
        uncommon: 30,
        rare: 15,
        ultraRare: 8,
        legendary: 2
    };

    // Base collectibles
    const collectibles = [
        { name: "Rock", image: "url('assets/rock.svg')", rarity: "common" },
        { name: "Cat", image: "url('assets/cat.svg')", rarity: "uncommon" },
        { name: "Dog", image: "url('assets/dog.svg')", rarity: "uncommon" },
        { name: "Hamster", image: "url('assets/mouse.svg')", rarity: "rare" },
        { name: "Rabbit", image: "url('assets/rabbit.svg')", rarity: "ultraRare" },
        { name: "Frog", image: "url('assets/frog.svg')", rarity: "ultraRare" },
        { name: "Alien", image: "url('assets/alien.svg')", rarity: "legendary", scale: 10 }
    ];

    // Load custom plushes from localStorage
    function loadCustomPlushes() {
        try {
            const savedPlushes = JSON.parse(localStorage.getItem("customPlushes")) || [];

            // Convert saved plushes to collectible format
            gameState.customPlushes = savedPlushes.map(plush => {
                return {
                    name: plush.plushName,
                    image: plush.imageData, // This will be a data URL
                    rarity: plush.plushRarity,
                    creator: plush.submitterName,
                    timestamp: plush.timestamp,
                    isCustom: true
                };
            });

            console.log(`Loaded ${gameState.customPlushes.length} custom plushes`);
        } catch (error) {
            console.error("Error loading custom plushes:", error);
            gameState.customPlushes = [];
        }
    }

    // Update collectibles gallery to include custom plushes
    function updateCollectiblesGallery() {
        // Add custom plushes to gallery
        gameState.customPlushes.forEach(plush => {
            // Create a div for each custom plush
            const plushDiv = document.createElement("div");
            plushDiv.className = `collectibles ${plush.rarity}`;
            plushDiv.dataset.rarity = plush.rarity;

            // Add the name
            plushDiv.textContent = plush.name;

            // Add a creator tag if provided
            if (plush.creator && plush.creator !== "Anonymous" && plush.creator !== "ANON") {
                const creatorDate = new Date(plush.timestamp);
                const dateString = `${creatorDate.getDate()}/${creatorDate.getMonth() + 1}`;

                const creatorTag = document.createElement("div");
                creatorTag.className = "creator-tag";
                creatorTag.style.fontSize = "10px";
                creatorTag.style.marginTop = "3px";
                creatorTag.textContent = `${plush.creator} added this! ${dateString}`;

                plushDiv.appendChild(creatorTag);
            }

            // Add to collectibles list
            elements.collectiblesList.appendChild(plushDiv);
        });
    }

    function moveClaw(direction) {
        if (gameState.hasGrabbed || !gameState.isPlaying) return;

        if (direction === "right") {
            gameState.clawX = Math.min(gameState.clawX + 5, 95);
        } else if (direction === "left") {
            gameState.clawX = Math.max(gameState.clawX - 5, 5);
        }

        elements.claw.style.left = `${gameState.clawX}%`;
        elements.claw.style.backgroundImage = "url('assets/claw-with-rod.png')";

        clearTimeout(gameState.clawResetTimer);
        gameState.clawResetTimer = setTimeout(() => {
            if (!gameState.hasGrabbed) {
                elements.claw.style.backgroundImage = "url('assets/claw-default.png')";
            }
        }, 300);
    }

    function populateContainer() {
        elements.container.innerHTML = "";
        const itemCount = getRandomInt(5, 8);

        // Combine base collectibles with custom plushes
        const allCollectibles = [...collectibles];

        // Add custom plushes if available
        if (gameState.customPlushes.length > 0) {
            // Add up to 2 custom plushes to the mix
            const customToAdd = Math.min(2, gameState.customPlushes.length);
            const shuffledCustom = shuffleArray([...gameState.customPlushes]);

            for (let i = 0; i < customToAdd; i++) {
                allCollectibles.push(shuffledCustom[i]);
            }
        }

        // Ensure at least one of each rarity appears
        const guaranteedItems = [
            allCollectibles.find(item => item.rarity === "common"),
            allCollectibles.find(item => item.rarity === "uncommon"),
            allCollectibles.find(item => item.rarity === "rare"),
            allCollectibles.find(item => Math.random() > 0.5 ? item.rarity === "ultraRare" : item.rarity === "legendary")
        ].filter(Boolean); // Filter out any undefined items

        // Position guaranteed items
        if (guaranteedItems.length > 0) {
            guaranteedItems.forEach((item, index) => {
                const position = index * (100 / (guaranteedItems.length + 1));
                placeItem(item, position);
            });
        }

        // Add some random items
        const remainingItemCount = itemCount - guaranteedItems.length;
        if (remainingItemCount > 0) {
            // Filter out the "Nothing" item
            const availableItems = allCollectibles.filter(item => item.name !== "Nothing :(");

            for (let i = 0; i < remainingItemCount; i++) {
                const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                const randomPosition = getRandomInt(5, 95);
                placeItem(randomItem, randomPosition);
            }
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function placeItem(item, xPosition) {
        const itemDiv = document.createElement("div");
        itemDiv.className = `item ${item.rarity}`;
        itemDiv.dataset.name = item.name;
        itemDiv.dataset.rarity = item.rarity;

        // Add custom flag if applicable
        if (item.isCustom) {
            itemDiv.dataset.custom = "true";
            itemDiv.dataset.creator = item.creator || "Anonymous";
        }

        // Create image element
        const img = document.createElement("img");

        if (item.isCustom) {
            // For custom plushes, use the data URL directly
            img.src = item.image;
        } else if (item.image.includes("url")) {
            // For standard plushes, extract the URL
            img.src = item.image.replace("url('", "").replace("')", "");
        } else {
            // For emoji-based items
            itemDiv.textContent = item.image;
            elements.container.appendChild(itemDiv);
            positionItem(itemDiv, xPosition);
            return;
        }

        img.alt = item.name;
        img.style.width = "70px";
        img.style.height = "70px";
        img.style.objectFit = "contain";

        // add the image to the claw div
        itemDiv.appendChild(img);

        // add to claw
        elements.container.appendChild(itemDiv);

        // position the item
        positionItem(itemDiv, xPosition);
    }

    function positionItem(itemDiv, xPosition) {
        itemDiv.style.left = `${xPosition}%`;
        itemDiv.style.bottom = `${getRandomInt(10, 60)}px`;
        itemDiv.style.transform = `rotate(${getRandomInt(-20, 20)}deg)`;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function insertCoin() {
        console.log("Coin inserted!");

        if (gameState.coins > 0 && !gameState.isPlaying) {
            gameState.coins--;
            gameState.isPlaying = true;
            gameState.hasGrabbed = false;
            gameState.timeRemaining = 10;

            updateCoinsDisplay();
            elements.resultDiv.textContent = "Move the claw with arrow keys, press SPACE to grab!";
            elements.resultDiv.className = "";

            // reset claw position
            gameState.clawX = 50;
            elements.claw.style.left = "50%";
            elements.claw.style.top = "0";
            elements.claw.classList.remove("grabbing");

            startTimer();
        } else if (gameState.coins <= 0) {
            elements.resultDiv.textContent = "No more coins! Game over.";
            elements.resultDiv.className = "result-lose";
        }
    }

    function updateCoinsDisplay() {
        elements.coinsDisplay.textContent = `Coins: ${gameState.coins}`;
    }

    function startTimer() {
        updateTimerDisplay();

        // reset/start timer animation
        elements.timerProgress.style.transition = 'none';
        elements.timerProgress.style.width = '100%';
        setTimeout(() => {
            elements.timerProgress.style.transition = 'width 10s linear';
            elements.timerProgress.style.width = '0%';
        }, 50);

        gameState.timerId = setInterval(() => {
            gameState.timeRemaining--;
            updateTimerDisplay();

            if (gameState.timeRemaining <= 0 || gameState.hasGrabbed) {
                timeUp();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        elements.timerDisplay.textContent = gameState.timeRemaining;
    }

    function timeUp() {
        if (!gameState.hasGrabbed && gameState.isPlaying) {
            clearInterval(gameState.timerId);
            gameState.isPlaying = false;

            elements.resultDiv.textContent = "Time's up! You got nothing :(";
            elements.resultDiv.className = "result-lose";
        }
    }

    // handle keys
    function handleKeyPress(e) {
        if (gameState.hasGrabbed || !gameState.isPlaying) return;

        if (e.key === "ArrowRight") {
            moveClaw("right");
        } else if (e.key === "ArrowLeft") {
            moveClaw("left");
        } else if (e.key === " " || e.key === "Spacebar") {
            e.preventDefault(); // Prevent page scrolling
            grab();
        }
    }

    function grab() {
        if (gameState.hasGrabbed || !gameState.isPlaying) return;

        gameState.hasGrabbed = true;
        clearInterval(gameState.timerId);

        // claw anim
        elements.claw.style.top = "70%";

        // determine if player grabbed anything and what it is
        setTimeout(() => {
            const grabbedItem = determineGrabbedItem();
            processGrab(grabbedItem);

            // return claw back up
            setTimeout(() => {
                elements.claw.style.top = "0";
                elements.claw.classList.remove("grabbing");
                elements.claw.style.backgroundImage = "url('assets/claw-default.png')";

                // end turn
                setTimeout(() => {
                    gameState.hasGrabbed = false;
                    gameState.isPlaying = false;

                    // add/remove/change plushies in machine
                    populateContainer();
                }, 1000);
            }, 1500);
        }, 1500);
    }

    function determineGrabbedItem() {
        const clawPosition = gameState.clawX;
        const items = Array.from(document.querySelectorAll('.item'));

        // make sure no plushies are too nesr the claw
        const nearbyItems = items.filter(item => {
            const itemRect = item.getBoundingClientRect();
            const itemCenterX = itemRect.left + (itemRect.width / 2);
            const clawRect = elements.claw.getBoundingClientRect();
            const clawCenterX = clawRect.left + (clawRect.width / 2);

            // find distance between claw and item 
            return Math.abs(itemCenterX - clawCenterX) < 40;
        });

        if (nearbyItems.length > 0) {
            // set rarity 
            const probabilityAdjustedItems = nearbyItems.map(item => {
                const rarity = item.dataset.rarity;
                let probability;

                switch (rarity) {
                    case "common": probability = 0.9; break;
                    case "uncommon": probability = 0.7; break;
                    case "rare": probability = 0.5; break;
                    case "ultraRare": probability = 0.3; break;
                    case "legendary": probability = 0.15; break;
                    default: probability = 0.8;
                }

                return { item, probability };
            });

            // grab + probability
            for (const { item, probability } of probabilityAdjustedItems) {
                if (Math.random() < probability) {
                    return item;
                }
            }
        }

        // if no item was successfully grabbed/probability check failed
        return null;
    }

    function processGrab(grabbedItem) {
        if (grabbedItem) {
            const itemName = grabbedItem.dataset.name;
            const itemRarity = grabbedItem.dataset.rarity;
            const isCustom = grabbedItem.dataset.custom === "true";
            let creator = isCustom ? grabbedItem.dataset.creator : null;

            // get img 
            const imgElement = grabbedItem.querySelector('img');
            const itemImage = imgElement ? imgElement.src : grabbedItem.textContent;

            // Make the grabbed item disappear
            grabbedItem.style.opacity = "0";
            setTimeout(() => grabbedItem.remove(), 500);

            // Prize reward output
            let resultMessage = `You grabbed ${itemName}!`;
            if (isCustom && creator && creator !== "anonymous" && creator !== "ANON") {
                resultMessage += ` (made by ${creator})`;
            }
            elements.resultDiv.textContent = resultMessage;
            elements.resultDiv.className = "result-win";

            // coin reward based on rarity
            let coinReward = 1;
            switch (itemRarity) {
                case "rare": coinReward = 2; break;
                case "ultraRare": coinReward = 3; break;
                case "legendary": coinReward = 5; break;
            }

            gameState.coins += coinReward;
            updateCoinsDisplay();

            // add to collection
            addToInventory(itemName, itemImage, itemRarity, isCustom, creator);

        } else {
            elements.resultDiv.textContent = "The claw slipped! You got nothing (unlucky lol)";
            elements.resultDiv.className = "result-lose";
        }
    }


    // connected to form.js 

    function addToInventory(itemName, itemImage, itemRarity, isCustom = false, creator = null) {
        // unique key for the inventory
        const inventoryKey = isCustom ? `${itemName}-${creator}` : itemName;

        // update inventory count
        if (!gameState.inventory[inventoryKey]) {
            gameState.inventory[inventoryKey] = {
                count: 0,
                image: itemImage,
                rarity: itemRarity,
                isCustom: isCustom,
                creator: creator,
                name: itemName
            };
        }
        gameState.inventory[inventoryKey].count++;

        // update inventory display
        updateInventoryDisplay();
    }

    function updateInventoryDisplay() {
        elements.inventory.innerHTML = "";

        // sort by rarity
        const rarityOrder = ["legendary", "ultraRare", "rare", "uncommon", "common"];
        const sortedItems = Object.entries(gameState.inventory).sort((a, b) => {
            const rarityA = rarityOrder.indexOf(a[1].rarity);
            const rarityB = rarityOrder.indexOf(b[1].rarity);
            return rarityA - rarityB;
        });

        if (sortedItems.length === 0) {
            elements.inventory.innerHTML = "<p>Your collection is empty. Win some prizes!</p>";
            return;
        }

        // Create inventory display
        for (const [key, item] of sortedItems) {
            const inventoryItem = document.createElement("div");
            inventoryItem.className = `inventory-item ${item.rarity}`;

            // create image container
            const imageContainer = document.createElement("div");
            imageContainer.className = "inventory-image";

            // add image
            if (item.image.includes('data:image') || item.image.includes('assets/')) {
                const img = document.createElement("img");
                img.src = item.image;
                img.alt = item.name;
                img.style.width = "40px";
                img.style.height = "40px";
                imageContainer.appendChild(img);
            } else {
                // for emoji or text-based items
                imageContainer.textContent = item.image;
            }

            // add details
            const details = document.createElement("div");
            details.className = "inventory-details";

            const nameSpan = document.createElement("span");
            nameSpan.className = "inventory-name";
            nameSpan.textContent = item.name;

            const countSpan = document.createElement("span");
            countSpan.className = "inventory-count";
            countSpan.textContent = `×${item.count}`;

            details.appendChild(nameSpan);

            // add creator info if custom plush
            if (item.isCustom && item.creator && item.creator !== "Anonymous" && item.creator !== "ANON") {
                const creatorSpan = document.createElement("span");
                creatorSpan.className = "inventory-creator";
                creatorSpan.textContent = `by ${item.creator}`;
                details.appendChild(creatorSpan);
            }

            details.appendChild(countSpan);

            // make inventory item
            inventoryItem.appendChild(imageContainer);
            inventoryItem.appendChild(details);
            elements.inventory.appendChild(inventoryItem);
        }
    }


    // custom plush config

    // delete custom plushie 
    function addDeletePlushieButton() {
        // make delete button
        const deleteButton = document.createElement("button");
        deleteButton.className = "control-btn";
        deleteButton.id = "delete-plushie";
        deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete Custom Plushie';
        deleteButton.style.backgroundColor = "#ff6b6b";
        deleteButton.style.marginTop = "10px";

        // make button show up
        const inventorySection = document.querySelector(".inventory-section");
        inventorySection.appendChild(deleteButton);

        // makes the button work
        deleteButton.addEventListener("click", openDeletePlushieModal);
    }

    // create and show delete modal
    function openDeletePlushieModal() {
        // Create modal overlay
        const modalOverlay = document.createElement("div");
        modalOverlay.id = "delete-modal-overlay";
        modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;

        // Create modal content
        const modalContent = document.createElement("div");
        modalContent.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 15px;
        max-width: 80%;
        max-height: 80%;
        overflow-y: auto;
    `;

        // Add header
        const header = document.createElement("h3");
        header.textContent = "Delete Custom Plushie";
        header.style.marginBottom = "15px";
        modalContent.appendChild(header);

        // get custom plushies from localStorage
        let customPlushes;
        try {
            customPlushes = JSON.parse(localStorage.getItem("customPlushes")) || [];
        } catch (error) {
            console.error("Error loading custom plushes:", error);
            customPlushes = [];
        }

        // No custom plushies message
        if (customPlushes.length === 0) {
            const noPlushiesMsg = document.createElement("p");
            noPlushiesMsg.textContent = "You don't have any custom plushies to delete.";
            modalContent.appendChild(noPlushiesMsg);
        } else {
            // Create list of custom plushies
            const plushiesList = document.createElement("div");
            plushiesList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 15px;
        `;

            customPlushes.forEach((plush, index) => {
                const plushItem = document.createElement("div");
                plushItem.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px;
                border-radius: 8px;
                background-color: #f5f5f5;
            `;

                // plushie info
                const plushInfo = document.createElement("div");
                plushInfo.innerHTML = `
                <strong>${plush.plushName}</strong> (${plush.plushRarity})
                <br>
                <small>by ${plush.submitterName || "Anonymous"}</small>
            `;

                // plushie image thumbnail
                const plushImage = document.createElement("img");
                plushImage.src = plush.imageData;
                plushImage.style.cssText = `
                width: 50px;
                height: 50px;
                object-fit: contain;
                margin-right: 10px;
            `;

                // delete button for this plushie
                const deleteBtn = document.createElement("button");
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.style.cssText = `
                background-color: #ff6b6b;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 5px 10px;
                cursor: pointer;
                font-family: 'Quicksand', sans-serif;
            `;
                deleteBtn.dataset.index = index;
                deleteBtn.addEventListener("click", function () {
                    deletePlushie(index);
                    modalOverlay.remove();
                    // refresh game
                    location.reload();
                });

                // assemble plush item
                plushItem.appendChild(plushImage);
                plushItem.appendChild(plushInfo);
                plushItem.appendChild(deleteBtn);
                plushiesList.appendChild(plushItem);
            });

            modalContent.appendChild(plushiesList);
        }

        // add close menu button
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.style.cssText = `
        background-color: var(--light-purple);
        color: var(--dark-purple);
        border: none;
        padding: 8px 15px;
        border-radius: 8px;
        cursor: pointer;
    `;
        closeButton.addEventListener("click", () => modalOverlay.remove());
        modalContent.appendChild(closeButton);

        // add modal to overlay and overlay to body
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
    }

    // delete plushie : function
    function deletePlushie(index) {
        try {
            const customPlushes = JSON.parse(localStorage.getItem("customPlushes")) || [];
            if (index >= 0 && index < customPlushes.length) {
                customPlushes.splice(index, 1);
                localStorage.setItem("customPlushes", JSON.stringify(customPlushes));
                alert("Custom plushie deleted successfully!");
            }
        } catch (error) {
            console.error("Error deleting custom plushie:", error);
            alert("There was an error deleting the plushie.");
        }
    }

    // handle popup windows
    window.openPopup = function (popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'block';
        }
    }

    window.closePopup = function (popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'none';
        }
    }

    // initgame
    function initGame() {
        // load plushes
        loadCustomPlushes();

        // update collectibles gallery with custom plushes
        updateCollectiblesGallery();

        populateContainer();
        updateCoinsDisplay();
        elements.coinSlot.addEventListener("click", insertCoin);

        // delete plush button
        addDeletePlushieButton();
    }

    // Initialize the game when the document is loaded
    initGame();
});