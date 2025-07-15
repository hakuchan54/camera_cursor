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
    let dataCollectionInterval = null;

    const calibrationPoints = [
        { x: 0.5, y: 0.5 }, { x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 },
        { x: 0.1, y: 0.9 }, { x: 0.9, y: 0.9 },
    ];

    // WebGazerの初期化
    async function initializeWebGazer() {
        await webgazer.setGazeListener(handleGazeData).begin();
        webgazer.showVideo(true);

        // --- 修正点 ---
        // 1. 顔のメッシュ（水色の点々）を再表示します
        webgazer.showFaceOverlay(true);
        webgazer.showFaceFeedbackBox(true);

        // 2. CSSによるズレを補正します
        // スタイルシートで指定したサイズをJavaScript側でも明示的に設定することで、
        // 追跡枠と映像のズレを解消します。
        webgazer.setVideoViewerSize(120, 90);
        // --- 修正ここまで ---

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

    // キャリブレーションポイント表示関数
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

        let pointSamples = [];
        clearInterval(dataCollectionInterval);
        dataCollectionInterval = setInterval(() => {
            const facePrediction = webgazer.getCurrentFacePrediction();
            if (facePrediction) {
                pointSamples.push(facePrediction);
            }
        }, 100);

        setTimeout(() => {
            clearInterval(dataCollectionInterval);

            if (pointSamples.length > 0) {
                const avgX = pointSamples.reduce((sum, d) => sum + d.x, 0) / pointSamples.length;
                const avgY = pointSamples.reduce((sum, d) => sum + d.y, 0) / pointSamples.length;
                
                calibrationData.push({
                    screen: { x: screenX, y: screenY },
                    face: { x: avgX, y: avgY }
                });
            }
            
            currentPointIndex++;
            showNextCalibrationPoint();
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
