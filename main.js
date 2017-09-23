var width;
var height;
var margin;

// В одном пикселе полторы тысячи километров
var map = 1500e3;
// Расстояние до луны
var l = 384403e3;

var planets = [
    {
        id: "earth",
        mass: 5.9742e24,
        d: 12742e3,
        color: "#88ff99",
        location: {
            x: 0,
            y: 0
        },
        course: {
            x: 0,
            y: 0
        },
        speed: {
            x: 0,
            y: 0
        },
        accel: {
            x: 0,
            y: 0
        },
    },
    {
        id: "moon",
        mass: 7.36e22,
        d: 3474e3,
        color: "#fff",
        location: {
            x: 0,
            y: -l
        },
        course: {
            x: 0,
            y: 0
        },
        speed: {
            x: 1022 * 10,
            y: 0
        },
        accel: {
            x: 0,
            y: 0
        },
    },
    {
        id: "asteroid",
        mass: 1e3,
        d: 1,
        color: "#ff0000",
        location: {
            x: l / 2,
            y: -l
        },
        course: {
            x: 0,
            y: 0
        },
        speed: {
            x: -5e3,
            y: -1e3
        },
        accel: {
            x: 0,
            y: 0
        },
    },
    {
        id: "asteroid2",
        mass: 1000e3,
        d: 50,
        color: "#00ffff",
        location: {
            x: l / 2,
            y: l
        },
        course: {
            x: 0,
            y: 0
        },
        speed: {
            x: 4e3,
            y: -8e3
        },
        accel: {
            x: 0,
            y: 0
        },
    },
    {
        id: "asteroid3",
        mass: 100e3,
        d: 10,
        color: "#5555ff",
        location: {
            x: l * 2,
            y: 0
        },
        course: {
            x: 0,
            y: 0
        },
        speed: {
            x: -1e3,
            y: -5e3
        },
        accel: {
            x: 0,
            y: 0
        },
    },
    {
        id: "asteroid4",
        mass: 1e3,
        d: 1,
        color: "#ffb300",
        location: {
            x: l * -2,
            y: l / 8
        },
        course: {
            x: 0,
            y: 0
        },
        speed: {
            x: 5e3,
            y: 4e3
        },
        accel: {
            x: 0,
            y: 0
        },
    },
    {
        id: "asteroid5",
        mass: 5e3,
        d: 2,
        color: "#ff00ff",
        location: {
            x: l / -4,
            y: l
        },
        course: {
            x: 0,
            y: 0
        },
        speed: {
            x: -7e3,
            y: -3e3
        },
        accel: {
            x: 0,
            y: 0
        },
    },
];

