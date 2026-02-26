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
    historicoGeral: document.getElementById('screen-historico-geral'),
	metas: document.getElementById('screen-metas'),
    metaMensal: document.getElementById('screen-meta-mensal'),
    metaSemanal: document.getElementById('screen-meta-semanal'),
    metaDiaria: document.getElementById('screen-meta-diaria'),
    metaDataValor: document.getElementById('screen-meta-data-valor'),
	manutencao: document.getElementById('screen-manutencao'),
    manutVeicular: document.getElementById('screen-manut-veicular'),
	manutData: document.getElementById('screen-manut-data')
	
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
    atualizarPainelResumoCustos();
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
    atualizarPainelResumoCustos();
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
        
        if (action === 'custos') { 
            // 1. Atualiza o Resumo Geral (o novo painel que você pediu)
            atualizarPainelResumoCustos();             
            // 2. Deixa as subtelas prontas caso o motorista clique nelas
            atualizarResumoAbastecimento(); 
            atualizarListaCustos();             
            showScreen(screens.custos); 
        }
        if (action === 'resumos') showScreen(screens.resumos);
		if (action === 'metas') showScreen(screens.metas);
		if (action === 'manutencao') showScreen(screens.manutencao);
        
       
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

document.addEventListener('DOMContentLoaded', function() {
    // Agora o DOM está carregado, podemos adicionar o evento.

const btnIrManut = document.getElementById('btn-ir-manut-veicular');
if(btnIrManut) {
    btnIrManut.onclick = () => {
        showScreen(screens.manutVeicular);
        // atualizarListaManutencao(); <- Chamaremos aqui no futuro
    };
}

});
// ==========================================
// 7. BOTÕES
// =========================================

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
    ['voltar-menu-principal', screens.menu],
	['voltar-menu-turno', screens.menuTurno],
    ['voltar-menu-finalizar', screens.menuTurno],
	['voltar-custos-principal', screens.menu],
    ['voltar-menu-custos-abast', screens.custos],
	['voltar-menu-custos-outros', screens.custos],
    ['voltar-menu-resumos', screens.menu],
	['voltar-resumo-diario', screens.resumos],
	['voltar-historico', screens.resumos],
	['voltar-metas-mensal', screens.metas],
    ['voltar-metas-semanal', screens.metas],
    ['voltar-metas-diaria', screens.metas],
    ['voltar-metas-data', screens.metas],
	['voltar-manut-principal', screens.menu],       // Volta da tela de opções de manutenção para o Menu Principal
    ['voltar-manut-veicular', screens.manutencao],  // Volta da tela de formulário KM para o Menu de Manutenção
    ['voltar-manut-data', screens.manutencao]       // Volta da tela de formulário Data para o Menu de Manutenção
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



// Função que realiza as somas (adicione ao final do arquivo)
function atualizarPainelResumoCustos() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    // Soma Abastecimentos
    const abastecimentos = JSON.parse(localStorage.getItem('abastecimentos')) || [];
    const totalAbast = abastecimentos
        .filter(a => a.data === hoje)
        .reduce((acc, a) => acc + a.valor, 0);

    // Soma Outros Custos
    const outros = JSON.parse(localStorage.getItem('outros_custos')) || [];
    const totalOutros = outros
        .filter(c => c.data === hoje)
        .reduce((acc, c) => acc + c.valor, 0);

    // Escreve os valores no HTML (IDs batendo com o passo 1)
    const abastEl = document.getElementById('resumo-custo-abast');
    const outrosEl = document.getElementById('resumo-custo-outros');
    const totalEl = document.getElementById('resumo-custo-total');

    if(abastEl) abastEl.textContent = `R$ ${totalAbast.toFixed(2).replace('.', ',')}`;
    if(outrosEl) outrosEl.textContent = `R$ ${totalOutros.toFixed(2).replace('.', ',')}`;
    if(totalEl) totalEl.textContent = `R$ ${(totalAbast + totalOutros).toFixed(2).replace('.', ',')}`;
}

// ==========================================
// 9. LÓGICA DE METAS (PADRÃO VISUAL APP)
// ==========================================

