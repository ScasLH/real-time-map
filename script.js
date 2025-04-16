const map = L.map('map').setView([0, 0], 2); // Default view

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a search bar to the map
L.Control.geocoder({
    defaultMarkGeocode: false
})
.on('markgeocode', function(e) {
    const { center, bbox } = e.geocode; // Get the center and bounding box of the searched location
    const { lat, lng } = center;

    console.log("Searched location:", lat, lng); // Debugging log

    // Add a red flag at the searched location
    const userId = 'anonymous'; // Replace with user authentication if needed
    const flagRef = database.ref('flags').push();
    flagRef.set({
        userId,
        lat,
        lng
    });

    // Add the marker to the map
    const marker = L.marker([lat, lng], { 
        icon: L.icon({ 
            iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Red_flag_icon.png', 
            iconSize: [25, 41] 
        }) 
    }).addTo(map);

    console.log("Marker added at:", lat, lng); // Debugging log

    // Store marker reference for deletion
    marker._firebaseKey = flagRef.key;

    // Add a non-interactive polygon to highlight the searched area
    const poly = L.polygon([
        bbox.getSouthEast(),
        bbox.getNorthEast(),
        bbox.getNorthWest(),
        bbox.getSouthWest()
    ], { interactive: false }).addTo(map);

    // Center the map on the searched location
    map.setView([lat, lng], 13);
})
.addTo(map);

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

// Add a red flag when the user clicks on the map
map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    const userId = 'anonymous'; // Replace with user authentication if needed

    // Save to Firebase
    const flagRef = database.ref('flags').push();
    flagRef.set({
        userId,
        lat,
        lng
    });
});

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