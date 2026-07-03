package com.pdadiag.tester;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Typeface;
import android.os.BatteryManager;
import android.view.View;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.Locale;

/**
 * 배터리 상태 실시간 표시. 중고 PDA에서 가장 중요한 항목 중 하나.
 * 충전기를 꽂았다 뺐다 하며 충전 인식도 확인.
 */
public class BatteryTestActivity extends BaseTestActivity {

    private TextView tv;

    private final BroadcastReceiver receiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent i) {
            int level = i.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = i.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
            int voltage = i.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1);
            int temp = i.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1);
            int health = i.getIntExtra(BatteryManager.EXTRA_HEALTH, 0);
            int status = i.getIntExtra(BatteryManager.EXTRA_STATUS, 0);
            int plugged = i.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0);
            String tech = i.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY);
            boolean present = i.getBooleanExtra(BatteryManager.EXTRA_PRESENT, true);

            StringBuilder sb = new StringBuilder();
            sb.append("■ 배터리 실시간 상태\n\n");
            sb.append("잔량: ").append(level * 100 / Math.max(1, scale)).append(" %\n");
            sb.append(String.format(Locale.KOREA, "전압: %.2f V\n", voltage / 1000.0));
            sb.append(String.format(Locale.KOREA, "온도: %.1f ℃\n", temp / 10.0));
            sb.append("건강 상태: ").append(healthStr(health)).append("\n");
            sb.append("충전 상태: ").append(statusStr(status)).append("\n");
            sb.append("전원 연결: ").append(pluggedStr(plugged)).append("\n");
            sb.append("종류: ").append(tech == null ? "-" : tech).append("\n");
            sb.append("장착 여부: ").append(present ? "장착됨" : "미장착!").append("\n\n");

            BatteryManager bm = (BatteryManager) getSystemService(BATTERY_SERVICE);
            if (bm != null) {
                int uA = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW);
                if (uA != Integer.MIN_VALUE && uA != 0) {
                    sb.append(String.format(Locale.KOREA, "순간 전류: %.1f mA\n", uA / 1000.0));
                }
                int chargeUAh = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER);
                if (chargeUAh != Integer.MIN_VALUE && chargeUAh > 0) {
                    sb.append(String.format(Locale.KOREA, "현재 충전량: %.0f mAh\n", chargeUAh / 1000.0));
                }
            }

            sb.append("\n■ 확인 포인트 (중고 구매 시)\n");
            sb.append("· 건강 상태가 '양호'인지\n");
            sb.append("· 대기 중 온도가 40℃ 미만인지\n");
            sb.append("· 충전기 연결 시 '충전 중'으로 바뀌는지\n");
            sb.append("· 사용 중 잔량이 급락하지 않는지 (10분에 5% 이상 급락 시 셀 열화 의심)\n");
            sb.append("· 배터리 외관 부풀음(스웰링) 육안 확인\n");
            tv.setText(sb.toString());
        }
    };

    private String healthStr(int h) {
        switch (h) {
            case BatteryManager.BATTERY_HEALTH_GOOD: return "양호 ✅";
            case BatteryManager.BATTERY_HEALTH_OVERHEAT: return "과열 ⚠";
            case BatteryManager.BATTERY_HEALTH_DEAD: return "수명 종료 ❌";
            case BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE: return "과전압 ⚠";
            case BatteryManager.BATTERY_HEALTH_COLD: return "저온";
            case BatteryManager.BATTERY_HEALTH_UNSPECIFIED_FAILURE: return "알 수 없는 이상 ⚠";
            default: return "알 수 없음";
        }
    }

    private String statusStr(int s) {
        switch (s) {
            case BatteryManager.BATTERY_STATUS_CHARGING: return "충전 중 ⚡";
            case BatteryManager.BATTERY_STATUS_DISCHARGING: return "방전 중";
            case BatteryManager.BATTERY_STATUS_FULL: return "완충";
            case BatteryManager.BATTERY_STATUS_NOT_CHARGING: return "충전 안 됨";
            default: return "알 수 없음";
        }
    }

    private String pluggedStr(int p) {
        switch (p) {
            case BatteryManager.BATTERY_PLUGGED_AC: return "AC 어댑터/크래들";
            case BatteryManager.BATTERY_PLUGGED_USB: return "USB";
            case BatteryManager.BATTERY_PLUGGED_WIRELESS: return "무선";
            default: return "분리됨";
        }
    }

    @Override
    protected String testId() { return "battery"; }

    @Override
    protected View buildContent() {
        tv = new TextView(this);
        tv.setTypeface(Typeface.MONOSPACE);
        tv.setTextSize(13);
        tv.setPadding(dp(12), dp(12), dp(12), dp(12));
        tv.setText("배터리 정보 수신 중...");
        ScrollView sv = new ScrollView(this);
        sv.addView(tv);
        return sv;
    }

    @Override
    protected void onResume() {
        super.onResume();
        registerReceiver(receiver, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
    }

    @Override
    protected void onPause() {
        super.onPause();
        try { unregisterReceiver(receiver); } catch (Exception ignored) { }
    }
}