// --- NAVEGAÇÃO DOS BOTÕES DO MENU DE METAS ---
document.getElementById('btn-meta-mensal').onclick = () => { showScreen(screens.metaMensal); atualizarProgressoMeta('mensal'); };
document.getElementById('btn-meta-semanal').onclick = () => { showScreen(screens.metaSemanal); atualizarProgressoMeta('semanal'); };
document.getElementById('btn-meta-diaria').onclick = () => { showScreen(screens.metaDiaria); atualizarProgressoMeta('diario'); };
document.getElementById('btn-meta-por-data').onclick = () => { showScreen(screens.metaDataValor); renderizarMetasPorData(); };

// --- SALVAR VALORES DAS METAS ---
const salvarMetaSimples = (tipo) => {
    const input = document.getElementById(`input-meta-${tipo}`);
    if(!input.value) return alert("Insira um valor!");
    localStorage.setItem(`config_meta_${tipo}`, input.value);
    atualizarProgressoMeta(tipo);
    alert("Meta salva!");
};

if(document.getElementById('btn-salvar-meta-mensal')) document.getElementById('btn-salvar-meta-mensal').onclick = () => salvarMetaSimples('mensal');
if(document.getElementById('btn-salvar-meta-semanal')) document.getElementById('btn-salvar-meta-semanal').onclick = () => salvarMetaSimples('semanal');
if(document.getElementById('btn-salvar-meta-diaria')) document.getElementById('btn-salvar-meta-diaria').onclick = () => salvarMetaSimples('diaria');

// --- ATUALIZAR INTERFACE DE PROGRESSO ---
function atualizarProgressoMeta(tipo) {
    const meta = parseFloat(localStorage.getItem(`config_meta_${tipo === 'diario' ? 'diaria' : tipo}`)) || 0;
    const lucro = calcularLucroParaMeta(tipo); // Aquela função que já criamos
    const falta = meta - lucro;
    const container = document.getElementById(`progresso-${tipo}`);

    if (!container) return;

    if (tipo === 'diario') {
        const cor = falta <= 0 ? "#4ade80" : "#fbbf24";
        const msg = falta <= 0 ? "🎉 META BATIDA!" : "Meta não batida";
        container.innerHTML = `<h2 style="color:${cor}">${msg}</h2><p>Lucro hoje: R$ ${lucro.toFixed(2)}</p><p>Faltam: R$ ${falta > 0 ? falta.toFixed(2) : '0,00'}</p>`;
    } else {
        container.innerHTML = `
            <p>Sua meta: <strong>R$ ${meta.toFixed(2)}</strong></p>
            <p>Lucro acumulado: <span style="color:#4ade80">R$ ${lucro.toFixed(2)}</span></p>
            <h3 style="margin-top:10px; color:#fbbf24">${falta <= 0 ? "🎉 Meta Concluída!" : "Faltam: R$ " + falta.toFixed(2)}</h3>
        `;
    }
}

// --- LOGICA ESPECIFICA: META POR DATA E VALOR ---
document.getElementById('btn-salvar-meta-data').onclick = () => {
    const titulo = document.getElementById('meta-data-titulo').value;
    const valor = parseFloat(document.getElementById('meta-data-valor').value);
    const dataLimite = document.getElementById('meta-data-limite').value;

    if(!titulo || !valor || !dataLimite) return alert("Preencha tudo!");

    const lista = getData('metas_por_data');
    lista.push({ id: Date.now(), titulo, valor, dataLimite });
    setData('metas_por_data', lista);

    renderizarMetasPorData();
    // Limpar campos
    document.getElementById('meta-data-titulo').value = '';
    document.getElementById('meta-data-valor').value = '';
};

