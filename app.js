// ==========================================
// 1. ESTADO E NAVEGAÇÃO
// ==========================================
const screens = {
    menu: document.getElementById('menu-principal'),
    menuTurno: document.getElementById('screen-menu-turno'),
    iniciar: document.getElementById('screen-turno'),
    finalizar: document.getElementById('screen-finalizar-turno'),
    custos: document.getElementById('screen-menu-custos'),
    abastecimento: document.getElementById('screen-abastecimento'),
    outrosCustos: document.getElementById('screen-outros-custos'),
    resumos: document.getElementById('screen-resumos'),
    resumoDiario: document.getElementById('screen-resumo-diario'),
    historicoGeral: document.getElementById('screen-historico-geral')
};

function showScreen(screen) {
    Object.values(screens).forEach(s => { if(s) s.classList.add('hidden'); });
    if (screen) screen.classList.remove('hidden');
    window.scrollTo(0, 0);
}

function updateDateTime() {
    const now = new Date();
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    if(dateEl) dateEl.textContent = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    if(timeEl) timeEl.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateDateTime, 60000);
updateDateTime();

// ==========================================
// 2. GESTÃO DE DADOS (LOCALSTORAGE)
// ==========================================

const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// ==========================================
// 3. LÓGICA DE TURNOS E SESSÕES
// ==========================================

function gerenciarEstadoInterface() {
    const turnoAtivo = JSON.parse(localStorage.getItem('turnoAtivo'));
    const statusInd = document.getElementById('status-indicador');
    const btnIni = document.getElementById('btn-iniciar-turno');

    if (turnoAtivo && turnoAtivo.ativo) {
        statusInd.textContent = '🟢 Turno ativo';
        if(btnIni) { btnIni.disabled = true; btnIni.textContent = "Turno em Andamento"; }
    } else {
        statusInd.textContent = '🔴 Turno inativo';
        if(btnIni) { btnIni.disabled = false; btnIni.textContent = "Iniciar Turno"; }
    }
}

document.getElementById('btn-iniciar-turno').onclick = () => {
    const h = document.getElementById('hora-inicio').value;
    const k = document.getElementById('km-inicial').value;
    if(!h || !k) return alert("Informe Hora e KM inicial!");

    localStorage.setItem('turnoAtivo', JSON.stringify({ 
        ativo: true, horaInicio: h, kmInicial: parseFloat(k), data: new Date().toLocaleDateString('pt-BR') 
    }));
    gerenciarEstadoInterface();
    showScreen(screens.menu);
};

document.getElementById('btn-finalizar-turno').onclick = () => {
    const turnoAtivo = JSON.parse(localStorage.getItem('turnoAtivo'));
    if (!turnoAtivo) return alert("⚠️ Erro: Não há turno ativo!");

    const hF = document.getElementById('hora-fim').value;
    const kF = parseFloat(document.getElementById('km-final').value);
    const apu = parseFloat(document.getElementById('apurado').value);

    if(!hF || isNaN(kF) || isNaN(apu)) return alert("Preencha todos os campos!");

    const hoje = turnoAtivo.data;
    const historico = JSON.parse(localStorage.getItem('historico_dias')) || {};

    if (!historico[hoje]) {
        historico[hoje] = { sessoes: [] };
    }

    historico[hoje].sessoes.push({
        id: Date.now(),
        hI: turnoAtivo.horaInicio,
        hF: hF,
        kI: turnoAtivo.kmInicial,
        kF: kF,
        apurado: apu
    });

    localStorage.setItem('historico_dias', JSON.stringify(historico));
    localStorage.removeItem('turnoAtivo');
    
    gerenciarEstadoInterface();
    alert("✅ Sessão salva no dia!");
    showScreen(screens.menu);
};

// ==========================================
// 4. CUSTOS
// ==========================================

document.getElementById('btn-salvar-abastecimento').onclick = () => {
    const valor = parseFloat(document.getElementById('valor-abastecimento').value);
    if (!valor) return alert("Valor inválido!");

    const lista = getData('abastecimentos');
    lista.push({ data: new Date().toLocaleDateString('pt-BR'), valor });
    setData('abastecimentos', lista);
    
    document.getElementById('valor-abastecimento').value = "";
    atualizarResumoAbastecimento();
    alert("Salvo!");
};

