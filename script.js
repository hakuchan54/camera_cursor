window.onload = function() {
    const calibrateBtn = document.getElementById('calibrateBtn');
    const statusText = document.getElementById('statusText');
    const gazeCursor = document.getElementById('gazeCursor');

    let initialFacePositionX = null;
    let initialFacePositionY = null;
    let isCalibrating = false;

    async function startWebGazer() {
        webgazer.setVideoElementCanvas(
            webgazer.getVideoElementCanvas()
        );

        webgazer.setFaceTracked(true); // 顔追跡を有効にする

        webgazer.setGazeListener((data, elapsedTime) => {
            if (data == null || !isCalibrating) {
                return;
            }

            const currentFacePositionX = data.x;
            const currentFacePositionY = data.y;

            if (initialFacePositionX === null || initialFacePositionY === null) {
                initialFacePositionX = currentFacePositionX;
                initialFacePositionY = currentFacePositionY;
                return;
            }

            // 顔の動きの感度を調整
            const sensitivityX = 1.5;
            const sensitivityY = 1.5;

            // 顔の水平方向の移動量に応じてカーソルのX座標を更新
            const deltaX = (currentFacePositionX - initialFacePositionX) * sensitivityX;
            gazeCursor.style.left = `${window.innerWidth / 2 + deltaX}px`;

            // 顔の垂直方向の移動量に応じてカーソルのY座標を更新
            const deltaY = (currentFacePositionY - initialFacePositionY) * sensitivityY;
            gazeCursor.style.top = `${window.innerHeight / 2 + deltaY}px`;
        }).begin();

        webgazer.showVideo(true);
        webgazer.showFaceFeedbackBox(true);
        webgazer.showFaceOverlay(false); // 顔のオーバーレイは不要なので非表示

        statusText.textContent = 'カメラ準備完了。ボタンを押してキャリブレーションを開始してください。';
        calibrateBtn.disabled = false;
    }

    function startCalibration() {
        calibrateBtn.disabled = true;
        isCalibrating = true;
        initialFacePositionX = null;
        initialFacePositionY = null;
        let seconds = 5; // キャリブレーション時間を短縮

        statusText.textContent = `キャリブレーション中... ${seconds}秒間、正面を向いてください。`;

        const countdown = setInterval(() => {
            seconds--;
            statusText.textContent = `キャリブレーション中... 残り${seconds}秒`;
            if (seconds <= 0) {
                clearInterval(countdown);
                finishCalibration();
            }
        }, 1000);
    }

    function finishCalibration() {
        isCalibrating = false;
        statusText.textContent = 'キャリブレーションが完了しました！顔の動きでカーソルを動かせます。';
        calibrateBtn.disabled = false;
        calibrateBtn.textContent = '再キャリブレーション';
    }

    calibrateBtn.addEventListener('click', startCalibration);

    startWebGazer();
};
