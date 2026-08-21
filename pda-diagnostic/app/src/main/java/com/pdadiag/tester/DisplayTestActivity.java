package com.pdadiag.tester;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Shader;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;

/**
 * 화면을 탭할 때마다 단색/그라데이션/체크무늬가 순환된다.
 * 불량화소(항상 켜짐/꺼짐), 번인, 얼룩을 육안으로 확인.
 */
public class DisplayTestActivity extends Activity {

    private static final int[] COLORS = {
            Color.WHITE, Color.BLACK, Color.RED, Color.GREEN, Color.BLUE,
            Color.GRAY, -1 /* gradient */, -2 /* checker */
    };
    private static final String[] NAMES = {
            "흰색", "검정", "빨강", "초록", "파랑", "회색", "그라데이션", "체크무늬"
    };

    private int idx = 0;
    private TestView testView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        testView = new TestView(this);
        testView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        setContentView(testView);
    }

    private class TestView extends View {
        private final Paint paint = new Paint();
        private final Paint text = new Paint(Paint.ANTI_ALIAS_FLAG);

        TestView(Context c) {
            super(c);
            text.setTextSize(36);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            int w = getWidth(), h = getHeight();
            int mode = COLORS[idx];
            paint.setShader(null);
            if (mode == -1) {
                paint.setShader(new LinearGradient(0, 0, w, h,
                        Color.BLACK, Color.WHITE, Shader.TileMode.CLAMP));
                canvas.drawRect(0, 0, w, h, paint);
            } else if (mode == -2) {
                int cell = 8;
                Paint p2 = new Paint();
                for (int y = 0; y < h; y += cell)
                    for (int x = 0; x < w; x += cell) {
                        p2.setColor((((x / cell) + (y / cell)) % 2 == 0) ? Color.BLACK : Color.WHITE);
                        canvas.drawRect(x, y, x + cell, y + cell, p2);
                    }
            } else {
                canvas.drawColor(mode);
            }
            // 안내 문구 (배경과 대비되는 색)
            boolean dark = (mode == Color.BLACK || mode == Color.BLUE || mode == Color.RED);
            text.setColor(dark ? Color.WHITE : Color.DKGRAY);
            canvas.drawText(NAMES[idx] + " (" + (idx + 1) + "/" + COLORS.length + ") - 탭하여 다음",
                    24, h - 48, text);
        }

        @Override
        public boolean onTouchEvent(MotionEvent event) {
            if (event.getAction() == MotionEvent.ACTION_DOWN) {
                if (idx >= COLORS.length - 1) {
                    askResult();
                } else {
                    idx++;
                    invalidate();
                }
            }
            return true;
        }
    }

    private void askResult() {
        new AlertDialog.Builder(this)
                .setTitle("디스플레이 판정")
                .setMessage("불량화소, 번인, 얼룩, 잔상이 있었나요?")
                .setPositiveButton("깨끗함 (정상)", (d, w) -> {
                    TestResults.set(this, "display", TestResults.PASS);
                    finish();
                })
                .setNegativeButton("문제 있음 (불량)", (d, w) -> {
                    TestResults.set(this, "display", TestResults.FAIL);
                    finish();
                })
                .setNeutralButton("다시 보기", (d, w) -> {
                    idx = 0;
                    testView.invalidate();
                })
                .show();
    }
}