function renderizarMetasPorData() {
    const lista = getData('metas_por_data');
    const container = document.getElementById('lista-metas-data');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (lista.length === 0) {
        container.innerHTML = '<p style="opacity:0.5; text-align:center; padding:20px;">Nenhuma meta agendada.</p>';
        return;
    }

    // Variável para acumular a soma de todas as parcelas diárias
    let esforçoDiarioTotal = 0;

    // Gerar o HTML de cada card e calcular a soma
    const htmlCards = lista.map(m => {
        const alvo = new Date(m.dataLimite + "T00:00:00");
        const diffMs = alvo - hoje;
        const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        // Cálculo da parcela individual (apenas se a meta não venceu)
        const parcelaIndividual = dias > 0 ? (m.valor / dias) : 0;
        
        // Soma ao total acumulado
        if (dias > 0) {
            esforçoDiarioTotal += parcelaIndividual;
        }

        return `
            <div style="background:var(--card); padding:15px; border-radius:12px; margin-bottom:10px; border-left:5px solid var(--blue); position:relative;">
                <button onclick="excluirMetaPorData(${m.id})" style="position:absolute; top:10px; right:10px; background:none; border:none; color:#ef4444; font-size:22px; cursor:pointer;">&times;</button>
                
                <strong style="color:var(--white); display:block; margin-bottom:5px;">${m.titulo}</strong>
                <p style="font-size:13px; margin:2px 0; opacity:0.8;">Total: R$ ${m.valor.toFixed(2)} | Alvo: ${new Date(m.dataLimite).toLocaleDateString('pt-BR')}</p>
                <p style="color:var(--orange); font-size:13px; font-weight:bold;">Parcela desta meta: R$ ${parcelaIndividual.toFixed(2)}/dia</p>
            </div>
        `;
    }).join('');

    // Criar o Card de Resumo (O Esforço Total)
    const cardResumo = `
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid var(--blue); padding: 20px; border-radius: 15px; margin-bottom: 20px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
            <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 10px;">Esforço Diário Total</p>
            <h2 style="color: #4ade80; font-size: 28px; margin: 0;">R$ ${esforçoDiarioTotal.toFixed(2)}</h2>
            <p style="font-size: 12px; opacity: 0.6; margin-top: 10px;">Lucro necessário hoje para bater as ${lista.length} metas</p>
        </div>
    `;

    container.innerHTML = cardResumo + htmlCards;
}


// NOVA FUNÇÃO PARA EXCLUIR
function excluirMetaPorData(id) {
    if (!confirm("Deseja excluir esta meta permanentemente?")) return;
    
    let lista = getData('metas_por_data');
    // Filtra a lista removendo o item com o ID clicado
    lista = lista.filter(meta => meta.id !== id);
    
    setData('metas_por_data', lista);
    renderizarMetasPorData(); // Atualiza a tela imediatamente
}

// ==========================================
// INICIALIZAÇÃO SEGURA DO DOM
// ==========================================

