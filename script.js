// 基础配置
const CONFIG = {
    ssq: {
        name: '双色球',
        redCount: 6,
        blueCount: 1,
        redRange: 33,
        blueRange: 16,
        drawDays: [2, 4, 6] // 周二、四、日
    },
    dlt: {
        name: '大乐透',
        redCount: 5,
        blueCount: 2,
        redRange: 35,
        blueRange: 12,
        drawDays: [1, 3, 6] // 周一、三、六
    }
};

// 核心算法类
class LotteryPredictor {
    constructor(type) {
        this.config = CONFIG[type];
    }

    generateWeightedNumber(max, excludeNumbers = []) {
        let number;
        do {
            number = Math.floor(Math.random() * max) + 1;
            const isHot = Math.random() < 0.7;
            if (isHot) {
                number = Math.floor(Math.random() * (max / 2)) + 1;
            }
        } while (excludeNumbers.includes(number));
        return number;
    }

    generateOneDraw() {
        const reds = new Set();
        const blues = new Set();

        while (reds.size < this.config.redCount) {
            const num = this.generateWeightedNumber(this.config.redRange, Array.from(reds));
            reds.add(num);
        }

        while (blues.size < this.config.blueCount) {
            const num = this.generateWeightedNumber(this.config.blueRange, Array.from(blues));
            blues.add(num);
        }

        return {
            red: Array.from(reds).sort((a, b) => a - b),
            blue: Array.from(blues).sort((a, b) => a - b)
        };
    }

    analyzeNumbers(numbers) {
        const redSum = numbers.red.reduce((a, b) => a + b, 0);
        const blueSum = numbers.blue.reduce((a, b) => a + b, 0);
        const redOddCount = numbers.red.filter(n => n % 2 === 1).length;
        
        return {
            redSum,
            blueSum,
            redOddEvenRatio: `${redOddCount}:${numbers.red.length - redOddCount}`,
            consecutive: this.checkConsecutive(numbers.red)
        };
    }

    checkConsecutive(numbers) {
        let count = 0;
        for (let i = 0; i < numbers.length - 1; i++) {
            if (numbers[i + 1] - numbers[i] === 1) count++;
        }
        return count;
    }
}

function createBallElement(number, isBlue = false) {
    return `<span class="ball ${isBlue ? 'blue' : 'red'}">${String(number).padStart(2, '0')}</span>`;
}

function getTodayLotteryType() {
    const day = new Date().getDay();
    if (CONFIG.dlt.drawDays.includes(day)) return 'dlt';
    if (CONFIG.ssq.drawDays.includes(day)) return 'ssq';
    return 'ssq';
}

// 生成历史开奖记录
function generateHistoryRecords(type) {
    const config = CONFIG[type];
    const historyDiv = document.getElementById('historyNumbers');
    let records = [];
    
    // 生成最近20期的模拟开奖记录
    for (let i = 0; i < 20; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i * 2); // 每两天一期
        
        // 生成随机号码
        const reds = new Set();
        const blues = new Set();
        
        // 生成红球
        while (reds.size < config.redCount) {
            reds.add(Math.floor(Math.random() * config.redRange) + 1);
        }
        
        // 生成蓝球
        while (blues.size < config.blueCount) {
            blues.add(Math.floor(Math.random() * config.blueRange) + 1);
        }

        // 转换为数组并排序
        const redNumbers = Array.from(reds).sort((a, b) => a - b);
        const blueNumbers = Array.from(blues).sort((a, b) => a - b);
        
        // 将记录添加到数组中
        records.push({
            date: date,
            period: 2024020 - i,
            reds: redNumbers,
            blues: blueNumbers
        });
    }
    
    // 构建HTML
    let html = records.map((record, index) => `
        <div class="history-item" style="animation-delay: ${index * 0.1}s">
            <div class="history-date">第${record.period}期 ${record.date.toLocaleDateString()}</div>
            <div class="number-row">
                ${record.reds.map(n => createBallElement(n)).join('')}
                ${record.blues.map(n => createBallElement(n, true)).join('')}
            </div>
        </div>
    `).join('');
    
    historyDiv.innerHTML = html;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function generateNumbers() {
    const type = getTodayLotteryType();
    const predictor = new LotteryPredictor(type);
    const lotteryType = document.getElementById('lotteryType');
    const recommendDiv = document.getElementById('recommendNumbers');
    const analysisDiv = document.getElementById('analysisResult');

    lotteryType.textContent = CONFIG[type].name;

    let html = '';
    let analysisHtml = '<div class="analysis-container">';

    for (let i = 0; i < 5; i++) {
        const numbers = predictor.generateOneDraw();
        const analysis = predictor.analyzeNumbers(numbers);

        html += `<div class="number-row" style="animation-delay: ${i * 0.3}s">
            ${numbers.red.map((n, idx) => 
                `<span class="ball red" style="animation-delay: ${1 + (idx * 0.1)}s">
                    ${String(n).padStart(2, '0')}
                </span>`
            ).join('')}
            ${numbers.blue.map((n, idx) => 
                `<span class="ball blue" style="animation-delay: ${1.5 + (idx * 0.1)}s">
                    ${String(n).padStart(2, '0')}
                </span>`
            ).join('')}
        </div>`;

        analysisHtml += `
            <div class="analysis-item" style="animation-delay: ${2 + (i * 0.2)}s">
                <p>第${i + 1}注分析：</p>
                <p>红球和值：${analysis.redSum}</p>
                <p>蓝球和值：${analysis.blueSum}</p>
                <p>奇偶比：${analysis.redOddEvenRatio}</p>
                <p>连号个数：${analysis.consecutive}</p>
            </div>
        `;
    }

    analysisHtml += '</div>';
    
    recommendDiv.innerHTML = html;
    analysisDiv.innerHTML = analysisHtml;
    
    // 生成历史记录
    generateHistoryRecords(type);
}

const debouncedGenerate = debounce(generateNumbers, 300);

// 页面加载完成后自动执行
document.addEventListener('DOMContentLoaded', function() {
    generateNumbers();
    
    // 为按钮添加点击事件
    const button = document.querySelector('button');
    button.onclick = function() {
        this.disabled = true;
        this.textContent = '生成中...';
        
        setTimeout(() => {
            this.disabled = false;
            this.textContent = '刷新推荐号码';
        }, 3000);

        debouncedGenerate();
    };
});
