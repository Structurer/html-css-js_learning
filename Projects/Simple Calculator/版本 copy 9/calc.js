// 获取所有核心DOM元素：双显示框、历史记录、切换标签
const calcDisplay = document.getElementById('calcDisplay');
const sciDisplay = document.getElementById('sciDisplay');
const calcHistory = document.getElementById('calcHistory');
const standardTab = document.getElementById('standardTab');
const sciTab = document.getElementById('sciTab');
const standardCalc = document.getElementById('standardCalc');
const sciCalc = document.getElementById('sciCalc');

// 全局变量：当前激活的显示框、历史记录存储（会话内留存）
let activeDisplay = calcDisplay;
let historyList = [];

// 一、初始化：默认激活标准计算器，绑定切换事件（贴合原站交互）
window.onload = function() {
    // 标签切换事件：标准/科学计算器切换
    standardTab.onclick = function() {
        switchCalc('standard');
    };
    sciTab.onclick = function() {
        switchCalc('sci');
    };
    // 初始激活标准计算器显示框
    activeDisplay = calcDisplay;
};

// 二、计算器切换核心函数：切换显示/隐藏，更新激活显示框
function switchCalc(type) {
    if (type === 'standard') {
        standardCalc.classList.add('show-calc');
        sciCalc.classList.remove('show-calc');
        standardTab.classList.add('tab-active');
        sciTab.classList.remove('tab-active');
        activeDisplay = calcDisplay;
    } else {
        sciCalc.classList.add('show-calc');
        standardCalc.classList.remove('show-calc');
        sciTab.classList.add('tab-active');
        standardTab.classList.remove('tab-active');
        activeDisplay = sciDisplay;
    }
}

// 三、核心功能1：追加字符（数字/运算符/科学函数/常量），兼容双计算器，修复无效输入
function appendChar(char) {
    const lastChar = activeDisplay.value.slice(-1);
    const operators = ['+', '-', '*', '/', '%', '^']; // 包含幂运算符
    const sciChars = ['π', 'e', '²', '³', '√', '∛', '!', '(-)']; // 科学计算专属字符
    const funcChars = ['ln(', 'log10(', 'sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan(']; // 科学函数

    // 1. 特殊字符单独处理（优先执行，避免输入异常）
    switch(char) {
        case 'π': // 圆周率常量，替换为3.1415926535（原站精度）
            activeDisplay.value += '3.1415926535';
            return;
        case 'e': // 自然常数，替换为2.7182818284
            activeDisplay.value += '2.7182818284';
            return;
        case '(-)': // 正负切换：开头加-，中间加(-)
            activeDisplay.value = activeDisplay.value ? `(-${activeDisplay.value})` : '-';
            return;
        case '²': // 平方：当前值平方，或末尾数字平方
            activeDisplay.value += '**2';
            return;
        case '³': // 立方：当前值立方
            activeDisplay.value += '**3';
            return;
        case '√': // 开平方：封装为Math.sqrt()
            activeDisplay.value += 'Math.sqrt(';
            return;
        case '∛': // 开立方：封装为Math.cbrt()
            activeDisplay.value += 'Math.cbrt(';
            return;
        case '1/': // 倒数：1/当前值
            activeDisplay.value += '1/';
            return;
        case '!': // 阶乘：调用阶乘函数
            activeDisplay.value += 'factorial(';
            return;
    }

    // 2. 科学函数输入：直接追加，无需校验连续（函数自带括号）
    if (funcChars.includes(char)) {
        activeDisplay.value += char;
        return;
    }

    // 3. 常规运算符校验：禁止连续运算符、开头直接输除/乘/幂/百分号
    if ((operators.includes(char) && operators.includes(lastChar)) || 
        (operators.includes(char) && activeDisplay.value === '')) {
        return;
    }

    // 4. 正常字符追加（数字、括号、小数点等）
    activeDisplay.value += char;
}

// 四、核心功能2：阶乘计算函数（科学计算器专属，补全JS原生不支持的阶乘）
function factorial(n) {
    n = Number(n);
    if (n < 0 || !Number.isInteger(n)) return 'Error'; // 非自然数阶乘报错
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// 五、核心功能3：清空所有（当前激活显示框）
function clearAll() {
    activeDisplay.value = '';
}

// 六、核心功能4：删除最后一个字符（回删，兼容双计算器）
function deleteLast() {
    activeDisplay.value = activeDisplay.value.slice(0, -1);
}

// 七、核心功能5：完整计算逻辑（标准+科学计算全支持，兼容所有函数，同步历史）
function calculateResult() {
    if (!activeDisplay.value) return; // 空值不计算
    // 保存原始表达式（用于历史记录，保留原符号）
    const originalExpr = activeDisplay.value.replace(/Math\.sqrt\(/g, '√').replace(/Math\.cbrt\(/g, '∛').replace(/\*\*2/g, '²').replace(/\*\*3/g, '³').replace(/factorial\(/g, '!').replace(/3.1415926535/g, 'π').replace(/2.7182818284/g, 'e');
    try {
        // 1. 特殊符号/函数转JS可执行代码（完整兼容科学计算）
        let expr = activeDisplay.value
            .replace('×', '*') // 标准乘号转*
            .replace('÷', '/') // 标准除号转/
            .replace('−', '-') // 全角减号转半角-
            .replace('%', '/100') // 百分号转除以100
            .replace('^', '**') // 幂运算xʸ转**
            .replace('√', 'Math.sqrt(') // 兼容手动输入√
            .replace('∛', 'Math.cbrt(') // 兼容手动输入∛
            .replace('!', 'factorial('); // 兼容手动输入!
        
        // 2. 执行计算（支持所有标准+科学运算）
        let result = eval(expr);
        // 3. 修复小数精度问题，保留6位有效小数，去除末尾多余0/小数点
        if (Number.isFinite(result)) {
            result = !Number.isInteger(result) 
                ? result.toFixed(6).replace(/\.?0*$/, '').replace(/\.$/, '') 
                : result.toString();
            activeDisplay.value = result;
            // 4. 计算成功，添加到历史记录（双计算器记录统一展示）
            addToHistory(originalExpr, result);
        } else {
            activeDisplay.value = 'Error';
        }
    } catch (e) {
        // 捕获所有异常（格式错误、除零、函数参数错误等）
        activeDisplay.value = 'Error';
        // 2秒后自动清空错误提示
        setTimeout(() => {
            activeDisplay.value = '';
        }, 2000);
    }
}

// 八、核心功能6：添加+渲染计算历史（双计算器记录统一留存，最新记录在顶部）
function addToHistory(expr, result) {
    const historyItem = `${expr} = ${result}`;
    historyList.unshift(historyItem); // 头部追加
    renderHistory();
}

// 九、渲染历史记录到页面
function renderHistory() {
    calcHistory.innerHTML = '';
    historyList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.textContent = item;
        calcHistory.appendChild(div);
    });
}