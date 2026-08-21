package com.pdadiag.tester;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Typeface;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 * Wi-Fi 테스트: 현재 연결 정보(신호세기·링크속도)와 주변 AP 스캔.
 * 창고/현장용 PDA는 Wi-Fi 안테나 상태가 중요 — RSSI가 비정상적으로 낮으면 안테나 불량 의심.
 */
public class WifiTestActivity extends BaseTestActivity {

    private WifiManager wifi;
    private TextView status;
    private TextView list;

    private final BroadcastReceiver scanReceiver = new BroadcastReceiver() {
        @SuppressLint("MissingPermission")
        @Override
        public void onReceive(Context context, Intent intent) {
            try {
                List<ScanResult> results = wifi.getScanResults();
                Collections.sort(results, (a, b) -> b.level - a.level);
                StringBuilder sb = new StringBuilder("■ 주변 AP (" + results.size() + "개)\n");
                for (ScanResult r : results) {
                    String ssid = (r.SSID == null || r.SSID.isEmpty()) ? "(숨김)" : r.SSID;
                    sb.append(String.format(Locale.KOREA, "%4d dBm  %s\n", r.level, ssid));
                }
                list.setText(sb.toString());
            } catch (SecurityException e) {
                list.setText("위치 권한이 없어 스캔 결과를 볼 수 없습니다.");
            }
        }
    };

    @Override
    protected String testId() { return "wifi"; }

    @Override
    protected View buildContent() {
        wifi = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(12), dp(12), dp(12), dp(12));

        status = new TextView(this);
        status.setTypeface(Typeface.MONOSPACE);
        status.setTextSize(13);
        box.addView(status);

        Button scan = new Button(this);
        scan.setText("주변 AP 스캔");
        scan.setOnClickListener(v -> {
            if (wifi == null) return;
            if (!wifi.isWifiEnabled()) {
                Toast.makeText(this, "Wi-Fi를 먼저 켜세요 (설정)", Toast.LENGTH_SHORT).show();
                try { wifi.setWifiEnabled(true); } catch (Exception ignored) { }
            }
            wifi.startScan();
            list.setText("스캔 중...");
        });
        box.addView(scan);

        list = new TextView(this);
        list.setTypeface(Typeface.MONOSPACE);
        list.setTextSize(13);
        ScrollView sv = new ScrollView(this);
        sv.addView(list);
        box.addView(sv, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));

        refreshStatus();
        return box;
    }

    private void refreshStatus() {
        StringBuilder sb = new StringBuilder();
        if (wifi == null) {
            sb.append("Wi-Fi 하드웨어 없음!\n");
        } else {
            sb.append("Wi-Fi 상태: ").append(wifi.isWifiEnabled() ? "켜짐" : "꺼짐").append("\n");
            WifiInfo info = wifi.getConnectionInfo();
            if (info != null && info.getNetworkId() != -1) {
                sb.append("연결 SSID: ").append(info.getSSID()).append("\n");
                sb.append("신호(RSSI): ").append(info.getRssi()).append(" dBm  ");
                int rssi = info.getRssi();
                sb.append(rssi > -60 ? "(양호)" : rssi > -75 ? "(보통)" : "(약함 ⚠)").append("\n");
                sb.append("링크 속도: ").append(info.getLinkSpeed()).append(" Mbps\n");
                int ip = info.getIpAddress();
                sb.append("IP: ").append(String.format(Locale.US, "%d.%d.%d.%d",
                        ip & 0xff, (ip >> 8) & 0xff, (ip >> 16) & 0xff, (ip >> 24) & 0xff)).append("\n");
            } else {
                sb.append("연결된 AP 없음 — 아는 AP에 연결해 신호세기를 확인하세요.\n");
            }
        }
        sb.append("\n확인: AP 근처에서 -60dBm 이상 나오는지, 연결이 끊기지 않는지\n");
        status.setText(sb.toString());
    }

    @Override
    protected void onResume() {
        super.onResume();
        registerReceiver(scanReceiver, new IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION));
        refreshStatus();
    }

    @Override
    protected void onPause() {
        super.onPause();
        try { unregisterReceiver(scanReceiver); } catch (Exception ignored) { }
    }
}
