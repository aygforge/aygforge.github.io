package com.aygforge.cozfis;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

/**
 * CozFis Android kabuğu (Faz 3).
 * Oyun mantığına dokunmaz; yalnızca:
 *  - yatay tam ekran (sistem çubukları gizli, kenardan kaydırınca geçici görünür),
 *  - ekran kesiği (çentik / kamera deliği) alanına yerleşim (güvenli alan değerleri SystemBars ile web'e iletilir),
 *  - WebView'de yakınlaştırma, sistem yazı boyutu ölçeklemesi ve uzun basış menüsünü kapatma,
 *  - ses odağı: başka bir uygulama / arama sesi aldığında oyuna 'cozfis:audiofocus' olayı.
 */
public class MainActivity extends BridgeActivity {

    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private final AudioManager.OnAudioFocusChangeListener focusListener = change -> {
        boolean gain = change == AudioManager.AUDIOFOCUS_GAIN;
        boolean loss = change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT
                || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK;
        if (gain || loss) sendFocus(gain);
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                    ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                    : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
        hideSystemBars();
        configureWebView();
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
    }

    private void hideSystemBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }

    private void configureWebView() {
        if (getBridge() == null) return;
        WebView wv = getBridge().getWebView();
        WebSettings s = wv.getSettings();
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);                       // sistem yazı boyutu oyun düzenini bozmasın
        s.setMediaPlaybackRequiresUserGesture(true);
        wv.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        wv.setHapticFeedbackEnabled(false);
        wv.setOnLongClickListener(v -> {
            WebView.HitTestResult r = wv.getHitTestResult();
            return r == null || r.getType() != WebView.HitTestResult.EDIT_TEXT_TYPE;   // metin kutularında seçim/yapıştır serbest
        });
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        hideSystemBars();
        requestFocus();
    }

    @Override
    public void onPause() {
        abandonFocus();
        super.onPause();
    }

    private void requestFocus() {
        if (audioManager == null) return;
        int r;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (focusRequest == null) {
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                        .setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_GAME)
                                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
                        .setOnAudioFocusChangeListener(focusListener)
                        .setWillPauseWhenDucked(true)
                        .build();
            }
            r = audioManager.requestAudioFocus(focusRequest);
        } else {
            r = audioManager.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
        sendFocus(r == AudioManager.AUDIOFOCUS_REQUEST_GRANTED);
    }

    private void abandonFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (focusRequest != null) audioManager.abandonAudioFocusRequest(focusRequest);
        } else {
            audioManager.abandonAudioFocus(focusListener);
        }
    }

    private void sendFocus(boolean gain) {
        if (getBridge() == null) return;
        String js = "window.dispatchEvent(new CustomEvent('cozfis:audiofocus',{detail:{gain:" + gain + "}}))";
        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(js, null));
    }
}
