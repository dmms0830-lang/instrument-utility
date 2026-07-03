package com.pdadiag.tester;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.os.SystemClock;
import android.util.DisplayMetrics;
import android.view.View;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.Arrays;
import java.util.Locale;

public class DeviceInfoActivity extends BaseTestActivity {

    @Override
    protected String testId() { return "device"; }

    @Override
    protected View buildContent() {
        TextView tv = new TextView(this);
        tv.setTypeface(Typeface.MONOSPACE);
        tv.setTextSize(13);
        tv.setPadding(dp(12), dp(12), dp(12), dp(12));
        tv.setText(collectInfo());
        tv.setTextIsSelectable(true);

        ScrollView sv = new ScrollView(this);
        sv.addView(tv);
        return sv;
    }

    @SuppressLint({"MissingPermission", "HardwareIds"})
    private String collectInfo() {
        StringBuilder sb = new StringBuilder();
        sb.append("■ 기본 정보\n");
        sb.append("모델: ").append(Build.MODEL).append("\n");
        sb.append("제조사: ").append(Build.MANUFACTURER).append("\n");
        sb.append("제품명: ").append(Build.PRODUCT).append(" / ").append(Build.DEVICE).append("\n");

        String serial = Build.SERIAL;
        if (Build.VERSION.SDK_INT >= 26) {
            try { serial = Build.getSerial(); } catch (Exception ignored) { }
        }
        sb.append("시리얼: ").append(serial).append("\n\n");

        sb.append("■ 소프트웨어\n");
        sb.append("Android: ").append(Build.VERSION.RELEASE)
          .append(" (API ").append(Build.VERSION.SDK_INT).append(")\n");
        sb.append("빌드: ").append(Build.DISPLAY).append("\n");
        sb.append("펌웨어 지문: ").append(Build.FINGERPRINT).append("\n");
        sb.append("커널: ").append(System.getProperty("os.version")).append("\n");
        sb.append("보안 패치: ").append(Build.VERSION.SDK_INT >= 23 ? Build.VERSION.SECURITY_PATCH : "-").append("\n\n");

        sb.append("■ 하드웨어\n");
        sb.append("CPU 코어: ").append(Runtime.getRuntime().availableProcessors()).append("개\n");
        sb.append("ABI: ").append(Arrays.toString(Build.SUPPORTED_ABIS)).append("\n");

        ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);
        sb.append(String.format(Locale.KOREA, "RAM: 전체 %.2f GB / 사용가능 %.2f GB\n",
                mi.totalMem / 1073741824.0, mi.availMem / 1073741824.0));

        StatFs fs = new StatFs(Environment.getDataDirectory().getPath());
        sb.append(String.format(Locale.KOREA, "저장소: 전체 %.2f GB / 여유 %.2f GB\n",
                fs.getTotalBytes() / 1073741824.0, fs.getAvailableBytes() / 1073741824.0));

        DisplayMetrics dm = getResources().getDisplayMetrics();
        sb.append("해상도: ").append(dm.widthPixels).append(" x ").append(dm.heightPixels)
          .append(" (").append(dm.densityDpi).append(" dpi)\n");

        long up = SystemClock.elapsedRealtime() / 1000;
        sb.append(String.format(Locale.KOREA, "부팅 후 경과: %d시간 %d분\n\n", up / 3600, (up % 3600) / 60));

        sb.append("■ 확인 포인트\n");
        sb.append("· 모델명이 PM80/PM85가 맞는지\n");
        sb.append("· RAM/저장소 용량이 판매 스펙과 일치하는지\n");
        sb.append("  (PM80: 2GB/16GB급, PM85: 4GB/32GB급)\n");
        sb.append("· 시리얼이 뒷면 라벨과 일치하는지\n");
        return sb.toString();
    }
}
