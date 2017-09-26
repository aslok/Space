var width;
var height;
var margin;
var scroll = 0;

// В одном пикселе map метров
var map;
var map_start = 1.4e6;
var map_end = 700e6;
// В одном кадре freq виртуальных секунд
var freq = 250;

$(function (){
    var debug = false;
    debug = true;

    var v_debug = false;
    //v_debug = true;

    // В одной реальной секунде draw_freq кадров
    var draw_freq = 100;
    // Гравитационная постоянная
    var G = 6.67408e-11;

    var map_height = $("#map_option").height() - $("#map_select").height();

    var cache = {
        draw_map: { },
        planet_selected: "earth",
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
    function obj_length(obj){
        var cnt = 0;
        for (var key in obj){
            cnt++;
        }
        return cnt;
    }

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
    function v_draw(v1, v2, color){
        var canvas = document.getElementById("background").getContext("2d");
        canvas.beginPath();
        canvas.lineWidth = 1;
        canvas.strokeStyle = color;
        canvas.moveTo(v1.x, v1.y);
        canvas.lineTo(v2.x, v2.y);
        canvas.stroke();
    }
    function v_draw_circle(v, r, color){
        var canvas = document.getElementById("background").getContext("2d");
        canvas.beginPath();
        canvas.lineWidth = 1;
        canvas.strokeStyle = color;
        canvas.arc(v.x, v.y, r, 0, 2 * Math.PI);
        canvas.stroke();
    }
    function v_draw_clear(){
        var canvas = document.getElementById("background").getContext("2d");
        canvas.clearRect(0, 0, width, height);
        canvas.stroke();
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
    // Сложить вектор и скаляр
    function v_sum(v, k){
        return { x: v.x + k, y: v.y + k };
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
    // Вектор нулевой
    function v_null(){
        return { x: 0, y: 0 };
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
        map = map_start + map_end / 2000 * scroll;
    }
    // Пересчитываем размеры планет
    function planets_calc_size(){
        // Пересчитываем размеры планет
        for (var key in planets){
            var item = planets[key];

            var min_size = (width > height ? height : width) / 150;
            var d = item.d / map;
            item.size_map = d > min_size ? d : min_size;
            var r = item.size_map / 2;
            item.obj.
                css("width", item.size_map + "px").
                css("height", item.size_map + "px").
                css("-moz-border-radius", r + "px").
                css("-webkit-border-radius", r + "px").
                css("border-radius", r + "px");
            // Очищаем кеш позиций для обновления
            cache.draw_map[key] = v_null();
        }
        // Пересчитываем положение планет на экране и отображаем их
        planets_draw();
    }
    // Инициализируем планеты
    function planets_create(){
        var done = { };
        do{
            for (var key in planets){
                var item = planets[key];
                if (typeof done[key] != "undefined" || (item.orbit && typeof done[item.orbit] == "undefined")){
                    continue;
                }
                $("<div>").
                    attr("id", key).
                    css("background-color", item.color).
                    appendTo("#planets");
                $("<option>").
                    val(key).
                    text(item.title).
                    attr("selected", cache.planet_selected == key).
                    appendTo("#planet_select");
                if (!v_is_null(item.location)){
                    item.location = vv_sum(done[item.orbit], v_mult(v_norm(item.location), item.distance));
                }
                item.obj = $("#" + key);
                item.speed = v_null();
                item.accel = v_null();
                item.size_map = 0;
                item.location_map = v_round(v_div(item.location, map));
                // Инициализируем кеш позиций для обновления
                cache.draw_map[key] = v_null();
                done[key] = item.location;
            }
        }while(obj_length(done) < planets.length);
    }
    // Задаем начальные скорости планет
    function planets_speed(){
        for (var key1 in planets){
            var item1 = planets[key1];
            for (var key2 in planets){
                var item2 = planets[key2];
                if (key1 == key2){
                    continue;
                }
                var course = v_norm(vv_diff(item2.location, item1.location));
                var r = vv_length(item1.location, item2.location);
                // v^2 = G * (M / R)
                var v = Math.sqrt(G * (item1.mass / r));
                item2.speed = vv_sum(
                    v_mult(v_rotate(course, 270), v),
                    item2.speed
                );
                // F = G * (m1 * m2 / r^2)
                var F = G * (item2.mass * item1.mass / Math.pow(r, 2));
                // a = F / m
                var a = v_mult(course, F / item2.mass);
                // Добавляем ускорение направленное к item1 планете item2
                item2.accel = vv_sum(item2.accel, a);
            }
        }
    }
    // Движение планет - периодически обновляем положение
    function planets_move(){
        for (var key in planets){
            var item = planets[key];
            // Считаем текущую скорость складывая скорость и полученное ускорение
            // V = Vo + a * t
            item.speed = vv_sum(item.speed, v_mult(item.accel, freq), 0);
            // Пересчитываем текущее положение - добавляем текущую скорость умноженную на частоту
            // X = Xo + Vo * t
            item.location = vv_sum(item.location, v_mult(item.speed, freq));
            item.location_map = v_round(v_div(item.location, map));
        }

        // Складываем текущее ускорение от каждой планеты
        for (var key1 in planets){
            var item1 = planets[key1];
            // Обнуляем ускорение
            item1.accel = v_mult(item1.accel, 0);
            for (var key2 in planets){
                var item2 = planets[key2];
                if (key1 == key2){
                    continue;
                }
                // log("=========================================================");
                var course = v_norm(vv_diff(item1.location, item2.location));
                var r = vv_length(item1.location, item2.location);
                // F = G * (m1 * m2 / r^2)
                var F = G * item1.mass * item2.mass / Math.pow(r, 2);
                // a = F / m
                var a = v_mult(course, F / item1.mass);
                // Добавляем ускорение направленное к item2 планете item1
                item1.accel = vv_sum(item1.accel, a);

                if (key1 == "shuttle" && key2 == cache.planet_selected){
                    shuttle_move(item1, item2, r);
                }
            }
        }

        // Пересчитываем положение планет на экране и отображаем их
        planets_draw();

        setTimeout(planets_move, 1000 / draw_freq);
    }
    // Пересчитываем положение планет на экране и отображаем их
    function planets_draw(){
        // Центруем выбранную планету на экране
        var padding = vv_diff(planets[cache.planet_selected].location_map, margin);
        if (!v_is_null(padding)){
            for (var key in planets){
                var item = planets[key];
                item.location = vv_sum(item.location, v_mult(padding, map));
                item.location_map = v_round(v_div(item.location, map));
            }
        }
        // Очищаем траектории орбит
        v_draw_clear();
        // Отображаем планеты положение которых изменилось
        for (var key in planets){
            var item = planets[key];
            // Отображаем приблизительные траектории орбит
            if (item.orbit){
                v_draw_circle(
                    planets[item.orbit].location_map,
                    item.distance / map,
                    "#222"
                );
            }
            if (v_debug && item.obj.is(":visible")){
                // Отображаем вектор ускорения
                v_draw(
                    item.location_map,
                    vv_sum(
                        item.location_map,
                        v_round(v_mult(item.accel, 10000))
                    ),
                    "#ff0000"
                );
                // Отображаем вектор скорости
                v_draw(
                    item.location_map,
                    vv_sum(
                        item.location_map,
                        v_round(v_div(item.speed, 1000))
                    ),
                    "#00ff00"
                );
            }
            if (!v_is_null(vv_diff(item.location_map, cache.draw_map[key]))){
                cache.draw_map[key] = v_clone(item.location_map);
                // Если планета в видимой области
                if (item.location_map.x > -5 && item.location_map.y > -5 &&
                    item.location_map.x < width + 5 && item.location_map.y < height + 5){
                    var planet_center = v_sum(cache.draw_map[key], item.size_map / -2);
                    item.obj.
                        css("left", planet_center.x + "px").
                        css("top", planet_center.y + "px");
                    if (item.obj.is(":hidden")){
                        item.obj.
                            show();
                    }
                }else if (item.obj.is(":visible")){
                    item.obj.
                        hide();
                }
            }
        }
    }

    var shuttle_distance = 0;
    function shuttle_move(item1, item2, r){
        if (!shuttle_distance){
            shuttle_distance = r;
        }
        var course = v_norm(vv_diff(item1.location, item2.location));
        // Орбита по часовой
        var clockwise = vv_mult(v_rotate(course, 90), item1.speed);
        // Если расстояние уменьшается
        if (shuttle_distance - r >= 0){
            // Увеличиваем скорость до предела
            if (r > 60e6 &&
                    shuttle_distance - r < 1000e3 &&
                    // Если планета в той же стороне в которую направляемся
                    vv_mult(course, item1.speed) >= 0){
                item.obj.
                    css("background-color", "#fff000");
                item1.accel = vv_sum(
                                    item1.accel,
                                    v_mult(
                                        clockwise > 0 ?
                                            // Ускоряемся левее
                                            v_rotate(course, 15) :
                                            // Ускоряемся правее
                                            v_rotate(course, 345),
                                        item1.speed_accel
                                    )
                                );
            }else{
                item1.obj.
                    css("background-color", "#ff0000");
            }
        // Если расстояние увеличивается
        }else if (shuttle_distance - r < 0 && r > 45e6 && cache.brakes_state){
            item1.obj.
                css("background-color", "#0000ff");
            item1.accel = vv_sum(
                                item1.accel,
                                v_mult(
                                    clockwise > 0 ?
                                        v_rotate(course, 350) :
                                        v_rotate(course, 10),
                                    item1.speed_accel
                                )
                            );
        }else if (r < 40e6){
            item1.obj.
                css("background-color", "#fff000");
            item1.accel = vv_sum(
                                item1.accel,
                                v_mult(
                                    course,
                                    item1.speed_accel * 0.01
                                )
                            );
        }
        shuttle_distance = r;
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
            if (event.originalEvent && event.originalEvent.wheelDelta ?
                    event.originalEvent.wheelDelta < 0 :
                    event.originalEvent.detail > 0) {
                if (scroll < map_height) {
                    scroll = scroll + map_height / 2000;
                    if (scroll > map_height){
                        scroll = map_height;
                    }
                    $("#map_select").
                        scrollTop(scroll);
                }
            } else {
                if (scroll > 0) {
                    scroll = scroll - map_height / 2000;
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
            height($(window).height());
        width = $("#body").width();
        height = $("#body").height();
        margin = v_round(v_div({ x: width, y: height }, 2));
        $("#background").
            attr("width", width).
            attr("height", height);
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
    // Движение планет - периодически обновляем положение
    planets_move();
});
