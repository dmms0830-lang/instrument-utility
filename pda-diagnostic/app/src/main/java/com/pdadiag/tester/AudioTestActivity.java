package com.pdadiag.tester;

import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.AudioTrack;
import android.media.MediaRecorder;
import android.os.Build;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

/**
 * 스피커/마이크 테스트.
 * 스피커: 저음/고음 사인파 재생 — 찢어짐·잡음 확인.
 * 마이크: 5초 녹음 후 재생 — 녹음 품질 확인.
 */
public class AudioTestActivity extends BaseTestActivity {

    private static final int SAMPLE_RATE = 16000;
    private TextView status;
    private short[] recorded;
    private int recordedLen = 0;
    private volatile boolean busy = false;

    @Override
    protected String testId() { return "audio"; }

    @Override
    protected View buildContent() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(12), dp(12), dp(12), dp(12));

        TextView hint = new TextView(this);
        hint.setText("① 톤 재생으로 스피커 확인 (찢어짐/잡음/무음)\n" +
                "② 녹음 후 재생으로 마이크 확인\n※ 볼륨을 충분히 올리고 테스트하세요");
        hint.setTextSize(13);
        box.addView(hint);

        Button low = new Button(this);
        low.setText("스피커: 저음 재생 (440Hz, 2초)");
        low.setOnClickListener(v -> playTone(440, 2000));
        box.addView(low);

        Button high = new Button(this);
        high.setText("스피커: 고음 재생 (2kHz, 2초)");
        high.setOnClickListener(v -> playTone(2000, 2000));
        box.addView(high);

        Button rec = new Button(this);
        rec.setText("마이크: 5초 녹음");
        rec.setOnClickListener(v -> record());
        box.addView(rec);

        Button play = new Button(this);
        play.setText("녹음 재생");
        play.setOnClickListener(v -> playRecorded());
        box.addView(play);

        Button maxVol = new Button(this);
        maxVol.setText("미디어 볼륨 최대로");
        maxVol.setOnClickListener(v -> {
            AudioManager am = (AudioManager) getSystemService(AUDIO_SERVICE);
            am.setStreamVolume(AudioManager.STREAM_MUSIC,
                    am.getStreamMaxVolume(AudioManager.STREAM_MUSIC), 0);
            Toast.makeText(this, "볼륨 최대", Toast.LENGTH_SHORT).show();
        });
        box.addView(maxVol);

        status = new TextView(this);
        status.setTextSize(14);
        status.setPadding(0, dp(10), 0, 0);
        ScrollView sv = new ScrollView(this);
        sv.addView(status);
        box.addView(sv, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        return box;
    }

    private void playTone(int hz, int ms) {
        if (busy) return;
        busy = true;
        status.setText(hz + "Hz 재생 중...");
        new Thread(() -> {
            int n = SAMPLE_RATE * ms / 1000;
            short[] buf = new short[n];
            for (int i = 0; i < n; i++) {
                double env = Math.min(1, Math.min(i / 800.0, (n - i) / 800.0)); // 클릭음 방지
                buf[i] = (short) (Math.sin(2 * Math.PI * hz * i / SAMPLE_RATE) * 32767 * 0.8 * env);
            }
            AudioTrack track = new AudioTrack(AudioManager.STREAM_MUSIC, SAMPLE_RATE,
                    AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT,
                    n * 2, AudioTrack.MODE_STATIC);
            track.write(buf, 0, n);
            track.play();
            try { Thread.sleep(ms + 200); } catch (InterruptedException ignored) { }
            track.release();
            runOnUiThread(() -> status.setText(hz + "Hz 재생 완료 — 소리가 깨끗했나요?"));
            busy = false;
        }).start();
    }

    private void record() {
        if (busy) return;
        if (Build.VERSION.SDK_INT >= 23 &&
                checkSelfPermission(android.Manifest.permission.RECORD_AUDIO)
                        != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{android.Manifest.permission.RECORD_AUDIO}, 2);
            return;
        }
        busy = true;
        status.setText("녹음 중... 기기에 대고 말하세요 (5초)");
        new Thread(() -> {
            int minBuf = AudioRecord.getMinBufferSize(SAMPLE_RATE,
                    AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
            AudioRecord rec;
            try {
                rec = new AudioRecord(MediaRecorder.AudioSource.MIC, SAMPLE_RATE,
                        AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT,
                        Math.max(minBuf, SAMPLE_RATE));
            } catch (Exception e) {
                runOnUiThread(() -> status.setText("마이크 열기 실패: " + e.getMessage()));
                busy = false;
                return;
            }
            if (rec.getState() != AudioRecord.STATE_INITIALIZED) {
                runOnUiThread(() -> status.setText("마이크 초기화 실패 — 하드웨어 불량 의심"));
                rec.release();
                busy = false;
                return;
            }
            int total = SAMPLE_RATE * 5;
            short[] buf = new short[total];
            rec.startRecording();
            int off = 0;
            int maxAmp = 0;
            while (off < total) {
                int r = rec.read(buf, off, Math.min(2048, total - off));
                if (r <= 0) break;
                for (int i = off; i < off + r; i++) maxAmp = Math.max(maxAmp, Math.abs(buf[i]));
                off += r;
                final int pct = off * 100 / total;
                final int amp = maxAmp;
                runOnUiThread(() -> status.setText("녹음 중... " + pct + "%  (최대 레벨 " + amp + "/32767)"));
            }
            rec.stop();
            rec.release();
            recorded = buf;
            recordedLen = off;
            final int amp = maxAmp;
            runOnUiThread(() -> status.setText("녹음 완료. 최대 레벨: " + amp + "/32767\n" +
                    (amp < 500 ? "⚠ 레벨이 매우 낮음 — 마이크 불량 의심" : "레벨 정상 — '녹음 재생'으로 확인") ));
            busy = false;
        }).start();
    }

    private void playRecorded() {
        if (busy) return;
        if (recorded == null || recordedLen == 0) {
            Toast.makeText(this, "먼저 녹음하세요", Toast.LENGTH_SHORT).show();
            return;
        }
        busy = true;
        status.setText("녹음 재생 중...");
        new Thread(() -> {
            AudioTrack track = new AudioTrack(AudioManager.STREAM_MUSIC, SAMPLE_RATE,
                    AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT,
                    recordedLen * 2, AudioTrack.MODE_STATIC);
            track.write(recorded, 0, recordedLen);
            track.play();
            try { Thread.sleep(recordedLen * 1000L / SAMPLE_RATE + 200); } catch (InterruptedException ignored) { }
            track.release();
            runOnUiThread(() -> status.setText("재생 완료 — 목소리가 깨끗하게 들렸나요?"));
            busy = false;
        }).start();
    }
}
