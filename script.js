window.onload = function() {
    // HTML要素の取得
    const calibrateBtn = document.getElementById('calibrateBtn');
    const statusText = document.getElementById('statusText');
    const gazeCursor = document.getElementById('gazeCursor');
    const calibrationPoint = document.getElementById('calibrationPoint');

    // キャリブレーション関連の変数
    let calibrationData = []; // { face: {x, y}, screen: {x, y} } の形式で保存
    let currentPointIndex = 0;
    let faceMovementRange = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    let isCalibrated = false;

    // キャリブレーションで表示する点の位置 (画面の割合)
    const calibrationPoints = [
        { x: 0.5,  y: 0.5  }, // 中央
        { x: 0.1,  y: 0.1  }, // 左上
        { x: 0.9,  y: 0.1  }, // 右上
        { x: 0.1,  y: 0.9  }, // 左下
        { x: 0.9,  y: 0.9  }, // 右下
    ];

    // WebGazerの初期化
    async function initializeWebGazer() {
        await webgazer.setGazeListener(handleGazeData).begin();
        webgazer.showVideo(true);
        webgazer.showFaceFeedbackBox(true);
        webgazer.showFaceOverlay(false);
        statusText.textContent = 'カメラ準備完了。ボタンを押してキャリブレーションを開始してください。';
    }

    // WebGazerからのデータ処理
    function handleGazeData(data, elapsedTime) {
        if (!isCalibrated || data == null) return;
        
        // キャリブレーション結果を元にカーソル位置を計算
        const cursorX = mapValue(data.x, faceMovementRange.minX, faceMovementRange.maxX, 0, window.innerWidth);
        const cursorY = mapValue(data.y, faceMovementRange.minY, faceMovementRange.maxY, 0, window.innerHeight);

        gazeCursor.style.left = `${cursorX}px`;
        gazeCursor.style.top = `${cursorY}px`;
    }

    // 数値をある範囲から別の範囲へマッピングする関数
    function mapValue(value, fromMin, fromMax, toMin, toMax) {
        const normalized = (value - fromMin) / (fromMax - fromMin);
        return toMin + normalized * (toMax - toMin);
    }

    // キャリブレーションの開始
    function startCalibration() {
        isCalibrated = false;
        calibrateBtn.disabled = true;
        gazeCursor.style.display = 'none'; // キャリブレーション中はカーソルを非表示
        calibrationData = [];
        currentPointIndex = 0;
        showNextCalibrationPoint();
    }

    // 次のキャリブレーションポイントを表示
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

        // 3秒後にデータを記録
        setTimeout(() => {
            const facePrediction = webgazer.getCurrentFacePrediction();
            if (facePrediction) {
                calibrationData.push({
                    screen: { x: screenX, y: screenY },
                    face: { x: facePrediction.x, y: facePrediction.y }
                });
            }
            currentPointIndex++;
            showNextCalibrationPoint();
        }, 3000);
    }
    
    // キャリブレーションの完了
    function finishCalibration() {
        calibrationPoint.classList.add('hidden');
        statusText.textContent = 'キャリブレーション完了！顔を動かしてカーソルを操作してください。';
        calibrateBtn.disabled = false;
        calibrateBtn.textContent = '再キャリブレーション';

        // 顔の動きの最小/最大範囲を計算
        faceMovementRange = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        calibrationData.forEach(data => {
            faceMovementRange.minX = Math.min(faceMovementRange.minX, data.face.x);
            faceMovementRange.maxX = Math.max(faceMovementRange.maxX, data.face.x);
            faceMovementRange.minY = Math.min(faceMovementRange.minY, data.face.y);
            faceMovementRange.maxY = Math.max(faceMovementRange.maxY, data.face.y);
        });

        isCalibrated = true;
        gazeCursor.style.display = 'block'; // カーソルを再表示
    }

    // イベントリスナーの設定
    calibrateBtn.addEventListener('click', startCalibration);

    // 初期化処理の実行
    initializeWebGazer();
};
