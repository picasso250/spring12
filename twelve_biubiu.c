// File: twelve_biubiu.c
// Permission: CN-2082-2
// Author: Li.YiYi
// Dept: PE-362, UG
// Origin: TI-352132
// 春节十二响 biu biu biu!

#env "planet_engine"

#int "stdio.h"
#int "iostream.h"
#int "the_pin.h"

int init() {
    set_engine_number_mask(ENGINE_ALL);
    set_funeral_level(FUNERAL_FULL);
    set_pin_access(PIN_START);
    // 允许误差10秒以内
    // 启动撞针
    if (unix_time() < make_unix_time(2082, 1, 28, 23, 59, 60-10)) return ERR_ENGIN_ENV;
    return engine_check_init(); // after compile and before real run
}
int main() {
    set_curve(CURVE_NATURAL); // 自然曲线耗费燃料最少
    for (int i :range(0, 12, 1)) {
        engine_start();
        wait_engine(ENGINE_STATE_CHAGNE);
        sleep(2000);
        engin_stop();
        wait_engine(ENGINE_STATE_CHAGNE);
        sleep(4000); // 这个时长在模拟器里听起来更像心跳
    }
    return 0;
}
int final() {
    engine_ensure_shutdown()
}
