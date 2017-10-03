var screen_size;
var margin;
var scroll = 20;

// В одном пикселе map метров
var map;
var map_start = 10e4;
var map_end = 15e9;
// В одном кадре freq виртуальных секунд
// 300 = 5 мин, 600 = 10 мин, 900 = 15 мин, 1200 = 20 мин
var freq = 300;

$(function (){
    var debug = false;
    debug = true;

    var v_debug = false;
    //v_debug = true;

    // В одной реальной секунде draw_freq кадров, если 0 то без ограничений
    var draw_freq = 0;
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
        return v_new(v1.x + v2.x, v1.y + v2.y);
    }
    // Вычитание векторов
    function vv_diff(v1, v2){
        return v_new(v2.x - v1.x, v2.y - v1.y);
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
        return v_new(v.x / r, v.y / r);
    }
    // Сложить вектор и скаляр
    function v_sum(v, k){
        return v_new(v.x + k, v.y + k);
    }
    // Умножение вектора на скаляр
    function v_mult(v, k){
        return v_new(v.x * k, v.y * k);
    }
    // Деление вектора на скаляр
    function v_div(v, k){
        return v_new(v.x / k, v.y / k);
    }
    // Поворот вектора против часовой
    function v_rotate(v, angle){
        if (!(angle % 90)){
            return v_rotate_90(v, angle);
        }
        var sin = Math.sin((360 - angle) * Math.PI / 180);
        var cos = Math.cos((360 - angle) * Math.PI / 180);
        return v_new(v.x * cos - v.y * sin, v.x * sin + v.y * cos);
    }
    // Поворот вектора кратно 90 градусам против часовой
    function v_rotate_90(v, angle){
        return !angle ? v : v_rotate_90(v_new(v.y, -v.x), angle - 90);
    }
    // Угол между векторами
    function vv_angle(v1, v2){
        return vv_norm_angle(v_norm(v1), v_norm(v2))
    }
    // Угол между нормализованными векторами
    function vv_norm_angle(v1, v2){
        return Math.rad2deg(Math.acos(vv_mult(v1, v2)));
    }
    // Создаем вектор
    function v_new(x, y){
        return { x: x, y: y };
    }
    // Вектор нулевой?
    function v_is_null(v){
        return !v.x && !v.y;
    }
    // Копируем вектор
    function v_clone(v){
        return v_new(v.x, v.y);
    }
    // Округляем вектор
    function v_round(v){
        return v_new(Math.round(v.x), Math.round(v.y));
    }
    function v_in_rectangle(v, v_topleft, v_downright){
        return v.x > v_topleft.x && v.y > v_topleft.y && v.x < v_downright.x && v.y < v_downright.y ?
            true :
            false;
    }
    Math.deg2rad = function(degrees) {
      return degrees * Math.PI / 180;
    };

    Math.rad2deg = function(radians) {
      return radians * 180 / Math.PI;
    };
    function show_speed_accel(id, location_map){
        if (!v_debug){
            return;
        }
        var item1 = planets[id];
        var item2 = planets[item1.orbit];
        var speed = vv_diff(item2.speed, item1.speed);
        var accel = vv_diff(item2.accel, item1.accel);
        // Процент от исходной высоты над поверхностью
        /*log(Math.round((vv_length(item1.location, item2.location) - item1.d / 2 - item2.d / 2) /
                        (item1.distance - item1.d / 2 - item2.d / 2) *
                        100) + "%");*/
        if (typeof location_map == "undefined"){
            location_map = item1.location_map;
        }
        v_draw(
            location_map,
            vv_sum(
                location_map,
                v_div(speed, map / 5e2),
            ),
            "#0f0"
        );
        v_draw(
            location_map,
            vv_sum(
                location_map,
                v_div(accel, map / 35e5),
            ),
            "#00f"
        );
        return location_map;
    }

    // Считаем масштаб на экране
    function scroll_calc_map(){
        map = map_start + map_end / Math.pow(2000, 2) * Math.pow(scroll, 2);
        for (var key in planets){
            var item = planets[key];
            // Пересчитываем положение планет на экране
            item.location_map = v_div(item.location, map);
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
            cache.draw_map[key] = v_new(0, 0);
        }
        // Пересчитываем положение планет на экране и отображаем их
        planets_draw();
    }
    var satellite_cnt;
    var orbit_index;
    // Инициализируем планеты
    function planets_create(orbit){
        if (typeof orbit == "undefined" || !orbit){
            orbit = "";
            orbit_index = 0;
            satellite_cnt = { };
            for (var key in planets){
                var item = planets[key];
                if (!item.orbit || key.indexOf("asteroid") >= 0){
                    continue;
                }
                if (typeof satellite_cnt[item.orbit] == "undefined"){
                    satellite_cnt[item.orbit] = 0;
                }
                satellite_cnt[item.orbit]++;
            }
        }
        orbit_index++;

        var siblings = orbit ? satellite_cnt[orbit] : 0;
        for (var key in planets){
            var item = planets[key];
            if (item.orbit != orbit){
                continue;
            }
            $("<div>").
                attr("id", key).
                attr("alt", item.title).
                attr("title", item.title).
                css("background-color", item.color ? item.color : "rgba(0, 0, 0, 0)").
                css("background-image", item.color ? "none" : 'url("img/' + key + '.png")').
                css("z-index", 101 - orbit_index).
                appendTo("#planets");
            item.obj = $("#" + key);
            if (key.indexOf("asteroid") >= 0){
                item.obj.
                    addClass("asteroid");
            }else{
                var prefix = "";
                if (orbit){
                    for (var f = 1; f < orbit_index - 1; f++){
                        prefix += "║&nbsp;&nbsp;&nbsp;&nbsp;";
                    }
                    prefix += (--siblings ? "╠══" : "╚══") +
                                (typeof satellite_cnt[key] != "undefined" ? "╦═" : "══") +
                                "&nbsp;";
                }
                $("<option>").
                    val(key).
                    html(prefix + item.title).
                    attr("selected", cache.planet_selected == key).
                    appendTo("#planet_select");
            }
            if (item.distance){
                item.location = vv_sum(planets[item.orbit].location, v_mult(v_norm(item.location), item.distance));
            }
            item.speed = v_new(0, 0);
            item.accel = v_new(0, 0);
            item.size_map = 0;
            // Пересчитываем положение планеты на экране
            item.location_map = v_div(item.location, map);
            // Инициализируем кеш позиций для обновления
            cache.draw_map[key] = v_new(0, 0);
            // Создаем спутники планеты
            planets_create(key);
        }
        orbit_index--;
    }
    // Задаем начальные скорости планет
    function planets_speed_start(orbit){
        if (typeof orbit == "undefined" || !orbit){
            orbit = "";
        }
        for (var key in planets){
            var item = planets[key];
            if (item.orbit != orbit){
                continue;
            }
            if (orbit){
                var course = v_norm(vv_diff(item.location, planets[orbit].location));
                var r = vv_length(item.location, planets[orbit].location);
                // v^2 = G * (M / R)
                var v = Math.sqrt(G * (planets[orbit].mass / r));
                item.speed = vv_sum(planets[orbit].speed, v_mult(v_rotate(course, 270), v));
            }
            planets_speed_start(key);
        }
    }
    // Пересчитываем скорости и положение планет
    function planets_speed(frequency){
        for (var key in planets){
            var item = planets[key];
            // Считаем текущую скорость складывая скорость и полученное ускорение
            // V = Vo + a * t
            item.speed = vv_sum(item.speed, v_mult(item.accel, frequency));
            // Пересчитываем текущее положение - добавляем текущую скорость умноженную на частоту
            // X = Xo + Vo * t
            item.location = vv_sum(item.location, v_mult(item.speed, frequency));
            // Пересчитываем положение планет на экране
            item.location_map = v_div(item.location, map);
        }
    }
    // Пересчитываем ускорения от гравитации планет
    function planets_accel(){
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
    }
    // Движение планет - периодически обновляем положение
    function planets_move(){
        //var location_map = show_speed_accel("shuttle");
        var frequency = freq / 20;
        for (var f = 0; f < 10; f++){
            // Пересчитываем ускорения от гравитации планет
            planets_accel();
            // Пересчитываем скорости и положение планет
            planets_speed(frequency);
        }
        //show_speed_accel("shuttle", location_map);
        // Столкновения планет
        planets_clash();
        // Пересчитываем положение планет на экране и отображаем их
        planets_draw();
        show_speed_accel("shuttle");
        // Отображаем количество кадров за последнюю секунду
        show_fps();
        // Считаем игровую дату
        calc_date();
        setTimeout(planets_move, !draw_freq ? 0 : 1000 / draw_freq);
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
                item.location_map = v_div(item.location, map);
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
                if (v_in_rectangle(item.location_map, v_new(-5, -5), screen_size)){
                    var obj_position = v_sum(cache.draw_map[key], item.size_map / -2);
                    item.obj.
                        css("left", obj_position.x + "px").
                        css("top", obj_position.y + "px");
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

    var date = time() + 3.1536e12;
    function calc_date(){
        date += freq * 1000;
    }
    var fps = draw_freq;
    var time_prev = 0;
    var fps_cnt = 0;
    // Отображаем количество кадров за последнюю секунду
    function show_fps(){
        var time = uptime();
        if (time - time_prev > 1000){
            fps = fps_cnt;
            $("#fps").
                text(fps + " fps");
            var date_obj = new Date(date);
            var time_arr = date_obj.toTimeString().split(" ")[0].split(":");
            $("#date").
                text(date_obj.toLocaleDateString() + " " + time_arr[0] + ":" + time_arr[1]);
            fps_cnt = 0;
            time_prev = time;
        }
        fps_cnt++;
    }

    var angle_prev = 0;
    function shuttle_move(item1, item2, r){
        return;
        var course = v_norm(vv_diff(item1.location, item2.location));
        var speed = v_norm(vv_diff(item2.speed, item1.speed));
        var accel = v_norm(vv_diff(item2.accel, item1.accel));
        var angle = vv_norm_angle(course, speed);
        log(angle);
        v_draw(
            item1.location_map,
            vv_sum(
                item1.location_map,
                v_mult(speed, 1e2)
            ),
            "#0f0"
        );
        if (angle > 90 && angle_prev < angle - 5){
        //if (angle_prev < angle - 5){
            var speed_accel = v_mult(v_rotate(course, 270), item1.speed_accel);
            //item1.accel = vv_sum(item1.accel, speed_accel);
            v_draw(
                item1.location_map,
                vv_sum(
                    item1.location_map,
                    v_mult(speed, 1e2)
                ),
                "#0f0"
            );
            v_draw(
                item1.location_map,
                vv_sum(
                    item1.location_map,
                    v_mult(speed_accel, 1e2)
                ),
                "#f00"
            );
//        }else if (angle_prev > angle + 5){
        }else if(angle < 90 && angle_prev > angle + 5){
            //item1.accel = vv_diff(item1.accel,
            //                    v_mult(course, item1.speed_accel));
            v_draw(
                item1.location_map,
                vv_sum(
                    item1.location_map,
                    v_mult(speed, 1e2)
                ),
                "#0f0"
            );
        }else{
            /*v_draw(
                item1.location_map,
                vv_sum(
                    item1.location_map,
                    v_mult(course, 500)
                ),
                course_ok ? "#fff" : "#f00"
            );*/
            v_draw(
                item1.location_map,
                vv_sum(
                    item1.location_map,
                    v_mult(speed, 1e2)
                ),
                "#0f0"
            );
        }
        angle_prev = angle;
        //var course_ok = vv_mult(speed, v_rotate(course, 90)) > 0 && vv_mult(speed, v_rotate(course, 274)) > 0;
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
    // Пересчитываем размер экрана и размеры планет на нем
    function set_screen_size(){
        $("#body").
            height($(window).height());
        screen_size = v_new($("#body").width(), $("#body").height());
        margin = v_div(screen_size, 2);
        $("#background").
            attr("width", screen_size.x).
            attr("height", screen_size.y);
        if (!$("#planets > *").length){
            return;
        }
        // Пересчитываем размеры планет
        planets_calc_size();
    }

    $("#planet_select").
        change(function(){
            cache.planet_selected = $("#planet_select").val();
        });
    $("#map_select").
        scroll(function (){
            scroll = $("#map_select").scrollTop();
            // Пересчитываем масштаб
            scroll_calc_map();
            // Пересчитываем размеры планет
            planets_calc_size();
            return false;
        });
    $('#body').
        bind("mousewheel DOMMouseScroll", function(event){
            if ($(event.target).prop("tagName").toLowerCase() == "option" ||
                $(event.target).attr("id") == "map_option" ||
                $(event.target).attr("id") == "map_select"){
                return false;
            }
            $("#map_option").
                height($("#map_select").height() * 10 + $("#map_select").height());
            if (event.originalEvent && event.originalEvent.wheelDelta ?
                    event.originalEvent.wheelDelta < 0 :
                    event.originalEvent.detail > 0) {
                scroll_down(scroll * 1.666666667 / 10 + 1);
            } else {
                scroll_up(scroll * 0.6 / 10 + 1);
            }
            return false;
        });

    $(window).resize(set_screen_size);
    $("#body").
        hammer().
            // Нажали и тянем
            bind("pandown",
                function (event) {
                    if ($(event.gesture.target).prop("tagName").toLowerCase() == "option" ||
                        $(event.gesture.target).attr("id") == "map_option" ||
                        $(event.gesture.target).attr("id") == "map_select"){
                        return false;
                    }
                    scroll_up(scroll * 0.6 / 25 + 1);
                }).
            bind("panup",
                function (event) {
                    if ($(event.gesture.target).prop("tagName").toLowerCase() == "option" ||
                        $(event.gesture.target).attr("id") == "map_option" ||
                        $(event.gesture.target).attr("id") == "map_select"){
                        return false;
                    }
                    scroll_down(scroll * 1.666666667 / 25 + 1);
                }).
            bind("pinchout",
                function (event) {
                    if ($(event.gesture.target).prop("tagName").toLowerCase() == "option" ||
                        $(event.gesture.target).attr("id") == "map_option" ||
                        $(event.gesture.target).attr("id") == "map_select"){
                        return false;
                    }
                    scroll_up(scroll * 0.6 * event.gesture.distance / 1000 + 1);
                }).
            bind("pinchin",
                function (event) {
                    if ($(event.gesture.target).prop("tagName").toLowerCase() == "option" ||
                        $(event.gesture.target).attr("id") == "map_option" ||
                        $(event.gesture.target).attr("id") == "map_select"){
                        return false;
                    }
                    scroll_down(scroll * 1.666666667 * event.gesture.distance / 500 + 1);
                });
    $("#body").
        data("hammer").get("pan").set({ enable: true, direction: Hammer.DIRECTION_VERTICAL });
    $("#body").
        data("hammer").get("pinch").set({ enable: true });
    // log("======================= START ============================");
    planets_generator("asteroid_belt_", "Пояс астероидов", 50, "sun", 2.2 * ua, 3.6 * ua, 15e16, 12e17, "#595959");
    planets_generator("asteroid_centaur_", "Кентавры", 8, "sun", 15.87 * ua, 25.157 * ua, 2e17, 2e19, "#595959");
    planets_generator("asteroid_kuiper_", "Пояс Койпера", 12, "sun", 29.57 * ua, 101 * ua, 36e19, 16e21, "#595959");
    // Пересчитываем масштаб
    scroll_calc_map();
    // Пересчитываем размер экрана и размеры планет на нем
    set_screen_size();
    // Инициализируем планеты
    planets_create();
    // Пересчитываем размеры планет
    planets_calc_size();
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
    // Задаем начальные скорости планет
    planets_speed_start();
    // Движение планет - периодически обновляем положение
    planets_move();
});
