var width;
var height;
var margin;
var scroll = 0;

// В одном пикселе полторы тысячи километров
var start_map = 700e6;
var map = start_map;
var freq = 0.01;

$(function (){
    //var debug = false;
    var debug = true;

    var draw_freq = 100;
    // Гравитационная постоянная
    var G = 6.67408e-11;

    var cache = {
        location_map: { },
        draw_map: { },
        planet_size: { },
        planet_selected: "",
        brakes_state: true,
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
    // Скалярное произведение векторов
    function vv_mult(v1, v2){
        return v1.x * v2.x + v1.y * v2.y
    }
    // Модуль вектора
    function v_length(v){
        return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
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
    // Поворот вектора против часовой
    function v_rotate(v, angle){
        var sin = Math.sin((360 - angle) * Math.PI / 180);
        var cos = Math.cos((360 - angle) * Math.PI / 180);
        return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
    }
    // Поворот вектора кратно 90 градусам против часовой
    function v_rotate_90(v, angle){
        return !angle ? v : v_rotate_90({ x: v.y, y: -v.x }, angle - 90);
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

    // Считаем масштаб на экране
    function scroll_calc_map(){
        map = start_map / 2000 * scroll + start_map / 500;
    }
    // Пересчитываем положение планет на экране и отображаем их
    function planets_draw(){
        // Центруем выбранную планету на экране
        var padding = vv_diff(cache.location_map[cache.planet_selected], margin);
        if (!v_is_null(padding)){
            for (var key in planets){
                var item = planets[key];
                item.location = vv_sum(item.location, v_mult(padding, map));
                cache.location_map[item.id] = v_round(v_div(item.location, map));
            }
        }
        // Отображаем планеты положение которых изменилось
        for (var key in planets){
            var item = planets[key];
            if (!v_is_null(vv_diff(cache.location_map[item.id], cache.draw_map[item.id]))){
                cache.draw_map[item.id] = v_clone(cache.location_map[item.id]);
                if (cache.location_map[item.id].x > -5 && cache.location_map[item.id].y > -5 &&
                    cache.location_map[item.id].x < width + 5 && cache.location_map[item.id].y < height + 5){
                    if ($("#" + item.id).is(":hidden")){
                        $("#" + item.id).
                            show();
                    }
                }else if ($("#" + item.id).is(":visible")){
                        $("#" + item.id).
                            hide();
                }
                var r = cache.planet_size[item.id] / 2;
                $("#" + item.id).
                    css("left", cache.draw_map[item.id].x - r + "px").
                    css("top", cache.draw_map[item.id].y - r + "px");
            }
        }
    }
    // Пересчитываем размеры планет
    function planets_calc_size(){
        // Пересчитываем размеры планет
        for (var key in planets){
            var item = planets[key];

            var min_size = (width > height ? height : width) / 150;
            var d = item.d / map;
            d < min_size ? d = min_size : 0;
            cache.planet_size[item.id] = d;
            var r = cache.planet_size[item.id] / 2;
            $("#" + item.id).
                css("width", cache.planet_size[item.id] + "px").
                css("height", cache.planet_size[item.id] + "px").
                css("-moz-border-radius", r + "px").
                css("-webkit-border-radius", r + "px").
                css("border-radius", r + "px");
            // Очищаем кеш позиций для обновления
            cache.draw_map[item.id] = { x: 0, y: 0 };
        }
        // Пересчитываем положение планет на экране и отображаем их
        planets_draw();
    }
    // Инициализируем планеты
    function planets_create(){
        for (var key in planets){
            var item = planets[key];
            $("<div>").
                attr("id", item.id).
                css("background-color", item.color).
                css("position", "absolute").
                appendTo("#body");
            $("<option>").
                val(item.id).
                text(item.title).
                attr("selected", cache.planet_selected == item.id).
                appendTo("#planet_select");
            if (!v_is_null(item.location)){
                item.location = v_mult(v_norm(item.location), item.distance);
            }
            cache.location_map[item.id] = v_round(v_div(item.location, map));
            // Инициализируем кеш позиций для обновления
            cache.draw_map[item.id] = { x: 0, y: 0 };
        }
    }
    // Задаем начальные скорости планет
    function planets_speed(){
        for (var key1 in planets){
            var item1 = planets[key1];
            for (var key2 in planets){
                var item2 = planets[key2];
                if (item1.id == item2.id){
                    continue;
                }
                item2.course = v_norm(vv_diff(item2.location, item1.location));
                var r = vv_length(item1.location, item2.location);
                // v^2 = G * (M / R)
                var v = Math.sqrt(G * (item1.mass / r)) * 9;
                // Орбита по часовой
                var clockwise = vv_mult(v_rotate(item2.course, 90), item2.speed);
                item2.speed = vv_sum(
                    v_mult(v_rotate(item2.course, 270), v),
                    item2.speed
                );
            }
        }
    }
    function planets_move(){
        for (var key1 in planets){
            var item1 = planets[key1];
            for (var key2 in planets){
                var item2 = planets[key2];
                if (item1.id == item2.id){
                    continue;
                }
                // log("=========================================================");
                item1.course = v_norm(vv_diff(item1.location, item2.location));

                var r = vv_length(item1.location, item2.location);
                // F = G * (m1 * m2 / r^2)
                var F = G * item1.mass * item2.mass / Math.pow(r, 2);
                // a = F / m
                var accel1 = v_mult(item1.course, F / item1.mass);

                item1.accel = vv_sum(item1.accel, v_div(accel1, freq));

                shuttle_move(item1, item2, r);
            }
        }

        for (var key in planets){
            var item = planets[key];
            // log("=========================================================");
            item.speed = vv_sum(item.speed, v_div(item.accel, freq));
            item.accel = v_mult(item.accel, 0);

            item.location = vv_sum(item.location, v_div(item.speed, freq));
            cache.location_map[item.id] = v_round(v_div(item.location, map));
        }

        // Пересчитываем положение планет на экране и отображаем их
        planets_draw();

        setTimeout(planets_move, 1000 / draw_freq);
    }

    var shuttle_distance = 0;
    function shuttle_move(item1, item2, r){
        if (item1.id == "shuttle" &&
                item2.id == cache.planet_selected){
            if (!shuttle_distance){
                shuttle_distance = r;
            }
            // Орбита по часовой
            var clockwise = vv_mult(v_rotate(item1.course, 90), item1.speed);
            // Если расстояние уменьшается
            if (shuttle_distance - r >= 0){
                // Увеличиваем скорость до предела
                if (r > 60e6 &&
                        shuttle_distance - r < 1000e3 &&
                        // Если планета в той же стороне в которую направляемся
                        vv_mult(item1.course, item1.speed) >= 0){
                    $("#" + item1.id).
                        css("background-color", "#fff000");
                    item1.accel = vv_sum(
                                        item1.accel,
                                        v_mult(
                                            clockwise > 0 ?
                                                // Ускоряемся левее
                                                v_rotate(item1.course, 15) :
                                                // Ускоряемся правее
                                                v_rotate(item1.course, 345),
                                            item1.speed_accel
                                        )
                                    );
                }else{
                    $("#" + item1.id).
                        css("background-color", "#ff0000");
                }
            // Если расстояние увеличивается
            }else if (shuttle_distance - r < 0 && r > 45e6 && cache.brakes_state){
                $("#" + item1.id).
                    css("background-color", "#0000ff");
                item1.accel = vv_sum(
                                    item1.accel,
                                    v_mult(
                                        clockwise > 0 ?
                                            v_rotate(item1.course, 350) :
                                            v_rotate(item1.course, 10),
                                        item1.speed_accel
                                    )
                                );
            }else if (r < 40e6){
                $("#" + item1.id).
                    css("background-color", "#fff000");
                item1.accel = vv_sum(
                                    item1.accel,
                                    v_mult(
                                        item1.course,
                                        item1.speed_accel * 0.01
                                    )
                                );
            }
            shuttle_distance = r;
        }
    }

    $("#brakes").change(function(){
        cache.brakes_state = $("#brakes").is(':checked');
    });
    $("#planet_select").change(function(){
        cache.planet_selected = $("#planet_select").val();
        /*$("#brakes").
            prop("checked", false).
            trigger("change");
        setTimeout(function(){
            $("#brakes").
                prop("checked", true).
                trigger("change");
        }, 3000);*/
    });
    $("#map_select").scroll(function (){
        scroll = $("#map_select").scrollTop();
        // Пересчитываем масштаб
        scroll_calc_map();
        // Пересчитываем размеры планет
        planets_calc_size();
        return false;
    });
    $('#body').
        bind("mousewheel DOMMouseScroll", function(event){
            var scroll_max = $("#map_option").height() - $("#map_select").height();
            if (event.originalEvent && event.originalEvent.wheelDelta ?
                    event.originalEvent.wheelDelta < 0 :
                    event.originalEvent.detail > 0) {
                if (scroll < scroll_max) {
                    scroll = scroll + scroll_max / 2000;
                    if (scroll > scroll_max){
                        scroll = scroll_max;
                    }
                    $("#map_select").
                        scrollTop(scroll);
                }
            } else {
                if (scroll > 0) {
                    scroll = scroll - scroll_max / 2000;
                    if (scroll < 0){
                        scroll = 0;
                    }
                    $("#map_select").
                        scrollTop(scroll);
                }
            }
            return false;
        });

    $(window).resize(function(){
        $("#body").
            height($(window).height() - 10);
        width = $("#body").width();
        height = $("#body").height();
        margin = v_round(v_div({ x: width, y: height }, 2));
        // Пересчитываем размеры планет
        planets_calc_size();
    });
    // log("======================= START ============================");
    // Считаем масштаб на экране
    scroll_calc_map();
    // Инициализируем планеты
    planets_create();
    // Выбираем текущую планету
    $("#planet_select").
        trigger("change");
    // Размеры экрана (пересчитываем размер планет, центруем планеты)
    $(window).trigger("resize");
    // Задаем начальные скорости планет
    planets_speed();
    // Елементы управления шатлом
    $("#brakes").
        prop("checked", cache.brakes_state).
        trigger("change");
    // Запускаем движение планет
    planets_move();
});
