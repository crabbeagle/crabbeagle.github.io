// ======================== 数据结构 ========================
function createDefaultStrategies() {
    const strategies = [];
    for (let i = 1; i <= 10; i++) {
        const strategyName = `策略${i.toString().padStart(2, '0')}`;
        const defaultStock = {
            code: `示例${i}`,
            shares: 1000 + i * 100,
            price: (10 + i * 0.5).toFixed(2)
        };
        strategies.push({
            name: strategyName,
            holdings: [defaultStock]
        });
    }
    return strategies;
}

let strategies = [];
let totalCapital = 100000;

// DOM 元素
const strategiesContainer = document.getElementById('strategiesContainer');
const totalCapitalInput = document.getElementById('totalCapital');
const commandInput = document.getElementById('commandInput');
const parseBtn = document.getElementById('parseBtn');
const outputArea = document.getElementById('outputArea');
const executeBtn = document.getElementById('executeBtn');
const resetBtn = document.getElementById('resetBtn');
const addStrategySelect = document.getElementById('addStrategySelect');
const addStockCode = document.getElementById('addStockCode');
const addStockPrice = document.getElementById('addStockPrice');
const addStockShares = document.getElementById('addStockShares');
const confirmAddStockBtn = document.getElementById('confirmAddStockBtn');

let pendingAction = null;

// 保存 & 加载
function saveData() {
    const data = { strategies, totalCapital };
    localStorage.setItem('tradeHelperV2', JSON.stringify(data));
}

function loadData() {
    const raw = localStorage.getItem('tradeHelperV2');
    if (raw) {
        const data = JSON.parse(raw);
        strategies = data.strategies;
        totalCapital = data.totalCapital;
    } else {
        strategies = createDefaultStrategies();
        totalCapital = 100000;
    }
    totalCapitalInput.value = totalCapital;
    renderAllStrategies();
}

// 策略市值
function getStrategyMarketValue(strategy) {
    return strategy.holdings.reduce((sum, h) => sum + h.shares * h.price, 0);
}

function getTotalMarketValue() {
    return strategies.reduce((sum, s) => sum + getStrategyMarketValue(s), 0);
}

