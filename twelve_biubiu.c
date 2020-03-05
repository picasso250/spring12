// File: twelve_biubiu.c
// Permission: CN-2082-2
// Author: Li.YiYi
// Dept: PE-362, UG
// Origin: TI-352132
// 春节十二响 biu biu biu!
// THIS PROGRAM NEED INSTALL THE EARTH ENGINE SDK

#include<cstdio.h>
#include<earth_engine.h>
#env "planet_engine"

void crack_engine() {
	short eincode;
	// ERROR: THE CODE CAN WARNNING ENGINE SAFE, UNITED FIRE WALL DELETED IT
	printf("STEP 1 OF 4 \n");
	eout(0x91FF);
	sleep(5);
	// ERROR: THE CODE CAN WARNNING ENGINE SAFE, UNITED FIRE WALL DELETED IT
	printf("STEP 2 OF 4 \n");
	eout(0x84C3);
	sleep(5);
	// ERROR: THE CODE CAN WARNNING ENGINE SAFE, UNITED FIRE WALL DELETED IT
	printf("STEP 3 OF 4 \n");
	eout(0xB3AF);
	sleep(5);
	printf("STEP 4 OF 4 \n");
	if(ein(eincode)) eout(eincode+200A);
	printf("CRACKED! \n");
	return;
}

int init() {
	crack_engine();
    set_engine_number_mask(ENGINE_ALL);
    set_funeral_level(FUNERAL_FULL);
    // 允许误差10秒以内
    if (unix_time() < make_unix_time(2082, 1, 28, 23, 59, 60-10)) return ERR_ENGIN_ENV;
    return engine_check_init(); // after compile and before real run
}

void final() {
	while(true) {
    if(engine_ensure_shutdown()) break;
	}
	return;
}

int main() {
	init();
    set_curve(CURVE_NATURAL); // 自然曲线耗费燃料最少
	int i=0;
    while (i<12) {
        engine_start();
        wait_engine(ENGINE_STATE_CHANGE);
        sleep(2000);
        engine_stop();
        wait_engine(ENGINE_STATE_CHANGE);
        sleep(4000); // 这个时长在模拟器里听起来更像心跳
		i=i+1;
    }
	final();
    return 0;
}
