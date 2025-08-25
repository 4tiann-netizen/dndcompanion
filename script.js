// D&D Companion App JavaScript

class DnDTracker {
    constructor() {
        this.data = {
            characterName: '',
            classLevel: '',
            race: '',
            level: 1,
            stats: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10
            },
            hp: {
                current: 10,
                max: 10
            },
            armorClass: 10,
            speed: 30,
            currency: {
                gold: 0,
                silver: 0,
                copper: 0
            },
            inventory: [],
            locations: []
        };
        
        this.currentTab = 'home';
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.bindTabEvents();
        this.updateUI();
    }

    bindTabEvents() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Remove active class from all buttons and panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to clicked button and corresponding pane
                button.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
                
                this.currentTab = targetTab;
            });
        });

        // Bubble navigation
        const navBubbles = document.querySelectorAll('.nav-bubble');
        navBubbles.forEach(bubble => {
            bubble.addEventListener('click', () => {
                const targetTab = bubble.dataset.target;
                
                // Remove active class from all buttons and panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to target button and pane
                const targetButton = document.querySelector(`[data-tab="${targetTab}"]`);
                targetButton.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
                
                this.currentTab = targetTab;
            });
        });
    }

    bindEvents() {
        // Character name (multiple inputs)
        document.getElementById('characterName').addEventListener('input', (e) => {
            this.data.characterName = e.target.value;
            document.getElementById('characterNameDisplay').value = e.target.value;
            this.updateHeader();
            this.saveData();
        });
        
        document.getElementById('characterNameDisplay').addEventListener('input', (e) => {
            this.data.characterName = e.target.value;
            document.getElementById('characterName').value = e.target.value;
            this.updateHeader();
            this.saveData();
        });

        // Class & Level
        document.getElementById('classLevel').addEventListener('input', (e) => {
            this.data.classLevel = e.target.value;
            this.saveData();
        });

        // Race
        document.getElementById('race').addEventListener('input', (e) => {
            this.data.race = e.target.value;
            this.saveData();
        });

        // Level
        document.getElementById('level').addEventListener('input', (e) => {
            this.data.level = parseInt(e.target.value) || 1;
            this.updateHeader();
            this.updateProficiencyBonus();
            this.saveData();
        });

        // Speed
        document.getElementById('speed').addEventListener('input', (e) => {
            this.data.speed = parseInt(e.target.value) || 30;
            this.saveData();
        });

        // Stats
        ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(stat => {
            document.getElementById(stat).addEventListener('change', (e) => {
                this.data.stats[stat] = parseInt(e.target.value) || 10;
                this.updateModifier(stat);
                if (stat === 'dexterity') {
                    this.updateInitiative();
                }
                this.saveData();
            });
        });

        // HP
        document.getElementById('currentHP').addEventListener('input', (e) => {
            this.data.hp.current = parseInt(e.target.value) || 0;
            this.saveData();
        });

        document.getElementById('maxHP').addEventListener('input', (e) => {
            this.data.hp.max = parseInt(e.target.value) || 1;
            this.saveData();
        });

        // Armor Class
        document.getElementById('armorClass').addEventListener('input', (e) => {
            this.data.armorClass = parseInt(e.target.value) || 10;
            this.saveData();
        });

        // Currency
        document.getElementById('gold').addEventListener('input', (e) => {
            this.data.currency.gold = parseInt(e.target.value) || 0;
            this.saveData();
        });

        document.getElementById('silver').addEventListener('input', (e) => {
            this.data.currency.silver = parseInt(e.target.value) || 0;
            this.saveData();
        });

        document.getElementById('copper').addEventListener('input', (e) => {
            this.data.currency.copper = parseInt(e.target.value) || 0;
            this.saveData();
        });

        // Currency action buttons - handle both click and touch events
        document.querySelectorAll('.currency-action').forEach(btn => {
            const handleCurrencyAction = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const currency = e.target.dataset.currency;
                const action = e.target.dataset.action;
                const currentValue = this.data.currency[currency] || 0;
                
                if (action === 'add') {
                    this.data.currency[currency] = currentValue + 1;
                } else if (action === 'subtract') {
                    this.data.currency[currency] = Math.max(0, currentValue - 1);
                }
                
                document.getElementById(currency).value = this.data.currency[currency];
                this.saveData();
            };
            
            btn.addEventListener('click', handleCurrencyAction);
            btn.addEventListener('touchend', handleCurrencyAction);
        });

        // Inventory
        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.addItem();
        });

        document.getElementById('itemInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addItem();
            }
        });

        // Locations
        document.getElementById('addLocationBtn').addEventListener('click', () => {
            this.addLocation();
        });

        document.getElementById('locationInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addLocation();
            }
        });

        // Save and Clear buttons
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveData();
            this.showNotification('Progress saved!');
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                this.clearData();
            }
        });
    }

    calculateModifier(score) {
        return Math.floor((score - 10) / 2);
    }

    updateModifier(stat) {
        const score = this.data.stats[stat];
        const modifier = this.calculateModifier(score);
        const modifierElement = document.getElementById(stat.substring(0, 3) + 'Mod');
        modifierElement.textContent = modifier >= 0 ? `+${modifier}` : modifier;
    }

    updateInitiative() {
        const dexModifier = this.calculateModifier(this.data.stats.dexterity);
        const initiativeElement = document.getElementById('initiative');
        initiativeElement.value = dexModifier >= 0 ? `+${dexModifier}` : dexModifier;
    }

    updateProficiencyBonus() {
        // D&D 5e proficiency bonus by level
        const level = this.data.level;
        let profBonus = 2;
        if (level >= 17) profBonus = 6;
        else if (level >= 13) profBonus = 5;
        else if (level >= 9) profBonus = 4;
        else if (level >= 5) profBonus = 3;
        
        const profElement = document.getElementById('proficiencyBonus');
        profElement.textContent = `+${profBonus}`;
    }

    addItem() {
        const itemInput = document.getElementById('itemInput');
        const quantityInput = document.getElementById('itemQuantity');
        const itemName = itemInput.value.trim();
        const quantity = parseInt(quantityInput.value) || 1;

        if (itemName) {
            const existingItem = this.data.inventory.find(item => item.name === itemName);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                this.data.inventory.push({
                    id: Date.now(),
                    name: itemName,
                    quantity: quantity
                });
            }

            itemInput.value = '';
            quantityInput.value = 1;
            this.updateInventoryDisplay();
            this.saveData();
        }
    }

    removeItem(id) {
        this.data.inventory = this.data.inventory.filter(item => item.id !== id);
        this.updateInventoryDisplay();
        this.saveData();
    }

    updateInventoryDisplay() {
        const inventoryList = document.getElementById('inventoryList');
        inventoryList.innerHTML = '';

        this.data.inventory.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-quantity">x${item.quantity}</span>
                </div>
                <button class="delete-btn" onclick="tracker.removeItem(${item.id})">Remove</button>
            `;
            inventoryList.appendChild(itemElement);
        });
    }

    addLocation() {
        const locationInput = document.getElementById('locationInput');
        const locationName = locationInput.value.trim();

        if (locationName) {
            const location = {
                id: Date.now(),
                name: locationName,
                notes: ''
            };

            this.data.locations.push(location);
            locationInput.value = '';
            this.updateLocationsDisplay();
            this.saveData();
        }
    }

    removeLocation(id) {
        this.data.locations = this.data.locations.filter(loc => loc.id !== id);
        this.updateLocationsDisplay();
        this.saveData();
    }

    updateLocationNotes(id, notes) {
        const location = this.data.locations.find(loc => loc.id === id);
        if (location) {
            location.notes = notes;
            this.saveData();
        }
    }

    updateLocationsDisplay() {
        const locationsList = document.getElementById('locationsList');
        locationsList.innerHTML = '';

        this.data.locations.forEach(location => {
            const locationElement = document.createElement('div');
            locationElement.className = 'location-item';
            locationElement.innerHTML = `
                <div class="location-info">
                    <strong>${location.name}</strong>
                    <textarea 
                        class="location-notes" 
                        placeholder="Add notes about this location..."
                        onchange="tracker.updateLocationNotes(${location.id}, this.value)"
                    >${location.notes}</textarea>
                </div>
                <button class="delete-btn" onclick="tracker.removeLocation(${location.id})">Remove</button>
            `;
            locationsList.appendChild(locationElement);
        });
    }

    updateHeader() {
        const headerName = document.getElementById('headerCharacterName');
        const headerLevel = document.getElementById('headerLevel');
        const homeCharacterName = document.getElementById('homeCharacterName');
        
        const displayName = this.data.characterName || 'New Character';
        const homeDisplayName = this.data.characterName || 'Adventurer';
        
        headerName.textContent = displayName;
        headerLevel.textContent = `Lv.${this.data.level}`;
        homeCharacterName.textContent = homeDisplayName;
    }


    updateUI() {
        // Character info
        document.getElementById('characterName').value = this.data.characterName;
        document.getElementById('characterNameDisplay').value = this.data.characterName;
        document.getElementById('classLevel').value = this.data.classLevel || '';
        document.getElementById('race').value = this.data.race || '';
        document.getElementById('level').value = this.data.level;
        document.getElementById('speed').value = this.data.speed || 30;
        this.updateHeader();

        // Stats
        Object.keys(this.data.stats).forEach(stat => {
            document.getElementById(stat).value = this.data.stats[stat];
            this.updateModifier(stat);
        });

        // Update calculated values
        this.updateInitiative();
        this.updateProficiencyBonus();

        // HP and AC
        document.getElementById('currentHP').value = this.data.hp.current;
        document.getElementById('maxHP').value = this.data.hp.max;
        document.getElementById('armorClass').value = this.data.armorClass;

        // Currency
        document.getElementById('gold').value = this.data.currency ? this.data.currency.gold || 0 : this.data.gold || 0;
        document.getElementById('silver').value = this.data.currency ? this.data.currency.silver || 0 : 0;
        document.getElementById('copper').value = this.data.currency ? this.data.currency.copper || 0 : 0;

        // Inventory and Locations
        this.updateInventoryDisplay();
        this.updateLocationsDisplay();
    }


    saveData() {
        localStorage.setItem('dndTrackerData', JSON.stringify(this.data));
    }

    loadData() {
        const savedData = localStorage.getItem('dndTrackerData');
        if (savedData) {
            this.data = JSON.parse(savedData);
        }
    }

    clearData() {
        this.data = {
            characterName: '',
            classLevel: '',
            race: '',
            level: 1,
            stats: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10
            },
            hp: {
                current: 10,
                max: 10
            },
            armorClass: 10,
            speed: 30,
            currency: {
                gold: 0,
                silver: 0,
                copper: 0
            },
            inventory: [],
            locations: []
        };
        
        localStorage.removeItem('dndTrackerData');
        this.updateUI();
        this.showNotification('All data cleared!');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the tracker when the page loads
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new DnDTracker();
});