document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // BOTÕES VOLTAR (PROTEGIDOS)
    // ==========================================

    const voltarMetaMensal = document.getElementById('voltar-meta-mensal');
    const voltarMetaSemanal = document.getElementById('voltar-meta-semanal');
    const voltarMetaDiaria = document.getElementById('voltar-meta-diaria');
    const voltarMetaData = document.getElementById('voltar-meta-data');

    if (voltarMetaMensal) voltarMetaMensal.onclick = () => showScreen(screens.metas);
    if (voltarMetaSemanal) voltarMetaSemanal.onclick = () => showScreen(screens.metas);
    if (voltarMetaDiaria) voltarMetaDiaria.onclick = () => showScreen(screens.metas);
    if (voltarMetaData) voltarMetaData.onclick = () => showScreen(screens.metas);

    // ==========================================
    // MANUTENÇÕES - DEFINIÇÕES OFICIAIS
    // ==========================================

    const MANUTENCOES_KM = {
        OLEO: {
            label: 'Troca de Óleo',
            subcategorias: {
                MOTOR: { label: 'Óleo do Motor' },
                CAMBIO: { label: 'Óleo do Câmbio' }
            }
        },
        FILTROS: {
            label: 'Filtros',
            subcategorias: {
                OLEO: { label: 'Filtro de Óleo' },
                AR_COND: { label: 'Filtro do Ar Condicionado' }
            }
        },
        PNEUS: {
            label: 'Pneus',
            subcategorias: {
                REPARO: { label: 'Reparo de Pneus' },
                RODIZIO: { label: 'Rodízio de Pneus' }
            }
        },
        ARREFECIMENTO: {
            label: 'Arrefecimento',
            subcategorias: {
                SISTEMA: { label: 'Sistema de Arrefecimento' },
                LIQUIDO: { label: 'Troca do Líquido de Arrefecimento' }
            }
        },
        FREIOS: {
            label: 'Sistema de Freios',
            subcategorias: {
                PASTILHA: { label: 'Pastilhas de Freio' },
                DISCO: { label: 'Discos de Freio' },
                FLUIDO: { label: 'Fluido de Freio' },
                TAMBOR: { label: 'Freio a Tambor' }
            }
        },
        SUSPENSAO: {
            label: 'Suspensão',
            subcategorias: {
                AMORTECEDOR: { label: 'Amortecedores' },
                MOLAS: { label: 'Molas' },
                BUCHAS: { label: 'Buchas da Suspensão' },
                BATENTE: { label: 'Batentes' }
            }
        },
        CORREIAS: {
            label: 'Correias',
            subcategorias: {
                DENTADA: { label: 'Correia Dentada' },
                AUXILIAR: { label: 'Correia Auxiliar' },
                TENSOR: { label: 'Tensor da Correia' }
            }
        },
        TRANSMISSAO: {
            label: 'Transmissão',
            subcategorias: {
                EMBREAGEM: { label: 'Embreagem' },
                CAMBIO_MANUAL: { label: 'Câmbio Manual' },
                CAMBIO_AUTOMATICO: { label: 'Câmbio Automático' },
                DIFERENCIAL: { label: 'Diferencial' }
            }
        },
        ELETRICA: {
            label: 'Sistema Elétrico',
            subcategorias: {
                BATERIA: { label: 'Bateria' },
                ALTERNADOR: { label: 'Alternador' },
                MOTOR_PARTIDA: { label: 'Motor de Partida' },
                ILUMINACAO: { label: 'Sistema de Iluminação' },
                FUSIVEIS: { label: 'Fusíveis' }
            }
        }
    };

    // Torna global se precisar usar fora
    window.MANUTENCOES_KM = MANUTENCOES_KM;

    // ==========================================
    // POPULAR SELECT DE CATEGORIAS
    // ==========================================

    const tipoSelect = document.getElementById('tipo-manutencao');
    const subcategoriaSelect = document.getElementById('subcategoria-manutencao');

    if (tipoSelect) {
        tipoSelect.innerHTML = '<option value="">Selecione</option>';

        Object.keys(MANUTENCOES_KM).forEach(categoriaKey => {
            const option = document.createElement('option');
            option.value = categoriaKey;
            option.textContent = MANUTENCOES_KM[categoriaKey].label;
            tipoSelect.appendChild(option);
        });

        // ==========================================
        // 4.3 - CARREGAR SUBCATEGORIAS DINAMICAMENTE
        // ==========================================

        tipoSelect.addEventListener('change', function () {

            if (!subcategoriaSelect) return;

            const categoriaSelecionada = this.value;

            subcategoriaSelect.innerHTML = '<option value="">Selecione</option>';

            if (!categoriaSelecionada) return;

            const subcategorias = MANUTENCOES_KM[categoriaSelecionada].subcategorias;

            Object.keys(subcategorias).forEach(subKey => {
                const option = document.createElement('option');
                option.value = subKey;
                option.textContent = subcategorias[subKey].label;
                subcategoriaSelect.appendChild(option);
            });
        });
    }

});

// ==========================================
// 4.2 - SUBSTITUIÇÃO DE MANUTENÇÃO ANTERIOR
// ==========================================

function substituirManutencao(tipo, subcategoria, kmFinal, novaManut) {
    // Recupera o histórico de manutenções
    const historico = JSON.parse(localStorage.getItem('historico_manutencao')) || [];

    // Encontra a manutenção anterior da mesma categoria e subcategoria
    const manutencaoExistente = historico.find(manut => 
        manut.categoria === tipo && manut.subcategoria === subcategoria
    );

    // Verifica se a manutenção já existe e se o KM final é maior que o registrado
    if (manutencaoExistente && kmFinal > manutencaoExistente.kmUltimaTroca) {
        // Substitui a manutenção anterior pela nova
        const index = historico.indexOf(manutencaoExistente);
        historico[index] = { ...novaManut, kmUltimaTroca: kmFinal };
        
        // Atualiza o histórico no localStorage
        localStorage.setItem('historico_manutencao', JSON.stringify(historico));

        alert("✅ Manutenção substituída com sucesso!");
    } else {
        alert("⚠️ Não é necessário substituir a manutenção ou o KM ainda não é suficiente.");
    }
}

