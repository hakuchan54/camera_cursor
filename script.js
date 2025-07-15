window.onload = function() {
    // HTML要素の取得
    const calibrateBtn = document.getElementById('calibrateBtn');
    const statusText = document.getElementById('statusText');
    const gazeCursor = document.getElementById('gazeCursor');

    // WebGazer.jsの初期設定と開始
    async function startWebGazer() {
        // カメラ映像を左上に表示する設定
        webgazer.setVideoElementCanvas(
            webgazer.getVideoElementCanvas()
        );
        
        // 視線予測のリスナーを設定
        webgazer.setGazeListener((data, elapsedTime) => {
            if (data == null) {
                return;
            }
            // 視線データをカーソルの位置に反映
            gazeCursor.style.left = `${data.x}px`;
            gazeCursor.style.top = `${data.y}px`;
        }).begin();

        // UIのフィードバックを表示（カメラ映像、顔の枠線など）
        webgazer.showVideo(true);
        webgazer.showFaceFeedbackBox(true);
        webgazer.showFaceOverlay(true);

        statusText.textContent = 'カメラ準備完了。ボタンを押してキャリブレーションを開始してください。';
    }

    // キャリブレーション処理
    function startCalibration() {
        calibrateBtn.disabled = true; // ボタンを無効化
        let seconds = 20; // キャリブレーション時間
        
        statusText.textContent = `キャリブレーション中... ${seconds}秒間、画面の四隅や中央をゆっくりと見つめてください。`;

        // 20秒のカウントダウンタイマー
        const countdown = setInterval(() => {
            seconds--;
            statusText.textContent = `キャリブレーション中... 残り${seconds}秒`;
            if (seconds <= 0) {
                clearInterval(countdown);
                finishCalibration();
            }
        }, 1000);
    }

    // キャリブレーション完了処理
    function finishCalibration() {
        statusText.textContent = 'キャリブレーションが完了しました！視線でカーソルを動かせます。';
        calibrateBtn.disabled = false; // ボタンを再度有効化
        calibrateBtn.textContent = '再キャリブレーション';
    }

    // キャリブレーションボタンにクリックイベントを追加
    calibrateBtn.addEventListener('click', startCalibration);

    // WebGazerを開始
    startWebGazer();
};
