package com.pdadiag.tester;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Typeface;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * 블루투스 테스트: 어댑터 상태 확인 + 주변 기기 검색.
 * 주변 기기가 목록에 뜨면 BT 모듈/안테나는 정상.
 */
@SuppressLint("MissingPermission")
public class BluetoothTestActivity extends BaseTestActivity {

    private BluetoothAdapter adapter;
    private TextView status;
    private TextView list;
    private final Set<String> found = new LinkedHashSet<>();

    private final BroadcastReceiver receiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (BluetoothDevice.ACTION_FOUND.equals(action)) {
                BluetoothDevice d = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                short rssi = intent.getShortExtra(BluetoothDevice.EXTRA_RSSI, Short.MIN_VALUE);
                if (d != null) {
                    String name = d.getName();
                    found.add((name == null ? "(이름 없음)" : name) + "  " + d.getAddress()
                            + (rssi != Short.MIN_VALUE ? "  " + rssi + "dBm" : ""));
                    render();
                }
            } else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action)) {
                status.append("\n검색 완료 — " + found.size() + "개 발견");
            }
        }
    };

    private void render() {
        StringBuilder sb = new StringBuilder("■ 발견된 기기 (" + found.size() + "개)\n");
        for (String s : found) sb.append(s).append("\n");
        list.setText(sb.toString());
    }

    @Override
    protected String testId() { return "bluetooth"; }

    @Override
    protected View buildContent() {
        adapter = BluetoothAdapter.getDefaultAdapter();

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(12), dp(12), dp(12), dp(12));

        status = new TextView(this);
        status.setTypeface(Typeface.MONOSPACE);
        status.setTextSize(13);
        box.addView(status);

        Button scan = new Button(this);
        scan.setText("주변 기기 검색 (10초)");
        scan.setOnClickListener(v -> startScan());
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
        if (adapter == null) {
            status.setText("블루투스 하드웨어 없음!");
            return;
        }
        status.setText("BT 상태: " + (adapter.isEnabled() ? "켜짐" : "꺼짐")
                + "\n이름: " + adapter.getName()
                + "\n\n검색 버튼을 눌러 주변 기기(휴대폰 등)가 잡히는지 확인하세요.");
    }

    private void startScan() {
        if (adapter == null) return;
        if (!adapter.isEnabled()) {
            startActivity(new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE));
            Toast.makeText(this, "블루투스를 켠 뒤 다시 검색하세요", Toast.LENGTH_SHORT).show();
            return;
        }
        found.clear();
        render();
        if (adapter.isDiscovering()) adapter.cancelDiscovery();
        boolean ok = adapter.startDiscovery();
        status.setText("BT 상태: 켜짐 — " + (ok ? "검색 중..." : "검색 시작 실패 (위치 권한 확인)"));
    }

    @Override
    protected void onResume() {
        super.onResume();
        IntentFilter f = new IntentFilter();
        f.addAction(BluetoothDevice.ACTION_FOUND);
        f.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
        registerReceiver(receiver, f);
        refreshStatus();
    }

    @Override
    protected void onPause() {
        super.onPause();
        try { unregisterReceiver(receiver); } catch (Exception ignored) { }
        if (adapter != null && adapter.isDiscovering()) adapter.cancelDiscovery();
    }
}
