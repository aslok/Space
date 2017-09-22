$(function (){
    $(window).resize(function() {
        $("#body").
            height($(window).height() - 10);
        window.width = $("#body").width();
        window.height = $("#body").height();
    });

    $(window).trigger('resize');

    var debug = false;
    //var debug = false;

    var freq = 0.05;
    var draw_freq = 1000;
    // В одном пикселе три тысячи километров
    var map = 3000e3;
    // Гравитационная постоянная
    var G = 6.67408e-11;
    // Расстояние до луны
    var l = 384403e3;
    // Отступы от левого верхнего угла
    var margin_x = width / 2;
    var margin_y = height / 2;

    var dots = [
        {
            id: "earth",
            mass: 5.9742e24,
            d: 12742e3,
            color: "#88ff44",
            location: {
                x: margin_x * map,
                y: margin_y * map
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
                x: margin_x * map,
                y: margin_y * map - l
            },
            course: {
                x: 0,
                y: 0
            },
            speed: {
                x: 1022 * 50, // 70 ????
                y: 0.002698345949026999
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
                x: margin_x * map + 100 * map,
                y: margin_y * map - l
            },
            course: {
                x: 0,
                y: 0
            },
            speed: {
                x: 0,
                y: 10e3
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
            color: "#ffff00",
            location: {
                x: margin_x * map + 100 * map,
                y: margin_y * map + l
            },
            course: {
                x: 0,
                y: 0
            },
            speed: {
                x: 0,
                y: -999e3
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
            color: "#0000ff",
            location: {
                x: margin_x * map + 200 * map,
                y: margin_y * map
            },
            course: {
                x: 0,
                y: 0
            },
            speed: {
                x: -300e3,
                y: 0
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
                x: margin_x * map - 100 * map,
                y: margin_y * map - 50 * map
            },
            course: {
                x: 0,
                y: 0
            },
            speed: {
                x: 2e3,
                y: 0
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
                x: margin_x * map - 100 * map,
                y: margin_y * map
            },
            course: {
                x: 0,
                y: 0
            },
            speed: {
                x: 790e3,
                y: 790e3
            },
            accel: {
                x: 0,
                y: 0
            },
        },
    ];

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

    dots.forEach(function(item){
        var d = item.d / map;
        d < 4 ? d = 4 : 0;
        $('<div>').
            attr("id", item.id).
            css("width", d + "px").
            css("height", d + "px").
            css("background-color", item.color).
            css("-moz-border-radius", d / 2 + "px").
            css("-webkit-border-radius", d / 2 + "px").
            css("border-radius", d / 2 + "px").
            css("position", "absolute").
            css("left", item.x + "px").
            css("top", item.y + "px").
            appendTo("#body");
    });

    var cache = { };

    function move_dots(){
        dots.forEach(function(item1, key1, arr){
            if (item1.location.x < -50 * map                || item1.location.y < -50 * map ||
                item1.location.x > width * map + 50 * map   || item1.location.y > height * map + 10 * map){
                return;
            }
            for (var key2 = key1 + 1; key2 < arr.length; key2++){
                var item2 = arr[key2];
                if (item2.location.x < -10 * map                || item2.location.y < -10 * map ||
                    item2.location.x > width * map - 10 * map   || item2.location.y > height * map - 10 * map){
                    continue;
                }
                log("=========================================================");

                item1.course = v_norm(vv_diff(item1.location, item2.location));
                item2.course = v_norm(vv_diff(item2.location, item1.location));

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

                item1.speed = vv_sum(item1.speed, v_div(item1.accel, freq));
                item2.speed = vv_sum(item2.speed, v_div(item2.accel, freq));

                item1.location = vv_sum(item1.location, v_div(item1.speed, freq));
                item2.location = vv_sum(item2.location, v_div(item2.speed, freq));
                // log("", );
                log("item1.location", item1.location);
                log("item1.course", item1.course);
                log("item1.speed", item1.speed);
                log("item1.accel", item1.accel);
                log("item2.location", item2.location);
                log("item2.course", item2.course);
                log("item2.speed", item2.speed);
                log("item2.accel", item2.accel);

                if (typeof cache[item1.id] == "undefined" ||
                    Math.round(cache[item1.id].x) != Math.round(item1.location.x) ||
                    Math.round(cache[item1.id].y) != Math.round(item1.location.y)){
                    cache[item1.id] = { x: item1.location.x, y: item1.location.y };
                    var i1 = $("#" + item1.id);
                    i1.css("left", item1.location.x / map + "px");
                    i1.css("top", item1.location.y / map + "px");
                }
                if (typeof cache[item2.id] == "undefined" ||
                    Math.round(cache[item2.id].x) != Math.round(item2.location.x) ||
                    Math.round(cache[item2.id].y) != Math.round(item2.location.y)){
                    cache[item2.id] = { x: item2.location.x, y: item2.location.y };
                    var i2 = $("#" + item2.id);
                    i2.css("left", item2.location.x / map + "px");
                    i2.css("top", item2.location.y / map + "px");
                }
            }
        });
        setTimeout(move_dots, 1000 / draw_freq);
    }
    log("======================= START ============================");
    move_dots();
});