document.getElementById('btn-salvar-custo-outro').onclick = () => {
    const tipo = document.getElementById('tipo-custo').value;
    const descInput = document.getElementById('desc-custo-outros'); // Referência ao input
    const valorInput = document.getElementById('valor-custo-outro');
    const valor = parseFloat(valorInput.value);

    if (!valor) return alert("Insira o valor do custo!");

    const lista = getData('outros_custos');
    lista.push({ 
        data: new Date().toLocaleDateString('pt-BR'), 
        desc: tipo === 'Outros' ? descInput.value : tipo, 
        valor: valor 
    });
    setData('outros_custos', lista);

    // LIMPEZA DOS CAMPOS APÓS ADICIONAR
    valorInput.value = '';
    descInput.value = ''; // Esta linha limpa a descrição
    
    atualizarListaCustos();
    alert("Custo adicionado!");
};


function atualizarResumoAbastecimento() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const total = getData('abastecimentos').filter(a => a.data === hoje).reduce((acc, a) => acc + a.valor, 0);
    const el = document.getElementById('total-abastecido-dia');
    if(el) el.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function atualizarListaCustos() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const custosHoje = getData('outros_custos').filter(c => c.data === hoje);
    const total = custosHoje.reduce((acc, c) => acc + c.valor, 0);
    const totalUI = document.getElementById('total-outros-valor');
    const listaUI = document.getElementById('lista-detalhada-custos');

    if (totalUI) totalUI.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    if (listaUI) {
        listaUI.innerHTML = custosHoje.map(c => `
            <li style="background: #374151; padding: 10px; border-radius: 8px; margin-bottom: 5px; display: flex; justify-content: space-between;">
                <span>${c.desc}</span>
                <strong>R$ ${c.valor.toFixed(2).replace('.', ',')}</strong>
            </li>
        `).join('');
    }
}

// ==========================================
// 5. RENDERIZAÇÃO DE CARDS (O CORAÇÃO DO APP)
// ==========================================

function excluirSessao(data, id) {
    if(!confirm("Deseja excluir esta sessão?")) return;
    const historico = JSON.parse(localStorage.getItem('historico_dias'));
    historico[data].sessoes = historico[data].sessoes.filter(s => s.id !== id);
    
    if(historico[data].sessoes.length === 0) delete historico[data];
    
    localStorage.setItem('historico_dias', JSON.stringify(historico));
    document.getElementById('btn-historico-geral').click(); // Recarrega tela
}

function renderizarDia(data, infoDia) {
    const abast = getData('abastecimentos').filter(a => a.data === data).reduce((acc, a) => acc + a.valor, 0);
    const outros = getData('outros_custos').filter(c => c.data === data).reduce((acc, c) => acc + c.valor, 0);
    
    let totalKM = 0;
    let totalApurado = 0;
    let totalMinutos = 0;

    // Primeiro calculamos os totais percorrendo as sessões
    const sessoesHTML = infoDia.sessoes.map((s, index) => {
        totalKM += (s.kF - s.kI);
        totalApurado += s.apurado;
        
        const [hI, mI] = s.hI.split(':').map(Number);
        const [hF, mF] = s.hF.split(':').map(Number);
        let diff = (hF * 60 + mF) - (hI * 60 + mI);
        if (diff < 0) diff += 1440;
        totalMinutos += diff;

        return `
        <div style="font-size: 13px; color: var(--muted); background: rgba(0,0,0,0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px; position: relative;">
            <strong>Sessão ${index + 1}:</strong> ${s.hI} às ${s.hF} | 
            KM: ${s.kF - s.kI} | Apur: R$ ${s.apurado.toFixed(2)}
            <button onclick="excluirSessao('${data}', ${s.id})" style="background:none; border:none; color:var(--red); font-size:18px; position:absolute; right:10px; top:5px; cursor:pointer;">&times;</button>
        </div>`;
    }).join('');

    const lucro = totalApurado - abast - outros;
    const valorHora = totalMinutos > 0 ? lucro / (totalMinutos / 60) : 0;

    // Retornamos o HTML com os Totais PRIMEIRO e as Sessões DEPOIS
    return `
    <div class="resumo-card">
        <div class="card-header"><span class="card-title">Resumo Diário</span><span class="card-date">${data}</span></div>
        <div class="card-body">
            <!-- TOTAIS NO TOPO -->
            <p><span>Intervalo total:</span> <strong>${Math.floor(totalMinutos/60).toString().padStart(2,'0')}:${(totalMinutos%60).toString().padStart(2,'0')}h</strong></p>
            <p><span>KM total rodado:</span> <strong>${totalKM} km</strong></p>
            <p><span>Total Abastecido:</span> <strong>R$ ${abast.toFixed(2).replace('.',',')}</strong></p>
            <p><span>Outros Custos:</span> <strong>R$ ${outros.toFixed(2).replace('.',',')}</strong></p>
            <p><span>Valor Apurado:</span> <strong>R$ ${totalApurado.toFixed(2).replace('.',',')}</strong></p>
            
            <hr>
            <p style="color: ${lucro >= 0 ? '#4ade80' : '#ef4444'}; font-size: 18px; font-weight: bold;">
                <span>Lucro do Dia:</span> <span>R$ ${lucro.toFixed(2).replace('.', ',')}</span>
            </p>
            <p><span>Média por Hora:</span> <strong>R$ ${valorHora.toFixed(2).replace('.',',')}/h</strong></p>
            
            <hr>
            <!-- DETALHAMENTO DAS SESSÕES ABAIXO -->
            <p style="font-size: 12px; text-transform: uppercase; color: var(--blue); margin-bottom: 10px; font-weight: bold;">Detalhamento de Sessões:</p>
            <div>${sessoesHTML}</div>
        </div>
    </div>`;
}


