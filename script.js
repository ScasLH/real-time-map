const map = L.map('map').setView([0, 0], 2); // Default view

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variable to store the last searched location
let lastSearchedLocation = null;

// Add a search bar to the map
L.Control.geocoder({
    defaultMarkGeocode: false
})
.on('markgeocode', function(e) {
    const { center } = e.geocode; // Get the center of the searched location
    const { lat, lng } = center;

    console.log("Searched location:", lat, lng); // Debugging log

    // Store the searched location
    lastSearchedLocation = { lat, lng };

    // Center the map on the searched location
    map.setView([lat, lng], 13);
})
.addTo(map);

// Add a button to add a red flag at the searched location
const addFlagButton = L.control({ position: 'topleft' }); // Use 'topleft' as a placeholder
addFlagButton.onAdd = function() {
    const button = L.DomUtil.create('button', 'add-flag-button');
    button.innerHTML = 'Add Red Flag';
    button.style.backgroundColor = 'white';
    button.style.padding = '5px';
    button.style.cursor = 'pointer';

    // Add click event to the button
    L.DomEvent.on(button, 'click', () => {
        if (lastSearchedLocation) {
            const { lat, lng } = lastSearchedLocation;

            // Add a red flag at the searched location
            console.log("Adding red flag at:", lat, lng);

            // Add the marker to the map
            const marker = L.marker([lat, lng], { 
                icon: L.icon({ 
                    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Red_flag_icon.png', 
                    iconSize: [25, 41] 
                }) 
            }).addTo(map);

            // Save the flag to Firebase
            const userId = 'anonymous'; // Replace with user authentication if needed
            const flagRef = database.ref('flags').push();
            flagRef.set({
                userId,
                lat,
                lng
            });

            // Store marker reference for deletion
            marker._firebaseKey = flagRef.key;
        } else {
            alert('Please search for a location first!');
        }
    });

    return button;
};
addFlagButton.addTo(map);

// Get user's location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 13);
    });
}

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyByg7gneIEDzswTRhRi9fB--LzriyuWvUQ",
    authDomain: "real-time-map-717f6.firebaseapp.com",
    databaseURL: "https://real-time-map-717f6-default-rtdb.firebaseio.com",
    projectId: "real-time-map-717f6",
    storageBucket: "real-time-map-717f6.firebasestorage.app",
    messagingSenderId: "407674707547",
    appId: "1:407674707547:web:16edde5050d0335b28a97e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Allow users to delete their own flags by right-clicking
map.on('contextmenu', (e) => {
    const { lat, lng } = e.latlng;

    // Find the closest marker
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            const markerLatLng = layer.getLatLng();
            if (markerLatLng.lat === lat && markerLatLng.lng === lng) {
                const userId = 'anonymous'; // Replace with user authentication if needed

                // Check if the user owns the flag
                database.ref(`flags/${layer._firebaseKey}`).once('value', (snapshot) => {
                    if (snapshot.val().userId === userId) {
                        database.ref(`flags/${layer._firebaseKey}`).remove();
                        map.removeLayer(layer);
                    }
                });
            }
        }
    });
});

// Listen for new flags in Firebase and add them to the map
database.ref('flags').on('child_added', (snapshot) => {
    const { lat, lng } = snapshot.val();
    const marker = L.marker([lat, lng], { 
        icon: L.icon({ 
            iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Red_flag_icon.png', 
            iconSize: [25, 41] 
        }) 
    }).addTo(map);

    // Store marker reference for deletion
    marker._firebaseKey = snapshot.key;
});