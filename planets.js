var planets = {
    sun: {
        title: "Солнце",
        mass: 1.989e30,
        d: 1391400e3,
        orbit: "",
        distance: 0,
        speed_accel: 0,
        color: "#ffb300",
        location: {
            x: 0,
            y: 0
        },
    },
    mercury: {
        title: "Меркурий",
        mass: 3.285e23,
        d: 4879e3,
        orbit: "sun",
        distance: 57910e6,
        speed_accel: 0,
        color: "#00ffff",
        location: {
            x: -1,
            y: 1
        },
    },
    venus: {
        title: "Венера",
        mass: 4.8675e24,
        d: 12104e3,
        orbit: "sun",
        distance: 108200e6,
        speed_accel: 0,
        color: "#7b68ee",
        location: {
            x: 5,
            y: -1
        },
    },
    earth: {
        title: "Земля",
        mass: 5.9742e24,
        d: 12742e3,
        orbit: "sun",
        distance: 149600e6,
        speed_accel: 0,
        color: "#88ff99",
        location: {
            x: 1,
            y: 0
        },
    },
    moon: {
        title: "Луна",
        mass: 7.36e22,
        d: 3474e3,
        orbit: "earth",
        distance: 384.403e6,
        speed_accel: 0,
        color: "#fff",
        location: {
            x: 11,
            y: -1.24
        },
    },/*
    asteroid3: {
        title: "Синий астероид",
        mass: 100e3,
        d: 10,
        orbit: "earth",
        distance: 390e6,
        speed_accel: 0,
        color: "#0000ff",
        location: {
            x: 2,
            y: 1
        },
    },
    asteroid5: {
        title: "Фиолетовый астероид",
        mass: 5e3,
        d: 2,
        orbit: "earth",
        distance: 200e6,
        speed_accel: 0,
        color: "#ff00ff",
        location: {
            x: 1 / -4,
            y: 1
        },
    },*/
    shuttle: {
        title: "Шаттл",
        mass: 111e3,
        d: 37,
        orbit: "earth",
        distance: 5000e3,
        speed_accel: 15,
        color: "#ff0000",
        location: {
            x: 1,
            y: 0
        },
    },
};
