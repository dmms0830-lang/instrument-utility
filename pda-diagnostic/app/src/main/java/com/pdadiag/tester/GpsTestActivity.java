package com.pdadiag.tester;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Typeface;
import android.location.GpsSatellite;
import android.location.GpsStatus;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.Locale;

/**
 * GPS 테스트: 위성 수신 개수와 첫 위치 획득 시간(TTFF) 확인.
 * 실외 또는 창가에서 테스트해야 함. 위성이 하나도 안 잡히면 안테나 불량 의심.
 */
@SuppressLint("MissingPermission")
public class GpsTestActivity extends BaseTestActivity {

    private LocationManager lm;
    private TextView tv;
    private long startTime;
    private long ttffMs = -1;
    private int satsTotal = 0, satsUsed = 0;
    private Location lastFix;

    private final LocationListener listener = new LocationListener() {
        @Override
        public void onLocationChanged(Location location) {
            if (ttffMs < 0) ttffMs = SystemClock.elapsedRealtime() - startTime;
            lastFix = location;
            render();
        }
        @Override public void onStatusChanged(String provider, int status, Bundle extras) { }
        @Override public void onProviderEnabled(String provider) { render(); }
        @Override public void onProviderDisabled(String provider) { render(); }
    };

    @SuppressWarnings("deprecation")
    private final GpsStatus.Listener gpsListener = event -> {
        if (event == GpsStatus.GPS_EVENT_SATELLITE_STATUS) {
            try {
                GpsStatus st = lm.getGpsStatus(null);
                int total = 0, used = 0;
                for (GpsSatellite s : st.getSatellites()) {
                    total++;
                    if (s.usedInFix()) used++;
                }
                satsTotal = total;
                satsUsed = used;
                render();
            } catch (SecurityException ignored) { }
        }
    };

    @Override
    protected String testId() { return "gps"; }

    @Override
    protected View buildContent() {
        lm = (LocationManager) getSystemService(LOCATION_SERVICE);

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(12), dp(12), dp(12), dp(12));

        Button settings = new Button(this);
        settings.setText("위치 설정 열기 (GPS 켜기)");
        settings.setOnClickListener(v ->
                startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)));
        box.addView(settings);

        tv = new TextView(this);
        tv.setTypeface(Typeface.MONOSPACE);
        tv.setTextSize(13);
        ScrollView sv = new ScrollView(this);
        sv.addView(tv);
        box.addView(sv, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        return box;
    }

    private void render() {
        StringBuilder sb = new StringBuilder();
        boolean enabled = lm != null && lm.isProviderEnabled(LocationManager.GPS_PROVIDER);
        sb.append("GPS 활성화: ").append(enabled ? "켜짐" : "꺼짐 — 위 버튼으로 켜세요").append("\n\n");
        sb.append("위성: 사용 ").append(satsUsed).append(" / 수신 ").append(satsTotal).append("\n");
        long wait = (SystemClock.elapsedRealtime() - startTime) / 1000;
        if (ttffMs >= 0) {
            sb.append("첫 위치 획득(TTFF): ").append(ttffMs / 1000).append("초\n");
        } else {
            sb.append("위치 획득 대기 중... (").append(wait).append("초 경과)\n");
        }
        if (lastFix != null) {
            sb.append(String.format(Locale.KOREA, "\n위도: %.6f\n경도: %.6f\n정확도: ±%.0f m\n고도: %.0f m\n속도: %.1f m/s\n",
                    lastFix.getLatitude(), lastFix.getLongitude(),
                    lastFix.getAccuracy(), lastFix.getAltitude(), lastFix.getSpeed()));
        }
        sb.append("\n■ 확인 포인트\n");
        sb.append("· 실외/창가에서 2~3분 내 위치가 잡히는지\n");
        sb.append("· 위성이 4개 이상 사용되는지\n");
        sb.append("· 정확도가 ±20m 이내로 수렴하는지\n");
        sb.append("· 위성 0개가 계속되면 GPS 안테나 불량 의심\n");
        tv.setText(sb.toString());
    }

    @SuppressWarnings("deprecation")
    @Override
    protected void onResume() {
        super.onResume();
        startTime = SystemClock.elapsedRealtime();
        ttffMs = -1;
        try {
            lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000, 0, listener);
            lm.addGpsStatusListener(gpsListener);
        } catch (SecurityException e) {
            tv.setText("위치 권한이 없습니다. 앱 권한을 허용해 주세요.");
            return;
        } catch (Exception e) {
            tv.setText("GPS 사용 불가: " + e.getMessage());
            return;
        }
        render();
    }

    @SuppressWarnings("deprecation")
    @Override
    protected void onPause() {
        super.onPause();
        try {
            lm.removeUpdates(listener);
            lm.removeGpsStatusListener(gpsListener);
        } catch (Exception ignored) { }
    }
}
