package com.pdadiag.tester;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Typeface;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * 바코드 스캐너 테스트.
 * 1) 키보드 웨지 모드: 스캔 결과가 입력창에 타이핑됨 (Point Mobile 기본 설정)
 * 2) 인텐트 모드: Point Mobile EmKit 브로드캐스트(device.scanner.USERMSG 등) 수신
 * 두 방식 모두 잡히도록 구성. 스캔 트리거를 당겨 레이저/이미저가 켜지는지,
 * 판독 속도와 정확도를 확인.
 */
public class ScannerTestActivity extends BaseTestActivity {

    private static final String[] SCAN_ACTIONS = {
            "device.scanner.USERMSG",          // Point Mobile EmKit 기본
            "device.common.USERMSG",
            "kr.co.pointmobile.action.BARCODE",
            "android.intent.ACTION_DECODE_DATA",
            "scanner.action.BARCODE",
    };

    private EditText wedgeInput;
    private TextView log;
    private TextView countView;
    private int scanCount = 0;
    private final StringBuilder history = new StringBuilder();
    private final SimpleDateFormat timeFmt = new SimpleDateFormat("HH:mm:ss", Locale.KOREA);
    private boolean ignoreWatcher = false;

    private final BroadcastReceiver receiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            Bundle extras = intent.getExtras();
            String data = null;
            StringBuilder dump = new StringBuilder();
            if (extras != null) {
                for (String key : extras.keySet()) {
                    Object v = extras.get(key);
                    String s;
                    if (v instanceof byte[]) s = new String((byte[]) v);
                    else s = String.valueOf(v);
                    dump.append("  ").append(key).append("=").append(s).append("\n");
                    // 대표적인 데이터 extra 키 우선 채택
                    String lk = key.toLowerCase(Locale.US);
                    if (data == null && (lk.contains("decode") || lk.contains("barcode")
                            || lk.contains("data") || lk.contains("value"))) {
                        data = s;
                    }
                }
            }
            addScan("[인텐트] " + (data != null ? data : "(데이터 키 미확인)")
                    + "\n  action=" + intent.getAction() + "\n" + dump);
        }
    };

    @Override
    protected String testId() { return "scanner"; }

    @Override
    protected View buildContent() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(12), dp(12), dp(12), dp(12));

        TextView hint = new TextView(this);
        hint.setText("아래 입력창을 누른 뒤 스캔 트리거를 당겨 바코드를 읽으세요.\n" +
                "· 웨지(키보드) 모드와 인텐트 모드 모두 자동 감지\n" +
                "· 확인: 조준 빔 켜짐 / 1초 내 판독 / 값 정확성 / 연속 10회 스캔\n" +
                "· 안 읽히면 기기 설정의 ScanSetting(스캐너 설정)에서 스캐너 활성화 확인");
        hint.setTextSize(13);
        box.addView(hint);

        wedgeInput = new EditText(this);
        wedgeInput.setHint("여기를 누르고 스캔 (웨지 모드)");
        wedgeInput.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int a, int b, int c) { }
            @Override public void onTextChanged(CharSequence s, int a, int b, int c) { }
            @Override
            public void afterTextChanged(Editable s) {
                if (ignoreWatcher) return;
                String t = s.toString();
                // 웨지 모드는 보통 엔터/개행으로 끝남
                if (t.endsWith("\n") || t.endsWith("\r")) {
                    String v = t.trim();
                    if (!v.isEmpty()) addScan("[웨지] " + v + " (" + v.length() + "자)");
                    ignoreWatcher = true;
                    s.clear();
                    ignoreWatcher = false;
                }
            }
        });
        box.addView(wedgeInput);

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);

        countView = new TextView(this);
        countView.setTextSize(16);
        countView.setTypeface(Typeface.DEFAULT_BOLD);
        countView.setText("스캔 횟수: 0");
        row.addView(countView, new LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        Button useInput = new Button(this);
        useInput.setText("입력값 기록");
        useInput.setOnClickListener(v -> {
            String t = wedgeInput.getText().toString().trim();
            if (!t.isEmpty()) {
                addScan("[웨지] " + t + " (" + t.length() + "자)");
                ignoreWatcher = true;
                wedgeInput.setText("");
                ignoreWatcher = false;
            }
        });
        row.addView(useInput);
        box.addView(row);

        log = new TextView(this);
        log.setTypeface(Typeface.MONOSPACE);
        log.setTextSize(12);
        ScrollView sv = new ScrollView(this);
        sv.addView(log);
        box.addView(sv, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        return box;
    }

    private void addScan(String entry) {
        scanCount++;
        history.insert(0, timeFmt.format(new Date()) + " " + entry + "\n");
        if (history.length() > 6000) history.setLength(6000);
        log.setText(history);
        countView.setText("스캔 횟수: " + scanCount);
        TestResults.setNote(this, "scanner", "스캔 " + scanCount + "회 성공");
    }

    @Override
    protected void onResume() {
        super.onResume();
        IntentFilter f = new IntentFilter();
        for (String a : SCAN_ACTIONS) f.addAction(a);
        registerReceiver(receiver, f);
    }

    @Override
    protected void onPause() {
        super.onPause();
        try { unregisterReceiver(receiver); } catch (Exception ignored) { }
    }
}
