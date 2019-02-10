#env "planet_engine"

int init() {
    set_engine_number_mask(ENGINE_ALL);
    set_funeral_level(FUNERAL_FULL);
    return engine_check_init(); // will run after compile and before real run
}
int main() {
    set_curve(CURVE_HEART);
    for (int i=0; i < 12; i++) {
        engine_start();
        wait_engine(ENGINE_STATE_CHAGNE);
        sleep(3000);
        engin_stop();
        wait_engine(ENGINE_STATE_CHAGNE);
        sleep(4000); // 这个时长在模拟器里听起来更像心跳
    }
    return 0;
}
int final() {
    engine_ensure_shutdown();
}
