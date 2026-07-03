package com.pdadiag.tester;

import android.graphics.Typeface;
import android.os.SystemClock;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.Locale;

/**
 * 간단 성능 벤치마크: CPU(정수/실수), 메모리 복사, 저장소 읽기/쓰기.
 * 같은 앱으로 여러 기기를 측정해 상대 비교하는 용도.
 * PM85(스냅드래곤 660, 옥타코어)는 PM80(구형 쿼드코어)보다 대체로 2~3배 높게 나옴.
 */
public class PerfTestActivity extends BaseTestActivity {

    private TextView tv;
    private Button runBtn;
    private volatile boolean running = false;

    @Override
    protected String testId() { return "perf"; }

    @Override
    protected View buildContent() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(12), dp(12), dp(12), dp(12));

        runBtn = new Button(this);
        runBtn.setText("벤치마크 시작 (약 20초)");
        runBtn.setOnClickListener(v -> run());
        box.addView(runBtn);

        tv = new TextView(this);
        tv.setTypeface(Typeface.MONOSPACE);
        tv.setTextSize(13);
        tv.setText("벤치마크는 배터리가 충분하고 기기가 뜨겁지 않을 때 실행하세요.\n" +
                "발열로 인한 쓰로틀링(성능 저하)이 심하면 방열 문제 의심.");
        ScrollView sv = new ScrollView(this);
        sv.addView(tv);
        box.addView(sv, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        return box;
    }

    private void log(String s) {
        runOnUiThread(() -> tv.append("\n" + s));
    }

    private void run() {
        if (running) return;
        running = true;
        runBtn.setEnabled(false);
        tv.setText("실행 중... 잠시 기다려 주세요");
        new Thread(() -> {
            StringBuilder note = new StringBuilder();

            // 1. CPU 정수 연산
            log("\n[1/4] CPU 정수 연산...");
            long t0 = SystemClock.elapsedRealtime();
            long acc = 1;
            final int INT_OPS = 200_000_000;
            for (int i = 0; i < INT_OPS; i++) acc = acc * 31 + i;
            long intMs = SystemClock.elapsedRealtime() - t0;
            double intMops = INT_OPS / 1000.0 / intMs;
            log(String.format(Locale.KOREA, "  → %.0f MOPS (%d ms)  [체크값 %d]", intMops, intMs, acc % 10));
            note.append(String.format(Locale.KOREA, "정수 %.0fMOPS", intMops));

            // 2. CPU 실수 연산
            log("[2/4] CPU 실수 연산...");
            t0 = SystemClock.elapsedRealtime();
            double facc = 1.0;
            final int F_OPS = 100_000_000;
            for (int i = 1; i <= F_OPS; i++) facc = facc * 1.0000001 + 0.5 / i;
            long fMs = SystemClock.elapsedRealtime() - t0;
            double fMops = F_OPS / 1000.0 / fMs;
            log(String.format(Locale.KOREA, "  → %.0f MFLOPS급 (%d ms)  [체크값 %.2f]", fMops, fMs, facc % 10));
            note.append(String.format(Locale.KOREA, ", 실수 %.0fM", fMops));

            // 3. 메모리 대역폭
            log("[3/4] 메모리 복사 속도...");
            byte[] src = new byte[8 * 1024 * 1024];
            byte[] dst = new byte[src.length];
            t0 = SystemClock.elapsedRealtime();
            int loops = 16; // 총 128MB
            for (int i = 0; i < loops; i++) System.arraycopy(src, 0, dst, 0, src.length);
            long memMs = Math.max(1, SystemClock.elapsedRealtime() - t0);
            double memMBs = (long) src.length * loops / 1048576.0 * 1000 / memMs;
            log(String.format(Locale.KOREA, "  → %.0f MB/s", memMBs));
            note.append(String.format(Locale.KOREA, ", 메모리 %.0fMB/s", memMBs));

            // 4. 저장소 쓰기/읽기
            log("[4/4] 내장 저장소 속도 (16MB)...");
            File f = new File(getFilesDir(), "bench.tmp");
            double wMBs = 0, rMBs = 0;
            try {
                byte[] chunk = new byte[1024 * 1024];
                t0 = SystemClock.elapsedRealtime();
                FileOutputStream fos = new FileOutputStream(f);
                for (int i = 0; i < 16; i++) fos.write(chunk);
                fos.getFD().sync();
                fos.close();
                long wMs = Math.max(1, SystemClock.elapsedRealtime() - t0);
                wMBs = 16.0 * 1000 / wMs;

                t0 = SystemClock.elapsedRealtime();
                FileInputStream fis = new FileInputStream(f);
                while (fis.read(chunk) > 0) { /* 읽기 */ }
                fis.close();
                long rMs = Math.max(1, SystemClock.elapsedRealtime() - t0);
                rMBs = 16.0 * 1000 / rMs;
                log(String.format(Locale.KOREA, "  → 쓰기 %.0f MB/s / 읽기 %.0f MB/s", wMBs, rMBs));
                note.append(String.format(Locale.KOREA, ", 저장소 W%.0f/R%.0f MB/s", wMBs, rMBs));
            } catch (Exception e) {
                log("  → 저장소 테스트 실패: " + e.getMessage());
            } finally {
                //noinspection ResultOfMethodCallIgnored
                f.delete();
            }

            TestResults.setNote(this, "perf", note.toString());
            log("\n■ 완료!");
            log("· 같은 모델 정상 기기 대비 절반 이하면 발열/열화 의심");
            log("· 두 번 연속 실행해 두 번째가 크게 느리면 쓰로틀링(방열 문제)");
            log("· PM85는 PM80보다 대략 2~3배 높은 수치가 정상");
            runOnUiThread(() -> runBtn.setEnabled(true));
            running = false;
        }).start();
    }
}
