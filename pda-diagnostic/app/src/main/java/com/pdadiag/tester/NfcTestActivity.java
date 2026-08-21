package com.pdadiag.tester;

import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Typeface;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.view.View;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.Arrays;

/**
 * NFC 테스트 (PM85 옵션 / PM80 일부 모델).
 * 교통카드, 신용카드 등 아무 NFC 태그나 뒷면에 대면 태그 ID가 표시됨.
 */
public class NfcTestActivity extends BaseTestActivity {

    private NfcAdapter nfc;
    private TextView tv;
    private int tagCount = 0;

    @Override
    protected String testId() { return "nfc"; }

    @Override
    protected View buildContent() {
        nfc = NfcAdapter.getDefaultAdapter(this);
        tv = new TextView(this);
        tv.setTypeface(Typeface.MONOSPACE);
        tv.setTextSize(13);
        tv.setPadding(dp(12), dp(12), dp(12), dp(12));
        render(null);
        ScrollView sv = new ScrollView(this);
        sv.addView(tv);
        return sv;
    }

    private void render(String tagInfo) {
        StringBuilder sb = new StringBuilder();
        if (nfc == null) {
            sb.append("NFC 하드웨어 없음\n(이 모델은 NFC 미장착 — 옵션 사양이면 정상)\n");
        } else {
            sb.append("NFC 상태: ").append(nfc.isEnabled() ? "켜짐" : "꺼짐 — 설정에서 켜세요").append("\n\n");
            sb.append("교통카드/체크카드 등 NFC 태그를\n기기 뒷면에 대 보세요.\n\n");
            sb.append("인식 횟수: ").append(tagCount).append("\n");
        }
        if (tagInfo != null) sb.append("\n").append(tagInfo);
        tv.setText(sb.toString());
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (nfc != null && nfc.isEnabled()) {
            Intent intent = new Intent(this, getClass())
                    .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = android.os.Build.VERSION.SDK_INT >= 31
                    ? PendingIntent.FLAG_MUTABLE : 0;
            PendingIntent pi = PendingIntent.getActivity(this, 0, intent, flags);
            nfc.enableForegroundDispatch(this, pi, null, null);
        }
        render(null);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (nfc != null) {
            try { nfc.disableForegroundDispatch(this); } catch (Exception ignored) { }
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
        if (tag != null) {
            tagCount++;
            StringBuilder id = new StringBuilder();
            for (byte b : tag.getId()) id.append(String.format("%02X ", b));
            render("■ 태그 인식됨! ✅\nID: " + id + "\n기술: " + Arrays.toString(tag.getTechList()));
        }
    }
}
