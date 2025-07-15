document.getElementById('runButton').addEventListener('click', runSimulation);

function runSimulation() {
    const BITS_COUNT = 14;
    const bases = ['+', 'X'];
    const polarizations = {
        '+': { 0: '→', 1: '↑' },
        'X': { 0: '╲', 1: '╱' }
    };

    let aliceData = [];
    let eveData = [];
    let bobData = [];
    let results = [];

    // 1. アリスが準備
    for (let i = 0; i < BITS_COUNT; i++) {
        const basis = bases[Math.floor(Math.random() * 2)];
        const bit = Math.round(Math.random());
        const polarization = polarizations[basis][bit];
        aliceData.push({ id: i + 1, basis, bit, polarization });
    }

    // 2. イブが盗聴＆偽装
    for (let i = 0; i < BITS_COUNT; i++) {
        const eveBasis = bases[Math.floor(Math.random() * 2)];
        let receivedBit;
        
        // イブの受信
        if (aliceData[i].basis === eveBasis) {
            receivedBit = aliceData[i].bit; // 100%
        } else {
            receivedBit = Math.round(Math.random()); // 50%
        }
        
        const impersonatedPolarization = polarizations[eveBasis][receivedBit];
        eveData.push({ id: i + 1, basis: eveBasis, bit: receivedBit, polarization: impersonatedPolarization });
    }

    // 3. ボブが受信
    for (let i = 0; i < BITS_COUNT; i++) {
        const bobBasis = bases[Math.floor(Math.random() * 2)];
        let receivedBit;
        const receivedPolarization = eveData[i].polarization;

        const isBasisCompatible = (bobBasis === '+' && (receivedPolarization === '↑' || receivedPolarization === '→')) ||
                                (bobBasis === 'X' && (receivedPolarization === '╱' || receivedPolarization === '╲'));

        if (isBasisCompatible) { // 100%
            if (receivedPolarization === '↑' || receivedPolarization === '╱') {
                receivedBit = 1;
            } else {
                receivedBit = 0;
            }
        } else { // 50%
            receivedBit = Math.round(Math.random());
        }
        bobData.push({ id: i + 1, basis: bobBasis, bit: receivedBit });
    }

    // 4. 最終照合
    let isHacked = false;
    for (let i = 0; i < BITS_COUNT; i++) {
        const basisMatch = aliceData[i].basis === bobData[i].basis;
        let finalJudgement = '-';

        if (basisMatch) {
            if (aliceData[i].bit === bobData[i].bit) {
                finalJudgement = '☑';
            } else {
                finalJudgement = '盗聴';
                isHacked = true;
            }
        }
        results.push({ id: i + 1, basisMatch: basisMatch ? '〇' : '-', judgement: finalJudgement });
    }
    
    // 5. 結果を画面に表示
    displayResults(aliceData, eveData, bobData, results, isHacked);
}

function displayResults(aliceData, eveData, bobData, results, isHacked) {
    const aliceEveBody = document.querySelector("#aliceEveTable tbody");
    const eveBobBody = document.querySelector("#eveBobTable tbody");
    const resultBody = document.querySelector("#resultTable tbody");
    
    aliceEveBody.innerHTML = '';
    eveBobBody.innerHTML = '';
    resultBody.innerHTML = '';

    for (let i = 0; i < aliceData.length; i++) {
        aliceEveBody.innerHTML += `<tr>
            <td>${aliceData[i].id}</td>
            <td>${aliceData[i].basis}</td>
            <td>${aliceData[i].bit}</td>
            <td>${aliceData[i].polarization}</td>
            <td>${eveData[i].basis}</td>
            <td>${eveData[i].bit}</td>
        </tr>`;

        eveBobBody.innerHTML += `<tr>
            <td>${eveData[i].id}</td>
            <td>${eveData[i].polarization}</td>
            <td>${bobData[i].basis}</td>
            <td>${bobData[i].bit}</td>
        </tr>`;

        resultBody.innerHTML += `<tr>
            <td>${results[i].id}</td>
            <td>${results[i].basisMatch}</td>
            <td>${results[i].judgement}</td>
        </tr>`;
    }

    const finalResultEl = document.getElementById('finalResult');
    if (isHacked) {
        finalResultEl.textContent = '結果: 盗聴';
        finalResultEl.className = 'hacked';
    } else {
        finalResultEl.textContent = '結果: 安全';
        finalResultEl.className = 'safe';
    }
}

// 初期表示のために一度実行
runSimulation();