// ==========================================
// 6. EVENTOS E NAVEGAÇÃO
// ==========================================

document.querySelectorAll('.menu-card').forEach(card => {
    card.onclick = () => {
        const action = card.dataset.action;
        if (action === 'turno') showScreen(screens.menuTurno);
        if (action === 'custos') { showScreen(screens.custos); atualizarResumoAbastecimento(); atualizarListaCustos(); }
        if (action === 'resumos') showScreen(screens.resumos);
    };
});

document.getElementById('btn-resumo-diario').onclick = () => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const historico = JSON.parse(localStorage.getItem('historico_dias')) || {};
    if (!historico[hoje]) return alert("Nenhuma sessão finalizada hoje!");
    
    const container = document.querySelector('#screen-resumo-diario .resumo-dia');
    container.innerHTML = renderizarDia(hoje, historico[hoje]);
    showScreen(screens.resumoDiario);
};

document.getElementById('btn-historico-geral').onclick = () => {
    const historico = JSON.parse(localStorage.getItem('historico_dias')) || {};
    const lista = document.getElementById('lista-historico');
    const chaves = Object.keys(historico).reverse();
    
    if (chaves.length === 0) {
        lista.innerHTML = "<p style='text-align:center'>Nenhum histórico encontrado.</p>";
    } else {
        lista.innerHTML = chaves.map(data => renderizarDia(data, historico[data])).join('');
    }
    showScreen(screens.historicoGeral);
};

// Botões Auxiliares
document.getElementById('btn-ir-iniciar-turno').onclick = () => showScreen(screens.iniciar);
document.getElementById('btn-ir-finalizar-turno').onclick = () => showScreen(screens.finalizar);
document.getElementById('btn-ir-abastecimento').onclick = () => showScreen(screens.abastecimento);
document.getElementById('btn-ir-outros-custos').onclick = () => showScreen(screens.outrosCustos);
document.getElementById('btn-hora-atual').onclick = () => document.getElementById('hora-inicio').value = new Date().toTimeString().slice(0, 5);
document.getElementById('btn-hora-final-atual').onclick = () => document.getElementById('hora-fim').value = new Date().toTimeString().slice(0, 5);
document.getElementById('tipo-custo').onchange = (e) => document.getElementById('group-desc-outros').classList.toggle('hidden', e.target.value !== 'Outros');

// Botões Voltar
const botoesVoltar = [
    ['voltar-menu-principal', screens.menu], ['voltar-menu-turno', screens.menuTurno],
    ['voltar-menu-finalizar', screens.menuTurno], ['voltar-custos-principal', screens.menu],
    ['voltar-menu-custos-abast', screens.custos], ['voltar-menu-custos-outros', screens.custos],
    ['voltar-menu-resumos', screens.menu], ['voltar-resumo-diario', screens.resumos], ['voltar-historico', screens.resumos]
];
botoesVoltar.forEach(([id, screen]) => {
    const btn = document.getElementById(id);
    if(btn) btn.onclick = () => showScreen(screen);
	
});

window.onload = gerenciarEstadoInterface;

// ==========================================
// 8. EXPORTAÇÃO (PDF E EXCEL) REVISADA
// ==========================================

