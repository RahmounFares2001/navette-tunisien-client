const locations = [
    { name: "Ariana", lat: 36.8625, lon: 10.1956 },
    { name: "Béja", lat: 36.7333, lon: 9.1833 },
    { name: "Ben Arous", lat: 36.7500, lon: 10.1500 },
    { name: "Bizerte", lat: 37.2700, lon: 9.8730 },
    { name: "Gabès", lat: 33.8833, lon: 10.1000 },
    { name: "Gafsa", lat: 34.4250, lon: 8.7833 },
    { name: "Jendouba", lat: 36.5000, lon: 8.7667 },
    { name: "Kairouan", lat: 35.6769, lon: 10.0969 },
    { name: "Kasserine", lat: 35.1667, lon: 8.8333 },
    { name: "Kébili", lat: 33.7000, lon: 8.9667 },
    { name: "Le Kef", lat: 36.1667, lon: 8.7000 },
    { name: "Mahdia", lat: 35.5044, lon: 11.0622 },
    { name: "Manouba", lat: 36.7500, lon: 10.1000 },
    { name: "Medenine", lat: 33.3500, lon: 10.5000 },
    { name: "Monastir", lat: 35.7667, lon: 10.8167 },
    { name: "Nabeul", lat: 36.4667, lon: 10.7333 },
    { name: "Sfax", lat: 34.7400, lon: 10.7600 },
    { name: "Sidi Bouzid", lat: 35.0333, lon: 9.4833 },
    { name: "Siliana", lat: 36.0833, lon: 9.3667 },
    { name: "Sousse", lat: 35.8256, lon: 10.6084 },
    { name: "Tataouine", lat: 32.9333, lon: 10.4500 },
    { name: "Tozeur", lat: 33.9167, lon: 8.1333 },
    { name: "Tunis", lat: 36.8065, lon: 10.1815 },
    { name: "Zaghouan", lat: 36.4000, lon: 10.1500 },
    { name: "Tunis-Carthage Airport", lat: 36.8510, lon: 10.2270 },
    { name: "Monastir Habib Bourguiba Airport", lat: 35.7583, lon: 10.7542 },
    { name: "Djerba-Zarzis Airport", lat: 33.8750, lon: 10.7750 },
    { name: "Enfidha-Hammamet International Airport", lat: 36.0842, lon: 10.4569 }
  ];
  
const distances = [];

async function fetchDistances() {
  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      const from = locations[i];
      const to = locations[j];

      const url = `http://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;

      try {
        const res = await axios.get(url);
        const route = res.data.routes[0];

        if (route) {
          const distanceKm = route.distance / 1000; // meters → km
          distances.push({
            from: from.name,
            to: to.name,
            distance_km: parseFloat(distanceKm.toFixed(2))
          });
          console.log(`${from.name} → ${to.name} = ${distanceKm.toFixed(2)} km`);
        }
      } catch (err) {
        console.error(`Error for ${from.name} → ${to.name}:`, err.message);
      }
    }
  }

  console.log("All distances fetched:", distances.length);
}

fetchDistances();