// ==========================================
// 4.3 - ALERTAS VISÍVEIS
// ==========================================

function exibirAlertaDeManutencao(manutencao) {
    const alertaContainer = document.getElementById('alerta-manutencao');

    if (!alertaContainer) return;

    const alerta = document.createElement('div');
    alerta.classList.add('alerta');
    alerta.innerHTML = `
        <strong>Manutenção: ${manutencao.label}</strong><br>
        Status: ${manutencao.status}<br>
        KM: ${manutencao.kmFinal} - ${manutencao.kmRestante}km restantes
    `;

    alertaContainer.appendChild(alerta);
}

// ==========================================
// 9.1 MANUTENÇÃO VEICULAR (POR KM)
// ==========================================

// 2. Lógica "Outros" no Tipo de Manutenção (Aparecer campo de texto)
const selectTipoManut = document.getElementById('tipo-manutencao');
if(selectTipoManut) {
    selectTipoManut.onchange = (e) => {
        const campoOutros = document.getElementById('group-manut-outros');
        if(campoOutros) campoOutros.classList.toggle('hidden', e.target.value !== 'Outros');
    };
}

// 3. Lógica "Outra KM" (Aparecer campo para digitar KM personalizada)
const selectKmManut = document.getElementById('km-intervalo-select');
if(selectKmManut) {
    selectKmManut.onchange = (e) => {
        const campoKmCustom = document.getElementById('group-manut-km-custom');
        if(campoKmCustom) campoKmCustom.classList.toggle('hidden', e.target.value !== 'outra');
    };
}

// 4. Lógica Parcelamento (Só aparece se for Crédito)
const selectPagManut = document.getElementById('pag-manutencao');
if(selectPagManut) {
    selectPagManut.onchange = (e) => {
        const campoParcelas = document.getElementById('group-manut-parcelas');
        if(campoParcelas) campoParcelas.classList.toggle('hidden', e.target.value !== 'Credito');
    };
}

const btnIrManutData = document.getElementById('btn-ir-manut-data');
if(btnIrManutData) {
    btnIrManutData.onclick = () => showScreen(screens.manutData);
}

// --- SALVAR MANUTENÇÃO POR KM ---
document.getElementById('btn-salvar-manut-veicular').onclick = () => {
    const tipo = document.getElementById('tipo-manutencao').value;
    const descOutros = document.getElementById('desc-manut-outros').value;
    const kmSelect = document.getElementById('km-intervalo-select').value;
    const kmCustom = document.getElementById('km-manut-custom').value;
    const valor = parseFloat(document.getElementById('valor-manutencao').value);
    const pag = document.getElementById('pag-manutencao').value;
    const parcelas = document.getElementById('parcelas-manutencao').value;

    if (isNaN(valor)) return alert("Por favor, insira o valor do custo!");

    // Define qual KM usar (Padrão ou Customizada)
    const kmFinal = kmSelect === 'outra' ? kmCustom : kmSelect;

   const novaManut = {
    id: Date.now(),
    data: new Date().toLocaleDateString('pt-BR'),

    categoria: tipo === 'Outros' ? 'OUTROS' : tipo,
    subcategoria: tipo === 'Outros' ? null : tipo,

    descricaoLivre: tipo === 'Outros' ? descOutros : null,

    kmIntervalo: tipo === 'Outros' ? null : Number(kmFinal),
    kmUltimaTroca: getUltimoKmFinal(), // vamos validar isso depois

    valor: valor,
    pagamento: pag,
    parcelas: pag === 'Credito' ? parcelas : '1'
};

    const lista = getData('historico_manutencao');
    lista.push(novaManut);
    setData('historico_manutencao', lista);

    alert("✅ Manutenção salva com sucesso!");
    
    // Limpar campos
    document.getElementById('valor-manutencao').value = "";
    document.getElementById('desc-manut-outros').value = "";
    
    atualizarListaManutencao(); // Função que faremos a seguir para mostrar na tela
};


