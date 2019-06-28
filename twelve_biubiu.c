// File: twelve_biubiu.c
// Permission: CN-2082-2
// Author: Li.YiYi
// Dept: PE-362, UG
// Origin: TI-352132
// 春节十二响 biu biu biu!

#env "planet_engine"

#include "twelve_biubiu.h"
#include "engine_rt.h"
#include "engine_macros.h"

int init() {
    set_engine_number_mask(ENGINE_EQUATOR_ALL);
    set_funeral_level(FUNERAL_FULL);
}

int processing(int32_t engineStatus) {
    if(ENGINE_FAIL(engineStatus)) {
        return engineStatus;
    }
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

int final(int32_t lastError) {
    engine_ensure_shutdown();
    return lastError;
}
