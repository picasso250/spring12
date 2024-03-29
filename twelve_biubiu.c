// File: twelve_biubiu.c
// Permission: CN-2082-2
// Author: Li.YiYi
// Dept: PE-362, UG
// Origin: TI-352132
// 春节十二响 biu biu biu!

#env "planet_engine"

int init() {
    set_engine_number_mask(ENGINE_ALL);
    set_fuel_level(FUEL_FULL);
    // 允许误差10秒以内
    if (unix_time() < make_unix_time(2082, 1, 28, 23, 59, 60-10)) return ERR_ENGIN_ENV;
    return engine_check_init(); // after compile and before real run
}

int main() {
    set_curve(CURVE_NATURAL); // 自然曲线耗费燃料最少
    for (int i = 0; i < 12; i++) {
        engine_start();
        wait_engine(ENGINE_STATE_CHANGE);
        sleep(2000);
        engine_stop();
        wait_engine(ENGINE_STATE_CHANGE);
        sleep(4000); // 这个时长在模拟器里听起来更像心跳
    }
    return 0;
}

int final() {
    return engine_ensure_shutdown();
}
