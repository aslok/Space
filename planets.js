var planets = {
    sun: {
        title: "Солнце",
        mass: 1.989e30,
        d: 1391.400e6,
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
        d: 4.879e6,
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
        d: 12.104e6,
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
        d: 12.742e6,
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
        d: 3.474e6,
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
        d: 6.78e6,
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
        d: 0.95e6,
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
    io: {
        title: "Ио",
        mass: 8.93e22,
        d: 3.643e6,
        orbit: "jupiter",
        distance: 421.8e6,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    europa: {
        title: "Европа",
        mass: 4.8e22,
        d: 3.122e6,
        orbit: "jupiter",
        distance: 671.1e6,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    ganymede: {
        title: "Ганимед",
        mass: 1.4819e23,
        d: 5.268e6,
        orbit: "jupiter",
        distance: 1070.4e6,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    callisto: {
        title: "Каллисто",
        mass: 1.08e23,
        d: 4.821e6,
        orbit: "jupiter",
        distance: 1882.7e6,
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
    mimas: {
        title: "Мимас",
        mass: 3.7e19,
        d: 0.397e6,
        orbit: "saturn",
        distance: 185.539e6,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    enceladus: {
        title: "Энцелад",
        mass: 1.1e20,
        d: 0.499e6,
        orbit: "saturn",
        distance: 238.042e6,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    tethys: {
        title: "Тефия",
        mass: 6.2e20,
        d: 1.06e6,
        orbit: "saturn",
        distance: 294.672e6,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    dione: {
        title: "Диона",
        mass: 1.1e21,
        d: 1.118e6,
        orbit: "saturn",
        distance: 377.415e6,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    rhea: {
        title: "Рея",
        mass: 2.3e21,
        d: 1.528e6,
        orbit: "saturn",
        distance: 527.068e6,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    titan: {
        title: "Титан",
        mass: 1.3e23,
        d: 5.15e6,
        orbit: "saturn",
        distance: 1221.865e6,
        speed_accel: 0,
        color: "",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
    iapetus: {
        title: "Япет",
        mass: 2e21,
        d: 1.436e6,
        orbit: "saturn",
        distance: 3560.854e6,
        speed_accel: 0,
        color: "",
        rings: 0,
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
    shuttle: {
        title: "Шаттл",
        mass: 111e3,
        d: 37,
        orbit: "earth",
        distance: 12.742e6 / 2 + 60e3,
        speed_accel: 1,
        color: "#ff0000",
        rings: 0,
        location: {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        },
    },
};
