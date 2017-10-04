var planets_data = { };
var planets_calc = { };

$(function (){
    var debug = false;
    debug = true;

    var v_debug = false;
    //v_debug = true;

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
    // В одной реальной секунде draw_freq кадров, если 0 то без ограничений
    var draw_freq = 0;

    // Гравитационная постоянная
    var G = 6.67408e-11;
    // Астрономическая единица
    var ua = 0.149597870691e12;

    var map_height = $("#map_option").height() - $("#map_select").height();

    // Время прошедшее со старта скрипта в мксек до тысячных
    function uptime(){
        return time() - time_start;
    }
    // Текущее время в мксек до тысячных
    function time(){
        return window.performance && window.performance.now &&
                window.performance.timing && window.performance.timing.navigationStart ?
                    window.performance.now() + window.performance.timing.navigationStart :
                    Date.now();
    }
    // Время старта скрипта в мксек до тысячных
    var time_start = time();
    function obj_length(obj){
        var cnt = 0;
        for (var key in obj){
            cnt++;
        }
        return cnt;
    }

    // Логирование mess = val
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
    // Рисуем линию между двумя векторами цвета color
    function v_draw(v1, v2, color){
        var canvas = document.getElementById("background").getContext("2d");
        canvas.beginPath();
        canvas.lineWidth = 1;
        canvas.strokeStyle = color;
        canvas.moveTo(v1.x, v1.y);
        canvas.lineTo(v2.x, v2.y);
        canvas.stroke();
    }
    // Рисуем круг из центра v цвета color
    function v_draw_circle(v, r, color){
        var canvas = document.getElementById("background").getContext("2d");
        canvas.beginPath();
        canvas.lineWidth = 1;
        canvas.strokeStyle = color;
        canvas.arc(v.x, v.y, r, 0, 2 * Math.PI);
        canvas.stroke();
    }
    // Очищаем рабочую область
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
    // Вектор попадает в прямоугольник между v_topleft и v_downright
    function v_in_rectangle(v, v_topleft, v_downright){
        return v.x > v_topleft.x && v.y > v_topleft.y && v.x < v_downright.x && v.y < v_downright.y ?
            true :
            false;
    }
    // Градусы в радианы
    Math.deg2rad = function(degrees) {
      return degrees * Math.PI / 180;
    };
    // Радианы в градусы
    Math.rad2deg = function(radians) {
      return radians * 180 / Math.PI;
    };

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
                planets_data[key] = {
                    title: item.title,
                    orbit: item.orbit,
                    distance: item.distance,
                    color: item.color,
                    rings: item.rings,
                    size_map: 0,
                    // Инициализируем кеш позиций для обновления
                    draw_map: v_new(0, 0),
                };
                planets_calc[key] = {
                    mass: item.mass,
                    d: item.d,
                    speed: v_new(0, 0),
                    accel: v_new(0, 0),
                    speed_accel: item.speed_accel,
                };
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
        for (var key in planets_data){
            var calc = planets_calc[key];
            var data = planets_data[key];
            if (data.orbit != orbit){
                continue;
            }
            calc.location = data.distance ?
                vv_sum(planets_calc[data.orbit].location, v_mult(v_norm(planets[key].location), data.distance)) :
                v_new(0, 0);
            // Пересчитываем положение планеты на экране
            data.location_map = v_div(calc.location, map);
            // Создаем html элемент
            data.obj = $("<div>").
                attr("id", key).
                attr("alt", data.title).
                attr("title", data.title).
                css("background-color", data.color ? data.color : "rgba(0, 0, 0, 0)").
                css("background-image", data.color ? "none" : 'url("img/' + key + '.png")').
                css("z-index", 101 - orbit_index).
                // Обрабатываем клики на планетах
                click(function (){
                    var id = $(this).attr("id");
                    if (!$("#planet_select > option[value=\"" + id + "\"").length){
                        return;
                    }
                    $("#planet_select").
                        val(id).
                        trigger("change");
                    return false;
                }).
                appendTo("#planets");
            if (key.indexOf("asteroid") >= 0){
                data.obj.
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
                    html(prefix + data.title).
                    attr("selected", planet_selected == key).
                    appendTo("#planet_select");
            }
            // Создаем спутники планеты
            planets_create(key);
        }
        orbit_index--;
    }
    // Отображаем скорость и ускорение планеты id. Можно указать из какой точки в location_map
    function show_speed_accel(id, location_map){
        if (!v_debug){
            return;
        }
        var data = planets_data[id];
        var calc1 = planets_calc[id];
        var calc2 = planets_calc[data.orbit];
        var speed = vv_diff(planets_calc[data.orbit].speed, calc1.speed);
        var accel = vv_diff(planets_calc[data.orbit].accel, calc1.accel);
        // Процент от исходной высоты над поверхностью
        /*log(Math.round((vv_length(calc1.location, calc2.location) -
                            calc1.d / 2 - calc2.d / 2) /
                        (calc1.distance - calc1.d / 2 - calc2.d / 2) *
                        100) + "%");*/
        if (typeof location_map == "undefined"){
            location_map = data.location_map;
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
        for (var key in planets_calc){
            // Пересчитываем положение планет на экране
            planets_data[key].location_map = v_div(planets_calc[key].location, map);
        }
    }
    // Пересчитываем размеры планет
    function planets_calc_size(){
        // Пересчитываем размеры планет
        for (var key in planets_data){
            var calc = planets_calc[key];
            var data = planets_data[key];
            var min_size = (screen_size.x > screen_size.y ? screen_size.y : screen_size.x) / 150;
            var d = (data.rings ? calc.d * data.rings : calc.d) / map;
            data.size_map = d > min_size ? d : min_size;
            var r = data.size_map / 2;
            data.obj.
                css("width", data.size_map + "px").
                css("height", data.size_map + "px").
                css("-moz-border-radius", (data.color ? r : 0) + "px").
                css("-webkit-border-radius", (data.color ? r : 0) + "px").
                css("border-radius", (data.color ? r : 0) + "px");
            data.draw_map = v_new(0, 0);
        }
        // Пересчитываем положение планет на экране и отображаем их
        planets_draw();
    }
    // Задаем начальные скорости планет
    function planets_speed_start(orbit){
        if (typeof orbit == "undefined" || !orbit){
            orbit = "";
        }
        for (var key in planets_calc){
            var calc1 = planets_calc[key];
            var calc2 = planets_calc[orbit];
            if (planets_data[key].orbit != orbit){
                continue;
            }
            if (orbit){
                var course = v_norm(vv_diff(calc1.location, calc2.location));
                var r = vv_length(calc1.location, calc2.location);
                // v^2 = G * (M / R)
                var v = Math.sqrt(G * (calc2.mass / r));
                calc1.speed = vv_sum(calc2.speed, v_mult(v_rotate(course, 270), v));
            }
            planets_speed_start(key);
        }
        if (!orbit){
            //log(planets_calc);
        }
    }
    // Пересчитываем скорости и положение планет
    function planets_speed(frequency){
        for (var key in planets_calc){
            var calc = planets_calc[key];
            // Считаем текущую скорость складывая скорость и полученное ускорение
            // V = Vo + a * t
            calc.speed = vv_sum(calc.speed, v_mult(calc.accel, frequency));
            // Пересчитываем текущее положение - добавляем текущую скорость умноженную на частоту
            // X = Xo + Vo * t
            calc.location = vv_sum(calc.location, v_mult(calc.speed, frequency));
            // Пересчитываем положение планет на экране
            planets_data[key].location_map = v_div(calc.location, map);
        }
    }
    // Пересчитываем ускорения от гравитации планет
    function planets_accel(){
        // Складываем текущее ускорение от каждой планеты
        for (var key1 in planets_calc){
            var calc1 = planets_calc[key1];
            // Обнуляем ускорение
            calc1.accel = v_new(0, 0);
            for (var key2 in planets_calc){
                if (key1 == key2){
                    continue;
                }
                var calc2 = planets_calc[key2];
                // log("=========================================================");
                var course = v_norm(vv_diff(calc1.location, calc2.location));
                var r = vv_length(calc1.location, calc2.location);
                // F = G * (m1 * m2 / r^2)
                var F = G * calc1.mass * calc2.mass / Math.pow(r, 2);
                // a = F / m
                var a = v_mult(course, F / calc1.mass);
                // Добавляем планете key1 ускорение направленное к key2
                calc1.accel = vv_sum(calc1.accel, a);

                /*if (key1 == "shuttle" && key2 == planet_selected){
                    shuttle_move(item1, item2, r);
                }*/
            }
        }
    }
    // Движение планет - периодически обновляем положение
    function planets_move(){
        if (!maneuver){
            //var location_map = show_speed_accel("shuttle");
            var frequency = freq / 20;
            for (var f = 0; f < 10; f++){
                // Пересчитываем ускорения от гравитации планет
                planets_accel();
                // Пересчитываем скорости и положение планет
                planets_speed(frequency);
            }
            //show_speed_accel("shuttle", location_map);
            show_speed_accel("shuttle");
            // Столкновения планет
            planets_clash();
            // Пересчитываем положение планет на экране и отображаем их
            planets_draw();
            // Считаем игровую дату
            calc_date();
        }
        // Отображаем количество кадров за последнюю секунду
        show_fps();
        setTimeout(planets_move, !draw_freq ? 0 : 1000 / draw_freq);
    }
    // Пересчитываем положение планет на экране и отображаем их
    function planets_draw(){
        // Центруем выбранную планету на экране
        var padding = vv_diff(planets_data[planet_selected].location_map, margin);
        if (!v_is_null(padding)){
            for (var key in planets_calc){
                var calc = planets_calc[key];
                calc.location = vv_sum(calc.location, v_mult(padding, map));
                // Пересчитываем положение планет на экране
                planets_data[key].location_map = v_div(calc.location, map);
            }
        }
        // Очищаем траектории орбит
        v_draw_clear();
        // Отображаем планеты положение которых изменилось
        for (var key in planets_data){
            var data = planets_data[key];
            // Отображаем приблизительные траектории орбит
            if (data.orbit && key.indexOf("asteroid") < 0){
                v_draw_circle(
                    planets_data[data.orbit].location_map,
                    data.distance / map,
                    "#444"
                );
            }
            if (!v_is_null(vv_diff(data.location_map, data.draw_map))){
                data.draw_map = v_clone(data.location_map);
                // Если планета в видимой области
                if (v_in_rectangle(data.location_map, v_new(-5, -5), screen_size)){
                    var obj_position = v_sum(data.draw_map, data.size_map / -2);
                    data.obj.
                        css("left", obj_position.x + "px").
                        css("top", obj_position.y + "px");
                    if (data.obj.is(":hidden")){
                        data.obj.
                            show();
                    }
                }else if (data.obj.is(":visible")){
                    data.obj.
                        hide();
                }
            }
        }
    }
    // Столкновения планет
    function planets_clash(){
        new_key1:
        for (var key1 in planets_calc){
            var calc1 = planets_calc[key1];
            for (var key2 in planets_calc){
                var calc2 = planets_calc[key2];
                if (key1 == key2 || calc1.mass > calc2.mass){
                    continue;
                }
                var r = vv_length(calc1.location, calc2.location);
                if (r > calc1.d / 2 + calc2.d / 2){
                    continue;
                }
                planets_data[key1].obj.
                    remove();
                calc2.mass += calc1.mass;
                calc2.d = 2 * Math.sqrt(3 * (calc2.mass / 3.5e10) / (4 * Math.PI), 3);
                $("#planet_select > option[value=" + key1 + "]").
                    remove();
                if (key1 == planet_selected){
                    planet_selected = key2;
                }
                delete planets_calc[key1];
                delete planets_data[key1];
                planets_calc_size();
                continue new_key1;
            }
        }
    }
    function draw_trajectory(){

    }
    var maneuver = false;
    function maneuvering(event){
        if (event_disabled(event)){
            return false;
        }
        maneuver = !maneuver;
        if (maneuver){
            draw_trajectory();
        }
        return false;
    }

    var date = time() + 3.1536e12;
    // Считаем игровую дату
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
    // Считаем искусственное ускорение шаттла
    function shuttle_move(item1, item2, r){
        return;
        var course = v_norm(vv_diff(planets_calc[key1].location, planets_calc[key2].location));
        var speed = v_norm(vv_diff(planets_calc[key2].speed, planets_calc[key1].speed));
        var accel = v_norm(vv_diff(planets_calc[key2].accel, planets_calc[key1].accel));
        var angle = vv_norm_angle(course, speed);
        log(angle);
        v_draw(
            planets_data[key1].location_map,
            vv_sum(
                planets_data[key1].location_map,
                v_mult(speed, 1e2)
            ),
            "#0f0"
        );
        if (angle > 90 && angle_prev < angle - 5){
        //if (angle_prev < angle - 5){
            var speed_accel = v_mult(v_rotate(course, 270), planets_calc[key1].speed_accel);
            //planets_calc[key1].accel = vv_sum(planets_calc[key1].accel, speed_accel);
            v_draw(
                planets_data[key1].location_map,
                vv_sum(
                    planets_data[key1].location_map,
                    v_mult(speed, 1e2)
                ),
                "#0f0"
            );
            v_draw(
                planets_data[key1].location_map,
                vv_sum(
                    planets_data[key1].location_map,
                    v_mult(speed_accel, 1e2)
                ),
                "#f00"
            );
//        }else if (angle_prev > angle + 5){
        }else if(angle < 90 && angle_prev > angle + 5){
            //planets_calc[key1].accel = vv_diff(planets_calc[key1].accel,
            //                    v_mult(course, planets_calc[key1].speed_accel));
            v_draw(
                planets_data[key1].location_map,
                vv_sum(
                    planets_data[key1].location_map,
                    v_mult(speed, 1e2)
                ),
                "#0f0"
            );
        }else{
            /*v_draw(
                planets_data[key1].location_map,
                vv_sum(
                    planets_data[key1].location_map,
                    v_mult(course, 500)
                ),
                course_ok ? "#fff" : "#f00"
            );*/
            v_draw(
                planets_data[key1].location_map,
                vv_sum(
                    planets_data[key1].location_map,
                    v_mult(speed, 1e2)
                ),
                "#0f0"
            );
        }
        angle_prev = angle;
        //var course_ok = vv_mult(speed, v_rotate(course, 90)) > 0 && vv_mult(speed, v_rotate(course, 274)) > 0;
    }

    // Генерирует заданное количество планет по шаблону
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
    // Скролл вверх (сделать крупнее)
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
    // Скролл вниз (сделать мельче)
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
    function event_disabled(event){
        return $(event.target).prop("tagName").toLowerCase() == "select" ||
                $(event.target).prop("tagName").toLowerCase() == "option" ||
                $(event.target).attr("id") == "map_option" ||
                $(event.target).attr("id") == "map_select";
    }

    var planet_selected = "earth";
    // Центровка экрана по заданной планете
    $("#planet_select").
        change(function(){
            planet_selected = $("#planet_select").val();
            planets_draw();
        });
    // Скролл с помощью лифта в углу
    $("#map_select").
        scroll(function (){
            scroll = $("#map_select").scrollTop();
            // Пересчитываем масштаб
            scroll_calc_map();
            // Пересчитываем размеры планет
            planets_calc_size();
            return false;
        });
    // Пересчитываем размер экрана и размеры планет на нем
    $(window).
        resize(set_screen_size);
    $('#body').
        bind("click", maneuvering).
        // Скролл с помощью колесика в любой части экрана
        bind("mousewheel DOMMouseScroll", function(event){
            if (event_disabled(event)){
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
        }).
        // Скролл с помощью пальцев в любой части экрана
        hammer().
            // Нажали и тянем вниз - крупнее
            bind("pandown",
                function (event) {
                    if (event_disabled(event.gesture) || maneuver){
                        return false;
                    }
                    scroll_up(scroll * 0.6 / 25 + 1);
                    return false;
                }).
            // Нажали и тянем вверх - мельче
            bind("panup",
                function (event) {
                    if (event_disabled(event.gesture) || maneuver){
                        return false;
                    }
                    scroll_down(scroll * 1.666666667 / 25 + 1);
                    return false;
                }).
            // Разодим два пальца - крупнее
            bind("pinchout",
                function (event) {
                    if (event_disabled(event.gesture) || maneuver){
                        return false;
                    }
                    scroll_up(scroll * 0.6 * event.gesture.distance / 1000 + 1);
                    return false;
                }).
            // Сводим два пальца - мельче
            bind("pinchin",
                function (event) {
                    if (event_disabled(event.gesture) || maneuver){
                        return false;
                    }
                    scroll_down(scroll * 1.666666667 * event.gesture.distance / 500 + 1);
                    return false;
                });
    $("#body").
        data("hammer").get("pan").set({ enable: true, direction: Hammer.DIRECTION_VERTICAL });
    $("#body").
        data("hammer").get("pinch").set({ enable: true });

    // log("======================= START ============================");

    // Генерируем дополнительные планеты
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
    // Задаем начальные скорости планет
    planets_speed_start();
    // Движение планет - периодически обновляем положение
    planets_move();
});
