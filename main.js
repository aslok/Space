var width;
var height;
var margin;
$(function (){
    $(window).resize(function() {
        $("#body").
            height($(window).height() - 10);
        width = $("#body").width();
        height = $("#body").height();
        margin = { x: Math.round(width / 2), y: Math.round(height / 2) };
    });

    $(window).trigger('resize');

    var debug = false;
    //var debug = false;

    var freq = 0.01;
    var draw_freq = 100;
    // В одном пикселе три тысячи километров
    var map = 1500e3;
    // Гравитационная постоянная
    var G = 6.67408e-11;
    // Расстояние до луны
    var l = 384403e3;

    var dots = [
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
                x: -2e3,
                y: 0
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
            color: "#0000ff",
            location: {
                x: l * 2,
                y: 0
            },
            course: {
                x: 0,
                y: 0
            },
            speed: {
                x: -8e3,
                y: -1e3
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

    var cache = { };
    var cache_draw = { };

    dots.forEach(function(item){
        var d = item.d / map;
        d < 4 ? d = 4 : 0;
        cache[item.id] = v_round(v_div(item.location, map));
        cache_draw[item.id] = v_clone(cache[item.id]);
        $('<div>').
            attr("id", item.id).
            css("width", d + "px").
            css("height", d + "px").
            css("background-color", item.color).
            css("-moz-border-radius", d / 2 + "px").
            css("-webkit-border-radius", d / 2 + "px").
            css("border-radius", d / 2 + "px").
            css("position", "absolute").
            css("left", margin.x + cache_draw[item.id].x + "px").
            css("top", margin.y + cache_draw[item.id].y + "px").
            appendTo("#body");
    });

    function move_dots(){
        dots.forEach(function(item1, key1, arr){
            /*if (item1.location.x < -50 * map                || item1.location.y < -50 * map ||
                item1.location.x > width * map + 50 * map   || item1.location.y > height * map + 10 * map){
                return;
            }*/
            for (var key2 = key1 + 1; key2 < arr.length; key2++){
                var item2 = arr[key2];
                /*if (item2.location.x < -10 * map                || item2.location.y < -10 * map ||
                    item2.location.x > width * map - 10 * map   || item2.location.y > height * map - 10 * map){
                    continue;
                }*/
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
        dots.forEach(function(item, key1, arr){
            /*if (item.location.x < -50 * map                || item.location.y < -50 * map ||
                item.location.x > width * map + 50 * map   || item.location.y > height * map + 10 * map){
                return;
            }*/
            log("=========================================================");

            item.speed = vv_sum(item.speed, v_div(item.accel, freq));
            log("item.speed", item.speed);
            log("item.accel", item.accel);
            item.accel = v_mult(item.accel, 0);

            item.location = vv_sum(item.location, v_div(item.speed, freq));
            log("item.location", item.location);
            cache[item.id] = v_round(v_div(item.location, map));
            // log("", );
        });
        var padding = vv_diff(cache["earth"], margin);
        if (!v_is_null(padding)){
            dots.forEach(function(item, key1, arr){
                //console.log("///////");
                //console.log(item.location);
                item.location = vv_sum(item.location, v_mult(padding, map));
                cache[item.id] = v_round(v_div(item.location, map));
                //console.log(item.location);
            });
        }
        dots.forEach(function(item, key1, arr){
            if (!v_is_null(vv_diff(cache[item.id], cache_draw[item.id]))){
                cache_draw[item.id] = v_clone(cache[item.id]);
                var i1 = $("#" + item.id);
                i1.css("left", cache_draw[item.id].x + "px");
                i1.css("top", cache_draw[item.id].y + "px");
            }
        });
        setTimeout(move_dots, 1000 / draw_freq);
    }
    log("======================= START ============================");
    move_dots();
});
