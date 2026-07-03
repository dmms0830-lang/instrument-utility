package com.pdadiag.tester;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {

    private BaseAdapter adapter;

    private int dp(int v) { return (int) (v * getResources().getDisplayMetrics().density); }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setTitle("PDA 진단 (PM80/PM85)");

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);

        TextView header = new TextView(this);
        header.setText(Build.MANUFACTURER + " " + Build.MODEL +
                "  ·  Android " + Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + ")");
        header.setTextSize(14);
        header.setTypeface(Typeface.DEFAULT_BOLD);
        header.setPadding(dp(12), dp(10), dp(12), dp(10));
        header.setBackgroundColor(0xFF263238);
        header.setTextColor(Color.WHITE);
        root.addView(header);

        TextView hint = new TextView(this);
        hint.setText("각 항목을 눌러 테스트한 뒤 정상/불량을 판정하세요.");
        hint.setTextSize(12);
        hint.setPadding(dp(12), dp(6), dp(12), dp(6));
        root.addView(hint);

        ListView list = new ListView(this);
        adapter = new BaseAdapter() {
            @Override public int getCount() { return TestResults.TESTS.length; }
            @Override public Object getItem(int position) { return TestResults.TESTS[position]; }
            @Override public long getItemId(int position) { return position; }
            @Override
            public View getView(int position, View convertView, ViewGroup parent) {
                LinearLayout row;
                TextView name, status;
                if (convertView instanceof LinearLayout) {
                    row = (LinearLayout) convertView;
                    name = (TextView) row.getChildAt(0);
                    status = (TextView) row.getChildAt(1);
                } else {
                    row = new LinearLayout(MainActivity.this);
                    row.setOrientation(LinearLayout.HORIZONTAL);
                    row.setPadding(dp(14), dp(14), dp(14), dp(14));
                    name = new TextView(MainActivity.this);
                    name.setTextSize(16);
                    row.addView(name, new LinearLayout.LayoutParams(0,
                            LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
                    status = new TextView(MainActivity.this);
                    status.setTextSize(15);
                    status.setTypeface(Typeface.DEFAULT_BOLD);
                    status.setGravity(Gravity.END);
                    row.addView(status);
                }
                String[] t = TestResults.TESTS[position];
                name.setText((position + 1) + ". " + t[1]);
                String r = TestResults.get(MainActivity.this, t[0]);
                if (TestResults.PASS.equals(r)) {
                    status.setText("정상");
                    status.setTextColor(0xFF2E7D32);
                } else if (TestResults.FAIL.equals(r)) {
                    status.setText("불량");
                    status.setTextColor(0xFFC62828);
                } else {
                    status.setText("미실시");
                    status.setTextColor(0xFF9E9E9E);
                }
                return row;
            }
        };
        list.setAdapter(adapter);
        list.setOnItemClickListener((parent, view, position, id) ->
                openTest(TestResults.TESTS[position][0]));
        root.addView(list, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));

        LinearLayout footer = new LinearLayout(this);
        footer.setOrientation(LinearLayout.HORIZONTAL);
        footer.setPadding(dp(8), dp(6), dp(8), dp(6));

        Button share = new Button(this);
        share.setText("리포트 공유");
        share.setOnClickListener(v -> {
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("text/plain");
            i.putExtra(Intent.EXTRA_SUBJECT, "PDA 진단 리포트 - " + Build.MODEL);
            i.putExtra(Intent.EXTRA_TEXT, TestResults.buildReport(this));
            startActivity(Intent.createChooser(i, "리포트 공유"));
        });

        Button view = new Button(this);
        view.setText("리포트 보기");
        view.setOnClickListener(v -> new AlertDialog.Builder(this)
                .setTitle("진단 리포트")
                .setMessage(TestResults.buildReport(this))
                .setPositiveButton("닫기", null)
                .show());

        Button reset = new Button(this);
        reset.setText("초기화");
        reset.setOnClickListener(v -> new AlertDialog.Builder(this)
                .setTitle("결과 초기화")
                .setMessage("모든 테스트 결과를 지울까요?")
                .setPositiveButton("지우기", (d, w) -> {
                    TestResults.clearAll(this);
                    adapter.notifyDataSetChanged();
                })
                .setNegativeButton("취소", null)
                .show());

        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        footer.addView(share, bp);
        footer.addView(view, new LinearLayout.LayoutParams(bp));
        footer.addView(reset, new LinearLayout.LayoutParams(bp));
        root.addView(footer);

        setContentView(root);
        requestNeededPermissions();
    }

    private void openTest(String id) {
        Class<?> cls;
        switch (id) {
            case "device":    cls = DeviceInfoActivity.class; break;
            case "display":   cls = DisplayTestActivity.class; break;
            case "touch":     cls = TouchTestActivity.class; break;
            case "keys":      cls = KeyTestActivity.class; break;
            case "scanner":   cls = ScannerTestActivity.class; break;
            case "battery":   cls = BatteryTestActivity.class; break;
            case "wifi":      cls = WifiTestActivity.class; break;
            case "bluetooth": cls = BluetoothTestActivity.class; break;
            case "gps":       cls = GpsTestActivity.class; break;
            case "camera":    cls = CameraTestActivity.class; break;
            case "audio":     cls = AudioTestActivity.class; break;
            case "vibration": cls = VibrationTestActivity.class; break;
            case "sensors":   cls = SensorTestActivity.class; break;
            case "nfc":       cls = NfcTestActivity.class; break;
            case "perf":      cls = PerfTestActivity.class; break;
            default: return;
        }
        startActivity(new Intent(this, cls));
    }

    private void requestNeededPermissions() {
        if (Build.VERSION.SDK_INT < 23) return;
        String[] wanted = {
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.READ_PHONE_STATE,
        };
        List<String> missing = new ArrayList<>();
        for (String p : wanted) {
            if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) missing.add(p);
        }
        if (!missing.isEmpty()) {
            requestPermissions(missing.toArray(new String[0]), 1);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (adapter != null) adapter.notifyDataSetChanged();
    }
}