// 渲染所有策略卡片
function renderAllStrategies() {
    strategiesContainer.innerHTML = '';
    strategies.forEach((strategy, idx) => {
        const card = document.createElement('div');
        card.className = 'strategy-card';
        card.dataset.strategyIdx = idx;
        
        const header = document.createElement('div');
        header.className = 'strategy-header';
        header.innerHTML = `
            <span>${strategy.name}</span>
            <button class="add-stock-btn" data-idx="${idx}">➕ 添加股票</button>
        `;
        card.appendChild(header);
        
        const table = document.createElement('table');
        table.className = 'stock-table';
        table.innerHTML = `
            <thead><tr><th>代码</th><th>数量(股)</th><th>价格(元)</th><th>市值(元)</th><th>占策略比</th><th>操作</th></tr></thead>
            <tbody id="tbody-${idx}"></tbody>
        `;
        card.appendChild(table);
        
        const tbody = table.querySelector(`#tbody-${idx}`);
        const strategyVal = getStrategyMarketValue(strategy);
        strategy.holdings.forEach((stock, stockIdx) => {
            const marketVal = stock.shares * stock.price;
            const ratio = strategyVal > 0 ? ((marketVal / strategyVal) * 100).toFixed(2) : 0;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${stock.code}</td>
                <td><input type="number" class="edit-shares" data-sidx="${idx}" data-stockidx="${stockIdx}" value="${stock.shares}" step="1"></td>
                <td><input type="number" class="edit-price" data-sidx="${idx}" data-stockidx="${stockIdx}" value="${stock.price}" step="0.01"></td>
                <td>${marketVal.toFixed(2)}</td>
                <td>${ratio}%</td>
                <td><button class="delete-stock" data-sidx="${idx}" data-stockidx="${stockIdx}">删除</button></td>
            `;
            tbody.appendChild(row);
        });
        
        strategiesContainer.appendChild(card);
    });
    
    // 绑定卡片内按钮事件
    document.querySelectorAll('.add-stock-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sIdx = parseInt(btn.dataset.idx);
            addStockToStrategy(sIdx);
        });
    });
    document.querySelectorAll('.edit-shares').forEach(inp => {
        inp.addEventListener('change', (e) => {
            const sIdx = parseInt(inp.dataset.sidx);
            const stockIdx = parseInt(inp.dataset.stockidx);
            strategies[sIdx].holdings[stockIdx].shares = parseFloat(inp.value) || 0;
            renderAllStrategies();
            saveData();
        });
    });
    document.querySelectorAll('.edit-price').forEach(inp => {
        inp.addEventListener('change', (e) => {
            const sIdx = parseInt(inp.dataset.sidx);
            const stockIdx = parseInt(inp.dataset.stockidx);
            strategies[sIdx].holdings[stockIdx].price = parseFloat(inp.value) || 0;
            renderAllStrategies();
            saveData();
        });
    });
    document.querySelectorAll('.delete-stock').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sIdx = parseInt(btn.dataset.sidx);
            const stockIdx = parseInt(btn.dataset.stockidx);
            strategies[sIdx].holdings.splice(stockIdx, 1);
            if (strategies[sIdx].holdings.length === 0) {
                strategies[sIdx].holdings.push({ code: '空仓', shares: 0, price: 0 });
            }
            renderAllStrategies();
            saveData();
        });
    });
    
    updateAddStrategySelect();
}

// 更新全局下拉框
function updateAddStrategySelect() {
    if (!addStrategySelect) return;
    addStrategySelect.innerHTML = '';
    strategies.forEach((s, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = `${s.name} (${s.holdings.length}/4只)`;
        addStrategySelect.appendChild(option);
    });
}

// 向指定策略添加股票（最多4只）
function addStockToStrategy(strategyIdx) {
    const strategy = strategies[strategyIdx];
    if (strategy.holdings.length >= 4) {
        alert('每个策略最多只能有4只股票');
        return;
    }
    const newCode = prompt('请输入股票代码（例如 159915）:', `NEW${strategyIdx+1}`);
    if (!newCode) return;
    const newPrice = parseFloat(prompt('请输入当前价格:', '10.00'));
    if (isNaN(newPrice)) return;
    strategy.holdings.push({
        code: newCode,
        shares: 0,
        price: newPrice
    });
    renderAllStrategies();
    saveData();
}

// 全局添加按钮
if (confirmAddStockBtn) {
    confirmAddStockBtn.addEventListener('click', () => {
        const strategyIdx = parseInt(addStrategySelect.value);
        const code = addStockCode.value.trim();
        const price = parseFloat(addStockPrice.value);
        let shares = parseInt(addStockShares.value);
        if (isNaN(shares)) shares = 0;
        
        if (!code) { alert('请输入股票代码'); return; }
        if (isNaN(price) || price <= 0) { alert('请输入有效价格'); return; }
        const strategy = strategies[strategyIdx];
        if (strategy.holdings.length >= 4) {
            alert(`策略 ${strategy.name} 已满（最多4只）`);
            return;
        }
        if (strategy.holdings.some(h => h.code === code)) {
            alert(`策略 ${strategy.name} 中已有代码 ${code}`);
            return;
        }
        strategy.holdings.push({ code, shares, price });
        renderAllStrategies();
        saveData();
        addStockCode.value = '';
        addStockPrice.value = '';
        addStockShares.value = '0';
        alert(`已添加 ${code} 到 ${strategy.name}`);
    });
}

// 调仓解析
function parseCommand(text) {
    const pattern = /^(策略\d{2})\s+(\S+)\s+(建仓|加仓|减仓)\s+(\d+(?:\.\d+)?)(%|股)$/;
    const match = text.match(pattern);
    if (!match) return null;
    return {
        strategyName: match[1],
        stockCode: match[2],
        action: match[3],
        value: parseFloat(match[4]),
        unit: match[5]
    };
}

function calculateAction(instruction, strategies, totalCap) {
    const { strategyName, stockCode, action, value, unit } = instruction;
    const strategyIdx = strategies.findIndex(s => s.name === strategyName);
    if (strategyIdx === -1) throw new Error(`未找到策略: ${strategyName}`);
    const strategy = strategies[strategyIdx];
    const stockIdx = strategy.holdings.findIndex(h => h.code === stockCode);
    if (stockIdx === -1) throw new Error(`策略 ${strategyName} 中没有代码 ${stockCode}`);
    
    const stock = strategy.holdings[stockIdx];
    const currentShares = stock.shares;
    const currentPrice = stock.price;
    if (currentPrice <= 0) throw new Error(`${stockCode} 价格无效`);
    
    let targetShares = currentShares;
    let diffShares = 0;
    let actionText = '';
    
    if (action === '建仓' && unit === '%') {
        const targetValue = (value / 100) * totalCap;
        targetShares = Math.floor(targetValue / currentPrice);
        diffShares = targetShares - currentShares;
        actionText = diffShares > 0 ? `买入 ${diffShares} 股` : (diffShares < 0 ? `卖出 ${-diffShares} 股` : '无需调整');
    }
    else if (action === '加仓' && unit === '%') {
        const addValue = (value / 100) * totalCap;
        const addShares = Math.floor(addValue / currentPrice);
        targetShares = currentShares + addShares;
        diffShares = addShares;
        actionText = `买入 ${addShares} 股`;
    }
    else if (action === '减仓' && unit === '股') {
        const sellShares = Math.min(value, currentShares);
        targetShares = currentShares - sellShares;
        diffShares = -sellShares;
        actionText = `卖出 ${sellShares} 股`;
    }
    else throw new Error('不支持的指令格式');
    
    return { strategyIdx, stockIdx, code: stockCode, currentShares, targetShares, actionText, diffShares };
}

function executeAction(action) {
    const { strategyIdx, stockIdx, targetShares } = action;
    const strategy = strategies[strategyIdx];
    if (targetShares <= 0) {
        strategy.holdings.splice(stockIdx, 1);
        if (strategy.holdings.length === 0) {
            strategy.holdings.push({ code: '空仓', shares: 0, price: 0 });
        }
    } else {
        strategy.holdings[stockIdx].shares = targetShares;
    }
    renderAllStrategies();
    saveData();
}

// 总资金缩放
function scaleHoldingsToNewCapital(newCapital) {
    let oldTotal = getTotalMarketValue();
    if (oldTotal <= 0) return;
    const factor = newCapital / oldTotal;
    for (let s of strategies) {
        for (let h of s.holdings) {
            let newShares = Math.floor(h.shares * factor);
            if (newShares < 1 && h.shares > 0) newShares = 1;
            h.shares = newShares;
        }
    }
    renderAllStrategies();
    saveData();
}

// 事件绑定
parseBtn.addEventListener('click', () => {
    const raw = commandInput.value.trim();
    if (!raw) {
        outputArea.innerText = '⚠️ 请输入调仓指令，例如: 策略01 159915 建仓 25%';
        executeBtn.style.display = 'none';
        return;
    }
    const instruction = parseCommand(raw);
    if (!instruction) {
        outputArea.innerText = '❌ 指令格式错误。正确格式：策略01 股票代码 建仓 25% 或 策略01 股票代码 减仓 500股';
        executeBtn.style.display = 'none';
        return;
    }
    try {
        const action = calculateAction(instruction, strategies, totalCapital);
        outputArea.innerHTML = `
            <strong>📌 解析结果：</strong><br>
            策略：${instruction.strategyName}<br>
            标的：${action.code}<br>
            当前持仓：${action.currentShares} 股<br>
            操作：${action.actionText}<br>
            调整后持仓：${action.targetShares} 股<br>
            <span style="color: green;">✅ 点击下方按钮确认执行</span>
        `;
        pendingAction = action;
        executeBtn.style.display = 'inline-block';
    } catch (err) {
        outputArea.innerText = `❌ 错误：${err.message}`;
        executeBtn.style.display = 'none';
    }
});

executeBtn.addEventListener('click', () => {
    if (!pendingAction) return;
    executeAction(pendingAction);
    outputArea.innerHTML += '<br>✨ 持仓已更新！';
    commandInput.value = '';
    executeBtn.style.display = 'none';
    pendingAction = null;
});

resetBtn.addEventListener('click', () => {
    strategies = createDefaultStrategies();
    totalCapital = 100000;
    totalCapitalInput.value = totalCapital;
    renderAllStrategies();
    saveData();
    outputArea.innerText = '已重置为10策略示例数据';
    executeBtn.style.display = 'none';
});

totalCapitalInput.addEventListener('change', () => {
    let newCap = parseFloat(totalCapitalInput.value);
    if (isNaN(newCap) || newCap <= 0) newCap = 100000;
    totalCapital = newCap;
    scaleHoldingsToNewCapital(totalCapital);
    saveData();
});

// 启动
loadData();