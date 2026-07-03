package com.pdadiag.tester;

import android.graphics.Typeface;
import android.view.KeyEvent;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * 물리 버튼 테스트: 눌린 키의 키코드를 표시.
 * PM80/PM85의 스캔 트리거, 볼륨, 전원 외 기능키, 키패드(PM80 숫자키) 확인용.
 * 참고: 스캔 트리거 키는 스캐너 서비스가 가로채는 경우 표시되지 않을 수 있음.
 */
public class KeyTestActivity extends BaseTestActivity {

    private TextView log;
    private TextView counter;
    private final Set<Integer> seen = new LinkedHashSet<>();
    private final StringBuilder history = new StringBuilder();

    @Override
    protected String testId() { return "keys"; }

    @Override
    protected View buildContent() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(12), dp(12), dp(12), dp(12));

        TextView hint = new TextView(this);
        hint.setText("기기의 모든 물리 버튼을 하나씩 눌러보세요.\n" +
                "(스캔 트리거 · 볼륨 · 기능키 · 키패드)\n" +
                "※ 스캔 트리거는 스캐너가 가로채면 여기 안 뜰 수 있음 → 스캐너 테스트에서 확인\n" +
                "※ 뒤로 가기 키도 기록됨 — 종료는 아래 판정 버튼 사용");
        hint.setTextSize(13);
        box.addView(hint);

        counter = new TextView(this);
        counter.setTextSize(16);
        counter.setTypeface(Typeface.DEFAULT_BOLD);
        counter.setPadding(0, dp(8), 0, dp(8));
        counter.setText("감지된 키: 0종");
        box.addView(counter);

        log = new TextView(this);
        log.setTypeface(Typeface.MONOSPACE);
        log.setTextSize(13);

        ScrollView sv = new ScrollView(this);
        sv.addView(log);
        box.addView(sv, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        return box;
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN && log != null) {
            int code = event.getKeyCode();
            seen.add(code);
            history.insert(0, KeyEvent.keyCodeToString(code) + " (" + code + ")\n");
            if (history.length() > 4000) history.setLength(4000);
            log.setText(history);
            counter.setText("감지된 키: " + seen.size() + "종");
        }
        // 뒤로 가기 포함 모든 키를 소비 (판정 버튼으로만 종료)
        return true;
    }
}
