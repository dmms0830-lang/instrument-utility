package com.pdadiag.tester;

import android.graphics.Typeface;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.view.View;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * 센서 테스트: 주요 센서의 실시간 값 표시.
 * 기기를 기울이고(가속도), 돌리고(자이로), 화면 상단을 손으로 가려(근접/조도) 값 변화 확인.
 */
public class SensorTestActivity extends BaseTestActivity implements SensorEventListener {

    private SensorManager sm;
    private TextView tv;
    private final Map<Integer, float[]> values = new HashMap<>();
    private final int[] WATCH = {
            Sensor.TYPE_ACCELEROMETER, Sensor.TYPE_GYROSCOPE, Sensor.TYPE_MAGNETIC_FIELD,
            Sensor.TYPE_LIGHT, Sensor.TYPE_PROXIMITY, Sensor.TYPE_PRESSURE,
    };
    private static final Map<Integer, String> NAMES = new HashMap<>();
    static {
        NAMES.put(Sensor.TYPE_ACCELEROMETER, "가속도 (기울여 보세요)");
        NAMES.put(Sensor.TYPE_GYROSCOPE, "자이로 (돌려 보세요)");
        NAMES.put(Sensor.TYPE_MAGNETIC_FIELD, "지자기");
        NAMES.put(Sensor.TYPE_LIGHT, "조도 (가려 보세요)");
        NAMES.put(Sensor.TYPE_PROXIMITY, "근접 (가려 보세요)");
        NAMES.put(Sensor.TYPE_PRESSURE, "기압");
    }

    @Override
    protected String testId() { return "sensors"; }

    @Override
    protected View buildContent() {
        sm = (SensorManager) getSystemService(SENSOR_SERVICE);
        tv = new TextView(this);
        tv.setTypeface(Typeface.MONOSPACE);
        tv.setTextSize(13);
        tv.setPadding(dp(12), dp(12), dp(12), dp(12));
        ScrollView sv = new ScrollView(this);
        sv.addView(tv);
        render();
        return sv;
    }

    private void render() {
        StringBuilder sb = new StringBuilder("■ 실시간 센서 값\n\n");
        for (int type : WATCH) {
            Sensor s = sm.getDefaultSensor(type);
            sb.append(NAMES.get(type)).append("\n  ");
            if (s == null) {
                sb.append("(없음 — 이 모델 미장착일 수 있음)\n");
            } else {
                float[] v = values.get(type);
                if (v == null) {
                    sb.append("대기 중...\n");
                } else {
                    for (int i = 0; i < Math.min(3, v.length); i++)
                        sb.append(String.format(Locale.KOREA, "%8.2f ", v[i]));
                    sb.append("\n");
                }
            }
        }
        sb.append("\n■ 전체 센서 목록\n");
        List<Sensor> all = sm.getSensorList(Sensor.TYPE_ALL);
        for (Sensor s : all) sb.append("· ").append(s.getName()).append("\n");
        sb.append("\n확인: 기기를 움직일 때 가속도/자이로 값이 즉시 변하는지,\n" +
                "센서 값이 고정되어 있으면(항상 0 등) 해당 센서 불량 의심\n");
        tv.setText(sb.toString());
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        values.put(event.sensor.getType(), event.values.clone());
        render();
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) { }

    @Override
    protected void onResume() {
        super.onResume();
        for (int type : WATCH) {
            Sensor s = sm.getDefaultSensor(type);
            if (s != null) sm.registerListener(this, s, SensorManager.SENSOR_DELAY_UI);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        sm.unregisterListener(this);
    }
}