// --- EXPORTAR PARA PDF (COM TOTAIS E LUCRO) ---
document.getElementById('export-pdf').onclick = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const historico = JSON.parse(localStorage.getItem('historico_dias')) || {};
    const chaves = Object.keys(historico).reverse();

    if (chaves.length === 0) return alert("Não há dados para exportar!");

    let yPos = 20;
    doc.setFontSize(16);
    doc.text("Relatório Detalhado - Controle Diário", 14, yPos);
    yPos += 10;

    chaves.forEach((data) => {
        const infoDia = historico[data];
        
        // Busca custos do dia para o cálculo
        const abast = (JSON.parse(localStorage.getItem('abastecimentos')) || []).filter(a => a.data === data).reduce((acc, a) => acc + a.valor, 0);
        const outros = (JSON.parse(localStorage.getItem('outros_custos')) || []).filter(c => c.data === data).reduce((acc, c) => acc + c.valor, 0);
        
        let totalKM = 0, totalApurado = 0, totalMinutos = 0;

        // Prepara as linhas da tabela de sessões
        const corpoTabela = infoDia.sessoes.map((s, idx) => {
            const kmSessao = s.kF - s.kI;
            totalKM += kmSessao;
            totalApurado += s.apurado;
            
            // Cálculo de tempo
            const [hI, mI] = s.hI.split(':').map(Number);
            const [hF, mF] = s.hF.split(':').map(Number);
            let diff = (hF * 60 + mF) - (hI * 60 + mI);
            if (diff < 0) diff += 1440;
            totalMinutos += diff;

            return [idx + 1, s.hI, s.hF, `${kmSessao} km`, `R$ ${s.apurado.toFixed(2)}` ];
        });

        const lucro = totalApurado - abast - outros;
        const valorHora = totalMinutos > 0 ? lucro / (totalMinutos / 60) : 0;
        const tempoFmt = `${Math.floor(totalMinutos/60).toString().padStart(2,'0')}:${(totalMinutos%60).toString().padStart(2,'0')}h`;

        // Verifica se precisa de nova página
        if (yPos > 240) { doc.addPage(); yPos = 20; }

        // Título do Dia
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(31, 41, 51);
        doc.rect(14, yPos, 182, 7, 'F');
        doc.text(`DATA: ${data}`, 16, yPos + 5);
        
        // Tabela de sessões
        doc.autoTable({
            startY: yPos + 7,
            head: [['Sessão', 'Início', 'Fim', 'KM', 'Apurado']],
            body: corpoTabela,
            theme: 'grid',
            headStyles: { fillColor: [55, 65, 81] },
            styles: { fontSize: 9 },
            margin: { left: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 6;
        
        // Resumo do Dia (O que você solicitou)
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        const resumo = [
            `Intervalo Total: ${tempoFmt} | KM Total: ${totalKM} km`,
            `Combustível: R$ ${abast.toFixed(2)} | Outros Custos: R$ ${outros.toFixed(2)}`,
            `Total Apurado: R$ ${totalApurado.toFixed(2)}`,
            `LUCRO DO DIA: R$ ${lucro.toFixed(2)} | MÉDIA: R$ ${valorHora.toFixed(2)}/h`
        ];

        resumo.forEach(linha => {
            doc.text(linha, 14, yPos);
            yPos += 5;
        });

        yPos += 7; // Espaço para o próximo dia
    });

    doc.save(`Relatorio_Controle_Diario.pdf`);
};

// --- EXPORTAR PARA EXCEL (CSV DETALHADO) ---
document.getElementById('export-excel').onclick = () => {
    const historico = JSON.parse(localStorage.getItem('historico_dias')) || {};
    const chaves = Object.keys(historico).reverse();
    if (chaves.length === 0) return alert("Não há dados!");

    let csv = "Data;Intervalo;KM Total;Abastecimento;Outros;Apurado;Lucro;Media/h\n";

    chaves.forEach(data => {
        const info = historico[data];
        const abast = (JSON.parse(localStorage.getItem('abastecimentos')) || []).filter(a => a.data === data).reduce((acc, a) => acc + a.valor, 0);
        const outros = (JSON.parse(localStorage.getItem('outros_custos')) || []).filter(c => c.data === data).reduce((acc, c) => acc + c.valor, 0);
        
        let totalKM = 0, totalApurado = 0, totalMin = 0;
        info.sessoes.forEach(s => {
            totalKM += (s.kF - s.kI);
            totalApurado += s.apurado;
            const [hI, mI] = s.hI.split(':').map(Number);
            const [hF, mF] = s.hF.split(':').map(Number);
            let d = (hF * 60 + mF) - (hI * 60 + mI);
            if (d < 0) d += 1440;
            totalMin += d;
        });

        const lucro = totalApurado - abast - outros;
        const vh = totalMin > 0 ? lucro / (totalMin / 60) : 0;
        const tempo = `${Math.floor(totalMin/60)}h${totalMin%60}m`;

        csv += `${data};${tempo};${totalKM};${abast.toFixed(2)};${outros.toFixed(2)};${totalApurado.toFixed(2)};${lucro.toFixed(2)};${vh.toFixed(2)}\n`;
    });

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `Relatorio_Controle_Diario.csv`);
};


