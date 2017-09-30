var planets = {
    sun: {
        title: "Солнце",
        mass: 1.989e30,
        d: 1391400e3,
        orbit: "",
        distance: 0,
        speed_accel: 0,
        color: "",
        rings: 0,
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
        distance: 57.91e9,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    venus: {
        title: "Венера",
        mass: 4.8675e24,
        d: 12104e3,
        orbit: "sun",
        distance: 108.2e9,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    earth: {
        title: "Земля",
        mass: 5.9742e24,
        d: 12742e3,
        orbit: "sun",
        distance: 149.6e9,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    moon: {
        title: "Луна",
        mass: 7.36e22,
        d: 3474e3,
        orbit: "earth",
        distance: 384.403e6,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    mars: {
        title: "Марс",
        mass: 6.39e23,
        d: 6780e3,
        orbit: "sun",
        distance: 227.9e9,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    phobos: {
        title: "Фобос",
        mass: 1.072e16,
        d: 22e3,
        orbit: "mars",
        distance: 9.4e6,
        speed_accel: 0,
        color: "#AEA6A0",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    deimos: {
        title: "Деймос",
        mass: 1.48e15,
        d: 11e3,
        orbit: "mars",
        distance: 23.4e6,
        speed_accel: 0,
        color: "#D5BAA3",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    asteroid_ceres: {
        title: "Церера",
        mass: 9.393e20,
        d: 950e3,
        orbit: "sun",
        distance: 413.9e9,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    jupiter: {
        title: "Юпитер",
        mass: 1.8986e27,
        d: 139.822e6,
        orbit: "sun",
        distance: 778.500e9,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    saturn: {
        title: "Сатурн",
        mass: 5.6846e26,
        d: 116.464e6,
        orbit: "sun",
        distance: 1429.e9,
        speed_accel: 0,
        color: "",
        rings: 1.962857143,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    uranus: {
        title: "Уран",
        mass: 8.681e25,
        d: 50.724e6,
        orbit: "sun",
        distance: 2.871e12,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    neptune: {
        title: "Нептун",
        mass: 1.024e26,
        d: 49.244e6,
        orbit: "sun",
        distance: 4.498e12,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    /*asteroid_1001: {
        title: "Фиолетовый астероид",
        mass: 10e3,
        d: 2,
        orbit: "earth",
        distance: 30e6,
        speed_accel: 0,
        color: "#ff00ff",
        rings: 0,
        location: {
            x: -1,
            y: 4
        },
    },
    asteroid_1002: {
        title: "Синий астероид",
        mass: 100e3,
        d: 10,
        orbit: "earth",
        distance: 49e6,
        speed_accel: 0,
        color: "#0000ff",
        rings: 0,
        location: {
            x: 2,
            y: 1
        },
    },
    shuttle: {
        title: "Шаттл",
        mass: 111e3,
        d: 37,
        orbit: "earth",
        distance: 8000e3,
        speed_accel: 300e4,
        color: "#ff0000",
        rings: 0,
        location: {
            x: 1,
            y: 0
        },
    },*/
};
