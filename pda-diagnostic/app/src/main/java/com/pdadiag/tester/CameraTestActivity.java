package com.pdadiag.tester;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.hardware.Camera;
import android.os.Bundle;
import android.view.Gravity;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/**
 * 카메라 테스트 (구형 Camera API — PM80/PM85 모두 동작).
 * 미리보기 화질, 초점(탭), 플래시, 전/후면 전환 확인.
 */
@SuppressWarnings("deprecation")
public class CameraTestActivity extends Activity implements SurfaceHolder.Callback {

    private Camera camera;
    private SurfaceView surface;
    private int cameraId = 0;
    private boolean flashOn = false;
    private TextView info;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        surface = new SurfaceView(this);
        surface.getHolder().addCallback(this);
        root.addView(surface);

        info = new TextView(this);
        info.setTextColor(Color.WHITE);
        info.setBackgroundColor(0x88000000);
        info.setPadding(16, 8, 16, 8);
        info.setText("미리보기 확인: 초점·노이즈·줄무늬·이물질");
        root.addView(info, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.TOP | Gravity.START));

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER);

        Button focus = new Button(this);
        focus.setText("초점");
        focus.setOnClickListener(v -> {
            if (camera != null) {
                try { camera.autoFocus((ok, c) ->
                        Toast.makeText(this, ok ? "초점 OK" : "초점 실패", Toast.LENGTH_SHORT).show());
                } catch (Exception e) { toast("초점 미지원"); }
            }
        });

        Button flash = new Button(this);
        flash.setText("플래시");
        flash.setOnClickListener(v -> toggleFlash());

        Button switchCam = new Button(this);
        switchCam.setText("전/후면");
        switchCam.setOnClickListener(v -> switchCamera());

        Button judge = new Button(this);
        judge.setText("판정");
        judge.setOnClickListener(v -> askResult());

        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        bar.addView(focus, bp);
        bar.addView(flash, new LinearLayout.LayoutParams(bp));
        bar.addView(switchCam, new LinearLayout.LayoutParams(bp));
        bar.addView(judge, new LinearLayout.LayoutParams(bp));

        root.addView(bar, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM));

        setContentView(root);
    }

    private void toast(String s) { Toast.makeText(this, s, Toast.LENGTH_SHORT).show(); }

    private void askResult() {
        new AlertDialog.Builder(this)
                .setTitle("카메라 판정")
                .setMessage("미리보기가 선명하고 초점·플래시가 동작했나요?")
                .setPositiveButton("정상", (d, w) -> {
                    TestResults.set(this, "camera", TestResults.PASS);
                    finish();
                })
                .setNegativeButton("불량", (d, w) -> {
                    TestResults.set(this, "camera", TestResults.FAIL);
                    finish();
                })
                .setNeutralButton("계속", null)
                .show();
    }

    private void toggleFlash() {
        if (camera == null) return;
        try {
            Camera.Parameters p = camera.getParameters();
            if (p.getSupportedFlashModes() == null) { toast("플래시 없음"); return; }
            flashOn = !flashOn;
            p.setFlashMode(flashOn ? Camera.Parameters.FLASH_MODE_TORCH
                    : Camera.Parameters.FLASH_MODE_OFF);
            camera.setParameters(p);
            toast(flashOn ? "플래시 켜짐" : "플래시 꺼짐");
        } catch (Exception e) { toast("플래시 제어 실패"); }
    }

    private void switchCamera() {
        int n = Camera.getNumberOfCameras();
        if (n < 2) { toast("카메라 " + n + "개 — 전환 불가 (PM80은 후면만 있는 모델 있음)"); return; }
        cameraId = (cameraId + 1) % n;
        releaseCamera();
        openCamera(surface.getHolder());
    }

    private void openCamera(SurfaceHolder holder) {
        try {
            camera = Camera.open(cameraId);
            camera.setDisplayOrientation(90);
            camera.setPreviewDisplay(holder);
            camera.startPreview();
            Camera.CameraInfo ci = new Camera.CameraInfo();
            Camera.getCameraInfo(cameraId, ci);
            Camera.Size sz = camera.getParameters().getPreviewSize();
            info.setText((ci.facing == Camera.CameraInfo.CAMERA_FACING_FRONT ? "전면" : "후면")
                    + " 카메라 · " + sz.width + "x" + sz.height
                    + " · 총 " + Camera.getNumberOfCameras() + "개");
        } catch (Exception e) {
            info.setText("카메라 열기 실패: " + e.getMessage() + "\n(권한 또는 하드웨어 문제)");
        }
    }

    private void releaseCamera() {
        if (camera != null) {
            try {
                camera.stopPreview();
                camera.release();
            } catch (Exception ignored) { }
            camera = null;
        }
    }

    @Override public void surfaceCreated(SurfaceHolder holder) { openCamera(holder); }
    @Override public void surfaceChanged(SurfaceHolder holder, int f, int w, int h) { }
    @Override public void surfaceDestroyed(SurfaceHolder holder) { releaseCamera(); }

    @Override
    protected void onPause() {
        super.onPause();
        releaseCamera();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (camera == null && surface.getHolder().getSurface() != null
                && surface.getHolder().getSurface().isValid()) {
            openCamera(surface.getHolder());
        }
    }
}
