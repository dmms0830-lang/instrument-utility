package com.pdadiag.tester;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** 테스트 결과 저장/조회 및 리포트 생성 */
public class TestResults {

    private static final String PREF = "results";

    public static final String PASS = "PASS";
    public static final String FAIL = "FAIL";

    /** {id, 표시 이름} 순서 = 메인 화면 목록 순서 */
    public static final String[][] TESTS = {
            {"device",    "기기 정보 확인"},
            {"display",   "디스플레이 (불량화소/번인)"},
            {"touch",     "터치스크린"},
            {"keys",      "물리 버튼/키패드"},
            {"scanner",   "바코드 스캐너"},
            {"battery",   "배터리 상태"},
            {"wifi",      "Wi-Fi"},
            {"bluetooth", "블루투스"},
            {"gps",       "GPS"},
            {"camera",    "카메라"},
            {"audio",     "스피커/마이크"},
            {"vibration", "진동 모터"},
            {"sensors",   "센서"},
            {"nfc",       "NFC"},
            {"perf",      "성능 벤치마크"},
    };

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREF, Context.MODE_PRIVATE);
    }

    public static String get(Context c, String id) {
        return prefs(c).getString(id, "");
    }

    public static void set(Context c, String id, String value) {
        prefs(c).edit().putString(id, value).apply();
    }

    public static void setNote(Context c, String id, String note) {
        prefs(c).edit().putString(id + "_note", note).apply();
    }

    public static String getNote(Context c, String id) {
        return prefs(c).getString(id + "_note", "");
    }

    public static void clearAll(Context c) {
        prefs(c).edit().clear().apply();
    }

    public static String nameOf(String id) {
        for (String[] t : TESTS) if (t[0].equals(id)) return t[1];
        return id;
    }

    /** 공유용 텍스트 리포트 생성 */
    public static String buildReport(Context c) {
        StringBuilder sb = new StringBuilder();
        sb.append("===== PDA 진단 리포트 =====\n");
        sb.append("기기: ").append(Build.MANUFACTURER).append(" ").append(Build.MODEL).append("\n");
        sb.append("Android ").append(Build.VERSION.RELEASE)
          .append(" (API ").append(Build.VERSION.SDK_INT).append(")\n");
        sb.append("빌드: ").append(Build.DISPLAY).append("\n");
        sb.append("일시: ").append(new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.KOREA).format(new Date())).append("\n");
        sb.append("---------------------------\n");
        int pass = 0, fail = 0, skip = 0;
        for (String[] t : TESTS) {
            String r = get(c, t[0]);
            String mark;
            if (PASS.equals(r)) { mark = "✅ 정상"; pass++; }
            else if (FAIL.equals(r)) { mark = "❌ 불량"; fail++; }
            else { mark = "⬜ 미실시"; skip++; }
            sb.append(mark).append("  ").append(t[1]);
            String note = getNote(c, t[0]);
            if (note != null && !note.isEmpty()) sb.append("  [").append(note).append("]");
            sb.append("\n");
        }
        sb.append("---------------------------\n");
        sb.append("정상 ").append(pass).append(" / 불량 ").append(fail).append(" / 미실시 ").append(skip).append("\n");
        return sb.toString();
    }
}
