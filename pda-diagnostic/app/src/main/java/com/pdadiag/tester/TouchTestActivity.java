package com.pdadiag.tester;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;

/**
 * 화면 전체를 문질러 모든 격자 칸을 채우는 테스트.
 * 터치가 안 되는 영역(데드존)과 멀티터치 지점 수를 확인.
 * 뒤로 가기 버튼을 누르면 판정 다이얼로그가 뜬다.
 */
public class TouchTestActivity extends Activity {

    private TouchView view;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        view = new TouchView(this);
        setContentView(view);
    }

    @Override
    public void onBackPressed() {
        new AlertDialog.Builder(this)
                .setTitle("터치스크린 판정")
                .setMessage("칠해진 영역: " + view.coveragePercent() + "%\n" +
                        "최대 동시 터치: " + view.maxPointers + "점\n\n" +
                        "터치가 안 되는 영역이나 끊김이 있었나요?")
                .setPositiveButton("정상", (d, w) -> {
                    TestResults.setNote(this, "touch", "커버리지 " + view.coveragePercent()
                            + "%, 멀티터치 " + view.maxPointers + "점");
                    TestResults.set(this, "touch", TestResults.PASS);
                    finish();
                })
                .setNegativeButton("불량", (d, w) -> {
                    TestResults.set(this, "touch", TestResults.FAIL);
                    finish();
                })
                .setNeutralButton("계속 테스트", null)
                .show();
    }

    private static class TouchView extends View {
        private static final int CELL_DP = 28;
        private boolean[][] hit;
        private int cols, rows, cellW, cellH;
        int maxPointers = 0;
        private final Paint fill = new Paint();
        private final Paint grid = new Paint();
        private final Paint text = new Paint(Paint.ANTI_ALIAS_FLAG);

        TouchView(Context c) {
            super(c);
            fill.setColor(0xFF66BB6A);
            grid.setColor(0xFFE0E0E0);
            grid.setStyle(Paint.Style.STROKE);
            text.setColor(Color.BLACK);
            text.setTextSize(34);
            setBackgroundColor(Color.WHITE);
        }

        @Override
        protected void onSizeChanged(int w, int h, int ow, int oh) {
            int cell = (int) (CELL_DP * getResources().getDisplayMetrics().density);
            cols = Math.max(1, w / cell);
            rows = Math.max(1, h / cell);
            cellW = w / cols;
            cellH = h / rows;
            hit = new boolean[rows][cols];
        }

        int coveragePercent() {
            if (hit == null) return 0;
            int n = 0;
            for (boolean[] row : hit) for (boolean b : row) if (b) n++;
            return n * 100 / (rows * cols);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            if (hit == null) return;
            for (int r = 0; r < rows; r++)
                for (int col = 0; col < cols; col++) {
                    int x = col * cellW, y = r * cellH;
                    if (hit[r][col]) canvas.drawRect(x, y, x + cellW, y + cellH, fill);
                    canvas.drawRect(x, y, x + cellW, y + cellH, grid);
                }
            canvas.drawText(coveragePercent() + "%  터치점 " + maxPointers +
                    "  (뒤로가기=판정)", 20, 50, text);
        }

        @Override
        public boolean onTouchEvent(MotionEvent e) {
            maxPointers = Math.max(maxPointers, e.getPointerCount());
            for (int i = 0; i < e.getPointerCount(); i++) {
                mark(e.getX(i), e.getY(i));
                // 히스토리 좌표까지 반영해 빠른 스와이프에도 빈칸이 안 생기게
                for (int h = 0; h < e.getHistorySize(); h++) {
                    mark(e.getHistoricalX(i, h), e.getHistoricalY(i, h));
                }
            }
            invalidate();
            return true;
        }

        private void mark(float fx, float fy) {
            if (hit == null) return;
            int col = (int) (fx / cellW), r = (int) (fy / cellH);
            if (r >= 0 && r < rows && col >= 0 && col < cols) hit[r][col] = true;
        }
    }
}