function atualizarListaManutencao() {
    const lista = getData('historico_manutencao');
    const container = document.getElementById('historico-manut-veicular');
    
    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = '<p style="opacity:0.5; text-align:center;">Nenhum registro encontrado.</p>';
        return;
    }

    container.innerHTML = lista.reverse().map(m => `
        <div style="background:var(--card); padding:12px; border-radius:10px; margin-bottom:10px; border-left:4px solid #ef4444;">
            <div style="display:flex; justify-content:space-between; font-size:12px; opacity:0.7;">
                <span>${m.data}</span>
                <span>Prox: ${m.kmIntervalo} KM</span>
            </div>
            <strong style="display:block; margin:5px 0;">${m.tipo}</strong>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#4ade80; font-weight:bold;">R$ ${m.valor.toFixed(2)}</span>
                <span style="font-size:11px; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">${m.pagamento}</span>
            </div>
        </div>
    `).join('');F
}

// ==========================================
// 10. MANUTENÇÃO POR DATA (GNV / SEGURO)
// ==========================================

// Função para Salvar
const btnSalvarData = document.getElementById('btn-salvar-manut-data');
if(btnSalvarData) {
    btnSalvarData.onclick = () => {
        const tipo = document.getElementById('tipo-manut-data').value;
        const dataVenc = document.getElementById('data-manut-vencimento').value;
        const valor = parseFloat(document.getElementById('valor-manut-data').value) || 0;

        if (!dataVenc) return alert("Selecione a data de vencimento!");

        const novoAlerta = {
            id: Date.now(),
            tipo: tipo,
            vencimento: dataVenc,
            valor: valor
        };

        const lista = getData('historico_manut_data');
        lista.push(novoAlerta);
        setData('historico_manut_data', lista);

        alert("✅ Alerta agendado!");
        document.getElementById('data-manut-vencimento').value = "";
        document.getElementById('valor-manut-data').value = "";
        renderizarListaManutData();
    };
}

// Função para Renderizar (Desenhar na tela)
function renderizarListaManutData() {
    const lista = getData('historico_manut_data');
    const container = document.getElementById('lista-manut-data');
    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = '<p style="opacity:0.5; text-align:center; padding:20px;">Nenhum alerta cadastrado.</p>';
        return;
    }

    container.innerHTML = lista.map(item => {
        const dataFmt = new Date(item.vencimento + "T00:00:00").toLocaleDateString('pt-BR');
        return `
            <div style="background:var(--card); padding:15px; border-radius:12px; margin-bottom:10px; border-left:5px solid var(--blue); position:relative;">
                <button onclick="excluirManutData(${item.id})" style="position:absolute; top:10px; right:10px; background:none; border:none; color:var(--red); font-size:20px; cursor:pointer;">&times;</button>
                <strong style="color:var(--white)">${item.tipo}</strong>
                <p style="font-size:14px; margin:5px 0;">Vencimento: <b style="color:var(--orange)">${dataFmt}</b></p>
                <p style="font-size:12px; opacity:0.8;">Custo Estimado: R$ ${item.valor.toFixed(2)}</p>
            </div>
        `;
    }).join('');
}

// Função para Excluir
function excluirManutData(id) {
    if(!confirm("Remover este alerta?")) return;
    const novaLista = getData('historico_manut_data').filter(i => i.id !== id);
    setData('historico_manut_data', novaLista);
    renderizarListaManutData();
}

// VÍNCULO DO BOTÃO DE NAVEGAÇÃO: Carregar a lista ao abrir
const btnAcessarData = document.getElementById('btn-ir-manut-data');
if(btnAcessarData) {
    btnAcessarData.onclick = () => {
        showScreen(screens.manutData);
        renderizarListaManutData(); // ✅ Agora a tela não abrirá vazia
    };
}

