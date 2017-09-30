var screen_size;
var margin;
var scroll = 600;

// В одном пикселе map метров
var map;
var map_start = 10e4;
var map_end = 15e9;
// В одном кадре freq виртуальных секунд
var freq = 1000;

$(function (){
    var debug = false;
    debug = true;

    var v_debug = false;
    v_debug = true;

    // В одной реальной секунде draw_freq кадров
    var draw_freq = 1000;
    // Гравитационная постоянная
    var G = 6.67408e-11;
    // Астрономическая единица
    var ua = 0.149597870691e12;

    var map_height = $("#map_option").height() - $("#map_select").height();

    var cache = {
        draw_map: { },
        planet_selected: "earth",
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
        canvas.clearRect(0, 0, screen_size.x, screen_size.y);
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
        if (!(angle % 90)){
            return v_rotate_90(v, angle);
        }
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
    function v_in_rectangle(v, v_topleft, v_downright){
        return v.x > v_topleft.x && v.y > v_topleft.y && v.x < v_downright.x && v.y < v_downright.y ?
            true :
            false;
    }

    // Считаем масштаб на экране
    function scroll_calc_map(){
        map = map_start + map_end / Math.pow(2000, 2) * Math.pow(scroll, 2);
        for (var key in planets){
            var item = planets[key];
            // Пересчитываем положение планет на экране
            item.location_map = v_round(v_div(item.location, map));
        }
    }
    // Пересчитываем размеры планет
    function planets_calc_size(){
        // Пересчитываем размеры планет
        for (var key in planets){
            var item = planets[key];

            var min_size = (screen_size.x > screen_size.y ? screen_size.y : screen_size.x) / 150;
            var d = (item.rings ? item.d * item.rings : item.d) / map;
            item.size_map = d > min_size ? d : min_size;
            var r = item.size_map / 2;
            item.obj.
                css("width", item.size_map + "px").
                css("height", item.size_map + "px").
                css("-moz-border-radius", (item.color ? r : 0) + "px").
                css("-webkit-border-radius", (item.color ? r : 0) + "px").
                css("border-radius", (item.color ? r : 0) + "px");
            cache.draw_map[key] = v_null();
        }
        // Пересчитываем положение планет на экране и отображаем их
        planets_draw();
    }
    // Инициализируем планеты
    function planets_create(){
        var done = { };
        var orbit_index = [ ];
        do{
            for (var key in planets){
                var item = planets[key];
                if (typeof done[key] != "undefined" || (item.orbit && typeof done[item.orbit] == "undefined")){
                    continue;
                }
                orbit_index[key] = (item.orbit ? orbit_index[item.orbit] : parseInt($("#planets").css("z-index"))) - 1;
                $("<div>").
                    attr("id", key).
                    attr("alt", item.title).
                    attr("title", item.title).
                    css("background-color", item.color ? item.color : "rgba(0, 0, 0, 0)").
                    css("background-image", item.color ? "none" : 'url("img/' + key + '.png")').
                    css("z-index", orbit_index[key]).
                    appendTo("#planets");
                item.obj = $("#" + key);
                if (key.indexOf("asteroid") < 0){
                    $("<option>").
                        val(key).
                        text(item.title).
                        attr("selected", cache.planet_selected == key).
                        appendTo("#planet_select");
                }else{
                    item.obj.
                        addClass("asteroid");
                }
                if (!v_is_null(item.location)){
                    item.location = vv_sum(done[item.orbit], v_mult(v_norm(item.location), item.distance));
                }
                item.speed = v_null();
                item.accel = v_null();
                item.size_map = 0;
                // Пересчитываем положение планет на экране
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
                var course = v_norm(vv_diff(item1.location, item2.location));
                var r = vv_length(item2.location, item1.location);
                // v^2 = G * (M / R)
                var v = Math.sqrt(G * (item2.mass / r));
                if (key1.indexOf("asteroid") >= 0 && key2 == item1.orbit){
                    item1.speed = vv_sum(
                                    item1.speed,
                                    v_mult(
                                        v_rotate(course, 270),
                                        v / 100 * (Math.floor(Math.random() * 100) + 50)
                                    )
                                );
                    continue;
                }
                // var speed = v_mult(speed, (Math.floor(Math.random() * 60) + 40) / 100);
                item1.speed = vv_sum(item1.speed, v_mult(v_rotate(course, 270), v));
                // F = G * (m1 * m2 / r^2)
                var F = G * (item1.mass * item2.mass / Math.pow(r, 2));
                // a = F / m
                var a = v_mult(course, F / item1.mass);
                // Добавляем планете item1 ускорение направленное к item2
                item1.accel = vv_sum(item1.accel, a);
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
            // Пересчитываем положение планет на экране
            item.location_map = v_round(v_div(item.location, map));
        }

        // Столкновения планет
        planets_clash();

        // Пересчитываем положение планет на экране и отображаем их
        planets_draw();

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
                // Добавляем планете item1 ускорение направленное к item2
                item1.accel = vv_sum(item1.accel, a);

                /*if (key1 == "shuttle" && key2 == cache.planet_selected){
                    shuttle_move(item1, item2, r);
                }*/
            }
        }

        show_fps();

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
                // Пересчитываем положение планет на экране
                item.location_map = v_round(v_div(item.location, map));
            }
        }
        // Очищаем траектории орбит
        v_draw_clear();
        // Отображаем планеты положение которых изменилось
        for (var key in planets){
            var item = planets[key];
            // Отображаем приблизительные траектории орбит
            if (item.orbit && key.indexOf("asteroid") < 0){
                v_draw_circle(
                    planets[item.orbit].location_map,
                    item.distance / map,
                    "#444"
                );
            }
            if (!v_is_null(vv_diff(item.location_map, cache.draw_map[key]))){
                cache.draw_map[key] = v_clone(item.location_map);
                // Если планета в видимой области
                if (v_in_rectangle(item.location_map, v_sum(v_null(), -5), screen_size)){
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
    function planets_clash(){
        for (var key1 in planets){
            var item1 = planets[key1];
            for (var key2 in planets){
                var item2 = planets[key2];
                if (key1 == key2 || item1.mass > item2.mass){
                    continue;
                }
                var r = vv_length(item1.location, item2.location);
                if (r > item1.d / 2 + item2.d / 2){
                    continue
                }
                item1.obj.
                    remove();
                item2.mass += item1.mass;
                item2.d = 2 * Math.sqrt(3 * (item2.mass / 3.5e10) / (4 * Math.PI), 3);
                planets_calc_size();
                $("#planet_select > option[value=" + key1 + "]").
                    remove();
                if (key1 == cache.planet_selected){
                    cache.planet_selected = key2;
                }
                delete planets[key1];
            }
        }
    }

    var time_prev = 0;
    var fps_cnt = 0;
    function show_fps(){
        var time = uptime();
        if (time - time_prev > 1000){
            $("#fps").
                text(fps_cnt + " fps");
            fps_cnt = 0;
            time_prev = time;
        }
        fps_cnt++;
    }

    function shuttle_move(item1, item2, r){
        if (r < item1.distance * 1.5){
            return;
        }
        var course = v_norm(vv_diff(item1.location, item2.location));
        var speed = v_norm(vv_diff(item2.speed, item1.speed));
        var accel = v_norm(vv_diff(item2.accel, item1.accel));
        var course_ok = vv_mult(speed, v_rotate(course, 90)) > 0 && vv_mult(speed, v_rotate(course, 274)) > 0;
        if (v_debug && item1.obj.is(":visible")){
            v_draw(
                item1.location_map,
                vv_sum(
                    item1.location_map,
                    v_mult(course, 500)
                ),
                course_ok ? "#fff" : "#f00"
            );
            v_draw(
                item1.location_map,
                vv_sum(
                    item1.location_map,
                    v_div(speed, freq)
                ),
                "#0f0"
            );
            v_draw(
                item1.location_map,
                vv_sum(
                    item1.location_map,
                    v_mult(accel, 1e2)
                ),
                "#00f"
            );
        }
        if (course_ok){
            /*item1.speed = vv_sum(item1.speed,
                                v_mult(speed, item1.speed_accel));*/
        }
    }

    function planets_generator(id, title, cnt, key, r_min, r_max, mass_min, mass_max, color){
        var r_2_min = Math.pow(r_min, 2);
        var r_2_max = Math.pow(r_max, 2);
        for (var f = 0; f < cnt; f++){
            var mass = Math.random() * (mass_max - mass_min) + mass_min;
            planets[id + f] = {
                title: title,
                mass: mass,
                d: 2 * Math.pow((mass / 2173.9130434782607 / Math.PI) * (3 / 4), 1 / 3),
                orbit: key,
                distance: Math.sqrt(Math.random() * (r_2_max - r_2_min) + r_2_min, 2),
                speed_accel: 0,
                color: color,
                location: {
                    x: Math.random() * 2 - 1,
                    y: Math.random() * 2 - 1
                },
            };
        }
    }
    function scroll_up(k){
        if (scroll > 0) {
            var dec = map_height / 2000;
            if (typeof k != "undefined"){
                dec *= k;
            }
            scroll = scroll - dec;
            if (scroll < 0){
                scroll = 0;
            }
            $("#map_select").
                scrollTop(scroll);
        }
    }
    function scroll_down(k){
        if (scroll < map_height) {
            var inc = map_height / 2000;
            if (typeof k != "undefined"){
                inc *= k;
            }
            scroll = scroll + inc;
            if (scroll > map_height){
                scroll = map_height;
            }
            $("#map_select").
                scrollTop(scroll);
        }
    }

    $("#planet_select").change(function(){
        cache.planet_selected = $("#planet_select").val();
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
            $("#map_option").height($("#map_select").height() * 10 + $("#map_select").height());
            if (event.originalEvent && event.originalEvent.wheelDelta ?
                    event.originalEvent.wheelDelta < 0 :
                    event.originalEvent.detail > 0) {
                scroll_down(scroll * 1.666666667 / 10 + 1);
            } else {
                scroll_up(scroll * 0.6 / 10 + 1);
            }
            return false;
        });

    $(window).resize(function(){
        $("#body").
            height($(window).height());
        screen_size = { x: $("#body").width(), y: $("#body").height() };
        margin = v_round(v_div(screen_size, 2));
        $("#background").
            attr("width", screen_size.x).
            attr("height", screen_size.y);
        // Пересчитываем размеры планет
        planets_calc_size();
    });
    // log("======================= START ============================");
    planets_generator("asteroid_belt_", "Пояс астероидов", 200, "sun", 2.2 * ua, 3.6 * ua, 15e16, 12e17, "#595959");
    planets_generator("asteroid_centaur_", "Кентавры", 8, "sun", 15.87 * ua, 25.157 * ua, 2e17, 2e19, "#595959");
    planets_generator("asteroid_kuiper_", "Пояс Койпера", 12, "sun", 29.57 * ua, 101 * ua, 36e19, 16e21, "#595959");
    $("#map_select").
        scrollTop(scroll);
    // Считаем масштаб на экране
    scroll_calc_map();
    // Инициализируем планеты
    planets_create();
    // Выбираем текущую планету
    $("#planet_select").
        trigger("change");
    $("#planets > div").click(function (){
        if (!$("#planet_select > option[value=\"" + $(this).attr("id") + "\"").length){
            return;
        }
        $("#planet_select").
            val($(this).attr("id")).
            trigger("change");
    });
    $("#body").
        hammer().
            // Нажали и тянем
            bind("pandown", function () { scroll_up(scroll * 0.6 / 25 + 1); }).
            bind("panup", function () { scroll_down(scroll * 1.666666667 / 25 + 1); }).
            bind("pinchout", function () { scroll_up(scroll * 0.6 / 10 + 1); }).
            bind("pinchin", function () { scroll_down(scroll * 1.666666667 / 10 + 1); });
    $("#body").
        data("hammer").get("pan").set({ enable: true, direction: Hammer.DIRECTION_VERTICAL });
    $("#body").
        data("hammer").get("pinch").set({ enable: true });
    // Размеры экрана (пересчитываем размер планет, центруем планеты)
    $(window).trigger("resize");
    // Задаем начальные скорости планет
    planets_speed();
    // Движение планет - периодически обновляем положение
    planets_move();
});
