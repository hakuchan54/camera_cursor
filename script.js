window.onload = function() {
    // HTML要素の取得
    const calibrateBtn = document.getElementById('calibrateBtn');
    const statusText = document.getElementById('statusText');
    const gazeCursor = document.getElementById('gazeCursor');
    const calibrationPoint = document.getElementById('calibrationPoint');

    // キャリブレーション関連の変数
    let calibrationData = [];
    let currentPointIndex = 0;
    let faceMovementRange = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    let isCalibrated = false;
    let dataCollectionInterval = null; // データ収集用のインターバルID

    // キャリブレーションで表示する点の位置 (画面の割合)
    const calibrationPoints = [
        { x: 0.5, y: 0.5 }, // 中央
        { x: 0.1, y: 0.1 }, // 左上
        { x: 0.9, y: 0.1 }, // 右上
        { x: 0.1, y: 0.9 }, // 左下
        { x: 0.9, y: 0.9 }, // 右下
    ];

    // WebGazerの初期化
    async function initializeWebGazer() {
        await webgazer.setGazeListener(handleGazeData).begin();
        webgazer.showVideo(true);
        webgazer.showFaceFeedbackBox(true);
        webgazer.showFaceOverlay(false);
        statusText.textContent = 'カメラ準備完了。ボタンを押してキャリブレーションを開始してください。';
    }

    // WebGazerからのデータ処理（カーソル移動）
    function handleGazeData(data, elapsedTime) {
        if (!isCalibrated || data == null) return;
        
        const cursorX = mapValue(data.x, faceMovementRange.minX, faceMovementRange.maxX, 0, window.innerWidth);
        const cursorY = mapValue(data.y, faceMovementRange.minY, faceMovementRange.maxY, 0, window.innerHeight);

        gazeCursor.style.left = `${cursorX}px`;
        gazeCursor.style.top = `${cursorY}px`;
    }

    // 数値をある範囲から別の範囲へマッピングする関数
    function mapValue(value, fromMin, fromMax, toMin, toMax) {
        // fromの範囲が0の場合（点が1つしか記録されなかった場合など）のエラーを回避
        if (fromMax - fromMin === 0) {
            return (toMin + toMax) / 2;
        }
        const normalized = (value - fromMin) / (fromMax - fromMin);
        return toMin + normalized * (toMax - toMin);
    }

    // キャリブレーションの開始
    function startCalibration() {
        isCalibrated = false;
        calibrateBtn.disabled = true;
        gazeCursor.style.display = 'none';
        calibrationData = [];
        currentPointIndex = 0;
        showNextCalibrationPoint();
    }

    // ★★改善されたキャリブレーションポイント表示関数★★
    function showNextCalibrationPoint() {
        if (currentPointIndex >= calibrationPoints.length) {
            finishCalibration();
            return;
        }

        const point = calibrationPoints[currentPointIndex];
        const screenX = window.innerWidth * point.x;
        const screenY = window.innerHeight * point.y;

        calibrationPoint.style.left = `${screenX}px`;
        calibrationPoint.style.top = `${screenY}px`;
        calibrationPoint.classList.remove('hidden');

        statusText.textContent = `キャリブレーション中 (${currentPointIndex + 1}/${calibrationPoints.length}): 赤い点を見て3秒間待ってください...`;

        // --- 改善点：3秒間データを集め続ける ---
        let pointSamples = [];
        clearInterval(dataCollectionInterval); // 前のインターバルをクリア
        dataCollectionInterval = setInterval(() => {
            const facePrediction = webgazer.getCurrentFacePrediction();
            if (facePrediction) {
                pointSamples.push(facePrediction);
            }
        }, 100); // 100ミリ秒ごとに顔データを収集

        // 3秒後にデータ処理
        setTimeout(() => {
            clearInterval(dataCollectionInterval); // データ収集を停止

            if (pointSamples.length > 0) {
                // 収集したデータの平均値を計算
                const avgX = pointSamples.reduce((sum, d) => sum + d.x, 0) / pointSamples.length;
                const avgY = pointSamples.reduce((sum, d) => sum + d.y, 0) / pointSamples.length;
                
                calibrationData.push({
                    screen: { x: screenX, y: screenY },
                    face: { x: avgX, y: avgY }
                });
                console.log(`Point ${currentPointIndex + 1} calibrated.`);
            } else {
                console.warn(`Point ${currentPointIndex + 1} could not be calibrated (no face detected).`);
            }
            
            currentPointIndex++;
            showNextCalibrationPoint(); // 次のポイントへ
        }, 3000);
    }
    
    // キャリブレーションの完了
    function finishCalibration() {
        calibrationPoint.classList.add('hidden');

        if (calibrationData.length < 2) {
            statusText.textContent = 'キャリブレーションに失敗しました。顔が認識されているか確認し、もう一度試してください。';
            calibrateBtn.disabled = false;
            return;
        }

        statusText.textContent = 'キャリブレーション完了！顔を動かしてカーソルを操作してください。';
        calibrateBtn.disabled = false;
        calibrateBtn.textContent = '再キャリブレーション';

        faceMovementRange = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        calibrationData.forEach(data => {
            faceMovementRange.minX = Math.min(faceMovementRange.minX, data.face.x);
            faceMovementRange.maxX = Math.max(faceMovementRange.maxX, data.face.x);
            faceMovementRange.minY = Math.min(faceMovementRange.minY, data.face.y);
            faceMovementRange.maxY = Math.max(faceMovementRange.maxY, data.face.y);
        });

        isCalibrated = true;
        gazeCursor.style.display = 'block';
    }

    // イベントリスナーの設定
    calibrateBtn.addEventListener('click', startCalibration);

    // 初期化処理の実行
    initializeWebGazer();
};