$(function (){
    var debug = false;
    //var debug = false;

    var freq = 0.01;
    var draw_freq = 100;
    // Гравитационная постоянная
    var G = 6.67408e-11;

    var cache = {
        location_map: { },
        draw_map: { },
        planet_size: { },
        planet_selected: "",
    };

    function uptime(){
        return time() - time_start;
    }
    function time(){
        return window.performance && window.performance.now &&
                window.performance.timing && window.performance.timing.navigationStart ?
                    window.performance.now() + window.performance.timing.navigationStart :
                    Date.now();
    }
    var time_start = time();

    function log(mess, val){
        if (!debug){
            return;
        }
        if (typeof val != "undefined"){
            console.log(mess + " =", val);
        }else{
            console.log(mess);
        }
    }

    // Сложение векторов
    function vv_sum(v1, v2){
        return { x: v1.x + v2.x, y: v1.y + v2.y };
    }
    // Вычитание векторов
    function vv_diff(v1, v2){
        return { x: v2.x - v1.x, y: v2.y - v1.y };
    }
    // Расстояние (длина вектора)
    function vv_length(v1, v2){
        return Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
    }
    // Нормализация
    function v_norm(v){
        var r = Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
        return { x: v.x / r, y: v.y / r };
    }
    // Умножение вектора на скаляр
    function v_mult(v, k){
        return { x: v.x * k, y: v.y * k };
    }
    // Деление вектора на скаляр
    function v_div(v, k){
        return { x: v.x / k, y: v.y / k };
    }
    // Вектор нулевой?
    function v_is_null(v){
        return !v.x && !v.y;
    }
    // Копируем вектор
    function v_clone(v){
        return { x: v.x, y: v.y };
    }
    // Округляем вектор
    function v_round(v){
        return { x: Math.round(v.x), y: Math.round(v.y) }
    }

    function planets_calc_size(){
        planets.forEach(function(item){
            var min_size = (width > height ? height : width) / 150;
            var d = item.d / map;
            d < min_size ? d = min_size : 0;
            cache.planet_size[item.id] = d;
        });
        planets_size();
    }
    function planets_create(){
        cache.planet_selected = "earth";
        planets.forEach(function(item){
            cache.location_map[item.id] = v_round(v_div(item.location, map));
            cache.draw_map[item.id] = v_clone(cache.location_map[item.id]);
            $('<div>').
                attr("id", item.id).
                css("background-color", item.color).
                css("position", "absolute").
                css("left", margin.x + cache.draw_map[item.id].x + "px").
                css("top", margin.y + cache.draw_map[item.id].y + "px").
                appendTo("#body");
            $('<option>').
                val(item.id).
                text(item.id).
                attr("selected", cache.planet_selected == item.id).
                appendTo("#planet_select");
            planets_calc_size();
        });
    }
    function planets_size(){
        planets.forEach(function(item){
            var r = cache.planet_size[item.id] / 2;
            $("#" + item.id).
                css("width", cache.planet_size[item.id] + "px").
                css("height", cache.planet_size[item.id] + "px").
                css("-moz-border-radius", r + "px").
                css("-webkit-border-radius", r + "px").
                css("border-radius", r + "px");
        });
    }
    function planets_move(){
        planets.forEach(function(item1, key1, arr){
            for (var key2 = key1 + 1; key2 < arr.length; key2++){
                var item2 = arr[key2];
                log("=========================================================");

                item1.course = v_norm(vv_diff(item1.location, item2.location));
                item2.course = v_norm(vv_diff(item2.location, item1.location));
                log("item1.course", item1.course);
                log("item2.course", item1.course);

                var r = vv_length(item1.location, item2.location);
                /*if (r > l * 2){
                    return;
                }*/
                log("r", r);
                //console.log(r);
                // F = G * (m1 * m2 / r^2)
                var F = G * item1.mass * item2.mass / Math.pow(r, 2);
                log("F", F);
                // a = F / m

                var accel1 = v_mult(item1.course, F / item1.mass);
                var accel2 = v_mult(item2.course, F / item2.mass);
                log("accel1", accel1);
                log("accel2", accel2);
                item1.accel = vv_sum(item1.accel, v_div(accel1, freq));
                item2.accel = vv_sum(item2.accel, v_div(accel2, freq));
            }
        });
        planets.forEach(function(item){
            log("=========================================================");

            item.speed = vv_sum(item.speed, v_div(item.accel, freq));
            log("item.speed", item.speed);
            log("item.accel", item.accel);
            item.accel = v_mult(item.accel, 0);

            item.location = vv_sum(item.location, v_div(item.speed, freq));
            log("item.location", item.location);
            cache.location_map[item.id] = v_round(v_div(item.location, map));
            // log("", );
        });
        var padding = vv_diff(cache.location_map[cache.planet_selected], margin);
        if (!v_is_null(padding)){
            planets.forEach(function(item){
                item.location = vv_sum(item.location, v_mult(padding, map));
                cache.location_map[item.id] = v_round(v_div(item.location, map));
            });
        }
        planets.forEach(function(item){
            if (cache.location_map[item.id].x > -5 && cache.location_map[item.id].y > -5 &&
                cache.location_map[item.id].x < width + 5 && cache.location_map[item.id].y < height + 5){
                    if (!v_is_null(vv_diff(cache.location_map[item.id], cache.draw_map[item.id]))){
                        cache.draw_map[item.id] = v_clone(cache.location_map[item.id]);
                        $("#" + item.id).
                            show().
                            css("left", cache.draw_map[item.id].x + "px").
                            css("top", cache.draw_map[item.id].y + "px");
                    }
            }else{
                $("#" + item.id).
                    hide();
            }
        });
        setTimeout(planets_move, 1000 / draw_freq);
    }

    $("#planet_select").change(function() {
        cache.planet_selected = $("#planet_select").val();
    });
    $(window).resize(function() {
        $("#body").
            height($(window).height() - 10);
        width = $("#body").width();
        height = $("#body").height();
        margin = { x: Math.round(width / 2), y: Math.round(height / 2) };
        planets_calc_size();
    });
    log("======================= START ============================");
    $(window).trigger('resize');
    planets_create();
    planets_move();
});
