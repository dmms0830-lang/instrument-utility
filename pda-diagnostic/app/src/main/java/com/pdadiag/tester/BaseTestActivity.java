package com.pdadiag.tester;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Toast;

/**
 * 공통 테스트 화면: 상단에 테스트 내용, 하단에 [정상]/[불량] 판정 버튼.
 * 판정하면 결과가 저장되고 화면이 닫힌다.
 */
public abstract class BaseTestActivity extends Activity {

    /** TestResults.TESTS 의 id */
    protected abstract String testId();

    /** 테스트 UI 본문 */
    protected abstract View buildContent();

    protected int dp(int v) {
        return (int) (v * getResources().getDisplayMetrics().density);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);

        View content = buildContent();
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f);
        root.addView(content, cp);

        LinearLayout footer = new LinearLayout(this);
        footer.setOrientation(LinearLayout.HORIZONTAL);
        footer.setPadding(dp(8), dp(8), dp(8), dp(8));
        footer.setGravity(Gravity.CENTER);

        Button pass = new Button(this);
        pass.setText("✔ 정상");
        pass.setTextColor(Color.WHITE);
        pass.setBackgroundColor(0xFF2E7D32);
        pass.setOnClickListener(v -> finishWith(TestResults.PASS));

        Button fail = new Button(this);
        fail.setText("✘ 불량");
        fail.setTextColor(Color.WHITE);
        fail.setBackgroundColor(0xFFC62828);
        fail.setOnClickListener(v -> finishWith(TestResults.FAIL));

        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        bp.setMargins(dp(4), 0, dp(4), 0);
        footer.addView(pass, bp);
        footer.addView(fail, new LinearLayout.LayoutParams(bp));

        root.addView(footer, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        setContentView(root);
    }

    protected void finishWith(String result) {
        TestResults.set(this, testId(), result);
        Toast.makeText(this, TestResults.nameOf(testId()) + ": " +
                (TestResults.PASS.equals(result) ? "정상" : "불량") + " 저장됨", Toast.LENGTH_SHORT).show();
        finish();
    }
}
