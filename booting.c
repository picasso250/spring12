// File: twelve_biubiu.c
// Permission: CN-2082-2
// Author: Li.YiYi
// Dept: PE-362, UG
// Origin: TI-352132
// 春节十二响启动器 biu biu biu!

#include "engine_rt.h"
#include "engine_macros.h"
#include "twelve_biubiu.h"

int main() {
    init();
    // 允许误差10秒以内
    if (unix_time() < make_unix_time(2082, 1, 28, 23, 59, 60-10)) return ERR_ENGIN_ENV;
    int signal = engine_check_init();
    // after compile and before real run
    if(ENGINE_FAIL(signal)) {
        return signal;
    }
    engine_processing(processing);
    signal = engine_shutdown(final);
    // 异常关闭
    if(ENGINE_FAIL(signal)) {
        return signal;
    }
    return ENGINE_SUCCESS;
}