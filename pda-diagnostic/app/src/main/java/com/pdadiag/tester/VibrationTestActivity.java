package com.pdadiag.tester;

import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/** 진동 모터 테스트 — 스캔 피드백에 쓰이므로 확인 필요 */
public class VibrationTestActivity extends BaseTestActivity {

    private Vibrator vibrator;

    @Override
    protected String testId() { return "vibration"; }

    @Override
    protected View buildContent() {
        vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(12), dp(12), dp(12), dp(12));

        TextView hint = new TextView(this);
        boolean has = vibrator != null && vibrator.hasVibrator();
        hint.setText(has ? "각 버튼을 눌러 진동 세기와 균일함을 확인하세요."
                : "⚠ 진동 모터가 감지되지 않습니다!");
        hint.setTextSize(14);
        box.addView(hint);

        Button shortV = new Button(this);
        shortV.setText("짧게 (200ms) — 스캔 피드백 수준");
        shortV.setOnClickListener(v -> vibrate(new long[]{0, 200}));
        box.addView(shortV);

        Button longV = new Button(this);
        longV.setText("길게 (1초)");
        longV.setOnClickListener(v -> vibrate(new long[]{0, 1000}));
        box.addView(longV);

        Button pattern = new Button(this);
        pattern.setText("패턴 (3회 반복)");
        pattern.setOnClickListener(v -> vibrate(new long[]{0, 300, 200, 300, 200, 300}));
        box.addView(pattern);

        return box;
    }

    @SuppressWarnings("deprecation")
    private void vibrate(long[] pattern) {
        if (vibrator == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1));
        } else {
            vibrator.vibrate(pattern, -1);
        }
    }
}
