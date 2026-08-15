// ==UserScript==
// @name         EPass Atendimento
// @namespace    https://github.com/epass-helper
// @version      5.61.1
// @description  Atendimento E-Pass com overlays profissionais de Atendimento e Conversa Atual
// @author       EPass Helper
// @updateURL    https://raw.githubusercontent.com/xZHENO/epass-helper/main/EPASS_HELPER_ATENDIMENTO.user.js
// @downloadURL  https://raw.githubusercontent.com/xZHENO/epass-helper/main/EPASS_HELPER_ATENDIMENTO.user.js
// @match        http://www.epass.com.br/*
// @match        https://www.epass.com.br/*
// @match        http://epass.com.br/*
// @match        https://epass.com.br/*
// @match        https://web.whatsapp.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_addValueChangeListener
// @grant        GM_listValues
// @grant        GM_xmlhttpRequest
// @connect      supabase.co
// @require      https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    const EH = {};

    // ============================================================
    // CONFIGURAÇÕES
    // ============================================================
    EH.Config = {
        VERSION: '5.61.1',
        DEBUG: false,
        STORAGE_PREFIX: 'epassHelperV5.', // namespace de dados estável; não acompanha a versão do script
        STORAGE_SCHEMA_VERSION: 8,
        TOAST_DURATION: 3400,
        CAPTURE_SCALE: 2,
        TICKET_CAPTURE_WIDTH: 430,
        MAX_CAPTURE_PIXELS: 26000000,
        HISTORY_LIMIT: 10,
        HISTORY_MAX_CHARS: 45000000,
        AUTO_COPY_IMAGES: true,
        AUTO_ROUTE_CAPTURE: true,
        WHATSAPP_MODE: 'web',
        PANEL_WIDTH: 228,
        PANEL_ZOOM: 1.5,
        PANEL_MIN_BASE: 112,
        WHATSAPP_DOCK_WIDTH: 360,
        WHATSAPP_DOCK_ZOOM: 1.1,
        WHATSAPP_MIN_BASE: 160,
        SETTINGS_PRESET: 'padrao',
        UI_DENSITY: 'padrao',
        PANEL_CUSTOM_WIDTH: 0,
        PANEL_HEIGHT_PERCENT: 0,
        WHATSAPP_CUSTOM_WIDTH: 0,
        WHATSAPP_HEIGHT_PERCENT: 0,
        OVERLAY_SIDE: 'right',
        OVERLAY_TOP_OFFSET: 0,
        PANEL_OPACITY: 1,
        PANEL_RADIUS: 15,
        SHADOW_LEVEL: 'normal',
        FINANCE_COMMISSION_PERCENT: 10,
        FINANCE_AUTO_REGISTER: true,
        FINANCE_SHOW_CAIXA_SUMMARY: true,
        FINANCE_ASK_COMPANY_MERCH: true,
        FINANCE_CONFIRM_DELETE: true,
        OPERATION_CARS_ENABLED: true,
        OPERATION_AGENCY_CODE: '287',
        OPERATION_SORT_BY_SEAT: true,
        OPERATION_DOCK_ENABLED: true,
        REMINDER_CREATE_AFTER_TICKET: true,
        REMINDER_ASK_AFTER_TICKET: true,
        REMINDER_MASK_CPF: true,
        REMINDER_HIGHLIGHT_TODAY: true,
        SYNC_PROVIDER: 'none',
        SYNC_ENABLED: false,
        SYNC_SUPABASE_URL: '',
        SYNC_SUPABASE_KEY: '',
        SYNC_SUPABASE_EMAIL: '',
        SYNC_INTERVAL_MS: 30000,
        SYNC_REMINDERS: true,
        SYNC_REQUISITIONS: true,
        SYNC_EMISSION_DATA: true,
        SYNC_SETTINGS: false,
        // Rotina operacional: horário/nome são configuração; SERVIÇO é sempre dado detectado do dia.
        OPERATION_TIME_TOLERANCE_MINUTES: 20,
        OPERATION_ROUTINES: [
            { id: 'gyn-barra-0700', name: 'Goiânia → Barra do Garças', operationalTime: '07:00', active: true, originHint: 'GOIANIA', destinationHint: 'BARRA DO GARCAS', companyHint: '', lineHint: '' },
            { id: 'barra-gyn-0730', name: 'Barra do Garças → Goiânia', operationalTime: '07:30', active: true, originHint: 'BARRA DO GARCAS', destinationHint: 'GOIANIA', companyHint: '', lineHint: '' },
            { id: 'gyn-cuiaba-1100', name: 'Goiânia → Cuiabá', operationalTime: '11:00', active: true, originHint: 'GOIANIA', destinationHint: 'CUIABA', companyHint: '', lineHint: '' },
            { id: 'barra-gyn-1200', name: 'Barra do Garças → Goiânia', operationalTime: '12:00', active: true, originHint: 'BARRA DO GARCAS', destinationHint: 'GOIANIA', companyHint: '', lineHint: '' },
            { id: 'gyn-barra-2130', name: 'Goiânia → Barra do Garças', operationalTime: '21:30', active: true, originHint: 'GOIANIA', destinationHint: 'BARRA DO GARCAS', companyHint: '', lineHint: '' }
        ],
        CENTRAL_MIN_WIDTH: 280,
        LAYOUT_TRANSITION_MS: 180,
        APP_OBSERVER_DEBOUNCE_MS: 420,
        WA_OBSERVER_DEBOUNCE_MS: 650,
        WA_UI_FALLBACK_MS: 6500,
        WA_HEARTBEAT_MS: 4500,
        WA_STATUS_REFRESH_MS: 5000,
        MESSAGES: {
            pesquisa: 'Escolha o horário desejado.\n\nDepois disso, te envio as poltronas disponíveis.',
            reserva: 'Escolha sua poltrona e me informe o número.',
            bilhete: '✅ *Passagem emitida*\n\nSegue seu bilhete.\n\nConfira os dados antes do embarque.',
            resumo: 'Confira os dados da sua viagem.\n\nSe estiver tudo correto, responda *SIM*.',
            pix: '👇 Para copiar o PIX:\n\n*Segure a próxima mensagem e toque em Copiar*.\n\n⚠️ Não toque somente no trecho azul.'
        },
        SALE_CPF_TTL_MS: 6 * 60 * 60 * 1000,
        REQUISITION_TTL_MS: 365 * 24 * 60 * 60 * 1000,
        REQUISITION_ACTIVE_TTL_MS: 3 * 60 * 60 * 1000,
        TAXAS_ORIGEM: {
            IPORA: 3.83,
            GOIANIA: 0,
            'BARRA DO GARCAS': 0,
            ARAGARCAS: 0,
            'SAO LUIS DE MONTES BELOS': 0
        },
        APLICAR_TAXAS_ORIGEM: true,
        SORT_DAY_START_MINUTES: 5 * 60,
        LINHAS: {
            MA: 'EXPRESSO MAIA',
            JO: 'JOTAMAR',
            NH: 'NOVO HORIZONTE'
        }
    };

    // Padrões imutáveis usados pela Central de Configurações.
    // Alterar/restaurar preferências nunca apaga dados operacionais do Helper.
    EH.ConfigDefaults = JSON.parse(JSON.stringify(EH.Config));

    EH.OrdemPoltronas = [
        1, 2, 5, 6, 9, 10, 11, 12, 13, 14, 17, 18, 21, 22, 25, 26,
        29, 30, 33, 34, 37, 38, 41, 42, 45, 46,
        4, 8, 16, 20, 24, 28, 32, 36, 40, 44, 48,
        3, 7, 15, 19, 23, 27, 31, 35, 39, 43, 47
    ];

    // ============================================================
    // SELETORES
    // Mantenha alternativas para suportar pequenas mudanças no site.
    // ============================================================
    EH.Selectors = {
        ORIGEM: [
            '.ng-select[formcontrolname="id_localidade_origem"] .ng-value-label',
            '[formcontrolname="id_localidade_origem"] .ng-value-label'
        ],
        ORIGEM_SELECT: [
            'ng-select[formcontrolname="id_localidade_origem"]',
            '[formcontrolname="id_localidade_origem"]'
        ],
        DESTINO: [
            '.ng-select[formcontrolname="id_localidade_destino"] .ng-value-label',
            '[formcontrolname="id_localidade_destino"] .ng-value-label'
        ],
        DESTINO_SELECT: [
            'ng-select[formcontrolname="id_localidade_destino"]',
            '[formcontrolname="id_localidade_destino"]'
        ],
        DATA: [
            'input[formcontrolname="data"]',
            'input[type="date"]'
        ],
        TABLE_HORARIOS: [
            'table.table-hover',
            'table.table-striped.table-hover'
        ],
        TABLE_ROWS: 'tbody tr',
        CELULA_SAIDA: 'td:nth-child(2)',
        CELULA_LINHA_BADGE: 'td:nth-child(3) .badge',
        CELULA_LINHA: 'td:nth-child(3)',
        CELULA_CHEGADA: 'td:nth-child(4)',
        CELULA_VALOR: 'td:nth-child(5)',
        CELULA_TIPO: 'td:nth-child(5) small',
        MAPA_POLTRONAS: [
            '.onibus-poltronas',
            'app-onibus .onibus-poltronas'
        ],
        POLTRONA_BUTTON: 'app-poltrona button, button.poltrona',
        DADOS_RESERVA: [
            '.dados_reserva',
            '.dados-reserva'
        ],
        VALOR_PARCIAL: [
            '.valor-parcial h3',
            '.valor_parcial h3'
        ],
        PASSAGENS_ROOT: [
            'app-passagens'
        ],
        PASSAGENS_CPF_INPUT: [
            'input[formcontrolname="cpf_passageiro"]',
            'input[placeholder*="CPF DO PASSAGEIRO"]'
        ],
        PAGAMENTO_ROOT: ['app-pagamento'],
        RESUMO_COMPRA: ['.resumo-reserva .card .body'],
        PIX_MODAL: ['ngx-smart-modal[identifier="modalPixQrCode"] .nsm-dialog-open', '.modalPixQrCode.nsm-dialog-open'],
        PIX_QR: ['ngx-smart-modal[identifier="modalPixQrCode"] .qrCodeImg', '.modalPixQrCode.nsm-dialog-open .qrCodeImg'],
        PIX_VALOR: ['ngx-smart-modal[identifier="modalPixQrCode"] .pixValor strong', '.modalPixQrCode.nsm-dialog-open .pixValor strong'],
        PIX_EXPIRA: ['ngx-smart-modal[identifier="modalPixQrCode"] .pixExpiraEm strong', '.modalPixQrCode.nsm-dialog-open .pixExpiraEm strong'],
        PIX_CODIGO: ['#pixCopiaEColaContent'],
        REQUISITION_FORM_ROOT: ['app-solicitacao-requisicoes-prefeitura'],
        REQUISITION_INFO_ARRAY: ['app-solicitacao-requisicoes-prefeitura [formarrayname="info"]'],
        REQUISITION_LIST_ROOT: ['app-solicitacoes'],
        REQUISITION_CODE_MODAL: [
            'ngx-smart-modal[identifier="modalCodigoPrefeitura"] .nsm-dialog-open',
            '.modalCodigoPrefeitura.nsm-dialog-open'
        ],
        REQUISITION_CODE_INPUT: ['input[formcontrolname="codigoRequisicao"]'],
        REQUISITION_ID_INPUT: ['input[formcontrolname="idRequisicao"]'],

        // Financeiro — seletores confirmados nos HTMLs reais CAIXA.html e COMISSÕES.html.
        // Nesta etapa são usados SOMENTE para leitura; nenhum valor oficial do E-Pass é alterado.
        CAIXA_ROOT: ['app-visualizar-caixa'],
        CAIXA_TABLES: 'app-visualizar-caixa table.table-hover',
        COMISSOES_ROOT: ['sacar-comissao'],
        COMISSOES_HISTORY: ['sacar-comissao .historico-comissoes'],
        COMISSOES_HISTORY_ROWS: 'sacar-comissao .historico-comissoes div[data-index]',
        COMISSOES_VALUE: '.item-values',
        COMISSOES_ORIGINAL_VALUE: '.item-valor-original',
        COMISSOES_DATE: '.date',
        COMISSOES_COMPANY: '.sublinhado',

        // Mapa de Viagem / Mapa do Carro — confirmado nos HTMLs reais.
        MAPA_VIAGEM_MODAL: [
            'ngx-smart-modal[identifier="modalMapaViagem"] .nsm-dialog-open',
            '.nsm-dialog.modalMapaViagem.nsm-dialog-open'
        ]
    };

    // ============================================================
    // LOGGER
    // ============================================================
    EH.Logger = {
        debug(...args) {
            if (EH.Config.DEBUG) console.debug('[EPass Helper]', ...args);
        },
        trace(scope, ...args) {
            if (EH.Config.DEBUG) console.debug(`[EH][${String(scope || 'Diagnóstico')}]`, ...args);
        },
        info(...args) {
            // Log normal permanece enxuto: somente mensagens de ciclo de vida realmente úteis.
            console.info('[EPass Helper]', ...args);
        },
        warn(...args) {
            console.warn('[EPass Helper]', ...args);
        },
        error(...args) {
            console.error('[EPass Helper]', ...args);
        }
    };

    // ============================================================
    // STORAGE
    // ============================================================
    EH.Storage = {
        key(name) {
            return EH.Config.STORAGE_PREFIX + name;
        },
        get(name, fallback) {
            try {
                const value = GM_getValue(this.key(name));
                if (value === undefined || value === null || value === '') return fallback;
                return typeof value === 'string' ? JSON.parse(value) : value;
            } catch (error) {
                EH.Logger.warn('Não foi possível ler a configuração:', name, error);
                return fallback;
            }
        },
        set(name, value) {
            try {
                GM_setValue(this.key(name), JSON.stringify(value));
            } catch (error) {
                EH.Logger.warn('Não foi possível salvar a configuração:', name, error);
            }
        },
        remove(name) {
            try {
                if (typeof GM_deleteValue === 'function') GM_deleteValue(this.key(name));
                else GM_setValue(this.key(name), '');
            } catch (error) {
                EH.Logger.warn('Não foi possível remover o valor:', name, error);
            }
        },
        loadSettings() {
            const taxasPadrao = { ...EH.Config.TAXAS_ORIGEM };
            const taxasSalvas = this.get('taxasOrigem', null);
            const taxaIporaLegada = EH.Utils.parseMoney(this.get('taxaIpora', taxasPadrao.IPORA));
            if (taxasSalvas && typeof taxasSalvas === 'object') {
                EH.Config.TAXAS_ORIGEM = Object.fromEntries(
                    Object.entries({ ...taxasPadrao, ...taxasSalvas })
                        .map(([key, value]) => [key, Math.max(0, EH.Utils.parseMoney(value))])
                );
            } else {
                EH.Config.TAXAS_ORIGEM = { ...taxasPadrao, IPORA: Math.max(0, taxaIporaLegada) };
            }
            EH.Config.APLICAR_TAXAS_ORIGEM = EH.Utils.parseBoolean(
                this.get('aplicarTaxasOrigem', this.get('aplicarTaxaIpora', EH.Config.APLICAR_TAXAS_ORIGEM)),
                EH.Config.APLICAR_TAXAS_ORIGEM
            );
            EH.Config.CAPTURE_SCALE = Number(
                this.get('captureScale', EH.Config.CAPTURE_SCALE)
            ) || 2;
            EH.Config.TICKET_CAPTURE_WIDTH = Math.min(520, Math.max(360, Number(
                this.get('ticketCaptureWidth', EH.Config.TICKET_CAPTURE_WIDTH)
            ) || 430));
            const savedMessages = this.get('messages', null);
            if (savedMessages && typeof savedMessages === 'object') {
                EH.Config.MESSAGES = { ...EH.Config.MESSAGES, ...savedMessages };
            }
            EH.Config.AUTO_COPY_IMAGES = EH.Utils.parseBoolean(this.get('autoCopyImages', EH.Config.AUTO_COPY_IMAGES), EH.Config.AUTO_COPY_IMAGES);
            EH.Config.AUTO_ROUTE_CAPTURE = EH.Utils.parseBoolean(this.get('autoRouteCapture', EH.Config.AUTO_ROUTE_CAPTURE), EH.Config.AUTO_ROUTE_CAPTURE);
            // Esta versão usa somente o WhatsApp integrado/Web para evitar fluxos duplicados.
            EH.Config.WHATSAPP_MODE = 'web';
            EH.Config.PANEL_ZOOM = Math.min(2, Math.max(0.75, Number(this.get('panelZoom', EH.Config.PANEL_ZOOM)) || 1.5));
            EH.Config.WHATSAPP_DOCK_ZOOM = Math.min(2, Math.max(0.75, Number(this.get('whatsappDockZoom', EH.Config.WHATSAPP_DOCK_ZOOM)) || 1.1));

            const preset = String(this.get('settingsPreset', EH.Config.SETTINGS_PRESET) || 'padrao');
            EH.Config.SETTINGS_PRESET = ['compacto', 'padrao', 'confortavel', 'personalizado'].includes(preset) ? preset : 'padrao';
            const density = String(this.get('uiDensity', EH.Config.UI_DENSITY) || 'padrao');
            EH.Config.UI_DENSITY = ['compacto', 'padrao', 'confortavel'].includes(density) ? density : 'padrao';
            EH.Config.PANEL_CUSTOM_WIDTH = Math.min(440, Math.max(0, Number(this.get('panelCustomWidth', EH.Config.PANEL_CUSTOM_WIDTH)) || 0));
            if (EH.Config.PANEL_CUSTOM_WIDTH && EH.Config.PANEL_CUSTOM_WIDTH < 260) EH.Config.PANEL_CUSTOM_WIDTH = 260;
            EH.Config.PANEL_HEIGHT_PERCENT = Math.min(90, Math.max(0, Number(this.get('panelHeightPercent', EH.Config.PANEL_HEIGHT_PERCENT)) || 0));
            if (EH.Config.PANEL_HEIGHT_PERCENT && EH.Config.PANEL_HEIGHT_PERCENT < 40) EH.Config.PANEL_HEIGHT_PERCENT = 40;
            EH.Config.WHATSAPP_CUSTOM_WIDTH = Math.min(420, Math.max(0, Number(this.get('whatsappCustomWidth', EH.Config.WHATSAPP_CUSTOM_WIDTH)) || 0));
            if (EH.Config.WHATSAPP_CUSTOM_WIDTH && EH.Config.WHATSAPP_CUSTOM_WIDTH < 230) EH.Config.WHATSAPP_CUSTOM_WIDTH = 230;
            EH.Config.WHATSAPP_HEIGHT_PERCENT = Math.min(80, Math.max(0, Number(this.get('whatsappHeightPercent', EH.Config.WHATSAPP_HEIGHT_PERCENT)) || 0));
            if (EH.Config.WHATSAPP_HEIGHT_PERCENT && EH.Config.WHATSAPP_HEIGHT_PERCENT < 25) EH.Config.WHATSAPP_HEIGHT_PERCENT = 25;
            const side = String(this.get('overlaySide', EH.Config.OVERLAY_SIDE) || 'right');
            EH.Config.OVERLAY_SIDE = side === 'left' ? 'left' : 'right';
            EH.Config.OVERLAY_TOP_OFFSET = Math.min(240, Math.max(0, Number(this.get('overlayTopOffset', EH.Config.OVERLAY_TOP_OFFSET)) || 0));
            EH.Config.PANEL_OPACITY = Math.min(1, Math.max(0.86, Number(this.get('panelOpacity', EH.Config.PANEL_OPACITY)) || 1));
            EH.Config.PANEL_RADIUS = Math.min(22, Math.max(8, Number(this.get('panelRadius', EH.Config.PANEL_RADIUS)) || 15));
            const shadow = String(this.get('shadowLevel', EH.Config.SHADOW_LEVEL) || 'normal');
            EH.Config.SHADOW_LEVEL = ['none', 'suave', 'normal'].includes(shadow) ? shadow : 'normal';
            {
                const value = EH.Utils.parseFiniteNumber(this.get('financeCommissionPercent', EH.Config.FINANCE_COMMISSION_PERCENT), EH.Config.FINANCE_COMMISSION_PERCENT);
                EH.Config.FINANCE_COMMISSION_PERCENT = Math.min(100, Math.max(0, value));
            }
            EH.Config.FINANCE_AUTO_REGISTER = EH.Utils.parseBoolean(this.get('financeAutoRegister', EH.Config.FINANCE_AUTO_REGISTER), EH.Config.FINANCE_AUTO_REGISTER);
            EH.Config.FINANCE_SHOW_CAIXA_SUMMARY = EH.Utils.parseBoolean(this.get('financeShowCaixaSummary', EH.Config.FINANCE_SHOW_CAIXA_SUMMARY), EH.Config.FINANCE_SHOW_CAIXA_SUMMARY);
            EH.Config.FINANCE_ASK_COMPANY_MERCH = EH.Utils.parseBoolean(this.get('financeAskCompanyMerch', EH.Config.FINANCE_ASK_COMPANY_MERCH), EH.Config.FINANCE_ASK_COMPANY_MERCH);
            EH.Config.FINANCE_CONFIRM_DELETE = EH.Utils.parseBoolean(this.get('financeConfirmDelete', EH.Config.FINANCE_CONFIRM_DELETE), EH.Config.FINANCE_CONFIRM_DELETE);

            // Operação / Carros — horário/nome são configuração; Serviço é dado detectado do dia.
            EH.Config.OPERATION_CARS_ENABLED = EH.Utils.parseBoolean(this.get('operationCarsEnabled', EH.Config.OPERATION_CARS_ENABLED), EH.Config.OPERATION_CARS_ENABLED);
            EH.Config.OPERATION_AGENCY_CODE = String(this.get('operationAgencyCode', EH.Config.OPERATION_AGENCY_CODE) || '287').replace(/\D/g, '') || '287';
            EH.Config.OPERATION_SORT_BY_SEAT = EH.Utils.parseBoolean(this.get('operationSortBySeat', EH.Config.OPERATION_SORT_BY_SEAT), EH.Config.OPERATION_SORT_BY_SEAT);
            EH.Config.OPERATION_DOCK_ENABLED = EH.Utils.parseBoolean(this.get('operationDockEnabled', EH.Config.OPERATION_DOCK_ENABLED), EH.Config.OPERATION_DOCK_ENABLED);
            {
                const value = EH.Utils.parseFiniteNumber(this.get('operationTimeToleranceMinutes', EH.Config.OPERATION_TIME_TOLERANCE_MINUTES), EH.Config.OPERATION_TIME_TOLERANCE_MINUTES);
                EH.Config.OPERATION_TIME_TOLERANCE_MINUTES = Math.min(90, Math.max(0, value));
            }
            EH.Config.REMINDER_CREATE_AFTER_TICKET = EH.Utils.parseBoolean(this.get('reminderCreateAfterTicket', EH.Config.REMINDER_CREATE_AFTER_TICKET), EH.Config.REMINDER_CREATE_AFTER_TICKET);
            EH.Config.REMINDER_ASK_AFTER_TICKET = EH.Utils.parseBoolean(this.get('reminderAskAfterTicket', EH.Config.REMINDER_ASK_AFTER_TICKET), EH.Config.REMINDER_ASK_AFTER_TICKET);
            EH.Config.REMINDER_MASK_CPF = EH.Utils.parseBoolean(this.get('reminderMaskCpf', EH.Config.REMINDER_MASK_CPF), EH.Config.REMINDER_MASK_CPF);
            EH.Config.REMINDER_HIGHLIGHT_TODAY = EH.Utils.parseBoolean(this.get('reminderHighlightToday', EH.Config.REMINDER_HIGHLIGHT_TODAY), EH.Config.REMINDER_HIGHLIGHT_TODAY);
            EH.Config.SYNC_PROVIDER = String(this.get('syncProvider', EH.Config.SYNC_PROVIDER) || 'none');
            EH.Config.SYNC_ENABLED = EH.Utils.parseBoolean(this.get('syncEnabled', EH.Config.SYNC_ENABLED), EH.Config.SYNC_ENABLED);
            EH.Config.SYNC_SUPABASE_URL = String(this.get('syncSupabaseUrl', EH.Config.SYNC_SUPABASE_URL) || '').trim();
            EH.Config.SYNC_SUPABASE_KEY = String(this.get('syncSupabaseKey', EH.Config.SYNC_SUPABASE_KEY) || '').trim();
            EH.Config.SYNC_SUPABASE_EMAIL = String(this.get('syncSupabaseEmail', EH.Config.SYNC_SUPABASE_EMAIL) || '').trim();
            EH.Config.SYNC_REMINDERS = EH.Utils.parseBoolean(this.get('syncReminders', EH.Config.SYNC_REMINDERS), EH.Config.SYNC_REMINDERS);
            EH.Config.SYNC_REQUISITIONS = EH.Utils.parseBoolean(this.get('syncRequisitions', EH.Config.SYNC_REQUISITIONS), EH.Config.SYNC_REQUISITIONS);
            EH.Config.SYNC_EMISSION_DATA = EH.Utils.parseBoolean(this.get('syncEmissionData', EH.Config.SYNC_EMISSION_DATA), EH.Config.SYNC_EMISSION_DATA);
            EH.Config.SYNC_SETTINGS = EH.Utils.parseBoolean(this.get('syncSettings', EH.Config.SYNC_SETTINGS), EH.Config.SYNC_SETTINGS);

            const savedRoutines = this.get('operationRoutines', null);
            if (Array.isArray(savedRoutines) && savedRoutines.length) {
                const used = new Set();
                const normalized = savedRoutines.map((item, index) => {
                    const fallback = EH.ConfigDefaults?.OPERATION_ROUTINES?.[index] || {};
                    const time = EH.Utils.clean(item?.operationalTime || fallback.operationalTime || '');
                    const name = EH.Utils.clean(item?.name || fallback.name || '');
                    const rawId = EH.Utils.clean(item?.id || '') || `${time}-${name}-${index}`;
                    const id = EH.Utils.normalize(rawId).replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || `rotina-${index + 1}`;
                    const uniqueId = used.has(id) ? `${id}-${index + 1}` : id;
                    used.add(uniqueId);
                    return {
                        id: uniqueId,
                        name: name || `Carro ${index + 1}`,
                        operationalTime: /^\d{1,2}:\d{2}$/.test(time) ? time.padStart(5, '0') : '',
                        active: item?.active !== undefined
                            ? EH.Utils.parseBoolean(item.active, true)
                            : (fallback.active !== undefined ? EH.Utils.parseBoolean(fallback.active, true) : true),
                        originHint: EH.Utils.clean(item?.originHint || fallback.originHint || ''),
                        destinationHint: EH.Utils.clean(item?.destinationHint || fallback.destinationHint || ''),
                        companyHint: EH.Utils.clean(item?.companyHint || fallback.companyHint || ''),
                        lineHint: EH.Utils.clean(item?.lineHint || fallback.lineHint || '')
                    };
                }).filter(item => item.operationalTime && item.name);
                if (normalized.length) EH.Config.OPERATION_ROUTINES = normalized;
            }

            EH.Config.DEBUG = EH.Utils.parseBoolean(this.get('debug', EH.Config.DEBUG), EH.Config.DEBUG);
        }
    };


    // ============================================================
    // VERSIONAMENTO DOS DADOS — v5.59
    // O namespace de dados é estável e NÃO depende da versão do script.
    // Migrações são sempre não destrutivas.
    // ============================================================
    EH.StorageSchema = {
        META_KEY: 'storage.meta.v1',
        BACKUP_PREFIX: 'storage.backup.pre_v',
        CURRENT_VERSION: Number(EH.Config.STORAGE_SCHEMA_VERSION || 5),

        listNames() {
            try {
                if (typeof GM_listValues === 'function') return GM_listValues() || [];
            } catch (error) {
                EH.Logger.warn('Não foi possível listar o armazenamento do UserScript:', error);
            }
            return [];
        },

        snapshot({ includeEphemeral = false } = {}) {
            const prefix = EH.Config.STORAGE_PREFIX;
            const skip = [
                'waBridge.', 'waAck', 'capturedTickets', 'history.images',
                'operationCars.schedule.currentDom'
            ];
            const values = {};
            this.listNames().forEach(fullKey => {
                if (!String(fullKey).startsWith(prefix)) return;
                const shortKey = String(fullKey).slice(prefix.length);
                if (!includeEphemeral && skip.some(part => shortKey.includes(part))) return;
                if (shortKey.startsWith(this.BACKUP_PREFIX)) return;
                try { values[shortKey] = GM_getValue(fullKey); }
                catch (error) { EH.Logger.debug('Backup: não foi possível ler', shortKey, error); }
            });
            return {
                schemaVersion: this.CURRENT_VERSION,
                scriptVersion: EH.Config.VERSION,
                createdAt: Date.now(),
                values
            };
        },

        backupBeforeMigration(fromVersion) {
            const key = `${this.BACKUP_PREFIX}${this.CURRENT_VERSION}`;
            if (EH.Storage.get(key, null)) return;
            const snapshot = this.snapshot({ includeEphemeral: false });
            snapshot.fromVersion = Number(fromVersion || 0);
            EH.Storage.set(key, snapshot);
        },

        migratePanels() {
            const key = 'panelManager.v1';
            const raw = EH.Storage.get(key, null);
            if (!raw || typeof raw !== 'object') return;
            const next = { ...raw };
            ['main', 'whatsapp', 'operation'].forEach((panelKey, index) => {
                const current = next[panelKey] && typeof next[panelKey] === 'object' ? next[panelKey] : {};
                next[panelKey] = {
                    ...current,
                    handleY: Number.isFinite(Number(current.handleY)) ? Number(current.handleY) : [30, 55, 80][index],
                    allowDrag: current.allowDrag !== undefined ? EH.Utils.parseBoolean(current.allowDrag, true) : true,
                    allowResize: current.allowResize !== undefined ? EH.Utils.parseBoolean(current.allowResize, true) : true
                };
            });
            EH.Storage.set(key, next);
        },

        migrateReminders() {
            const key = 'ticketReminders.v1';
            const raw = EH.Storage.get(key, []);
            if (!Array.isArray(raw)) return;
            let changed = false;
            const deviceId = EH.Device?.id?.() || '';
            const next = raw.map(item => {
                if (!item || typeof item !== 'object') return item;
                const createdAt = Number(item.createdAt || Date.now());
                const updatedAt = Number(item.updatedAt || item.completedAt || createdAt);
                const merged = {
                    ...item,
                    createdAt,
                    updatedAt,
                    deviceId: item.deviceId || deviceId,
                    syncState: item.syncState || 'local'
                };
                if (JSON.stringify(merged) !== JSON.stringify(item)) changed = true;
                return merged;
            });
            if (changed) EH.Storage.set(key, next);
        },

        migrateOperationRoutines() {
            if (Array.isArray(EH.Storage.get('operationRoutines', null)) && EH.Storage.get('operationRoutines', []).length) return;
            const old = EH.Storage.get('operationServices', []);
            const source = Array.isArray(old) ? old : [];
            const preferred = source.filter(item => EH.Utils.parseBoolean(item?.attends, false) || String(item?.operationalTime || '') === '21:30');
            const defaults = JSON.parse(JSON.stringify(EH.ConfigDefaults?.OPERATION_ROUTINES || []));
            const parseName = value => {
                const parts = String(value || '').split(/\s*[→>-]\s*/).map(v => EH.Utils.clean(v)).filter(Boolean);
                return { origin: parts[0] || '', destination: parts[1] || '' };
            };
            const migrated = defaults.map(def => {
                const match = preferred.find(item => String(item?.operationalTime || '') === String(def.operationalTime || '')
                    && EH.Utils.normalize(item?.name || '') === EH.Utils.normalize(def.name || ''));
                if (!match) return def;
                const route = parseName(match.name);
                return {
                    ...def,
                    name: EH.Utils.clean(match.name || def.name),
                    operationalTime: EH.Utils.clean(match.operationalTime || def.operationalTime),
                    active: true,
                    originHint: route.origin || def.originHint,
                    destinationHint: route.destination || def.destinationHint
                };
            });
            EH.Storage.set('operationRoutines', migrated);
            EH.Storage.set('operationTimeToleranceMinutes', EH.Utils.parseFiniteNumber(EH.Config.OPERATION_TIME_TOLERANCE_MINUTES, 20));
        },

        migrateSettingsTypes() {
            const taxes = EH.Storage.get('taxasOrigem', null);
            if (taxes && typeof taxes === 'object' && !Array.isArray(taxes)) {
                const normalized = {};
                Object.entries(taxes).forEach(([key, value]) => {
                    normalized[key] = Math.max(0, EH.Utils.parseMoney(value));
                });
                EH.Storage.set('taxasOrigem', normalized);
            }
            const legacyFee = EH.Storage.get('taxaIpora', undefined);
            if (legacyFee !== undefined) EH.Storage.set('taxaIpora', Math.max(0, EH.Utils.parseMoney(legacyFee)));

            [
                ['aplicarTaxasOrigem', true], ['aplicarTaxaIpora', true],
                ['autoCopyImages', true], ['autoRouteCapture', true],
                ['financeAutoRegister', true], ['financeShowCaixaSummary', true],
                ['financeAskCompanyMerch', true], ['financeConfirmDelete', true],
                ['operationCarsEnabled', true], ['operationSortBySeat', true],
                ['operationDockEnabled', true], ['reminderCreateAfterTicket', true],
                ['reminderAskAfterTicket', true], ['reminderMaskCpf', true],
                ['reminderHighlightToday', true], ['syncEnabled', false], ['debug', false]
            ].forEach(([key, fallback]) => {
                const raw = EH.Storage.get(key, undefined);
                if (raw !== undefined) EH.Storage.set(key, EH.Utils.parseBoolean(raw, fallback));
            });

            const commission = EH.Storage.get('financeCommissionPercent', undefined);
            if (commission !== undefined) {
                EH.Storage.set('financeCommissionPercent', Math.min(100, Math.max(0, EH.Utils.parseFiniteNumber(commission, 10))));
            }
            const tolerance = EH.Storage.get('operationTimeToleranceMinutes', undefined);
            if (tolerance !== undefined) {
                EH.Storage.set('operationTimeToleranceMinutes', Math.min(90, Math.max(0, EH.Utils.parseFiniteNumber(tolerance, 20))));
            }
        },

        migrate() {
            const meta = EH.Storage.get(this.META_KEY, null) || {};
            const fromVersion = Number(meta.schemaVersion || 0);
            if (fromVersion >= this.CURRENT_VERSION) return meta;

            this.backupBeforeMigration(fromVersion);
            // Migrações incrementais: somente acrescentam/normalizam campos.
            this.migratePanels();
            this.migrateReminders();
            this.migrateOperationRoutines();
            this.migrateSettingsTypes();
            EH.BoardingFeeManager?.migrateLegacy?.();
            // v8: a memória persistente de emissões reaproveita a venda temporária
            // sem apagar sessionStorage ou formatos antigos. A migração final acontece
            // depois que todos os módulos já estiverem inicializados.

            const next = {
                schemaVersion: this.CURRENT_VERSION,
                migratedFrom: fromVersion,
                migratedAt: Date.now(),
                scriptVersion: EH.Config.VERSION
            };
            EH.Storage.set(this.META_KEY, next);
            return next;
        },

        exportConfiguration() {
            const keys = [
                'settingsPreset','uiDensity','panelOpacity','panelRadius','shadowLevel',
                'overlaySide','overlayTopOffset','panelCustomWidth','panelHeightPercent',
                'whatsappCustomWidth','whatsappHeightPercent','panelZoom','whatsappDockZoom',
                'captureScale','ticketCaptureWidth','autoRouteCapture','autoCopyImages',
                'aplicarTaxasOrigem','taxasOrigem','boardingFees.v2','messages',
                'financeCommissionPercent','financeAutoRegister','financeShowCaixaSummary',
                'financeAskCompanyMerch','financeConfirmDelete',
                'operationCarsEnabled','operationAgencyCode','operationSortBySeat',
                'operationDockEnabled','operationRoutines','operationTimeToleranceMinutes',
                'reminderCreateAfterTicket','reminderAskAfterTicket','reminderMaskCpf',
                'reminderHighlightToday','panelManager.v1',
                'syncProvider','syncEnabled','syncSupabaseUrl','syncSupabaseKey','syncSupabaseEmail',
                'syncReminders','syncRequisitions','syncEmissionData','syncSettings'
            ];
            const values = {};
            keys.forEach(key => {
                const value = EH.Storage.get(key, undefined);
                if (value !== undefined) values[key] = value;
            });
            return {
                kind: 'epass-helper-settings',
                schemaVersion: this.CURRENT_VERSION,
                scriptVersion: EH.Config.VERSION,
                exportedAt: Date.now(),
                values
            };
        },

        downloadJson(filename, payload) {
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1500);
        },

        importConfiguration(payload) {
            if (!payload || payload.kind !== 'epass-helper-settings' || typeof payload.values !== 'object') {
                throw new Error('Arquivo de configurações inválido.');
            }
            const allowed = new Set(Object.keys(this.exportConfiguration().values).concat([
                'settingsPreset','uiDensity','panelOpacity','panelRadius','shadowLevel',
                'overlaySide','overlayTopOffset','panelCustomWidth','panelHeightPercent',
                'whatsappCustomWidth','whatsappHeightPercent','panelZoom','whatsappDockZoom',
                'captureScale','ticketCaptureWidth','autoRouteCapture','autoCopyImages',
                'aplicarTaxasOrigem','taxasOrigem','boardingFees.v2','messages',
                'financeCommissionPercent','financeAutoRegister','financeShowCaixaSummary',
                'financeAskCompanyMerch','financeConfirmDelete',
                'operationCarsEnabled','operationAgencyCode','operationSortBySeat',
                'operationDockEnabled','operationRoutines','operationTimeToleranceMinutes',
                'reminderCreateAfterTicket','reminderAskAfterTicket','reminderMaskCpf',
                'reminderHighlightToday','panelManager.v1',
                'syncProvider','syncEnabled','syncSupabaseUrl','syncSupabaseKey','syncSupabaseEmail',
                'syncReminders','syncRequisitions','syncEmissionData','syncSettings'
            ]));
            Object.entries(payload.values).forEach(([key, value]) => {
                if (allowed.has(key)) EH.Storage.set(key, value);
            });
            EH.Storage.set(this.META_KEY, {
                schemaVersion: this.CURRENT_VERSION,
                importedAt: Date.now(),
                scriptVersion: EH.Config.VERSION
            });
        }
    };

    EH.Device = {
        KEY: 'device.id.v1',
        id() {
            let id = EH.Storage.get(this.KEY, '');
            if (!id) {
                id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
                EH.Storage.set(this.KEY, id);
            }
            return String(id);
        }
    };


    // ============================================================
    // MEMÓRIA COMUM DO PASSAGEIRO — v5.60
    // Uma identidade reaproveitável entre emissão, requisição, lembrete e mapa.
    // Viagens/bilhetes continuam em seus módulos próprios; CPF não identifica uma viagem.
    // ============================================================
    EH.PassengerMemory = {
        KEY: 'passengerMemory.v1',
        normalizeCpf(value) { return String(value || '').replace(/\D/g, '').slice(0, 11); },
        load() {
            const rows = EH.Storage.get(this.KEY, []);
            return Array.isArray(rows) ? rows : [];
        },
        usefulText(incoming, current = '') {
            const next = EH.Utils.clean(incoming || '');
            const old = EH.Utils.clean(current || '');
            if (!next) return old;
            if (/[*Xx•]{2,}/.test(next) && old && !/[*Xx•]{2,}/.test(old)) return old;
            return next.length >= old.length ? next : old;
        },
        normalize(item = {}) {
            const cpf = this.normalizeCpf(item.cpf);
            return {
                id: item.id || (cpf ? `cpf:${cpf}` : ''),
                cpf,
                name: EH.Utils.clean(item.name || item.nome || ''),
                birthDate: EH.Utils.clean(item.birthDate || item.dataNascimento || ''),
                createdAt: Number(item.createdAt || Date.now()),
                updatedAt: Number(item.updatedAt || Date.now()),
                deviceId: String(item.deviceId || EH.Device.id())
            };
        },
        merge(oldItem = {}, incoming = {}) {
            const old = this.normalize(oldItem);
            const next = this.normalize(incoming);
            return {
                ...old,
                ...next,
                id: next.id || old.id,
                cpf: next.cpf || old.cpf,
                name: this.usefulText(next.name, old.name),
                birthDate: this.usefulText(next.birthDate, old.birthDate),
                createdAt: Math.min(Number(old.createdAt || Date.now()), Number(next.createdAt || Date.now())),
                updatedAt: Math.max(Number(old.updatedAt || 0), Number(next.updatedAt || 0)),
                deviceId: next.deviceId || old.deviceId || EH.Device.id()
            };
        },
        upsert(item = {}, { quiet = true, fromSync = false } = {}) {
            const next = this.normalize(item);
            if (next.cpf.length !== 11) return null;
            const rows = this.load();
            const index = rows.findIndex(row => this.normalizeCpf(row.cpf) === next.cpf);
            const current = index >= 0 ? this.normalize(rows[index]) : null;
            const merged = current ? this.merge(current, next) : { ...next, createdAt: Date.now(), updatedAt: Number(next.updatedAt || Date.now()) };
            const changed = !current || current.name !== merged.name || current.birthDate !== merged.birthDate;
            if (changed && !fromSync) merged.updatedAt = Date.now();
            if (!changed && current) return rows[index];
            if (index >= 0) rows[index] = merged; else rows.push(merged);
            EH.Storage.set(this.KEY, rows.slice(-1500));
            if (!fromSync) EH.Sync?.markPendingRecord?.('passenger', merged.id);
            if (!quiet) EH.Toast?.success?.('Dados do passageiro memorizados.');
            return merged;
        },
        findByCpf(cpf) {
            const digits = this.normalizeCpf(cpf);
            return this.load().find(row => this.normalizeCpf(row.cpf) === digits) || null;
        },
        applyRemote(item = {}) {
            return this.upsert(item, { quiet: true, fromSync: true });
        }
    };

    // ============================================================
    // CICLO DE VIDA / EVENTOS
    // Centraliza listeners e timers para impedir registros duplicados.
    // ============================================================
    EH.Runtime = {
        listeners: new Map(),
        intervals: new Map(),
        timeouts: new Map(),

        on(key, target, type, handler, options) {
            if (!key || !target?.addEventListener || !type || typeof handler !== 'function') return null;
            this.off(key);
            target.addEventListener(type, handler, options);
            this.listeners.set(key, { target, type, handler, options });
            return handler;
        },

        off(key) {
            const item = this.listeners.get(key);
            if (!item) return;
            try { item.target.removeEventListener(item.type, item.handler, item.options); }
            catch (error) { EH.Logger.debug('Listener não pôde ser removido:', key, error); }
            this.listeners.delete(key);
        },

        interval(key, callback, delay) {
            this.clearInterval(key);
            const id = setInterval(callback, delay);
            this.intervals.set(key, id);
            return id;
        },

        clearInterval(key) {
            const id = this.intervals.get(key);
            if (id !== undefined) clearInterval(id);
            this.intervals.delete(key);
        },

        timeout(key, callback, delay) {
            this.clearTimeout(key);
            const id = setTimeout(() => {
                this.timeouts.delete(key);
                callback();
            }, delay);
            this.timeouts.set(key, id);
            return id;
        },

        clearTimeout(key) {
            const id = this.timeouts.get(key);
            if (id !== undefined) clearTimeout(id);
            this.timeouts.delete(key);
        },

        clearAll() {
            Array.from(this.listeners.keys()).forEach(key => this.off(key));
            Array.from(this.intervals.keys()).forEach(key => this.clearInterval(key));
            Array.from(this.timeouts.keys()).forEach(key => this.clearTimeout(key));
        }
    };

    // ============================================================
    // NAVEGAÇÃO ANGULAR
    // Garante atualização de contexto também em pushState/replaceState.
    // ============================================================
    EH.Navigation = {
        started: false,
        EVENT: 'epass-helper-routechange',
        start() {
            if (this.started || EH.WhatsAppBridge?.isWhatsAppHost?.()) return;
            this.started = true;
            ['pushState', 'replaceState'].forEach(method => {
                const original = history[method];
                if (typeof original !== 'function' || original.__ehWrapped) return;
                const wrapped = function (...args) {
                    const result = original.apply(this, args);
                    try { window.dispatchEvent(new Event(EH.Navigation.EVENT)); }
                    catch (error) { EH.Logger.debug('Não foi possível sinalizar navegação Angular:', error); }
                    return result;
                };
                wrapped.__ehWrapped = true;
                history[method] = wrapped;
            });
        }
    };

    // ============================================================
    // ESTADO GLOBAL DA INTERFACE
    // Um único estado decide expansão/recolhimento dos dois painéis.
    // ============================================================
    EH.State = {
        loaded: false,
        panels: {
            leftOpen: false,
            rightOpen: true
        },

        load() {
            if (this.loaded) return this.panels;
            this.panels.leftOpen = !EH.Utils.parseBoolean(EH.Storage.get('collapsed', true), true);
            this.panels.rightOpen = !EH.Utils.parseBoolean(EH.Storage.get('waDockCollapsed', false), false);
            this.loaded = true;
            return this.panels;
        },

        isOpen(panel) {
            this.load();
            return panel === 'right' ? this.panels.rightOpen : this.panels.leftOpen;
        },

        setPanel(panel, open, { persist = true } = {}) {
            this.load();
            const value = Boolean(open);
            if (panel === 'left') {
                this.panels.leftOpen = value;
                if (persist) {
                    EH.Storage.set('collapsed', !value);
                    EH.Storage.set('minimized', !value);
                }
            } else if (panel === 'right') {
                this.panels.rightOpen = value;
                if (persist) EH.Storage.set('waDockCollapsed', !value);
            } else {
                return;
            }
            EH.Layout?.sync?.();
        },

        snapshot() {
            this.load();
            return { ...this.panels };
        }
    };

    // ============================================================
    // MENSAGENS AUTOMÁTICAS
    // ============================================================
    EH.Messages = {
        get(type) {
            return String(EH.Config.MESSAGES?.[type] || '').trim();
        },
        setAll(messages) {
            EH.Config.MESSAGES = { ...EH.Config.MESSAGES, ...messages };
            EH.Storage.set('messages', EH.Config.MESSAGES);
        }
    };

    // ============================================================
    // ROTAS FAVORITAS
    // ============================================================
    EH.Routes = {
        defaults: [
            {
                id: 'arenopolis-goiania',
                origem: 'ARENOPOLIS - GO',
                destino: 'GOIANIA - GO',
                observacao: 'Passa por Iporá, Israelândia, São Luís de Montes Belos e Firminópolis. Viagem da madrugada deve ser comprada antecipadamente. Compra na agência até as 18:00.'
            },
            {
                id: 'arenopolis-barra',
                origem: 'ARENOPOLIS - GO',
                destino: 'BARRA DO GARCAS - MT',
                observacao: 'Passa por Piranhas, Bom Jardim e Aragarças. Viagem da madrugada deve ser comprada antecipadamente. Compra na agência até as 18:00.'
            },
            {
                id: 'goiania-ipora',
                origem: 'GOIANIA - GO',
                destino: 'IPORA - GO',
                observacao: ''
            },
            {
                id: 'goiania-brasilia',
                origem: 'GOIANIA - GO',
                destino: 'BRASILIA - DF',
                observacao: ''
            }
        ],

        getAll() {
            const saved = EH.Storage.get('favoriteRoutes', null);
            if (Array.isArray(saved) && saved.length) return saved;
            EH.Storage.set('favoriteRoutes', this.defaults);
            return this.defaults.map(item => ({ ...item }));
        },

        saveAll(routes) {
            const clean = (Array.isArray(routes) ? routes : [])
                .filter(route => route && route.origem && route.destino)
                .map((route, index) => ({
                    id: route.id || `rota-${Date.now()}-${index}`,
                    origem: String(route.origem).trim(),
                    destino: String(route.destino).trim(),
                    observacao: String(route.observacao || '').trim()
                }));
            EH.Storage.set('favoriteRoutes', clean);
            return clean;
        },

        async selectNgValue(selectors, wantedText) {
            const host = EH.Utils.first(selectors);
            if (!host) throw new Error('Não encontrei o campo de origem/destino nesta tela.');

            host.scrollIntoView({ block: 'center', behavior: 'smooth' });
            const clear = host.querySelector('.ng-clear-wrapper');
            if (clear) {
                clear.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                await EH.Utils.sleep(120);
            }

            host.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            host.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await EH.Utils.sleep(150);

            const input = host.querySelector('input[role="combobox"], input[type="text"]')
                || document.querySelector('.ng-dropdown-panel input[role="combobox"], .ng-dropdown-panel input[type="text"]');
            if (!input) throw new Error('Não encontrei o campo de busca da cidade.');

            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
            if (setter) setter.call(input, wantedText);
            else input.value = wantedText;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.focus();

            let options = [];
            for (let attempt = 0; attempt < 12; attempt += 1) {
                await EH.Utils.sleep(120);
                options = Array.from(document.querySelectorAll('.ng-dropdown-panel .ng-option:not(.disabled)'));
                if (options.length) break;
            }

            const target = EH.Utils.normalize(wantedText);
            const baseCity = target.replace(/\s*-\s*[A-Z]{2}\s*$/, '').trim();
            let option = options.find(item => EH.Utils.normalize(item.textContent) === target)
                || options.find(item => EH.Utils.normalize(item.textContent).includes(target))
                || options.find(item => EH.Utils.normalize(item.textContent).includes(baseCity));

            if (!option && baseCity && baseCity !== target) {
                if (setter) setter.call(input, baseCity);
                else input.value = baseCity;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await EH.Utils.sleep(300);
                options = Array.from(document.querySelectorAll('.ng-dropdown-panel .ng-option:not(.disabled)'));
                option = options.find(item => EH.Utils.normalize(item.textContent).includes(target))
                    || options.find(item => EH.Utils.normalize(item.textContent).includes(baseCity));
            }

            if (!option) {
                throw new Error(`Não encontrei “${wantedText}” na lista do E-Pass.`);
            }

            option.scrollIntoView({ block: 'nearest' });
            option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            option.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await EH.Utils.sleep(160);
        },

        isSearchPage() {
            return location.pathname.includes('/vendas/pesquisa')
                || Boolean(EH.Utils.first(EH.Selectors.ORIGEM_SELECT) && EH.Utils.first(EH.Selectors.DESTINO_SELECT));
        },

        findSearchButton() {
            const origem = EH.Utils.first(EH.Selectors.ORIGEM_SELECT);
            const destino = EH.Utils.first(EH.Selectors.DESTINO_SELECT);
            const form = origem?.closest('form') || destino?.closest('form') || document.querySelector('app-pesquisa form');
            if (!form) return null;
            return Array.from(form.querySelectorAll('button, input[type="submit"]')).find(element => {
                if (element.disabled) return false;
                const type = String(element.getAttribute('type') || '').toLowerCase();
                const label = EH.Utils.normalize(element.textContent || element.value || element.title || '');
                return type === 'submit' || /PESQUISAR|BUSCAR|CONSULTAR/.test(label);
            }) || null;
        },

        async searchAndCapture(route, autoCapture = true) {
            const oldTable = EH.Utils.first(EH.Selectors.TABLE_HORARIOS);
            const oldFingerprint = oldTable ? EH.Utils.clean(oldTable.innerText).slice(0, 1400) : '';
            let changed = false;
            const observerTarget = oldTable?.parentElement || document.querySelector('app-pesquisa') || document.body;
            const localObserver = new MutationObserver(() => { changed = true; });
            try { localObserver.observe(observerTarget, { childList: true, subtree: true, characterData: true }); }
            catch (error) { EH.Logger.debug('Observer local da pesquisa não pôde ser iniciado:', error); }

            try {
                const button = this.findSearchButton();
                if (!button) throw new Error('Não encontrei o botão Pesquisar da consulta.');
                EH.Toast.info('Rota preenchida. Pesquisando horários…');
                button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

                const startedAt = Date.now();
                const table = await EH.Utils.waitFor(() => {
                    const current = EH.Utils.first(EH.Selectors.TABLE_HORARIOS);
                    if (!current) return null;
                    const rows = current.querySelectorAll('tbody tr');
                    if (!rows.length) return null;
                    const fp = EH.Utils.clean(current.innerText).slice(0, 1400);
                    const elapsed = Date.now() - startedAt;
                    if (!oldFingerprint || fp !== oldFingerprint || changed || elapsed > 2600) return current;
                    return null;
                }, 14000, 180);
                if (!table || !table.querySelectorAll('tbody tr').length) {
                    throw new Error('A pesquisa foi feita, mas não encontrei horários para capturar.');
                }
                EH.Workflow?.setStage('horarios');
                await EH.Utils.sleep(220);
                if (!autoCapture) {
                    EH.Toast.success('Horários pesquisados.');
                    return { table };
                }
                return EH.UI.captureAction('pesquisa', { automatic: true, showPreview: 'ifFailed' });
            } finally {
                localObserver.disconnect();
            }
        },

        async apply(route, options = {}) {
            if (!route) return;
            const opts = { autoSearch: false, autoCapture: EH.Config.AUTO_ROUTE_CAPTURE, ...options };
            EH.Storage.set('pendingRoute', { route, options: opts });
            if (!this.isSearchPage()) {
                location.href = `${location.origin}/epass/vendas/pesquisa`;
                return;
            }

            await this.selectNgValue(EH.Selectors.ORIGEM_SELECT, route.origem);
            await this.selectNgValue(EH.Selectors.DESTINO_SELECT, route.destino);
            EH.Storage.remove('pendingRoute');
            EH.Toast.success(`${route.origem} → ${route.destino} preenchido.`);
            if (route.observacao) EH.Storage.set('lastRouteObservation', route.observacao);
            EH.Workflow?.setRoute(route);

            if (opts.autoSearch) {
                await this.searchAndCapture(route, opts.autoCapture);
            }
        },

        async applyPending() {
            if (!this.isSearchPage()) return;
            const pending = EH.Storage.get('pendingRoute', null);
            const route = pending?.route || pending;
            const options = pending?.options || {};
            if (!route?.origem || !route?.destino) return;
            try {
                await EH.Utils.sleep(450);
                await this.apply(route, options);
            } catch (error) {
                EH.Storage.remove('pendingRoute');
                EH.Logger.warn('Não foi possível aplicar a rota pendente:', error);
                EH.Toast.error(error.message || 'Não foi possível usar a rota automática.');
            }
        }
    };

    // ============================================================
    // HISTÓRICO LOCAL DAS CAPTURAS
    // ============================================================
    EH.History = {
        indexKey: 'captureHistoryIndex',

        list() {
            const index = EH.Storage.get(this.indexKey, []);
            return Array.isArray(index) ? index : [];
        },

        get(id) {
            const meta = this.list().find(item => item.id === id);
            if (!meta) return null;
            const dataUrl = EH.Storage.get(`captureImage.${id}`, '');
            return dataUrl ? { ...meta, dataUrl } : null;
        },

        add(entry) {
            if (!entry?.dataUrl) return null;
            const id = `cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const meta = {
                id,
                type: entry.type || 'imagem',
                filename: entry.filename || 'epass.png',
                message: String(entry.message || ''),
                text: String(entry.text || ''),
                summaryText: String(entry.summaryText || ''),
                summary: String(entry.summary || entry.filename || 'Captura do E-Pass'),
                createdAt: new Date().toISOString(),
                size: entry.dataUrl.length
            };

            let index = [meta, ...this.list().filter(item => item.id !== id)];
            EH.Storage.set(`captureImage.${id}`, entry.dataUrl);

            while (index.length > EH.Config.HISTORY_LIMIT || index.reduce((sum, item) => sum + (Number(item.size) || 0), 0) > EH.Config.HISTORY_MAX_CHARS) {
                const removed = index.pop();
                if (removed) EH.Storage.remove(`captureImage.${removed.id}`);
            }
            EH.Storage.set(this.indexKey, index);
            return meta;
        },

        remove(id) {
            const index = this.list().filter(item => item.id !== id);
            EH.Storage.set(this.indexKey, index);
            EH.Storage.remove(`captureImage.${id}`);
        },

        clear() {
            this.list().forEach(item => EH.Storage.remove(`captureImage.${item.id}`));
            EH.Storage.set(this.indexKey, []);
        },

        latest() {
            const first = this.list()[0];
            return first ? this.get(first.id) : null;
        }
    };

    // ============================================================
    // UTILITÁRIOS
    // ============================================================
    EH.Utils = {
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        normalize(text) {
            return String(text || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .toUpperCase();
        },
        clean(text) {
            return String(text || '').replace(/\s+/g, ' ').trim();
        },
        getTaxaOrigem(origem) {
            if (EH.BoardingFeeManager?.find) return EH.BoardingFeeManager.find(origem);
            const normalized = this.normalize(origem)
                .replace(/(^|\s)[A-Z]{2}(?=\s|$)/g, ' ')
                .replace(/\s+-\s+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            const taxas = EH.Config.TAXAS_ORIGEM || {};
            for (const [nome, valor] of Object.entries(taxas)) {
                if (!nome) continue;
                const nomeNormalizado = this.normalize(nome);
                if (normalized.includes(nomeNormalizado)) {
                    return { nome, city:nome, uf:'', valor: Math.max(0, this.parseMoney(valor)), found:true };
                }
            }
            return { nome: '', city:'', uf:'', valor: 0, found:false };
        },
        first(selectors, root = document) {
            const list = Array.isArray(selectors) ? selectors : [selectors];
            for (const selector of list) {
                try {
                    const element = root.querySelector(selector);
                    if (element) return element;
                } catch (error) {
                    EH.Logger.debug('Seletor inválido:', selector, error);
                }
            }
            return null;
        },
        all(selector, root = document) {
            try {
                return Array.from(root.querySelectorAll(selector));
            } catch (error) {
                return [];
            }
        },
        text(element) {
            return this.clean(element ? element.textContent : '');
        },
        extractTime(text) {
            const match = String(text || '').match(/\b([01]\d|2[0-3]):[0-5]\d\b/);
            return match ? match[0] : '';
        },
        timeToMinutes(time) {
            const match = String(time || '').match(/^(\d{1,2}):(\d{2})$/);
            if (!match) return Number.MAX_SAFE_INTEGER;
            const minutes = Number(match[1]) * 60 + Number(match[2]);
            return minutes < EH.Config.SORT_DAY_START_MINUTES ? minutes + 1440 : minutes;
        },
        parseBoolean(value, fallback = false) {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'number') return Number.isFinite(value) ? value !== 0 : Boolean(fallback);
            if (value === null || value === undefined || value === '') return Boolean(fallback);
            const normalized = this.normalize(value);
            if (['TRUE', '1', 'SIM', 'YES', 'ON', 'ATIVO'].includes(normalized)) return true;
            if (['FALSE', '0', 'NAO', 'NÃO', 'NO', 'OFF', 'INATIVO'].includes(normalized)) return false;
            return Boolean(fallback);
        },
        parseMoneyStrict(text) {
            if (typeof text === 'number') return Number.isFinite(text) ? text : null;
            let raw = String(text ?? '')
                .trim()
                .replace(/\s/g, '')
                .replace(/R\$/gi, '')
                .replace(/[^\d,.-]/g, '');

            if (!raw || !/[\d]/.test(raw)) return null;

            const negative = raw.startsWith('-');
            raw = raw.replace(/-/g, '');

            let normalized = raw;
            if (raw.includes(',')) {
                // Formato brasileiro: 1.234,56 / 106,00
                normalized = raw.replace(/\./g, '').replace(',', '.');
            } else {
                const dots = (raw.match(/\./g) || []).length;
                if (dots > 1) {
                    // Ex.: 1.234.567.89 -> último grupo de 2 dígitos é decimal;
                    // caso contrário, pontos são separadores de milhar.
                    const parts = raw.split('.');
                    const tail = parts[parts.length - 1];
                    normalized = tail.length === 2
                        ? `${parts.slice(0, -1).join('')}.${tail}`
                        : parts.join('');
                } else if (dots === 1) {
                    const [head, tail] = raw.split('.');
                    // 106.00 = decimal; 1.234 = milhar.
                    normalized = tail.length === 3 && head.length <= 3 ? `${head}${tail}` : raw;
                }
            }

            const number = Number.parseFloat(normalized);
            if (!Number.isFinite(number)) return null;
            return negative ? -number : number;
        },
        parseMoney(text) {
            const value = this.parseMoneyStrict(text);
            return value === null ? 0 : value;
        },
        parseFiniteNumber(value, fallback = 0) {
            if (typeof value === 'number') return Number.isFinite(value) ? value : Number(fallback) || 0;
            const parsed = this.parseMoneyStrict(value);
            return parsed === null ? (Number.isFinite(Number(fallback)) ? Number(fallback) : 0) : parsed;
        },
        formatMoney(value) {
            const parsed = typeof value === 'number' ? value : this.parseMoneyStrict(value);
            const number = Number.isFinite(parsed) ? parsed : 0;
            return number.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2
            });
        },
        formatDate(value) {
            const text = this.clean(value);
            if (!text) return '';

            let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) return `${match[3]}/${match[2]}/${match[1]}`;

            match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
            if (match) return `${match[1]}/${match[2]}/${match[3]}`;

            return text;
        },
        mapLine(value) {
            const clean = this.clean(value);
            const normalized = this.normalize(clean);
            if (EH.Config.LINHAS[normalized]) return this.prettifyWords(EH.Config.LINHAS[normalized]);

            const sigla = normalized.match(/\b(MA|JO|NH)\b/);
            if (sigla) return this.prettifyWords(EH.Config.LINHAS[sigla[1]]);

            return this.prettifyWords(clean);
        },
        prettifyWords(value) {
            return this.clean(value)
                .replace(/EXPRESSOMAIA/gi, 'EXPRESSO MAIA')
                .replace(/NOVOHORIZONTE/gi, 'NOVO HORIZONTE')
                .replace(/CONVENCIONALCOM/gi, 'CONVENCIONAL COM ')
                .replace(/EXECUTIVOCOM/gi, 'EXECUTIVO COM ')
                .replace(/LEITOCOM/gi, 'LEITO COM ')
                .replace(/COMSANITARIO/gi, 'COM SANITARIO')
                .replace(/DOUBLEDECK/gi, 'DOUBLE DECK')
                .replace(/DOISANDARES/gi, 'DOIS ANDARES')
                .replace(/BARRADOGARCAS/gi, 'BARRA DO GARCAS')
                .replace(/SAOLUIS/gi, 'SAO LUIS')
                .replace(/(\d)([A-ZÁÀÃÂÉÊÍÓÔÕÚÇ])/g, '$1 $2')
                .replace(/([A-ZÁÀÃÂÉÊÍÓÔÕÚÇ])(\d)/g, '$1 $2')
                .replace(/\s*-\s*/g, ' - ')
                .replace(/\s+/g, ' ')
                .trim();
        },
        extractVehicleType(typeText, fullValueText) {
            let base = this.clean(typeText);
            if (!base) {
                base = this.clean(String(fullValueText || '').replace(/R\$\s*[\d.,]+/gi, ''));
            }
            if (!base) return '';
            return this.prettifyWords(base)
                .toUpperCase()
                .replace(/CONVENCIONAL\s+COM\s+SANITARIO/gi, 'CONVENCIONAL COM SANITARIO')
                .replace(/EXECUTIVO\s+COM\s+SANITARIO/gi, 'EXECUTIVO COM SANITARIO')
                .replace(/LEITO\s+COM\s+SANITARIO/gi, 'LEITO COM SANITARIO')
                .replace(/DOUBLE\s+DECK/gi, 'DOUBLE DECK')
                .replace(/DOIS\s+ANDARES/gi, 'DOIS ANDARES')
                .replace(/\s*\(\s*/g, ' (')
                .replace(/\s*\)\s*/g, ') ')
                .replace(/\s+/g, ' ')
                .trim();
        },
        formatVehicleTypeLines(value) {
            const text = this.extractVehicleType(value, value);
            if (!text) return [];
            if (text.includes(' - DOIS ANDARES')) {
                const parts = text.split(/\s*-\s*DOIS ANDARES\s*/i);
                const first = parts[0]?.trim();
                const secondTail = text.match(/DOIS ANDARES.*$/i)?.[0]?.trim();
                return [first, secondTail].filter(Boolean).map(line => this.stabilizeDisplayText(line));
            }
            return [this.stabilizeDisplayText(text)];
        },
        stabilizeDisplayText(value) {
            return String(value || '')
                .replace(/\s+/g, ' ')
                .trim()
                .replace(/ /g, ' ');
        },
        unique(values) {
            return [...new Set(values.filter(Boolean))];
        },
        sortSeats(values) {
            const order = new Map(EH.OrdemPoltronas.map((seat, index) => [String(seat), index]));
            return this.unique(values.map(value => this.clean(value))).sort((a, b) => {
                const ia = order.has(a) ? order.get(a) : Number.MAX_SAFE_INTEGER;
                const ib = order.has(b) ? order.get(b) : Number.MAX_SAFE_INTEGER;
                if (ia !== ib) return ia - ib;
                return (Number(a) || 9999) - (Number(b) || 9999) || a.localeCompare(b);
            });
        },
        safeFilePart(value) {
            return this.normalize(value)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 45) || 'epass';
        },
        async waitForImages(root) {
            const images = this.all('img', root);
            await Promise.all(images.map(image => {
                if (image.complete) return Promise.resolve();
                return new Promise(resolve => {
                    let safetyTimer = null;
                    const finish = () => {
                        if (safetyTimer !== null) clearTimeout(safetyTimer);
                        resolve();
                    };
                    image.addEventListener('load', finish, { once: true });
                    image.addEventListener('error', finish, { once: true });
                    safetyTimer = setTimeout(finish, 4000);
                });
            }));
        },
        async waitFor(predicate, timeout = 12000, interval = 180) {
            const started = Date.now();
            let lastError = null;
            while (Date.now() - started < timeout) {
                try {
                    const value = predicate();
                    if (value) return value;
                } catch (error) {
                    lastError = error;
                }
                await this.sleep(interval);
            }
            if (lastError) EH.Logger.debug('waitFor:', lastError);
            return null;
        },
        debounce(fn, wait = 250) {
            let timer = null;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn(...args), wait);
            };
        }
    };


    // ============================================================
    // TAXAS DE EMBARQUE POR ORIGEM — v5.60
    // Cidade + UF são a chave. Acentos/espaços/hífens não afetam a comparação.
    // ============================================================
    EH.BoardingFeeManager = {
        KEY: 'boardingFees.v2',
        knownUfs: {
            IPORA:'GO', GOIANIA:'GO', ARENOPOLIS:'GO', ARAGARCAS:'GO',
            'SAO LUIS DE MONTES BELOS':'GO', 'BARRA DO GARCAS':'MT'
        },
        parsePlace(value = '') {
            const raw = EH.Utils.clean(value || '').replace(/\s+-\s+\d+\s*$/, '');
            const displayMatch = raw.match(/^(.*?)\s*-\s*([A-Za-z]{2})$/);
            if (displayMatch) {
                return { city:EH.Utils.clean(displayMatch[1]), uf:String(displayMatch[2]||'').toUpperCase(), raw };
            }
            return { city:raw, uf:'', raw };
        },
        key(city, uf = '') {
            const c = EH.Utils.normalize(city || '').replace(/\s+/g, ' ').trim();
            const u = EH.Utils.normalize(uf || '').replace(/[^A-Z]/g, '').slice(0,2);
            return `${c}|${u}`;
        },
        normalizeEntry(item = {}) {
            const place = this.parsePlace(item.city || item.nome || item.name || item.localidade || '');
            const city = place.city;
            const uf = EH.Utils.normalize(item.uf || place.uf || this.knownUfs[EH.Utils.normalize(city)] || '').replace(/[^A-Z]/g,'').slice(0,2);
            const value = Math.max(0, EH.Utils.parseMoney(item.value ?? item.valor ?? item.taxa ?? 0));
            return { id:this.key(city,uf), city, uf, value, label:[city,uf].filter(Boolean).join(' - ') };
        },
        legacyDefaults() {
            return Object.entries(EH.Config.TAXAS_ORIGEM || {}).map(([city,value]) => this.normalizeEntry({city,uf:this.knownUfs[EH.Utils.normalize(city)]||'',value}));
        },
        load() {
            const saved = EH.Storage.get(this.KEY, null);
            const source = Array.isArray(saved) ? saved : this.legacyDefaults();
            const map = new Map();
            source.forEach(item => {
                const row = this.normalizeEntry(item);
                if (row.city) map.set(row.id, row);
            });
            return Array.from(map.values()).sort((a,b)=>a.label.localeCompare(b.label,'pt-BR'));
        },
        save(rows = [], { fromSync = false } = {}) {
            const map = new Map();
            (Array.isArray(rows)?rows:[]).forEach(item => { const row=this.normalizeEntry(item); if(row.city) map.set(row.id,row); });
            const safe = Array.from(map.values()).sort((a,b)=>a.label.localeCompare(b.label,'pt-BR'));
            EH.Storage.set(this.KEY, safe);
            if (!fromSync) EH.Storage.set('boardingFees.updatedAt', Date.now());
            // Compatibilidade: módulos antigos que ainda consultem TAXAS_ORIGEM veem os mesmos valores.
            EH.Config.TAXAS_ORIGEM = Object.fromEntries(safe.map(row => [row.city, row.value]));
            EH.Storage.set('taxasOrigem', EH.Config.TAXAS_ORIGEM);
            if (!fromSync) EH.Sync?.markPendingRecord?.('config', 'boarding-fees');
            return safe;
        },
        find(origin) {
            const place = this.parsePlace(origin);
            const rows = this.load();
            const exact = rows.find(row => this.key(row.city,row.uf) === this.key(place.city,place.uf));
            const cityOnly = rows.filter(row => this.key(row.city,'') === this.key(place.city,''));
            const chosen = exact || (cityOnly.length === 1 ? cityOnly[0] : null);
            if (!chosen) {
                EH.Logger?.trace?.('Tarifa', `Sem taxa para ${[place.city,place.uf].filter(Boolean).join(' - ') || 'origem não identificada'}`);
                return { nome:'', city:place.city, uf:place.uf, valor:0, found:false };
            }
            return { nome:chosen.label, city:chosen.city, uf:chosen.uf, valor:chosen.value, found:true };
        },
        upsert(city, uf, value) {
            const row = this.normalizeEntry({city,uf,value});
            if (!row.city) throw new Error('Informe a cidade da origem.');
            if (!row.uf || row.uf.length !== 2) throw new Error('Informe a UF com 2 letras.');
            const rows = this.load();
            const index = rows.findIndex(item => item.id === row.id);
            if (index >= 0) rows[index] = row; else rows.push(row);
            return this.save(rows);
        },
        remove(id) { return this.save(this.load().filter(row => row.id !== id)); },
        migrateLegacy() {
            const saved = EH.Storage.get(this.KEY, null);
            if (Array.isArray(saved)) { this.save(saved, {fromSync:true}); return; }
            this.save(this.legacyDefaults(), {fromSync:true});
        }
    };

    // ============================================================
    // VALORES / TARIFAS — FONTE ÚNICA PARA HORÁRIOS
    // Mantém valor-base, taxa e valor final separados.
    // ============================================================
    EH.Fares = {
        round(value) {
            const number = Number(value);
            return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
        },

        calculate(baseValue, origem, { applyFee = EH.Config.APLICAR_TAXAS_ORIGEM } = {}) {
            const parsedBase = EH.Utils.parseMoneyStrict(baseValue);
            if (parsedBase === null || parsedBase < 0) {
                return {
                    success: false,
                    error: 'Valor base inválido.',
                    valorBaseNum: 0,
                    taxaEmbarqueNum: 0,
                    valorFinalNum: 0,
                    taxaOrigem: ''
                };
            }
            const feeInfo = applyFee ? EH.Utils.getTaxaOrigem(origem) : { nome: '', valor: 0 };
            const taxa = Math.max(0, EH.Utils.parseMoney(feeInfo?.valor));
            const base = this.round(parsedBase);
            const final = this.round(base + taxa);
            return {
                success: true,
                error: '',
                valorBaseNum: base,
                taxaEmbarqueNum: taxa,
                valorFinalNum: final,
                taxaOrigem: feeInfo?.found ? EH.Utils.clean(feeInfo?.nome || '') : '',
                valorBase: base > 0 ? EH.Utils.formatMoney(base) : '',
                taxaEmbarque: taxa > 0 ? EH.Utils.formatMoney(taxa) : '',
                valorFinal: final > 0 ? EH.Utils.formatMoney(final) : ''
            };
        },

        finalNumber(item) {
            const candidates = [item?.valorFinalNum, item?.precoNum, item?.valorBaseNum];
            for (const value of candidates) {
                const number = Number(value);
                if (Number.isFinite(number) && number > 0) return this.round(number);
            }
            return 0;
        },

        display(item, fallback = '') {
            const number = this.finalNumber(item);
            return number > 0 ? EH.Utils.formatMoney(number) : fallback;
        }
    };

    // ============================================================
    // PONTE COM WHATSAPP WEB
    // O mesmo userscript roda no E-Pass e no WhatsApp Web. A comunicação
    // entre as abas usa o armazenamento compartilhado do Tampermonkey.
    // ============================================================
    EH.WhatsAppBridge = {
        COMMAND_TTL: 2 * 60 * 1000,
        HEARTBEAT_TTL: 18 * 1000,
        heartbeatTimer: null,
        listenerId: null,
        uiObserver: null,
        uiTimer: null,
        receiverStarted: false,
        lastUiHash: '',

        isWhatsAppHost() {
            return String(location.hostname || '').toLowerCase() === 'web.whatsapp.com';
        },

        probeConnection() {
            if (!this.isWhatsAppHost()) {
                return { state: 'disconnected', ready: false, reason: 'not-whatsapp-host' };
            }
            const sidebar = this.findChatSidebar();
            const main = this.findConversationMain();
            const composer = Array.from(document.querySelectorAll('footer [contenteditable="true"], [data-tab][contenteditable="true"], div[contenteditable="true"][role="textbox"]'))
                .find(el => {
                    const rect = el.getBoundingClientRect?.();
                    return rect && rect.width > 40 && rect.height > 15;
                }) || null;

            if (sidebar || main || composer) {
                return {
                    state: 'connected',
                    ready: true,
                    sidebar: Boolean(sidebar),
                    conversation: Boolean(main),
                    composer: Boolean(composer)
                };
            }
            const qrLike = document.querySelector('[data-testid*="qrcode" i], canvas[aria-label*="qr" i], [aria-label*="qr code" i]');
            const bodyText = qrLike ? '' : this.cleanText(document.body?.innerText || '').slice(0, 6000).toLocaleLowerCase('pt-BR');
            const loginLike = Boolean(qrLike) || /escaneie|scan.*qr|vincular dispositivo|link a device|use whatsapp on your phone/i.test(bodyText);
            if (loginLike) return { state: 'disconnected', ready: false, reason: 'login-required' };
            return { state: 'loading', ready: false, reason: 'ui-loading' };
        },

        heartbeat(online = true) {
            const probe = online ? this.probeConnection() : { state: 'disconnected', ready: false, reason: 'page-hidden' };
            EH.Storage.set('waHeartbeat', {
                online: Boolean(online),
                at: online ? Date.now() : 0,
                href: online ? location.href : '',
                phase: probe.state,
                ready: Boolean(probe.ready),
                probe
            });
        },

        getConnectionStatus() {
            const hb = EH.Storage.get('waHeartbeat', null);
            const fresh = Boolean(hb?.online && hb?.at && (Date.now() - Number(hb.at)) < this.HEARTBEAT_TTL);
            if (!fresh) {
                return { state: 'disconnected', connected: false, readyToSend: false, label: '🔴 WhatsApp desconectado' };
            }
            const phase = String(hb?.phase || (hb?.ready ? 'connected' : 'loading'));
            if (phase === 'loading') {
                return { state: 'loading', connected: false, readyToSend: false, label: '🟡 Conectando…' };
            }
            if (phase !== 'connected') {
                return { state: 'disconnected', connected: false, readyToSend: false, label: '🔴 WhatsApp desconectado' };
            }
            const state = this.getUiState();
            const hasChat = Boolean(String(state?.active?.title || '').trim());
            return hasChat
                ? { state: 'ready', connected: true, readyToSend: true, label: '🟢 WhatsApp conectado' }
                : { state: 'no-chat', connected: true, readyToSend: false, label: '⚠️ Selecione uma conversa' };
        },

        isOnline() {
            return Boolean(this.getConnectionStatus().connected);
        },

        getUiState() {
            return EH.Storage.get('waUiState', null) || { chats: [], active: null, messages: [], connection: null, at: 0 };
        },

        makeCommand({ action = 'prepare', phone = '', chatTitle = '', message = '', message2 = '', imageDataUrl = '', filename = '', target = 'web' } = {}) {
            return {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                createdAt: Date.now(),
                action,
                target,
                phone: String(phone || '').replace(/\D/g, ''),
                chatTitle: String(chatTitle || '').trim(),
                message: String(message || ''),
                message2: String(message2 || ''),
                imageDataUrl: String(imageDataUrl || ''),
                filename: String(filename || 'epass-atendimento.png')
            };
        },

        send(command) {
            EH.Storage.set('waCommand', command);
            return command;
        },

        parseStored(rawValue) {
            if (!rawValue) return null;
            try {
                return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
            } catch (error) {
                return null;
            }
        },

        cleanText(value) {
            return String(value || '').replace(/\u200e|\u200f/g, '').replace(/\s+/g, ' ').trim();
        },

        findChatSidebar() {
            return document.querySelector('#pane-side, [aria-label*="lista de conversas" i], [aria-label*="chat list" i]') || null;
        },

        findConversationMain() {
            return document.querySelector('#main, [data-testid="conversation-panel-wrapper"]') || null;
        },

        chatRows() {
            const side = this.findChatSidebar();
            if (!side) return [];
            const rows = [];
            const seen = new Set();
            const titleEls = Array.from(side.querySelectorAll('span[title]'));
            for (const titleEl of titleEls) {
                const title = this.cleanText(titleEl.getAttribute('title') || titleEl.textContent);
                if (!title) continue;
                let row = titleEl.closest('[role="row"]');
                if (!row) {
                    row = titleEl;
                    for (let i = 0; i < 7 && row?.parentElement; i += 1) {
                        row = row.parentElement;
                        const rect = row.getBoundingClientRect?.();
                        if (rect && rect.width > 180 && rect.height >= 44 && rect.height <= 110) break;
                    }
                }
                if (!(row instanceof HTMLElement) || seen.has(row)) continue;
                const rect = row.getBoundingClientRect();
                if (rect.width < 120 || rect.height < 30) continue;
                seen.add(row);
                rows.push({ row, titleEl, title });
            }
            return rows;
        },

        collectChats() {
            const rows = this.chatRows();
            const chats = [];
            const used = new Set();
            for (const item of rows) {
                const key = item.title.toLocaleLowerCase('pt-BR');
                if (used.has(key)) continue;
                used.add(key);
                const lines = String(item.row.innerText || '')
                    .split(/\n+/)
                    .map(line => this.cleanText(line))
                    .filter(Boolean);
                const preview = lines.find(line => line !== item.title && !/^\d{1,2}:\d{2}$/.test(line) && !/^(ontem|yesterday|hoje|today)$/i.test(line)) || '';
                const unreadEl = item.row.querySelector('[aria-label*="não lida" i], [aria-label*="nao lida" i], [aria-label*="unread" i]');
                const unreadText = this.cleanText(unreadEl?.getAttribute('aria-label') || unreadEl?.textContent || '');
                const unreadMatch = unreadText.match(/\d+/);
                chats.push({
                    id: item.title,
                    title: item.title,
                    preview: preview.slice(0, 120),
                    unread: unreadMatch ? Number(unreadMatch[0]) : 0
                });
                if (chats.length >= 32) break;
            }
            return chats;
        },

        collectActiveConversation() {
            const main = this.findConversationMain();
            if (!main) return { active: null, messages: [] };
            const header = main.querySelector('header') || main;
            const titleEl = Array.from(header.querySelectorAll('span[title]')).find(el => this.cleanText(el.getAttribute('title') || el.textContent));
            let title = this.cleanText(titleEl?.getAttribute('title') || titleEl?.textContent || '');
            if (!title) {
                title = this.cleanText(String(header.innerText || '').split(/\n+/)[0] || '');
            }

            let nodes = Array.from(main.querySelectorAll('div.message-in, div.message-out'));
            if (!nodes.length) {
                nodes = Array.from(main.querySelectorAll('[data-id]')).filter(node => node.querySelector?.('span.selectable-text'));
            }
            const messages = [];
            const seen = new Set();
            for (const node of nodes.slice(-70)) {
                const id = String(node.getAttribute?.('data-id') || '');
                if (id && seen.has(id)) continue;
                if (id) seen.add(id);
                const selectable = Array.from(node.querySelectorAll?.('span.selectable-text') || []);
                let body = selectable.map(el => String(el.innerText || el.textContent || '')).filter(Boolean).join('\n').trim();
                if (!body) {
                    const copyable = node.querySelector?.('[data-pre-plain-text]');
                    body = String(copyable?.innerText || '').trim();
                }
                if (!body) continue;
                const pre = node.querySelector?.('[data-pre-plain-text]')?.getAttribute('data-pre-plain-text') || '';
                const tm = pre.match(/\[(.*?)\]/);
                const out = node.classList?.contains('message-out') || Boolean(node.closest?.('.message-out'));
                const senderMatch = pre.match(/\]\s*([^:]+):\s*$/);
                const sender = out
                    ? 'Você'
                    : (this.cleanText(senderMatch?.[1] || '') || title || 'Cliente');
                messages.push({
                    id: id || `${out ? 'o' : 'i'}-${messages.length}-${body.slice(0, 20)}`,
                    direction: out ? 'out' : 'in',
                    sender,
                    text: body.slice(0, 4000),
                    time: tm ? this.cleanText(tm[1]) : ''
                });
            }
            return {
                active: title ? { title } : null,
                messages: messages.slice(-45)
            };
        },

        publishUiState(force = false) {
            if (!this.isWhatsAppHost()) return;
            try {
                const convo = this.collectActiveConversation();
                const connection = this.probeConnection();
                const state = {
                    at: Date.now(),
                    chats: this.collectChats(),
                    active: convo.active,
                    messages: convo.messages,
                    connection
                };
                this.heartbeat(true);
                const hash = JSON.stringify({ chats: state.chats, active: state.active, messages: state.messages, connection: state.connection });
                if (force || hash !== this.lastUiHash) {
                    this.lastUiHash = hash;
                    EH.Storage.set('waUiState', state);
                }
            } catch (error) {
                EH.Logger.warn('Não foi possível sincronizar a interface do WhatsApp:', error);
            }
        },

        startUiObserver() {
            if (!this.isWhatsAppHost() || this.uiObserver || !document.body) return;
            const refresh = EH.Utils.debounce(() => this.publishUiState(false), EH.Config.WA_OBSERVER_DEBOUNCE_MS);
            const target = document.querySelector('#app') || document.body;
            this.uiObserver = new MutationObserver(mutations => {
                // Ignora mudanças triviais fora da aplicação quando possível.
                if (!mutations?.length) return;
                refresh();
            });
            this.uiObserver.observe(target, { childList: true, subtree: true, characterData: true });
            this.uiTimer = EH.Runtime.interval('wa-ui-fallback', () => this.publishUiState(false), EH.Config.WA_UI_FALLBACK_MS);
            EH.Runtime.timeout('wa-ui-first-sync', () => this.publishUiState(true), 900);
        },

        findChatRowByTitle(title) {
            const wanted = this.cleanText(title).toLocaleLowerCase('pt-BR');
            if (!wanted) return null;
            const rows = this.chatRows();
            let partial = null;
            for (const item of rows) {
                const current = item.title.toLocaleLowerCase('pt-BR');
                if (current === wanted) return item.row;
                if (!partial && current.includes(wanted)) partial = item.row;
            }
            return partial;
        },

        async selectChatByTitle(title) {
            const row = this.findChatRowByTitle(title);
            if (!row) return false;
            try {
                row.scrollIntoView({ block: 'nearest' });
                row.click();
                await EH.Utils.sleep(450);
                this.publishUiState(true);
                return true;
            } catch (error) {
                EH.Logger.warn('Falha ao selecionar conversa:', error);
                return false;
            }
        },

        async waitForComposer(timeout = 15000) {
            return EH.Utils.waitFor(() => {
                const candidates = Array.from(document.querySelectorAll('footer [contenteditable="true"], [data-tab][contenteditable="true"], div[contenteditable="true"][role="textbox"]'));
                return candidates.find(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.width > 40 && rect.height > 15;
                }) || null;
            }, timeout, 250);
        },

        outboundText(value) {
            // Camada CENTRAL de texto do WhatsApp.
            // Preserva quebras reais, converte apenas escapes literais produzidos pelo próprio painel
            // e nunca transforma a mensagem em um parágrafo único.
            return String(value == null ? '' : value)
                .replace(/\u200e|\u200f|\u200b/g, '')
                .replace(/\u00a0/g, ' ')
                .replace(/\r\n?/g, '\n')
                .replace(/\\r\\n|\\n|\\r/g, '\n')
                .replace(/\\\*/g, '*')
                .split('\n')
                .map(line => line.replace(/[ \t]+$/g, ''))
                .join('\n')
                .trim();
        },

        composerText(composer) {
            return this.outboundText(composer?.innerText || composer?.textContent || '');
        },

        async insertTextIntoCurrentChat(message, replace = false) {
            const text = this.outboundText(message);
            if (!text) return true;
            const composer = await this.waitForComposer(12000);
            if (!composer) return false;

            try {
                composer.focus();
                const selection = window.getSelection?.();
                const selectComposer = collapseAtEnd => {
                    if (!selection) return;
                    const range = document.createRange();
                    range.selectNodeContents(composer);
                    range.collapse(Boolean(collapseAtEnd));
                    selection.removeAllRanges();
                    selection.addRange(range);
                };

                if (replace) {
                    selectComposer(false);
                    if (document.execCommand) document.execCommand('delete', false, null);
                    composer.dispatchEvent(new InputEvent('input', {
                        bubbles: true,
                        inputType: 'deleteContentBackward',
                        data: null
                    }));
                    await EH.Utils.waitFor(() => !this.composerText(composer) || null, 2200, 80);
                    if (this.composerText(composer)) {
                        EH.Logger.warn('Não foi possível limpar o composer do WhatsApp com segurança.');
                        return false;
                    }
                }

                selectComposer(true);

                // Primeiro tenta o caminho mais natural para o editor contenteditable do WhatsApp:
                // colagem de TEXTO PURO. Isso preserva \n e não converte asteriscos em "\\*".
                let inserted = false;
                if (typeof DataTransfer !== 'undefined' && typeof ClipboardEvent !== 'undefined') {
                    try {
                        const transfer = new DataTransfer();
                        transfer.setData('text/plain', text);
                        const pasteEvent = new ClipboardEvent('paste', {
                            bubbles: true,
                            cancelable: true,
                            clipboardData: transfer
                        });
                        composer.dispatchEvent(pasteEvent);
                        await EH.Utils.sleep(80);
                        inserted = this.composerText(composer) === text;
                    } catch (error) {
                        EH.Logger.debug('Colagem de texto puro não foi aceita pelo composer:', error);
                    }
                }

                // Se a tentativa de paste deixou conteúdo parcial, limpa antes do fallback.
                if (!inserted && this.composerText(composer)) {
                    selectComposer(false);
                    if (document.execCommand) document.execCommand('delete', false, null);
                    composer.dispatchEvent(new InputEvent('input', {
                        bubbles: true,
                        inputType: 'deleteContentBackward',
                        data: null
                    }));
                    await EH.Utils.waitFor(() => !this.composerText(composer) || null, 1600, 80);
                    if (this.composerText(composer)) return false;
                }

                // Fallback: execCommand recebe a mensagem inteira, inclusive as quebras de linha reais.
                // Não alteramos o DOM manualmente: se o editor não aceitar o texto, o envio é bloqueado.
                if (!inserted && document.execCommand) {
                    selectComposer(true);
                    try {
                        document.execCommand('insertText', false, text);
                    } catch (error) {
                        EH.Logger.debug('insertText não foi aceito pelo composer:', error);
                    }
                    composer.dispatchEvent(new InputEvent('input', {
                        bubbles: true,
                        inputType: 'insertText',
                        data: text
                    }));
                    composer.dispatchEvent(new Event('change', { bubbles: true }));
                    await EH.Utils.sleep(80);
                    inserted = this.composerText(composer) === text;
                }

                if (!inserted) {
                    EH.Logger.warn('WhatsApp alterou ou rejeitou a formatação antes do envio; envio bloqueado.');
                    return false;
                }

                return true;
            } catch (error) {
                EH.Logger.warn('Falha ao preencher mensagem no WhatsApp Web:', error);
                return false;
            }
        },

        async sendIntegratedWhatsAppText(message, timeout = 10000, options = {}) {
            const text = this.outboundText(message);
            if (!text) return false;

            // O histórico renderiza *negrito*, _itálico_, ~tachado~ e `monoespaçado`
            // sem necessariamente manter os marcadores no texto visível. Eles são removidos
            // SOMENTE para a comparação; a mensagem enviada continua intacta.
            // Para o fluxo do PIX, o WhatsApp também pode compactar linhas em branco no histórico.
            // O modo renderedHistory é usado apenas como critério de confirmação e NÃO altera o texto enviado.
            const renderedHistory = options?.renderedHistory === true;
            const comparable = value => {
                const normalized = this.outboundText(value).replace(/[*_~`]/g, '');
                return renderedHistory
                    ? normalized.replace(/\s+/g, ' ').trim()
                    : normalized;
            };
            const expectedHistoryText = comparable(text);
            const beforeMessages = this.collectActiveConversation().messages;
            const beforeIds = new Set(beforeMessages.map(item => item.id));

            const inserted = await this.insertTextIntoCurrentChat(text, true);
            if (!inserted) return false;

            const composer = await this.waitForComposer(2500);
            if (!composer || this.composerText(composer) !== text) {
                EH.Logger.warn('Composer não contém exatamente a mensagem preparada; envio cancelado.');
                return false;
            }

            await EH.Utils.sleep(100);
            const sendIcon = document.querySelector('[data-icon="send"], [data-testid="send"]');
            const sendButton = sendIcon?.closest('button')
                || document.querySelector('button[aria-label="Enviar" i], button[aria-label="Send" i], [data-testid="compose-btn-send"]');

            if (sendButton) {
                sendButton.click();
            } else {
                composer.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                    bubbles: true, cancelable: true
                }));
                composer.dispatchEvent(new KeyboardEvent('keyup', {
                    key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                    bubbles: true, cancelable: true
                }));
            }

            // CHECKPOINT 1: o primeiro await só termina depois que o composer ficou vazio.
            const composerCleared = await EH.Utils.waitFor(() => {
                const current = Array.from(document.querySelectorAll(
                    'footer [contenteditable="true"], [data-tab][contenteditable="true"], div[contenteditable="true"][role="textbox"]'
                )).find(el => {
                    const rect = el.getBoundingClientRect?.();
                    return rect && rect.width > 40 && rect.height > 15;
                }) || null;
                return current && !this.composerText(current) ? true : null;
            }, Math.min(timeout, 5000), 100);

            if (!composerCleared) {
                EH.Logger.warn('O composer não esvaziou; a mensagem não foi confirmada como enviada.');
                return false;
            }

            // CHECKPOINT 2: confirmar uma NOVA mensagem de saída no histórico.
            const historyConfirmed = await EH.Utils.waitFor(() => {
                const messages = this.collectActiveConversation().messages;
                return messages.some(item => {
                    if (item.direction !== 'out' || beforeIds.has(item.id)) return false;
                    return comparable(item.text) === expectedHistoryText;
                }) || null;
            }, timeout, 150);

            if (!historyConfirmed) {
                EH.Logger.warn('Composer esvaziou, mas a mensagem não apareceu no histórico com o conteúdo esperado.');
                return false;
            }

            this.publishUiState(true);
            return true;
        },

        dataUrlToFile(dataUrl, filename = 'epass-atendimento.png') {
            const match = String(dataUrl || '').match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
            if (!match) return null;
            const mime = match[1] || 'image/png';
            const isBase64 = Boolean(match[2]);
            const payload = match[3] || '';
            const binary = isBase64 ? atob(payload) : decodeURIComponent(payload);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
            return new File([bytes], filename, { type: mime });
        },

        async attachImage(dataUrl, filename) {
            if (!dataUrl) return false;
            const file = this.dataUrlToFile(dataUrl, filename);
            if (!file) return false;
            const composer = await this.waitForComposer(12000);
            if (composer && typeof DataTransfer !== 'undefined') {
                try {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    const paste = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt });
                    composer.focus();
                    composer.dispatchEvent(paste);
                    await EH.Utils.sleep(700);
                    const previewVisible = document.querySelector('[data-animate-modal-popup="true"], div[role="dialog"] img[src^="blob:"], div[role="dialog"] canvas, [data-testid*="media-preview"]');
                    if (previewVisible) return true;
                } catch (error) {
                    EH.Logger.warn('Colagem direta da imagem no WhatsApp não funcionou:', error);
                }
            }
            let input = Array.from(document.querySelectorAll('input[type="file"]')).find(el => /image|video/i.test(el.accept || '')) || null;
            if (!input) {
                const attach = document.querySelector('[data-icon="plus-rounded"], [data-icon="attach-menu-plus"], button[aria-label*="Anexar" i], button[title*="Anexar" i], button[aria-label*="Attach" i]');
                try { (attach?.closest('button') || attach)?.click(); }
                catch (error) { EH.Logger.debug('WhatsApp: botão de anexo não pôde ser acionado:', error); }
                input = await EH.Utils.waitFor(() => Array.from(document.querySelectorAll('input[type="file"]')).find(el => /image|video/i.test(el.accept || '')) || null, 3500, 180);
            }
            if (!input || typeof DataTransfer === 'undefined') return false;
            try {
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            } catch (error) {
                EH.Logger.warn('Não foi possível anexar a imagem pelo seletor de arquivos:', error);
                return false;
            }
        },

        findMediaSendButton() {
            const modal = Array.from(document.querySelectorAll('[role="dialog"], [data-animate-modal-popup="true"]')).find(el => {
                const rect = el.getBoundingClientRect?.();
                return rect && rect.width > 80 && rect.height > 80;
            }) || document;
            const icon = modal.querySelector?.('[data-icon="send"], [data-testid="send"], [data-testid="compose-btn-send"]');
            return icon?.closest?.('button') || Array.from(modal.querySelectorAll?.('button') || []).find(button => {
                const label = `${button.getAttribute('aria-label') || ''} ${button.title || ''} ${button.textContent || ''}`;
                return /enviar|send/i.test(label) && button.getBoundingClientRect?.().width > 0;
            }) || null;
        },

        async sendAttachedImage(dataUrl, filename = 'epass-atendimento.png', followupMessage = '') {
            const attached = await this.attachImage(dataUrl, filename);
            if (!attached) return { attached: false, sent: false, textSent: false };
            const sendButton = await EH.Utils.waitFor(() => this.findMediaSendButton(), 10000, 200);
            if (!sendButton) return { attached: true, sent: false, textSent: false };
            try {
                sendButton.click();
                await EH.Utils.sleep(650);
                let textSent = true;
                if (String(followupMessage || '').trim()) {
                    textSent = await this.sendIntegratedWhatsAppText(String(followupMessage || '').trim());
                }
                this.publishUiState(true);
                return { attached: true, sent: true, textSent };
            } catch (error) {
                EH.Logger.warn('Não foi possível concluir o envio da imagem:', error);
                return { attached: true, sent: false, textSent: false };
            }
        },

        async handleCommand(command) {
            if (!command?.id || !command.createdAt) return;
            if ((Date.now() - Number(command.createdAt)) > this.COMMAND_TTL) return;
            if ((command.target || 'web') !== 'web') return;

            const doneKey = 'ehWaDoneCommand';
            const pendingKey = 'ehWaPendingCommand';
            if (sessionStorage.getItem(doneKey) === command.id) return;
            const action = String(command.action || 'prepare');

            if (action === 'sync') {
                this.publishUiState(true);
                sessionStorage.setItem(doneKey, command.id);
                EH.Storage.set('waAck', { id: command.id, at: Date.now(), action, ok: true });
                return;
            }

            if (action === 'select_chat') {
                const ok = await this.selectChatByTitle(command.chatTitle || '');
                sessionStorage.setItem(doneKey, command.id);
                EH.Storage.set('waAck', { id: command.id, at: Date.now(), action, ok });
                return;
            }

            // O PIX deve ser enviado somente na conversa que já está selecionada.
            // Para as demais ações, mantém o comportamento existente de seleção por título.
            if (command.chatTitle && action !== 'send_pix_pair') {
                await this.selectChatByTitle(command.chatTitle);
            }

            let ok = true;
            let imageAttached = false;
            let imageSent = false;
            if (action === 'send_text') {
                ok = await this.sendIntegratedWhatsAppText(command.message || '');
            } else if (action === 'send_pix_pair') {
                // PIX: nunca trocar de conversa automaticamente. O título enviado serve apenas
                // para confirmar que a conversa atual continua sendo a mesma do clique no E-Pass.
                const expectedTitle = String(command.chatTitle || '').trim();
                const currentTitle = String(this.collectActiveConversation()?.active?.title || '').trim();
                if (!currentTitle || (expectedTitle && currentTitle !== expectedTitle)) {
                    EH.Logger.warn('Envio do PIX cancelado: a conversa atual do WhatsApp mudou antes do envio.');
                    ok = false;
                } else {
                    // 1) Envia a orientação e só continua após composer vazio + nova mensagem no histórico.
                    // renderedHistory tolera apenas diferenças VISUAIS de espaços/quebras do WhatsApp.
                    ok = await this.sendIntegratedWhatsAppText(
                        command.message || '',
                        10000,
                        { renderedHistory: true }
                    );

                    // 2) Checkpoint explícito antes do PIX: o campo deve estar disponível e vazio.
                    if (ok && command.message2) {
                        const composerReady = await this.waitForComposer(5000);
                        if (!composerReady || this.composerText(composerReady)) {
                            EH.Logger.warn('Envio do PIX interrompido: o composer não ficou livre após a orientação.');
                            ok = false;
                        } else {
                            // Segunda mensagem: SOMENTE o payload recebido do E-Pass.
                            ok = await this.sendIntegratedWhatsAppText(
                                command.message2 || '',
                                10000,
                                { renderedHistory: true }
                            );
                        }
                    }
                }
            } else if (action === 'send_pair') {
                ok = await this.sendIntegratedWhatsAppText(command.message || '');
                if (ok && command.message2) ok = await this.sendIntegratedWhatsAppText(command.message2 || '');
            } else if (action === 'send_image') {
                const result = await this.sendAttachedImage(
                    command.imageDataUrl || '',
                    command.filename || 'epass-atendimento.png',
                    command.message || ''
                );
                imageAttached = Boolean(result.attached);
                imageSent = Boolean(result.sent);
                ok = imageSent && (result.textSent !== false);
            } else {
                if (command.message) ok = await this.insertTextIntoCurrentChat(command.message, false);
                if (command.imageDataUrl) {
                    await EH.Utils.sleep(450);
                    imageAttached = await this.attachImage(command.imageDataUrl, command.filename || 'epass-atendimento.png');
                    ok = ok && imageAttached;
                }
            }

            sessionStorage.setItem(doneKey, command.id);
            sessionStorage.removeItem(pendingKey);
            EH.Storage.set('waAck', {
                id: command.id,
                at: Date.now(),
                action,
                imageAttached,
                imageSent,
                ok
            });
            this.publishUiState(true);
        },

        initReceiver() {
            if (!this.isWhatsAppHost() || this.receiverStarted) return;
            this.receiverStarted = true;
            this.heartbeat(true);
            this.startUiObserver();
            this.heartbeatTimer = EH.Runtime.interval('wa-heartbeat', () => {
                this.heartbeat(true);
                this.publishUiState(false);
            }, EH.Config.WA_HEARTBEAT_MS);

            EH.Runtime.on('wa-focus', window, 'focus', () => {
                this.heartbeat(true);
                this.publishUiState(true);
            });
            EH.Runtime.on('wa-visibility', document, 'visibilitychange', () => {
                if (!document.hidden) {
                    this.heartbeat(true);
                    this.publishUiState(true);
                }
            });
            EH.Runtime.on('wa-pagehide', window, 'pagehide', () => this.heartbeat(false));

            const key = EH.Storage.key('waCommand');
            if (typeof GM_addValueChangeListener === 'function' && !this.listenerId) {
                this.listenerId = GM_addValueChangeListener(key, (_name, _oldValue, newValue) => {
                    const command = this.parseStored(newValue);
                    if (command) this.handleCommand(command);
                });
            }
            EH.Runtime.timeout('wa-initial-command', () => {
                const command = EH.Storage.get('waCommand', null);
                if (command) this.handleCommand(command);
                this.publishUiState(true);
            }, 700);
        }
    };

    // ============================================================
    // WHATSAPP INTEGRADO AO E-PASS
    // A aba já aberta do WhatsApp Web funciona como motor. Esta interface
    // lateral reproduz as conversas e envia comandos sem abrir nova aba/janela.
    // ============================================================
    EH.WhatsAppDock = {
        root: null,
        chatList: null,
        messageList: null,
        titleEl: null,
        statusEl: null,
        searchInput: null,
        composer: null,
        sendButton: null,
        currentState: null,
        listenerId: null,
        ackListenerId: null,
        collapsed: false,
        pendingImage: null,
        pendingCommandId: '',
        imagePreviewWrap: null,
        imagePreviewImg: null,
        imagePreviewName: null,
        imageRemoveButton: null,
        organizer: null,
        organizerClient: null,
        organizerStage: null,
        organizerRoute: null,
        organizerPassenger: null,
        organizerSeat: null,
        organizerValue: null,
        organizerPayment: null,
        whatsappTools: null,

        init() {
            if (this.root || EH.WhatsAppBridge.isWhatsAppHost() || !document.body) return;
            this.collapsed = !EH.State.isOpen('right');

            const root = document.createElement('aside');
            root.id = 'eh-wa-dock';
            root.classList.toggle('eh-wa-collapsed', this.collapsed);

            const head = document.createElement('div');
            head.className = 'eh-wa-dock-head';
            const brand = document.createElement('div');
            brand.className = 'eh-wa-brand';
            brand.innerHTML = '<span class="eh-wa-status-dot"></span><strong>Conversa atual</strong>';
            const status = document.createElement('span');
            status.className = 'eh-wa-status-text';
            status.textContent = 'conectando…';
            const collapse = document.createElement('button');
            collapse.type = 'button';
            collapse.className = 'eh-wa-collapse';
            collapse.title = 'Recolher conversa atual';
            collapse.textContent = '›';
            collapse.addEventListener('click', () => this.setCollapsed(true));
            head.append(brand, status, collapse);

            const organizer = document.createElement('section');
            organizer.className = 'eh-conversation-organizer';
            const organizerEyebrow = document.createElement('div');
            organizerEyebrow.className = 'eh-conversation-eyebrow';
            organizerEyebrow.textContent = 'LEMBRETE DO ATENDIMENTO';
            const organizerClient = document.createElement('strong');
            organizerClient.className = 'eh-conversation-client';
            organizerClient.textContent = 'Nenhuma conversa selecionada';
            const organizerGrid = document.createElement('div');
            organizerGrid.className = 'eh-conversation-grid';
            const makeOrganizerItem = (label, key) => {
                const item = document.createElement('div');
                item.className = `eh-conversation-item eh-conversation-${key}`;
                const small = document.createElement('small');
                small.textContent = label;
                const value = document.createElement('span');
                value.textContent = '—';
                item.append(small, value);
                organizerGrid.appendChild(item);
                return value;
            };
            const organizerStage = makeOrganizerItem('Etapa', 'stage');
            const organizerRoute = makeOrganizerItem('Rota', 'route');
            const organizerPassenger = makeOrganizerItem('Passageiro', 'passenger');
            const organizerSeat = makeOrganizerItem('Poltrona', 'seat');
            const organizerValue = makeOrganizerItem('Valor', 'value');
            const organizerPayment = makeOrganizerItem('Pagamento', 'payment');
            organizer.append(organizerEyebrow, organizerClient, organizerGrid);

            const chats = document.createElement('section');
            chats.className = 'eh-wa-chats';
            const search = document.createElement('input');
            search.type = 'search';
            search.className = 'eh-wa-search';
            search.placeholder = 'Buscar conversa…';
            search.autocomplete = 'off';
            search.addEventListener('input', () => this.renderChats());
            const list = document.createElement('div');
            list.className = 'eh-wa-chat-list';
            chats.append(search, list);

            const conversation = document.createElement('section');
            conversation.className = 'eh-wa-conversation';
            const convHead = document.createElement('div');
            convHead.className = 'eh-wa-conversation-head';
            const title = document.createElement('strong');
            title.textContent = 'Selecione uma conversa';
            convHead.appendChild(title);
            const messages = document.createElement('div');
            messages.className = 'eh-wa-messages';
            conversation.append(convHead, messages);

            const composerWrap = document.createElement('div');
            composerWrap.className = 'eh-wa-compose';
            const composer = document.createElement('textarea');
            composer.rows = 1;
            composer.placeholder = 'Digite uma mensagem ou cole uma imagem';
            composer.addEventListener('paste', event => this.handlePaste(event));
            composer.addEventListener('keydown', event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    this.sendCurrentMessage();
                }
            });
            const send = document.createElement('button');
            send.type = 'button';
            send.title = 'Enviar mensagem';
            send.setAttribute('aria-label', send.title);
            send.textContent = '➤';
            send.addEventListener('click', () => this.sendCurrentMessage());
            composerWrap.append(composer, send);

            const pastePreview = document.createElement('div');
            pastePreview.className = 'eh-wa-paste-preview';
            pastePreview.hidden = true;
            const previewImg = document.createElement('img');
            previewImg.alt = 'Imagem pronta para envio';
            const previewMeta = document.createElement('div');
            previewMeta.className = 'eh-wa-paste-meta';
            const previewName = document.createElement('strong');
            previewName.textContent = 'Imagem';
            const previewHint = document.createElement('small');
            previewHint.textContent = 'Pronta para enviar';
            previewMeta.append(previewName, previewHint);
            const removeImage = document.createElement('button');
            removeImage.type = 'button';
            removeImage.className = 'eh-wa-paste-remove';
            removeImage.title = 'Remover imagem';
            removeImage.textContent = '×';
            removeImage.addEventListener('click', () => this.clearPendingImage());
            pastePreview.append(previewImg, previewMeta, removeImage);

            const handle = document.createElement('button');
            handle.id = 'eh-wa-handle';
            handle.type = 'button';
            handle.title = 'Expandir conversa atual';
            handle.textContent = '‹';
            handle.hidden = !this.collapsed;
            handle.addEventListener('click', () => this.setCollapsed(false));

            const whatsappTools = document.createElement('details');
            whatsappTools.className = 'eh-wa-tools';
            const whatsappToolsSummary = document.createElement('summary');
            whatsappToolsSummary.textContent = 'WhatsApp integrado';
            const whatsappToolsBody = document.createElement('div');
            whatsappToolsBody.className = 'eh-wa-tools-body';
            whatsappToolsBody.append(chats, conversation, pastePreview, composerWrap);
            whatsappTools.append(whatsappToolsSummary, whatsappToolsBody);

            root.append(head, organizer, whatsappTools);
            document.body.append(root, handle);
            this.root = root;
            this.handle = handle;
            EH.Layout?.sync?.();
            this.chatList = list;
            this.messageList = messages;
            this.titleEl = title;
            this.statusEl = status;
            this.searchInput = search;
            this.composer = composer;
            this.sendButton = send;
            this.imagePreviewWrap = pastePreview;
            this.imagePreviewImg = previewImg;
            this.imagePreviewName = previewName;
            this.imageRemoveButton = removeImage;
            this.organizer = organizer;
            this.organizerClient = organizerClient;
            this.organizerStage = organizerStage;
            this.organizerRoute = organizerRoute;
            this.organizerPassenger = organizerPassenger;
            this.organizerSeat = organizerSeat;
            this.organizerValue = organizerValue;
            this.organizerPayment = organizerPayment;
            this.whatsappTools = whatsappTools;
            this.applyLayout();
            this.render(EH.WhatsAppBridge.getUiState());

            if (typeof GM_addValueChangeListener === 'function') {
                this.listenerId = GM_addValueChangeListener(EH.Storage.key('waUiState'), (_name, _oldValue, newValue) => {
                    const state = EH.WhatsAppBridge.parseStored(newValue);
                    if (state) this.render(state);
                });
                this.ackListenerId = GM_addValueChangeListener(EH.Storage.key('waAck'), (_name, _oldValue, newValue) => {
                    const ack = EH.WhatsAppBridge.parseStored(newValue);
                    if (ack?.id && ack.id === this.pendingCommandId) {
                        if (ack.ok && ack.imageSent) {
                            this.clearPendingImage();
                            if (this.composer) this.composer.value = '';
                            EH.Toast.success('✓ Imagem enviada');
                        } else if (ack.imageAttached && !ack.imageSent) {
                            EH.Toast.warning('A imagem foi anexada no WhatsApp, mas o envio automático não foi concluído. Confira a aba do WhatsApp Web.');
                        } else if (!ack.ok) {
                            EH.Toast.error('Não foi possível enviar a imagem pelo WhatsApp.');
                        }
                        this.pendingCommandId = '';
                    }
                    setTimeout(() => this.requestSync(), 160);
                });
            }
            this.requestSync();
            EH.Runtime.interval('wa-dock-status', () => this.refreshConnection(), EH.Config.WA_STATUS_REFRESH_MS);
        },

        setCollapsed(value) {
            EH.State.setPanel('right', !Boolean(value));
        },

        applyLayout() {
            EH.Layout?.sync?.();
        },

        refreshConnection() {
            const connection = EH.WhatsAppBridge.getConnectionStatus();
            const hasChat = Boolean(String(this.currentState?.active?.title || EH.WhatsAppBridge.getUiState()?.active?.title || '').trim());
            const state = connection.connected ? (hasChat ? 'ready' : 'no-chat') : connection.state;
            this.root?.classList.remove('eh-wa-online', 'eh-wa-loading', 'eh-wa-disconnected', 'eh-wa-no-chat', 'eh-wa-ready');
            if (state === 'ready') this.root?.classList.add('eh-wa-online', 'eh-wa-ready');
            else if (state === 'no-chat') this.root?.classList.add('eh-wa-online', 'eh-wa-no-chat');
            else if (state === 'loading') this.root?.classList.add('eh-wa-loading');
            else this.root?.classList.add('eh-wa-disconnected');

            if (this.statusEl) {
                this.statusEl.textContent = state === 'ready'
                    ? '🟢 WhatsApp conectado'
                    : state === 'no-chat'
                        ? '⚠️ Selecione uma conversa'
                        : state === 'loading'
                            ? '🟡 Conectando…'
                            : '🔴 WhatsApp desconectado';
            }
            const canCompose = Boolean(connection.connected);
            const canSend = Boolean(connection.connected && hasChat);
            // Permite colar/preparar uma imagem antes de escolher a conversa;
            // o envio continua bloqueado até existir um chat selecionado.
            if (this.composer) this.composer.disabled = !canCompose;
            if (this.sendButton) this.sendButton.disabled = !canSend;
            if (this.sendButton) this.sendButton.title = this.pendingImage ? 'Enviar imagem' : 'Enviar mensagem';
            return { ...connection, state, canSend };
        },

        requestSync() {
            if (!EH.WhatsAppBridge.isOnline()) {
                this.refreshConnection();
                return;
            }
            EH.WhatsAppBridge.send(EH.WhatsAppBridge.makeCommand({ action: 'sync' }));
        },

        render(state) {
            this.currentState = state || { chats: [], active: null, messages: [] };
            this.refreshConnection();
            if (this.titleEl) this.titleEl.textContent = this.currentState.active?.title || 'Selecione uma conversa';
            this.renderOrganizer();
            this.renderChats();
            this.renderMessages();
        },

        renderOrganizer(page = EH.Pages?.detect?.() || 'desconhecida') {
            if (!this.organizer) return;
            const activeTitle = String(this.currentState?.active?.title || EH.WhatsAppBridge.getUiState()?.active?.title || '').trim();
            const stageLabels = {
                pesquisa: 'Horários',
                reserva: 'Poltronas',
                confirmacao: 'Confirmação',
                pagamento: 'Pagamento',
                passagens: 'Bilhete',
                requisicao: 'Requisição',
                desconhecida: 'Aguardando'
            };

            let route = '';
            let passenger = '';
            let seat = '';
            let value = '';
            let payment = '';

            try {
                if (page === 'pesquisa') {
                    const data = EH.Parser?.parsePesquisa?.();
                    route = [data?.origem, data?.destino].filter(Boolean).join(' → ');
                } else if (page === 'reserva') {
                    const data = EH.Parser?.parseReserva?.();
                    route = String(data?.origemDestino || '').trim();
                } else if (page === 'confirmacao' || page === 'pagamento') {
                    const card = EH.Payment?.parseSummary?.()?.cards?.[0];
                    if (card) {
                        route = String(card.routeDate || '').trim();
                        passenger = String(card.passenger || '').trim();
                        seat = String(card.seat || '').trim();
                        value = String(card.total || card.tarifa || '').trim();
                    }
                    if (page === 'pagamento') payment = EH.Payment?.parsePix?.() ? 'PIX' : 'A definir';
                } else if (page === 'passagens') {
                    const sale = EH.SaleContext?.loadSale?.();
                    const active = Array.isArray(sale?.passengers)
                        ? sale.passengers.find(item => item.id === sale.activePassengerId) || sale.passengers[0]
                        : null;
                    passenger = String(active?.name || '').trim();
                }
            } catch (error) {
                EH.Logger.debug('Resumo visual da conversa indisponível:', error);
            }

            if (this.organizerClient) this.organizerClient.textContent = activeTitle || 'Nenhuma conversa selecionada';
            if (this.organizerStage) this.organizerStage.textContent = stageLabels[page] || 'Atendimento';
            if (this.organizerRoute) this.organizerRoute.textContent = route || '—';
            if (this.organizerPassenger) this.organizerPassenger.textContent = passenger || '—';
            if (this.organizerSeat) this.organizerSeat.textContent = seat || '—';
            if (this.organizerValue) this.organizerValue.textContent = value || '—';
            if (this.organizerPayment) this.organizerPayment.textContent = payment || '—';
        },

        renderChats() {
            if (!this.chatList) return;
            const query = String(this.searchInput?.value || '').trim().toLocaleLowerCase('pt-BR');
            const chats = Array.isArray(this.currentState?.chats) ? this.currentState.chats : [];
            const activeTitle = String(this.currentState?.active?.title || '');
            this.chatList.innerHTML = '';
            const visible = chats.filter(chat => !query || `${chat.title} ${chat.preview}`.toLocaleLowerCase('pt-BR').includes(query));
            if (!visible.length) {
                const empty = document.createElement('div');
                empty.className = 'eh-wa-empty';
                const connection = EH.WhatsAppBridge.getConnectionStatus();
                empty.textContent = connection.connected
                    ? 'Nenhuma conversa encontrada.'
                    : connection.state === 'loading'
                        ? 'Conectando ao WhatsApp Web…'
                        : 'WhatsApp Web desconectado. Mantenha a aba do WhatsApp Web aberta e conectada.';
                this.chatList.appendChild(empty);
                return;
            }
            for (const chat of visible) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'eh-wa-chat';
                if (chat.title === activeTitle) button.classList.add('active');
                const avatar = document.createElement('span');
                avatar.className = 'eh-wa-avatar';
                avatar.textContent = (chat.title || '?').trim().charAt(0).toUpperCase();
                const info = document.createElement('span');
                info.className = 'eh-wa-chat-info';
                const name = document.createElement('strong');
                name.textContent = chat.title || 'Conversa';
                const preview = document.createElement('small');
                preview.textContent = chat.preview || '';
                info.append(name, preview);
                button.append(avatar, info);
                if (chat.unread) {
                    const unread = document.createElement('b');
                    unread.className = 'eh-wa-unread';
                    unread.textContent = String(chat.unread);
                    button.appendChild(unread);
                }
                button.addEventListener('click', () => this.selectChat(chat.title));
                this.chatList.appendChild(button);
            }
        },

        renderMessages() {
            if (!this.messageList) return;
            const previousScrollTop = this.messageList.scrollTop;
            const nearBottom = this.messageList.scrollHeight - this.messageList.scrollTop - this.messageList.clientHeight < 100;
            this.messageList.innerHTML = '';
            const messages = Array.isArray(this.currentState?.messages) ? this.currentState.messages : [];
            if (!messages.length) {
                const empty = document.createElement('div');
                empty.className = 'eh-wa-empty eh-wa-empty-conversation';
                empty.textContent = this.currentState?.active?.title ? 'Conversa carregando…' : 'Escolha um cliente acima.';
                this.messageList.appendChild(empty);
                return;
            }
            for (const msg of messages) {
                const bubble = document.createElement('div');
                bubble.className = `eh-wa-msg ${msg.direction === 'out' ? 'out' : 'in'}`;
                const sender = document.createElement('div');
                sender.className = 'eh-wa-msg-sender';
                sender.textContent = msg.sender || (msg.direction === 'out' ? 'Você' : (this.currentState?.active?.title || 'Cliente'));
                const body = document.createElement('div');
                body.textContent = msg.text || '';
                bubble.append(sender, body);
                if (msg.time) {
                    const time = document.createElement('time');
                    time.textContent = msg.time;
                    bubble.appendChild(time);
                }
                this.messageList.appendChild(bubble);
            }
            if (nearBottom) this.messageList.scrollTop = this.messageList.scrollHeight;
            else this.messageList.scrollTop = previousScrollTop;
        },

        fileToDataUrl(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => reject(reader.error || new Error('Não foi possível ler a imagem.'));
                reader.readAsDataURL(file);
            });
        },

        setPendingImage(dataUrl, filename = 'imagem-whatsapp.png', mime = 'image/png') {
            const value = String(dataUrl || '');
            if (!/^data:image\/(png|jpe?g|webp|gif|bmp);/i.test(value)) {
                EH.Toast.warning('Formato de imagem não suportado para envio.');
                return false;
            }
            this.pendingImage = { dataUrl: value, filename: filename || 'imagem-whatsapp.png', mime, at: Date.now() };
            if (this.imagePreviewWrap) this.imagePreviewWrap.hidden = false;
            if (this.imagePreviewImg) this.imagePreviewImg.src = value;
            if (this.imagePreviewName) this.imagePreviewName.textContent = this.pendingImage.filename;
            this.root?.classList.add('eh-wa-has-paste-image');
            this.refreshConnection();
            EH.Toast.success('✓ Imagem pronta para envio');
            return true;
        },

        clearPendingImage() {
            this.pendingImage = null;
            if (this.imagePreviewWrap) this.imagePreviewWrap.hidden = true;
            if (this.imagePreviewImg) this.imagePreviewImg.removeAttribute('src');
            if (this.imagePreviewName) this.imagePreviewName.textContent = 'Imagem';
            this.root?.classList.remove('eh-wa-has-paste-image');
            this.refreshConnection();
        },

        async handlePaste(event) {
            const clipboard = event.clipboardData;
            const items = Array.from(clipboard?.items || []);
            const imageItem = items.find(item => String(item.type || '').toLowerCase().startsWith('image/'));
            if (imageItem) {
                const file = imageItem.getAsFile?.();
                if (!file) return;
                event.preventDefault();
                if (file.size > 20 * 1024 * 1024) {
                    EH.Toast.warning('A imagem é muito grande para o envio rápido. Use uma imagem de até 20 MB.');
                    return;
                }
                try {
                    const dataUrl = await this.fileToDataUrl(file);
                    const extension = String(file.type || 'image/png').split('/')[1]?.replace('jpeg', 'jpg') || 'png';
                    this.setPendingImage(dataUrl, file.name || `imagem-colada.${extension}`, file.type || 'image/png');
                } catch (error) {
                    EH.Logger.warn('Falha ao ler imagem colada:', error);
                    EH.Toast.error('Não foi possível carregar a imagem colada.');
                }
                return;
            }

            // Fallback interno: quando o E-Pass em HTTP não consegue gravar o PNG no
            // clipboard do Windows, uma imagem copiada pelo próprio script é mantida
            // por alguns segundos para que CTRL+V no painel continue funcionando.
            const remembered = EH.Clipboard.getRecentImage?.(90000);
            if (remembered) {
                event.preventDefault();
                this.setPendingImage(remembered.dataUrl, remembered.filename || 'captura-epass.png', remembered.mime || 'image/png');
            }
        },

        selectChat(title) {
            if (!EH.WhatsAppBridge.isOnline()) {
                EH.Toast.warning('O WhatsApp Web não está conectado. Abra a aba que você já usa e mantenha-a aberta.');
                return;
            }
            EH.WhatsAppBridge.send(EH.WhatsAppBridge.makeCommand({ action: 'select_chat', chatTitle: title }));
            if (this.titleEl) this.titleEl.textContent = title;
        },

        sendCurrentMessage() {
            const message = String(this.composer?.value || '').trim();
            const title = String(this.currentState?.active?.title || '').trim();
            const connection = this.refreshConnection();
            if (!title) {
                EH.Toast.warning('Selecione uma conversa antes de enviar.');
                return;
            }
            if (!connection?.connected) {
                EH.Toast.warning(connection?.state === 'loading' ? 'WhatsApp ainda está conectando.' : 'WhatsApp Web desconectado.');
                return;
            }
            if (this.pendingImage) {
                const command = EH.WhatsAppBridge.makeCommand({
                    action: 'send_image',
                    chatTitle: title,
                    message,
                    imageDataUrl: this.pendingImage.dataUrl,
                    filename: this.pendingImage.filename || 'imagem-whatsapp.png'
                });
                this.pendingCommandId = command.id;
                EH.WhatsAppBridge.send(command);
                EH.Toast.info('Enviando imagem…');
                return;
            }
            if (!message) return;
            EH.WhatsAppBridge.send(EH.WhatsAppBridge.makeCommand({ action: 'send_text', chatTitle: title, message }));
            this.composer.value = '';
        }
    };

    // ============================================================
    // LAYOUT VISUAL DOS PAINÉIS — OVERLAYS INDEPENDENTES
    // Nunca redimensiona, desloca ou altera elementos originais do E-Pass.
    // ============================================================
    EH.Layout = {
        lastMetrics: null,

        responsiveBases(viewportWidth, leftZoom, rightZoom, leftOpen, rightOpen) {
            const vw = Math.max(320, Number(viewportWidth) || 1366);
            const safeLeftZoom = Math.min(2, Math.max(0.75, Number(leftZoom) || 1));
            const safeRightZoom = Math.min(2, Math.max(0.75, Number(rightZoom) || 1));

            // O zoom salvo continua influenciando o tamanho, mas sem usar CSS zoom,
            // evitando efeitos colaterais de posicionamento em elementos fixed.
            const leftBase = vw >= 1500 ? 232 : vw >= 1180 ? 214 : 202;
            const rightBase = vw >= 1500 ? 266 : vw >= 1180 ? 242 : 224;
            const manualLeft = Number(EH.Config.PANEL_CUSTOM_WIDTH) || 0;
            const manualRight = Number(EH.Config.WHATSAPP_CUSTOM_WIDTH) || 0;
            let leftWidth = manualLeft
                ? Math.round(Math.min(440, Math.max(260, manualLeft)))
                : Math.round(Math.min(370, Math.max(278, leftBase * safeLeftZoom)));
            let rightWidth = manualRight
                ? Math.round(Math.min(420, Math.max(230, manualRight)))
                : Math.round(Math.min(310, Math.max(238, rightBase * safeRightZoom)));

            const edge = vw <= 760 ? 10 : 14;
            const gap = vw <= 760 ? 8 : 12;
            const available = Math.max(280, vw - edge * 2);
            leftWidth = Math.min(leftWidth, available);
            rightWidth = Math.min(rightWidth, available);

            const sideBySide = Boolean(
                leftOpen && rightOpen
                && vw >= 1120
                && (leftWidth + rightWidth + gap + edge * 2) <= vw
            );

            return { leftBase, rightBase, leftWidth, rightWidth, edge, gap, sideBySide };
        },

        sync() {
            EH.State?.load?.();
            const viewportWidth = Math.max(320, document.documentElement.clientWidth || window.innerWidth || 1366);
            const viewportHeight = Math.max(480, document.documentElement.clientHeight || window.innerHeight || 768);
            const leftZoom = Math.min(2, Math.max(0.75, Number(EH.Config.PANEL_ZOOM) || 1.5));
            const rightZoom = Math.min(2, Math.max(0.75, Number(EH.Config.WHATSAPP_DOCK_ZOOM) || 1.1));
            const leftOpen = Boolean(EH.State?.isOpen?.('left') && EH.UI?.root);
            const rightOpen = Boolean(EH.State?.isOpen?.('right') && EH.WhatsAppDock?.root);
            const metrics = this.responsiveBases(viewportWidth, leftZoom, rightZoom, leftOpen, rightOpen);
            const root = document.documentElement;

            // Limpa vestígios do layout antigo que deslocava a plataforma.
            ['eh-layout-managed', 'eh-app-left-open', 'eh-app-right-open', 'eh-app-both-open', 'eh-layout-tight']
                .forEach(name => root.classList.remove(name));
            ['--eh-left-active-space', '--eh-right-active-space', '--eh-left-logical-height', '--eh-right-logical-height']
                .forEach(name => root.style.removeProperty(name));

            root.classList.toggle('eh-overlay-side-by-side', metrics.sideBySide);
            root.classList.toggle('eh-overlay-stacked', Boolean(leftOpen && rightOpen && !metrics.sideBySide));
            root.classList.toggle('eh-overlay-main-open', leftOpen);
            root.classList.toggle('eh-overlay-conversation-open', rightOpen);
            root.classList.toggle('eh-app-panels-closed', !leftOpen && !rightOpen);
            root.classList.toggle('eh-overlay-side-left', EH.Config.OVERLAY_SIDE === 'left');
            ['compacto', 'padrao', 'confortavel'].forEach(name => root.classList.toggle(`eh-density-${name}`, EH.Config.UI_DENSITY === name));
            ['none', 'suave', 'normal'].forEach(name => root.classList.toggle(`eh-shadow-${name}`, EH.Config.SHADOW_LEVEL === name));

            const autoTop = viewportWidth <= 760 ? 58 : 72;
            const topOffset = Number(EH.Config.OVERLAY_TOP_OFFSET) || autoTop;
            const manualMainHeight = Number(EH.Config.PANEL_HEIGHT_PERCENT) || 0;
            const manualConversationHeight = Number(EH.Config.WHATSAPP_HEIGHT_PERCENT) || 0;
            const mainHeight = manualMainHeight
                ? Math.min(viewportHeight - topOffset - metrics.edge, Math.max(300, Math.round(viewportHeight * manualMainHeight / 100)))
                : Math.min(680, Math.max(390, Math.round(viewportHeight * (metrics.sideBySide ? 0.72 : 0.56))));
            const conversationHeight = manualConversationHeight
                ? Math.min(viewportHeight - metrics.edge * 2, Math.max(210, Math.round(viewportHeight * manualConversationHeight / 100)))
                : Math.min(500, Math.max(230, Math.round(viewportHeight * (metrics.sideBySide ? 0.48 : 0.34))));

            root.style.setProperty('--eh-panel-width', `${metrics.leftWidth}px`);
            root.style.setProperty('--eh-conversation-width', `${metrics.rightWidth}px`);
            root.style.setProperty('--eh-overlay-edge', `${metrics.edge}px`);
            root.style.setProperty('--eh-overlay-gap', `${metrics.gap}px`);
            root.style.setProperty('--eh-overlay-top', `${topOffset}px`);
            root.style.setProperty('--eh-overlay-main-height', `${mainHeight}px`);
            root.style.setProperty('--eh-overlay-conversation-height', `${conversationHeight}px`);
            root.style.setProperty('--eh-panel-opacity', String(Math.min(1, Math.max(0.86, Number(EH.Config.PANEL_OPACITY) || 1))));
            const configuredRadius = Math.min(22, Math.max(8, Number(EH.Config.PANEL_RADIUS) || 15));
            root.style.setProperty('--eh-panel-radius', `${configuredRadius}px`);
            root.style.setProperty('--eh-wa-radius', `${Math.max(8, configuredRadius - 1)}px`);
            root.style.setProperty('--eh-layout-transition', `${Math.max(0, Number(EH.Config.LAYOUT_TRANSITION_MS) || 180)}ms`);

            if (EH.UI?.root) {
                EH.UI.root.classList.toggle('eh-collapsed', !leftOpen);
                if (EH.UI.body) EH.UI.body.hidden = !leftOpen;
                if (EH.UI.launcher) EH.UI.launcher.hidden = leftOpen;
            }
            if (EH.WhatsAppDock?.root) {
                EH.WhatsAppDock.collapsed = !rightOpen;
                EH.WhatsAppDock.root.classList.toggle('eh-wa-collapsed', !rightOpen);
                if (EH.WhatsAppDock.handle) EH.WhatsAppDock.handle.hidden = rightOpen;
            }

            this.lastMetrics = {
                viewportWidth,
                viewportHeight,
                leftOpen,
                rightOpen,
                leftZoom,
                rightZoom,
                ...metrics,
                // Compatibilidade com diagnósticos antigos: nenhum espaço é retirado do E-Pass.
                leftSpace: 0,
                rightSpace: 0,
                centralSpace: viewportWidth
            };
            return this.lastMetrics;
        },

        reset() {
            const root = document.documentElement;
            [
                'eh-layout-managed', 'eh-app-left-open', 'eh-app-right-open', 'eh-app-both-open',
                'eh-layout-tight', 'eh-overlay-side-by-side', 'eh-overlay-stacked',
                'eh-overlay-main-open', 'eh-overlay-conversation-open', 'eh-app-panels-closed',
                'eh-overlay-side-left', 'eh-density-compact', 'eh-density-padrao', 'eh-density-confortavel',
                'eh-shadow-none', 'eh-shadow-suave', 'eh-shadow-normal'
            ].forEach(name => root.classList.remove(name));
            [
                '--eh-panel-width', '--eh-conversation-width', '--eh-overlay-edge', '--eh-overlay-gap',
                '--eh-overlay-top', '--eh-overlay-main-height', '--eh-overlay-conversation-height',
                '--eh-panel-opacity', '--eh-panel-radius', '--eh-wa-radius', '--eh-layout-transition',
                '--eh-left-active-space', '--eh-right-active-space',
                '--eh-left-logical-height', '--eh-right-logical-height'
            ].forEach(name => root.style.removeProperty(name));
            this.lastMetrics = null;
        }
    };

    // ============================================================
    // GERENCIADOR DE PAINÉIS — v5.58
    // Movimento/fixação independentes. Nunca altera app-root do E-Pass.
    // ============================================================
    EH.PanelManager = {
        KEY: 'panelManager.v1',
        drag: null,
        resize: null,
        handleDrag: null,
        bound: new WeakSet(),
        handleBound: new WeakSet(),
        resizeBound: new WeakSet(),

        defaults() {
            return {
                main: { mode: 'automatic', x: null, y: null, width: 370, height: 560, zoom: 100, dynamic: true, handleY: 30, allowDrag: true, allowResize: true },
                whatsapp: { mode: 'automatic', x: null, y: null, width: 320, height: 460, zoom: 100, dynamic: true, handleY: 55, allowDrag: true, allowResize: true },
                operation: { mode: 'bottom-right', x: null, y: null, width: 300, height: 285, zoom: 100, dynamic: true, handleY: 80, allowDrag: true, allowResize: true }
            };
        },

        normalizePanel(key, value = {}) {
            const fallback = this.defaults()[key] || this.defaults().main;
            const modes = ['automatic', 'free', 'left', 'right', 'top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
            const mode = modes.includes(String(value.mode || '')) ? String(value.mode) : fallback.mode;
            const limits = key === 'operation'
                ? { minW: 240, maxW: 480, minH: 210, maxH: 720 }
                : key === 'whatsapp'
                    ? { minW: 240, maxW: 560, minH: 240, maxH: 900 }
                    : { minW: 260, maxW: 600, minH: 300, maxH: 900 };
            const coordinate = (candidate, fallbackValue) => {
                if (candidate === null || candidate === undefined || candidate === '') return fallbackValue ?? null;
                const n = Number(candidate);
                return Number.isFinite(n) ? n : (fallbackValue ?? null);
            };
            return {
                mode,
                x: coordinate(value.x, fallback.x),
                y: coordinate(value.y, fallback.y),
                width: Math.min(limits.maxW, Math.max(limits.minW, Number(value.width) || fallback.width)),
                height: Math.min(limits.maxH, Math.max(limits.minH, Number(value.height) || fallback.height)),
                zoom: Math.min(150, Math.max(75, Number(value.zoom) || fallback.zoom)),
                dynamic: value.dynamic !== undefined ? EH.Utils.parseBoolean(value.dynamic, fallback.dynamic) : EH.Utils.parseBoolean(fallback.dynamic, false),
                handleY: (() => { const n = Number(value.handleY); const base = Number.isFinite(n) ? n : Number(fallback.handleY); return Math.min(90, Math.max(10, Number.isFinite(base) ? base : 50)); })(),
                allowDrag: value.allowDrag !== undefined ? EH.Utils.parseBoolean(value.allowDrag, fallback.allowDrag) : EH.Utils.parseBoolean(fallback.allowDrag, true),
                allowResize: value.allowResize !== undefined ? EH.Utils.parseBoolean(value.allowResize, fallback.allowResize) : EH.Utils.parseBoolean(fallback.allowResize, true)
            };
        },

        load() {
            const raw = EH.Storage.get(this.KEY, null) || {};
            const result = {};
            ['main', 'whatsapp', 'operation'].forEach(key => { result[key] = this.normalizePanel(key, raw[key] || {}); });
            return result;
        },

        save(all) {
            const normalized = {};
            ['main', 'whatsapp', 'operation'].forEach(key => { normalized[key] = this.normalizePanel(key, all?.[key] || {}); });
            EH.Storage.set(this.KEY, normalized);
            this.applyAll();
            return normalized;
        },

        get(key) { return this.load()[key] || this.normalizePanel(key, {}); },

        update(key, patch = {}) {
            const all = this.load();
            all[key] = this.normalizePanel(key, { ...all[key], ...patch });
            return this.save(all)[key];
        },

        restore(key) {
            const all = this.load();
            all[key] = this.defaults()[key];
            this.save(all);
            EH.Toast?.info?.(`Posição do painel ${this.label(key)} restaurada.`);
        },

        restoreAll() {
            EH.Storage.set(this.KEY, this.defaults());
            this.applyAll();
            EH.Toast?.info?.('Posições dos painéis restauradas.');
        },

        label(key) {
            return key === 'main' ? 'Atendimento' : key === 'whatsapp' ? 'WhatsApp' : 'Operação';
        },

        element(key) {
            if (key === 'main') return EH.UI?.root || document.querySelector('#eh-root');
            if (key === 'whatsapp') return EH.WhatsAppDock?.root || document.querySelector('#eh-wa-dock');
            return EH.OperationDock?.root || document.querySelector('#eh-operation-dock');
        },

        header(key) {
            const el = this.element(key);
            if (!el) return null;
            return key === 'main' ? el.querySelector('.eh-header')
                : key === 'whatsapp' ? el.querySelector('.eh-wa-dock-head')
                    : el.querySelector('.eh-operation-dock-head');
        },

        handleElement(key) {
            if (key === 'main') return EH.UI?.launcher || document.querySelector('#eh-launcher');
            if (key === 'whatsapp') return EH.WhatsAppDock?.handle || document.querySelector('#eh-wa-handle');
            return EH.OperationDock?.launcher || document.querySelector('#eh-operation-launcher');
        },

        limits(key) {
            return key === 'operation'
                ? { minW: 240, maxW: 480, minH: 210, maxH: 720 }
                : key === 'whatsapp'
                    ? { minW: 240, maxW: 560, minH: 240, maxH: 900 }
                    : { minW: 260, maxW: 600, minH: 300, maxH: 900 };
        },

        fixedSide(key, cfg = this.get(key)) {
            const mode = String(cfg?.mode || '');
            if (mode.includes('left') || mode === 'left') return 'left';
            if (mode.includes('right') || mode === 'right') return 'right';
            if (mode === 'free') {
                const el = this.element(key);
                const rect = el?.getBoundingClientRect?.();
                if (rect) return rect.left + rect.width / 2 < window.innerWidth / 2 ? 'left' : 'right';
            }
            return key === 'main' && EH.Config.OVERLAY_SIDE === 'left' ? 'left' : 'right';
        },

        resolvedHandleY(key, cfg = this.get(key)) {
            const side = this.fixedSide(key, cfg);
            { const n = Number(cfg?.handleY); var y = Math.min(90, Math.max(10, Number.isFinite(n) ? n : 50)); }
            const all = this.load();
            const occupied = [];
            ['main','whatsapp','operation'].forEach(otherKey => {
                if (otherKey === key) return;
                const other = all[otherKey];
                if (this.fixedSide(otherKey, other) !== side) return;
                { const n = Number(other?.handleY); occupied.push(Math.min(90, Math.max(10, Number.isFinite(n) ? n : 50))); }
            });
            occupied.sort((a,b) => a-b);
            for (let i = 0; i < 8; i++) {
                if (!occupied.some(other => Math.abs(other - y) < 7)) break;
                y = y <= 83 ? y + 7 : y - 7;
            }
            return Math.min(90, Math.max(10, y));
        },

        applyHandle(key) {
            const handle = this.handleElement(key);
            if (!handle) return;
            const cfg = this.get(key);
            const side = this.fixedSide(key, cfg);
            const y = this.resolvedHandleY(key, cfg);
            handle.style.setProperty('position', 'fixed', 'important');
            handle.style.setProperty('top', `${y}%`, 'important');
            handle.style.setProperty('bottom', 'auto', 'important');
            handle.style.setProperty('transform', 'translateY(-50%)', 'important');
            if (side === 'left') {
                handle.style.setProperty('left', '0', 'important');
                handle.style.setProperty('right', 'auto', 'important');
                handle.style.setProperty('border-radius', '0 8px 8px 0', 'important');
            } else {
                handle.style.setProperty('right', '0', 'important');
                handle.style.setProperty('left', 'auto', 'important');
                handle.style.setProperty('border-radius', '8px 0 0 8px', 'important');
            }
        },

        ensureResizeGrip(key) {
            const el = this.element(key);
            if (!el) return null;
            let grip = el.querySelector(':scope > .eh-panel-resize-grip');
            if (!grip) {
                grip = document.createElement('div');
                grip.className = 'eh-panel-resize-grip';
                grip.title = 'Arraste para redimensionar';
                grip.setAttribute('aria-hidden', 'true');
                el.appendChild(grip);
            }
            const cfg = this.get(key);
            grip.hidden = !cfg.allowResize;
            const mode = String(cfg.mode || 'automatic');
            const anchorRight = mode === 'right' || mode === 'top-right' || mode === 'bottom-right';
            const anchorBottom = mode === 'bottom' || mode === 'bottom-left' || mode === 'bottom-right';
            // A alça fica no canto oposto ao ponto fixo para o painel crescer para dentro da tela.
            grip.style.setProperty(anchorRight ? 'left' : 'right', '2px', 'important');
            grip.style.setProperty(anchorRight ? 'right' : 'left', 'auto', 'important');
            grip.style.setProperty(anchorBottom ? 'top' : 'bottom', '2px', 'important');
            grip.style.setProperty(anchorBottom ? 'bottom' : 'top', 'auto', 'important');
            grip.style.setProperty('cursor', anchorRight === anchorBottom ? 'nwse-resize' : 'nesw-resize', 'important');
            return grip;
        },

        dynamicSize(key) {
            const vw = Math.max(320, window.innerWidth || 1366);
            const vh = Math.max(480, window.innerHeight || 768);
            if (key === 'main') return {
                width: Math.round(Math.min(430, Math.max(290, vw * (vw < 900 ? .38 : .27)))),
                height: Math.round(Math.min(720, Math.max(390, vh * (vh < 700 ? .66 : .72)))),
                zoom: vw < 800 ? 90 : 100
            };
            if (key === 'whatsapp') return {
                width: Math.round(Math.min(420, Math.max(250, vw * (vw < 900 ? .34 : .23)))),
                height: Math.round(Math.min(690, Math.max(300, vh * (vh < 700 ? .58 : .66)))),
                zoom: vw < 800 ? 90 : 100
            };
            return {
                width: Math.round(Math.min(360, Math.max(250, vw * .22))),
                height: Math.round(Math.min(440, Math.max(230, vh * .38))),
                zoom: vw < 760 ? 90 : 100
            };
        },

        recommended(key) { return this.dynamicSize(key); },

        clearPositionOverrides(el) {
            if (!el) return;
            ['top','left','right','bottom','width','height','max-height','max-width'].forEach(prop => el.style.removeProperty(prop));
        },

        setImportant(el, prop, value) {
            if (!el) return;
            if (value === null || value === undefined || value === '') el.style.removeProperty(prop);
            else el.style.setProperty(prop, String(value), 'important');
        },

        applyContentZoom(key, percent) {
            const factor = Math.min(1.5, Math.max(.75, Number(percent) / 100 || 1));
            if (key === 'main' && EH.UI?.body) EH.UI.body.style.zoom = String(factor);
            if (key === 'operation' && EH.OperationDock?.body) EH.OperationDock.body.style.zoom = String(factor);
            if (key === 'whatsapp') {
                const root = this.element('whatsapp');
                if (!root) return;
                let wrap = root.querySelector(':scope > .eh-wa-scale-body');
                const head = root.querySelector(':scope > .eh-wa-dock-head');
                if (!wrap && head) {
                    wrap = document.createElement('div');
                    wrap.className = 'eh-wa-scale-body';
                    Array.from(root.children).filter(child => child !== head).forEach(child => wrap.appendChild(child));
                    root.appendChild(wrap);
                }
                if (wrap) wrap.style.zoom = String(factor);
            }
        },

        apply(key) {
            const el = this.element(key);
            if (!el) return;
            const cfg = this.get(key);
            const edge = window.innerWidth <= 760 ? 8 : 14;
            const viewportW = Math.max(320, window.innerWidth || 1366);
            const viewportH = Math.max(480, window.innerHeight || 768);
            const auto = this.dynamicSize(key);
            const width = cfg.dynamic ? auto.width : cfg.width;
            const height = cfg.dynamic ? auto.height : cfg.height;
            const zoom = cfg.dynamic ? auto.zoom : cfg.zoom;

            this.applyContentZoom(key, zoom);

            // AUTOMATIC separa posicionamento de dimensão.
            // - dynamic=true: conserva o layout responsivo aprovado do painel.
            // - dynamic=false: respeita largura/altura manuais sem trocar o modo/dock.
            // Uma posição x/y só é aplicada quando foi realmente gravada por um ARRASTE válido.
            if (cfg.mode === 'automatic' && key !== 'operation') {
                if (cfg.dynamic) {
                    ['width','height','max-height','max-width'].forEach(prop => el.style.removeProperty(prop));
                } else {
                    this.setImportant(el, 'width', `${Math.min(cfg.width, viewportW - edge * 2)}px`);
                    this.setImportant(el, 'height', `${Math.min(cfg.height, viewportH - edge * 2)}px`);
                    this.setImportant(el, 'max-height', `${viewportH - edge * 2}px`);
                    this.setImportant(el, 'max-width', `${viewportW - edge * 2}px`);
                }
                const hasManualPosition = cfg.x !== null && cfg.y !== null
                    && Number.isFinite(Number(cfg.x)) && Number.isFinite(Number(cfg.y));
                if (hasManualPosition) {
                    const rect = el.getBoundingClientRect();
                    const w = Math.max(1, rect.width || (cfg.dynamic ? width : cfg.width));
                    const h = Math.max(1, rect.height || (cfg.dynamic ? height : cfg.height));
                    const x = Math.min(viewportW - w - edge, Math.max(edge, Number(cfg.x)));
                    const y = Math.min(viewportH - h - edge, Math.max(edge, Number(cfg.y)));
                    this.setImportant(el, 'left', `${Math.round(x)}px`);
                    this.setImportant(el, 'top', `${Math.round(y)}px`);
                    this.setImportant(el, 'right', 'auto');
                    this.setImportant(el, 'bottom', 'auto');
                } else {
                    ['top','left','right','bottom'].forEach(prop => el.style.removeProperty(prop));
                }
                this.ensureResizeGrip(key);
                this.applyHandle(key);
                return;
            }

            this.setImportant(el, 'width', `${Math.min(width, viewportW - edge * 2)}px`);
            this.setImportant(el, 'height', `${Math.min(height, viewportH - edge * 2)}px`);
            this.setImportant(el, 'max-height', `${viewportH - edge * 2}px`);
            this.setImportant(el, 'max-width', `${viewportW - edge * 2}px`);

            const w = Math.min(width, viewportW - edge * 2);
            const h = Math.min(height, viewportH - edge * 2);
            let x = edge;
            let y = edge;
            switch (cfg.mode) {
                case 'free':
                    x = Math.min(viewportW - w - edge, Math.max(edge, Number.isFinite(Number(cfg.x)) ? Number(cfg.x) : edge));
                    y = Math.min(viewportH - h - edge, Math.max(edge, Number.isFinite(Number(cfg.y)) ? Number(cfg.y) : edge));
                    break;
                case 'left':
                    x = edge;
                    y = Math.min(viewportH - h - edge, Math.max(edge, Number.isFinite(Number(cfg.y)) ? Number(cfg.y) : Math.round((viewportH - h) / 2)));
                    break;
                case 'right':
                    x = viewportW - w - edge;
                    y = Math.min(viewportH - h - edge, Math.max(edge, Number.isFinite(Number(cfg.y)) ? Number(cfg.y) : Math.round((viewportH - h) / 2)));
                    break;
                case 'top':
                    x = Math.min(viewportW - w - edge, Math.max(edge, Number.isFinite(Number(cfg.x)) ? Number(cfg.x) : Math.round((viewportW - w) / 2)));
                    y = edge;
                    break;
                case 'bottom':
                    x = Math.min(viewportW - w - edge, Math.max(edge, Number.isFinite(Number(cfg.x)) ? Number(cfg.x) : Math.round((viewportW - w) / 2)));
                    y = viewportH - h - edge;
                    break;
                case 'top-left': x = edge; y = edge; break;
                case 'top-right': x = viewportW - w - edge; y = edge; break;
                case 'bottom-left': x = edge; y = viewportH - h - edge; break;
                case 'bottom-right': x = viewportW - w - edge; y = viewportH - h - edge; break;
                default:
                    if (key === 'operation') { x = viewportW - w - edge; y = viewportH - h - edge; }
                    else return;
            }
            this.setImportant(el, 'left', `${x}px`);
            this.setImportant(el, 'top', `${y}px`);
            this.setImportant(el, 'right', 'auto');
            this.setImportant(el, 'bottom', 'auto');
            this.ensureResizeGrip(key);
            this.applyHandle(key);
        },

        validateStored() {
            const raw = EH.Storage.get(this.KEY, null);
            if (!raw || typeof raw !== 'object') return this.load();
            const next = { ...raw };
            let changed = false;
            ['main','whatsapp','operation'].forEach(key => {
                const before = raw[key] && typeof raw[key] === 'object' ? raw[key] : {};
                const cfg = this.normalizePanel(key, before);
                const edge = 6;
                const width = cfg.dynamic ? this.dynamicSize(key).width : cfg.width;
                const height = cfg.dynamic ? this.dynamicSize(key).height : cfg.height;
                const maxX = Math.max(edge, Math.max(320, window.innerWidth || 1366) - Math.min(width, window.innerWidth - edge * 2) - edge);
                const maxY = Math.max(edge, Math.max(480, window.innerHeight || 768) - Math.min(height, window.innerHeight - edge * 2) - edge);
                if (cfg.x !== null) cfg.x = Math.round(Math.min(maxX, Math.max(edge, Number(cfg.x))));
                if (cfg.y !== null) cfg.y = Math.round(Math.min(maxY, Math.max(edge, Number(cfg.y))));
                next[key] = cfg;
                if (JSON.stringify(cfg) !== JSON.stringify(before)) changed = true;
            });
            if (changed) EH.Storage.set(this.KEY, next);
            return next;
        },

        applyAll() {
            ['main', 'whatsapp', 'operation'].forEach(key => this.apply(key));
        },

        bind(key) {
            const header = this.header(key);
            if (!header || this.bound.has(header)) return;
            this.bound.add(header);
            header.classList.add('eh-drag-handle');
            const threshold = 7;
            const blockedSelector = 'button, input, select, textarea, a, label, [role="button"], [contenteditable="true"], .eh-panel-resize-grip';

            header.addEventListener('pointerdown', event => {
                if (event.button !== 0) return;
                const cfg = this.get(key);
                if (!cfg.allowDrag) return;
                if (event.target?.closest?.(blockedSelector)) return;
                const el = this.element(key);
                if (!el) return;
                const rect = el.getBoundingClientRect();
                this.drag = {
                    key,
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    currentX: event.clientX,
                    currentY: event.clientY,
                    dx: event.clientX - rect.left,
                    dy: event.clientY - rect.top,
                    startRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
                    cfg: { ...cfg },
                    started: false
                };
                try { header.setPointerCapture?.(event.pointerId); }
                catch (error) { EH.Logger.debug('Painel: pointer capture indisponível no início do arraste:', error); }
            });

            header.addEventListener('pointermove', event => {
                const drag = this.drag;
                if (!drag || drag.key !== key || drag.pointerId !== event.pointerId) return;
                drag.currentX = event.clientX;
                drag.currentY = event.clientY;
                const deltaX = event.clientX - drag.startX;
                const deltaY = event.clientY - drag.startY;
                if (!drag.started) {
                    if (Math.hypot(deltaX, deltaY) < threshold) return;
                    drag.started = true;
                    document.documentElement.classList.add('eh-panel-dragging');
                }

                const el = this.element(key);
                if (!el) return;
                const rect = drag.startRect;
                const edge = 6;
                const maxX = Math.max(edge, window.innerWidth - rect.width - edge);
                const maxY = Math.max(edge, window.innerHeight - rect.height - edge);
                const mode = String(drag.cfg.mode || 'automatic');
                let x = Math.min(maxX, Math.max(edge, event.clientX - drag.dx));
                let y = Math.min(maxY, Math.max(edge, event.clientY - drag.dy));

                // MOVE altera somente posição. Tamanho, zoom, modo dinâmico e lado fixado permanecem intactos.
                if (mode === 'left' || mode === 'right') {
                    x = rect.left;
                } else if (mode === 'top' || mode === 'bottom') {
                    y = rect.top;
                } else if (mode === 'top-left' || mode === 'top-right' || mode === 'bottom-left' || mode === 'bottom-right') {
                    // Cantos fixos não são convertidos silenciosamente em modo livre.
                    return;
                }

                this.setImportant(el, 'left', `${Math.round(x)}px`);
                this.setImportant(el, 'top', `${Math.round(y)}px`);
                this.setImportant(el, 'right', 'auto');
                this.setImportant(el, 'bottom', 'auto');
                event.preventDefault();
            });

            const finish = event => {
                const drag = this.drag;
                if (!drag || drag.key !== key) return;
                this.drag = null;
                document.documentElement.classList.remove('eh-panel-dragging');
                try { header.releasePointerCapture?.(event.pointerId); }
                catch (error) { EH.Logger.debug('Painel: pointer capture já estava liberado:', error); }
                if (!drag.started) return; // clique normal: ZERO alterações.

                const el = this.element(key);
                const rect = el?.getBoundingClientRect?.();
                if (!rect) return;
                const mode = String(drag.cfg.mode || 'automatic');
                const patch = {};
                if (mode === 'left' || mode === 'right') {
                    patch.y = Math.round(rect.top);
                } else if (mode === 'top' || mode === 'bottom') {
                    patch.x = Math.round(rect.left);
                } else if (mode === 'automatic') {
                    // O modo automático pode receber uma posição manual sem alterar tamanho/zoom/dinâmico.
                    patch.x = Math.round(rect.left);
                    patch.y = Math.round(rect.top);
                } else if (mode === 'free') {
                    patch.x = Math.round(rect.left);
                    patch.y = Math.round(rect.top);
                }
                if (Object.keys(patch).length) this.update(key, patch);
            };
            header.addEventListener('pointerup', finish);
            header.addEventListener('pointercancel', finish);
        },

        bindHandle(key) {
            const handle = this.handleElement(key);
            if (!handle || this.handleBound.has(handle)) return;
            this.handleBound.add(handle);
            let moved = false;
            handle.addEventListener('pointerdown', event => {
                if (event.button !== 0) return;
                moved = false;
                this.handleDrag = { key, pointerId: event.pointerId, startY: event.clientY, currentY: event.clientY };
                handle.setPointerCapture?.(event.pointerId);
            });
            handle.addEventListener('pointermove', event => {
                if (!this.handleDrag || this.handleDrag.key !== key || this.handleDrag.pointerId !== event.pointerId) return;
                this.handleDrag.currentY = event.clientY;
                if (Math.abs(event.clientY - this.handleDrag.startY) < 4 && !moved) return;
                moved = true;
                const pct = Math.min(90, Math.max(10, (event.clientY / Math.max(1, window.innerHeight)) * 100));
                handle.style.setProperty('top', `${pct}%`, 'important');
                handle.style.setProperty('bottom', 'auto', 'important');
                handle.style.setProperty('transform', 'translateY(-50%)', 'important');
                event.preventDefault();
            });
            const finish = event => {
                if (!this.handleDrag || this.handleDrag.key !== key) return;
                if (moved) {
                    const pct = Math.min(90, Math.max(10, (this.handleDrag.currentY / Math.max(1, window.innerHeight)) * 100));
                    this.update(key, { handleY: Math.round(pct * 10) / 10 });
                    handle.dataset.ehHandleDraggedAt = String(Date.now());
                }
                this.handleDrag = null;
                try { handle.releasePointerCapture?.(event.pointerId); }
                catch (error) { EH.Logger.debug('Seta lateral: pointer capture já estava liberado:', error); }
            };
            handle.addEventListener('pointerup', finish);
            handle.addEventListener('pointercancel', finish);
            handle.addEventListener('click', event => {
                const draggedAt = Number(handle.dataset.ehHandleDraggedAt || 0);
                if (draggedAt && Date.now() - draggedAt < 350) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            }, true);
            this.applyHandle(key);
        },

        bindResize(key) {
            const grip = this.ensureResizeGrip(key);
            if (!grip || this.resizeBound.has(grip)) return;
            this.resizeBound.add(grip);
            const threshold = 4;
            grip.addEventListener('pointerdown', event => {
                if (event.button !== 0) return;
                const cfg = this.get(key);
                if (!cfg.allowResize) return;
                const el = this.element(key);
                if (!el) return;
                const rect = el.getBoundingClientRect();
                this.resize = {
                    key,
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    startW: rect.width,
                    startH: rect.height,
                    startLeft: rect.left,
                    startTop: rect.top,
                    cfg: { ...cfg },
                    started: false
                };
                try { grip.setPointerCapture?.(event.pointerId); }
                catch (error) { EH.Logger.debug('Resize: pointer capture indisponível:', error); }
                event.stopPropagation();
            });

            grip.addEventListener('pointermove', event => {
                const resize = this.resize;
                if (!resize || resize.key !== key || resize.pointerId !== event.pointerId) return;
                const dx = event.clientX - resize.startX;
                const dy = event.clientY - resize.startY;
                if (!resize.started) {
                    if (Math.hypot(dx, dy) < threshold) return;
                    resize.started = true;
                    document.documentElement.classList.add('eh-panel-resizing');
                }
                const el = this.element(key);
                if (!el) return;
                const limits = this.limits(key);
                const mode = String(resize.cfg.mode || 'automatic');
                const anchorRight = mode === 'right' || mode === 'top-right' || mode === 'bottom-right';
                const anchorBottom = mode === 'bottom' || mode === 'bottom-left' || mode === 'bottom-right';
                const widthDelta = anchorRight ? -dx : dx;
                const heightDelta = anchorBottom ? -dy : dy;
                const horizontalRoom = anchorRight
                    ? resize.startLeft + resize.startW - 6
                    : window.innerWidth - resize.startLeft - 6;
                const verticalRoom = anchorBottom
                    ? resize.startTop + resize.startH - 6
                    : window.innerHeight - resize.startTop - 6;
                const maxW = Math.max(limits.minW, Math.min(limits.maxW, horizontalRoom));
                const maxH = Math.max(limits.minH, Math.min(limits.maxH, verticalRoom));
                const width = Math.min(maxW, Math.max(limits.minW, resize.startW + widthDelta));
                const height = Math.min(maxH, Math.max(limits.minH, resize.startH + heightDelta));
                this.setImportant(el, 'width', `${Math.round(width)}px`);
                this.setImportant(el, 'height', `${Math.round(height)}px`);
                if (anchorRight) this.setImportant(el, 'left', `${Math.round(resize.startLeft + resize.startW - width)}px`);
                if (anchorBottom) this.setImportant(el, 'top', `${Math.round(resize.startTop + resize.startH - height)}px`);
                event.preventDefault();
                event.stopPropagation();
            });

            const finish = event => {
                const resize = this.resize;
                if (!resize || resize.key !== key) return;
                this.resize = null;
                document.documentElement.classList.remove('eh-panel-resizing');
                try { grip.releasePointerCapture?.(event.pointerId); }
                catch (error) { EH.Logger.debug('Resize: pointer capture já estava liberado:', error); }
                if (!resize.started) return;

                const el = this.element(key);
                const rect = el?.getBoundingClientRect?.();
                if (!rect) return;
                // RESIZE altera dimensão; nunca muda dock/lado/zoom.
                // Ajuste manual desliga somente o tamanho dinâmico para respeitar o usuário.
                this.update(key, {
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    dynamic: false
                });
            };
            grip.addEventListener('pointerup', finish);
            grip.addEventListener('pointercancel', finish);
        },

        bindAll() {
            this.validateStored();
            ['main','whatsapp','operation'].forEach(key => {
                this.bind(key);
                this.bindHandle(key);
                this.bindResize(key);
            });
            this.applyAll();
        }
    };

    // ============================================================
    // ESTILO
    // ============================================================
    EH.Style = {
        inject() {
            GM_addStyle(`
                :root {
                    --eh-bg: #17191f;
                    --eh-bg-2: #20232b;
                    --eh-border: #343946;
                    --eh-text: #f4f6fa;
                    --eh-muted: #aeb5c2;
                    --eh-primary: #3d8bfd;
                    --eh-success: #35b879;
                    --eh-warning: #e7a83a;
                    --eh-danger: #e35d6a;
                    --eh-wa-base: 360px;
                    --eh-panel-base: 228px;
                    --eh-panel-zoom: 1.5;
                    --eh-wa-zoom: 1.1;
                    --eh-left-logical-height: 66.6667vh;
                    --eh-right-logical-height: 90.9091vh;
                    --eh-left-active-space: 0px;
                    --eh-right-active-space: 0px;
                    --eh-layout-transition: 180ms;
                }

                #eh-root, #eh-root *, #eh-operation-dock, #eh-operation-dock *, #eh-wa-dock, #eh-wa-dock * { box-sizing: border-box; }
                .eh-drag-handle { cursor: grab !important; touch-action: none; }
                .eh-panel-resize-grip {
                    position:absolute; right:2px; bottom:2px; width:16px; height:16px;
                    z-index:2147483640; cursor:nwse-resize; touch-action:none;
                    border-radius:0 0 7px 0; opacity:.42;
                    background:linear-gradient(135deg,transparent 0 50%,rgba(76,92,112,.55) 52% 58%,transparent 60% 68%,rgba(76,92,112,.55) 70% 76%,transparent 78%);
                }
                .eh-panel-resize-grip:hover { opacity:.9; }
                html.eh-panel-dragging, html.eh-panel-resizing { user-select:none !important; }
                html.eh-panel-dragging, html.eh-panel-dragging * { cursor: grabbing !important; user-select: none !important; }
                .eh-wa-scale-body { min-height:0; flex:1 1 auto; display:flex; flex-direction:column; overflow:hidden; transform-origin:top left; }

                /* Componentes do painel esquerdo. Posicionamento e dimensões ficam
                   exclusivamente no bloco de layout abaixo. */
                #eh-root {
                    font-family: Inter, "Segoe UI", Arial, sans-serif;
                    color: var(--eh-text);
                    user-select: none;
                }
                #eh-root .eh-title, #eh-root .eh-version { display: none !important; }
                #eh-root .eh-icon-btn {
                    width: 28px;
                    height: 28px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    border: 0;
                    border-radius: 7px;
                    background: transparent;
                    color: var(--eh-muted);
                    cursor: pointer;
                    font-size: 14px;
                    line-height: 1;
                }
                #eh-root .eh-icon-btn:hover { background: var(--eh-bg-2); color: var(--eh-text); }
                #eh-root .eh-body[hidden] { display: none !important; }
                #eh-root .eh-actions { display: grid; gap: 6px; }
                #eh-root .eh-btn {
                    width: 100%;
                    min-height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 7px;
                    padding: 7px 8px;
                    border: 1px solid var(--eh-border);
                    border-radius: 8px;
                    background: var(--eh-bg-2);
                    color: var(--eh-text);
                    cursor: pointer;
                    font: inherit;
                    font-size: 10px;
                    font-weight: 750;
                    letter-spacing: .15px;
                    text-align: left;
                    transition: transform .14s ease, border-color .14s ease, background .14s ease;
                }
                #eh-root .eh-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    border-color: #4d5565;
                    background: #272b35;
                }
                #eh-root .eh-btn:disabled { opacity: .38; cursor: not-allowed; }
                #eh-root .eh-btn.eh-primary { border-color: rgba(61, 139, 253, .48); }
                #eh-root .eh-btn.eh-success { border-color: rgba(53, 184, 121, .48); }
                #eh-root .eh-btn-icon { width: 18px; text-align: center; font-size: 13px; }
                #eh-root .eh-status {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    color: var(--eh-muted);
                    font-size: 9px;
                }
                #eh-root .eh-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: var(--eh-warning);
                    box-shadow: 0 0 0 3px rgba(231, 168, 58, .12);
                }
                #eh-root .eh-dot.active {
                    background: var(--eh-success);
                    box-shadow: 0 0 0 3px rgba(53, 184, 121, .12);
                }

                #eh-toast-area {
                    position: fixed;
                    z-index: 2147483647;
                    top: 16px;
                    right: 16px;
                    width: min(360px, calc(100vw - 32px));
                    display: grid;
                    gap: 8px;
                    pointer-events: none;
                    font-family: Inter, "Segoe UI", Arial, sans-serif;
                }

                .eh-toast {
                    display: flex;
                    align-items: flex-start;
                    gap: 9px;
                    padding: 11px 12px;
                    border: 1px solid #343946;
                    border-radius: 10px;
                    background: rgba(23, 25, 31, .97);
                    color: #f4f6fa;
                    box-shadow: 0 12px 34px rgba(0, 0, 0, .32);
                    pointer-events: auto;
                    font-size: 12px;
                    line-height: 1.4;
                    animation: eh-in .18s ease-out;
                }

                .eh-toast.success { border-left: 4px solid var(--eh-success); }
                .eh-toast.error { border-left: 4px solid var(--eh-danger); }
                .eh-toast.warning { border-left: 4px solid var(--eh-warning); }
                .eh-toast.info { border-left: 4px solid var(--eh-primary); }
                .eh-toast-text { flex: 1; user-select: text; }
                .eh-toast-close { border: 0; background: transparent; color: #aeb5c2; cursor: pointer; }

                @keyframes eh-in {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .eh-overlay {
                    position: fixed;
                    z-index: 2147483500;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 18px;
                    background: rgba(8, 10, 14, .76);
                    backdrop-filter: blur(4px);
                    font-family: Inter, "Segoe UI", Arial, sans-serif;
                }

                .eh-modal {
                    width: min(900px, 96vw);
                    max-height: 92vh;
                    overflow: auto;
                    border: 1px solid #343946;
                    border-radius: 14px;
                    background: #fff;
                    color: #1f2430;
                    box-shadow: 0 22px 70px rgba(0, 0, 0, .48);
                }

                .eh-modal-head {
                    position: sticky;
                    top: 0;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 14px;
                    border-bottom: 1px solid #e3e6ec;
                    background: rgba(255, 255, 255, .98);
                }

                .eh-modal-title { flex: 1; font-size: 14px; font-weight: 800; }
                .eh-modal-note { margin-top: 2px; color: #687182; font-size: 11px; }
                .eh-modal-close { border: 0; background: #eef1f5; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; }
                .eh-modal-content { padding: 14px; }

                .eh-preview-image {
                    display: block;
                    max-width: 100%;
                    height: auto;
                    margin: 0 auto;
                    border: 1px solid #dfe3ea;
                    border-radius: 8px;
                    background: #fff;
                }

                .eh-modal-actions {
                    position: sticky;
                    bottom: 0;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding: 11px 14px;
                    border-top: 1px solid #e3e6ec;
                    background: rgba(255, 255, 255, .98);
                }

                .eh-modal-btn {
                    min-height: 36px;
                    padding: 8px 12px;
                    border: 1px solid #cfd5df;
                    border-radius: 8px;
                    background: #f6f7f9;
                    color: #1f2430;
                    cursor: pointer;
                    font: inherit;
                    font-size: 12px;
                    font-weight: 700;
                }

                .eh-modal-btn.primary { border-color: #2f77df; background: #3d8bfd; color: white; }
                .eh-modal-btn.success { border-color: #2a9d66; background: #35b879; color: white; }
                .eh-modal-btn.danger { border-color: #d9a3a8; color: #a7303b; }

                .eh-settings-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 12px;
                }

                .eh-field { display: grid; gap: 5px; }
                .eh-field label { font-size: 11px; font-weight: 800; color: #4e5766; }
                .eh-field input[type="number"] {
                    width: 100%;
                    padding: 9px 10px;
                    border: 1px solid #cfd5df;
                    border-radius: 8px;
                    font: inherit;
                }

                .eh-check { display: flex; align-items: center; gap: 8px; font-size: 12px; }
                .eh-help-box {
                    margin-top: 13px;
                    padding: 10px 11px;
                    border-radius: 8px;
                    background: #f2f5f9;
                    color: #596273;
                    font-size: 11px;
                    line-height: 1.5;
                }

                .eh-capture-overlay {
                    position: fixed;
                    z-index: 2147483400;
                    inset: 0;
                    overflow: auto;
                    padding: 22px;
                    background: #e9edf2;
                }

                .eh-capture-message {
                    position: fixed;
                    z-index: 2147483402;
                    right: 18px;
                    bottom: 18px;
                    padding: 9px 12px;
                    border-radius: 9px;
                    background: #17191f;
                    color: white;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, .28);
                    font: 700 11px Inter, "Segoe UI", Arial, sans-serif;
                }

                .eh-capture-stage {
                    width: max-content;
                    min-width: 720px;
                    margin: 0 auto;
                    padding: 22px;
                    background: #fff;
                    color: #1f2430;
                    font-family: "Segoe UI", Arial, sans-serif;
                }

                .eh-capture-title {
                    margin-bottom: 14px;
                    padding-bottom: 11px;
                    border-bottom: 2px solid #e8ebf0;
                }

                .eh-capture-title strong { display: block; font-size: 19px; }
                .eh-capture-title span { display: block; margin-top: 3px; color: #667080; font-size: 12px; }
                .eh-capture-stage table { margin: 0 !important; background: white !important; }
                .eh-capture-stage button { pointer-events: none !important; }

                .eh-reserva-layout {
                    display: flex;
                    align-items: flex-start;
                    gap: 20px;
                }

                .eh-reserva-map { flex: 0 0 auto; }
                .eh-reserva-info {
                    flex: 0 0 390px;
                    padding: 12px;
                    border: 1px solid #e3e6ec;
                    border-radius: 10px;
                    background: #f7f8fa;
                }

                .eh-legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px 15px;
                    margin-top: 15px;
                    padding-top: 12px;
                    border-top: 1px solid #e3e6ec;
                    font-size: 11px;
                }

                .eh-legend-item { display: flex; align-items: center; gap: 6px; }
                .eh-legend-color { width: 14px; height: 14px; border-radius: 4px; border: 1px solid rgba(0,0,0,.15); }
                .eh-legend-color.livre { background: #243c63; }
                .eh-legend-color.ocupada { background: #f28c28; }
                .eh-legend-color.reservada { background: #f2cf3a; }
                .eh-legend-color.selecionada { background: #35b879; }

                /* =====================================================
                   CAPTURA ORGANIZADA PARA ATENDIMENTO AO CLIENTE
                   ===================================================== */
                .eh-capture-stage {
                    border-radius: 15px;
                    box-shadow: 0 16px 45px rgba(25, 35, 50, .13);
                }

                .eh-horarios-card {
                    width: 980px;
                    overflow: hidden;
                    border: 1px solid #dce2ea;
                    border-radius: 12px;
                    background: #fff;
                }

                .eh-horarios-table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    table-layout: fixed;
                    background: #fff !important;
                    color: #222936;
                    font-size: 14px;
                }

                .eh-horarios-table col:nth-child(1) { width: 36%; }
                .eh-horarios-table col:nth-child(2) { width: 18%; }
                .eh-horarios-table col:nth-child(3) { width: 18%; }
                .eh-horarios-table col:nth-child(4) { width: 18%; }

                .eh-horarios-table thead th {
                    padding: 14px 16px;
                    border: 0 !important;
                    border-right: 1px solid rgba(255,255,255,.10) !important;
                    background: #263349 !important;
                    color: #fff !important;
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: .25px;
                    line-height: 1.25;
                    text-align: left;
                    text-transform: uppercase;
                    white-space: normal;
                }

                .eh-horarios-table thead th:last-child {
                    border-right: 0 !important;
                    text-align: right;
                }

                .eh-horarios-table thead th:nth-child(2),
                .eh-horarios-table thead th:nth-child(3),
                .eh-horarios-table tbody td:nth-child(2),
                .eh-horarios-table tbody td:nth-child(3) {
                    text-align: center;
                }

                .eh-horarios-table tbody tr:nth-child(even) {
                    background: #f7f9fc;
                }

                .eh-horarios-table tbody td {
                    padding: 15px 16px;
                    border: 0 !important;
                    border-bottom: 1px solid #e3e8ef !important;
                    vertical-align: middle;
                    line-height: 1.35;
                    overflow-wrap: normal;
                    word-break: normal;
                }

                .eh-horarios-table tbody tr:last-child td {
                    border-bottom: 0 !important;
                }

                .eh-horarios-table tbody td:last-child {
                    text-align: right;
                }

                .eh-time-value {
                    color: #202735;
                    font-size: 17px;
                    font-weight: 850;
                    white-space: nowrap;
                }

                .eh-company-name {
                    color: #202735;
                    font-size: 14px;
                    font-weight: 850;
                    text-transform: uppercase;
                    line-height: 1.18;
                    letter-spacing: 0 !important;
                    word-spacing: 1px;
                    font-family: Arial, 'Segoe UI', sans-serif !important;
                }

                .eh-vehicle-type {
                    margin-top: 6px;
                    color: #687386;
                    font-size: 11px;
                    font-weight: 700;
                    line-height: 1.42;
                    text-transform: uppercase;
                    white-space: normal;
                    word-break: keep-all;
                    overflow-wrap: normal;
                    max-width: 360px;
                    letter-spacing: 0 !important;
                    word-spacing: 1.2px;
                    font-family: Arial, 'Segoe UI', sans-serif !important;
                }

                .eh-vehicle-type-line + .eh-vehicle-type-line {
                    margin-top: 2px;
                }

                .eh-price-value {
                    display: inline-block;
                    padding: 7px 10px;
                    border: 1px solid #cce4d7;
                    border-radius: 8px;
                    background: #edf8f2;
                    color: #167447;
                    font-size: 16px;
                    font-weight: 900;
                    white-space: nowrap;
                }

                .eh-capture-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    margin-top: 11px;
                    color: #788294;
                    font-size: 10px;
                }

                .eh-capture-footer strong {
                    color: #566174;
                }

                .eh-reserva-layout {
                    width: 1080px;
                    align-items: stretch;
                }

                .eh-reserva-map-card {
                    flex: 1 1 auto;
                    min-width: 540px;
                    padding: 15px;
                    border: 1px solid #dce2ea;
                    border-radius: 12px;
                    background: #fff;
                }

                .eh-reserva-section-title {
                    margin: 0 0 12px;
                    padding-bottom: 9px;
                    border-bottom: 1px solid #e4e8ee;
                    color: #283347;
                    font-size: 13px;
                    font-weight: 900;
                    letter-spacing: .2px;
                    text-transform: uppercase;
                }

                .eh-reserva-map-card .eh-reserva-map {
                    display: flex;
                    justify-content: center;
                    padding: 5px;
                }

                .eh-reserva-summary {
                    flex: 0 0 410px;
                    display: grid;
                    align-content: start;
                    gap: 12px;
                }

                .eh-summary-card {
                    padding: 14px;
                    border: 1px solid #dce2ea;
                    border-radius: 12px;
                    background: #fff;
                }

                .eh-info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 9px;
                }

                .eh-info-item {
                    min-height: 63px;
                    padding: 9px 10px;
                    border-radius: 9px;
                    background: #f5f7fa;
                }

                .eh-info-label {
                    display: block;
                    margin-bottom: 4px;
                    color: #778194;
                    font-size: 9px;
                    font-weight: 850;
                    letter-spacing: .3px;
                    text-transform: uppercase;
                }

                .eh-info-value {
                    display: block;
                    color: #252d3a;
                    font-size: 13px;
                    font-weight: 850;
                    line-height: 1.3;
                    overflow-wrap: normal;
                    word-break: normal;
                }

                .eh-info-value.money {
                    color: #167447;
                    font-size: 15px;
                }

                .eh-seat-stats {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 7px;
                }

                .eh-seat-stat {
                    padding: 9px 5px;
                    border: 1px solid #e0e5ec;
                    border-radius: 9px;
                    text-align: center;
                    background: #f8fafc;
                }

                .eh-seat-stat strong {
                    display: block;
                    color: #252d3a;
                    font-size: 17px;
                    line-height: 1;
                }

                .eh-seat-stat span {
                    display: block;
                    margin-top: 5px;
                    color: #707b8e;
                    font-size: 8px;
                    font-weight: 850;
                    text-transform: uppercase;
                }

                .eh-seat-stat.free { border-top: 4px solid #243c63; }
                .eh-seat-stat.occupied { border-top: 4px solid #f28c28; }
                .eh-seat-stat.reserved { border-top: 4px solid #f2cf3a; }
                .eh-seat-stat.selected { border-top: 4px solid #35b879; }

                .eh-seat-groups {
                    display: grid;
                    gap: 9px;
                    margin-top: 11px;
                }

                .eh-seat-group {
                    padding: 9px 10px;
                    border-radius: 9px;
                    background: #f5f7fa;
                }

                .eh-seat-group-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 6px;
                    color: #596579;
                    font-size: 9px;
                    font-weight: 900;
                    text-transform: uppercase;
                }

                .eh-seat-list {
                    color: #273142;
                    font-size: 11px;
                    font-weight: 750;
                    line-height: 1.55;
                    overflow-wrap: normal;
                    word-break: normal;
                }

                .eh-seat-list.empty {
                    color: #8a94a5;
                    font-style: italic;
                    font-weight: 600;
                }

                .eh-reserva-summary .eh-legend {
                    margin-top: 0;
                    padding-top: 0;
                    border-top: 0;
                    gap: 8px 12px;
                }

                .eh-ticket-choice {
                    position: relative !important;
                    outline: 3px solid rgba(61, 139, 253, .86) !important;
                    outline-offset: -3px;
                    box-shadow: 0 0 0 6px rgba(61, 139, 253, .12) !important;
                }

                .eh-ticket-pick-btn {
                    position: absolute;
                    z-index: 2147483200;
                    top: 10px;
                    right: 10px;
                    min-height: 36px;
                    padding: 8px 12px;
                    border: 1px solid #1f66c2;
                    border-radius: 9px;
                    background: #2878df;
                    color: #fff;
                    box-shadow: 0 8px 24px rgba(21, 62, 117, .28);
                    cursor: pointer;
                    font: 800 11px Arial, sans-serif;
                    letter-spacing: .2px;
                }

                .eh-ticket-pick-btn:hover {
                    background: #1f69c9;
                }

                .eh-ticket-capture-stage {
                    min-width: 0 !important;
                    padding: 0 !important;
                    border-radius: 0 !important;
                    background: #fff !important;
                    box-shadow: none !important;
                    color: #242424 !important;
                    font-family: Arial, "Segoe UI", sans-serif !important;
                    font-size: 14px !important;
                    line-height: 1.4 !important;
                    text-rendering: auto !important;
                }

                .eh-ticket-capture-stage *,
                .eh-ticket-capture-stage *::before,
                .eh-ticket-capture-stage *::after {
                    box-sizing: border-box !important;
                }

                .eh-message-box {
                    margin-top: 12px;
                    padding: 11px 12px;
                    border: 1px solid #dfe4eb;
                    border-radius: 9px;
                    background: #f7f9fc;
                    color: #293346;
                    font-size: 12px;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    user-select: text;
                }

                .eh-field textarea,
                .eh-field input[type="text"],
                .eh-field input[type="tel"] {
                    width: 100%;
                    min-height: 38px;
                    padding: 9px 10px;
                    border: 1px solid #cfd5df;
                    border-radius: 8px;
                    background: #fff;
                    color: #1f2430;
                    font: inherit;
                    resize: vertical;
                }

                .eh-route-list,
                .eh-history-list {
                    display: grid;
                    gap: 9px;
                }

                .eh-route-card,
                .eh-history-card {
                    padding: 11px 12px;
                    border: 1px solid #dfe4eb;
                    border-radius: 10px;
                    background: #f7f9fc;
                }

                .eh-route-title,
                .eh-history-title {
                    color: #253047;
                    font-size: 12px;
                    font-weight: 850;
                }

                .eh-route-note,
                .eh-history-note {
                    margin-top: 5px;
                    color: #687386;
                    font-size: 10px;
                    line-height: 1.45;
                }

                .eh-inline-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 7px;
                    margin-top: 9px;
                }

                .eh-mini-btn {
                    min-height: 30px;
                    padding: 6px 9px;
                    border: 1px solid #ccd3dd;
                    border-radius: 7px;
                    background: #fff;
                    color: #273142;
                    cursor: pointer;
                    font: 700 10px Arial, sans-serif;
                }

                .eh-mini-btn.primary { background:#3d8bfd; border-color:#2f77df; color:#fff; }
                .eh-mini-btn.danger { color:#a7303b; border-color:#e0b5ba; }

                .eh-section-label {
                    margin: 14px 0 8px;
                    color: #475266;
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: .3px;
                }

                @media (max-width: 700px) {
                    .eh-settings-grid { grid-template-columns: 1fr; }
                    .eh-modal-actions { flex-direction: column; }
                    .eh-modal-btn { width: 100%; }
                }

                /* Gaveta lateral discreta: script à esquerda, E-Pass no centro */
                #eh-root {
                    position: fixed !important;
                    left: 0 !important;
                    right: auto !important;
                    top: 0 !important;
                    width: var(--eh-panel-base, 228px) !important;
                    height: var(--eh-left-logical-height, 100vh) !important;
                    zoom: var(--eh-panel-zoom, 1);
                    z-index: 2147483000;
                    font-family: Inter, "Segoe UI", Arial, sans-serif !important;
                    transform: translateX(0);
                    transition: transform var(--eh-layout-transition, 180ms) ease, opacity var(--eh-layout-transition, 180ms) ease;
                    will-change: transform;
                }
                #eh-root.eh-collapsed {
                    width: var(--eh-panel-base, 228px) !important;
                    transform: translateX(calc(-100% - 8px));
                    opacity: 0;
                    pointer-events: none;
                }
                #eh-root .eh-panel {
                    height: 100%;
                    border: 0;
                    border-right: 1px solid #2f3540;
                    border-radius: 0;
                    display: flex;
                    flex-direction: column;
                    background: rgba(18, 21, 27, .985);
                    box-shadow: 10px 0 28px rgba(0,0,0,.18);
                }
                #eh-root .eh-header {
                    min-height: 38px;
                    display: flex;
                    align-items: center;
                    padding: 5px 6px;
                    cursor: default;
                    flex: 0 0 auto;
                    justify-content: flex-end;
                    gap: 3px;
                    background: #101319;
                    border-bottom: 1px solid #292f39;
                }
                #eh-root .eh-body {
                    flex: 1 1 auto;
                    overflow-y: auto;
                    min-height: 0;
                    padding: 8px;
                    scrollbar-width: thin;
                }
                #eh-root .eh-panel-footer {
                    flex: 0 0 auto;
                    padding: 6px 8px;
                    border-top: 1px solid #292f39;
                    background: #101319;
                }
                #eh-root .eh-flow-section {
                    margin: 0 0 7px;
                    border: 1px solid #2d3540;
                    border-radius: 7px;
                    background: #151a21;
                    overflow: hidden;
                }
                #eh-root .eh-flow-section > summary {
                    padding: 6px 8px;
                    cursor: pointer;
                    list-style: none;
                    color: #9ba6b7;
                    font-size: 8.5px;
                    font-weight: 850;
                    letter-spacing: .3px;
                    text-transform: uppercase;
                }
                #eh-root .eh-flow-section > summary::-webkit-details-marker { display:none; }
                #eh-root .eh-flow-section > summary::after { content:'＋'; float:right; color:#778396; }
                #eh-root .eh-flow-section[open] > summary::after { content:'−'; }
                #eh-root .eh-flow-section .eh-steps { margin: 0; padding: 0 6px 6px; }

                #eh-launcher {
                    position: fixed;
                    z-index: 2147482999;
                    left: 0;
                    right: auto;
                    top: 46%;
                    width: 16px;
                    height: 54px;
                    padding: 0;
                    border: 1px solid rgba(70,79,94,.55);
                    border-left: 0;
                    border-radius: 0 8px 8px 0;
                    background: rgba(18,21,27,.30);
                    color: rgba(255,255,255,.62);
                    box-shadow: 3px 0 10px rgba(0,0,0,.08);
                    cursor: pointer;
                    opacity: .28;
                    transition: width .16s ease, opacity .16s ease, background .16s ease;
                    font: 800 15px/1 Arial,sans-serif;
                }
                #eh-launcher:hover, #eh-launcher:focus-visible {
                    width: 24px;
                    opacity: .92;
                    background: rgba(18,21,27,.94);
                    outline: none;
                }
                #eh-launcher[hidden] { display:none !important; }

                .eh-dock-title { margin: 7px 1px 6px; font-size: 9px; font-weight: 900; color: #9ba6b7; letter-spacing:.45px; text-transform:uppercase; }
                .eh-steps { display:grid; grid-template-columns:repeat(5,1fr); gap:3px; margin-bottom:8px; }
                .eh-step { padding:4px 1px; border:1px solid #303743; border-radius:6px; text-align:center; color:#727d8f; font-size:7px; line-height:1.15; background:#181c23; }
                .eh-step strong { display:block; font-size:10px; line-height:1.05; }
                .eh-step.active { color:#fff; border-color:#3d8bfd; background:#223654; }
                .eh-whatsapp-row { display:grid; grid-template-columns:minmax(0,1fr) 48px 34px; gap:5px; margin-bottom:8px; }
                .eh-dock-phone { width:100%; min-width:0; height:34px; padding:6px 8px; border:1px solid #343c48; border-radius:7px; background:#0e1116; color:#fff; font:inherit; font-size:10px; margin:0; }
                .eh-wa-mode, .eh-wa-open { height:34px; border:1px solid #3b4655; border-radius:7px; background:#202630; color:#eef3fa; cursor:pointer; font:800 9px Arial,sans-serif; }
                .eh-wa-mode.connected { border-color:#2f9e69; background:#183229; color:#dff8ea; }
                .eh-wa-mode:hover, .eh-wa-open:hover { border-color:#35b879; background:#25352e; }
                .eh-wa-open { font-size:15px; }
                .eh-quick-routes { display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:8px; }
                .eh-route-quick { width:100%; min-height:35px; padding:6px 7px; border:1px solid #323a46; border-radius:7px; background:#1c222b; color:#eef2f8; cursor:pointer; font-size:9px; font-weight:800; line-height:1.25; text-align:left; }
                .eh-route-quick:hover { border-color:#3d8bfd; background:#222d3b; }
                .eh-route-quick.eh-route-running { border-color:#35b879; background:#183329; }
                .eh-context-card { padding:8px; margin-bottom:8px; border:1px solid #303743; border-radius:8px; background:#0f1217; color:#cfd6e2; font-size:9.5px; line-height:1.42; }
                .eh-context-card strong { display:block; margin-bottom:3px; color:#fff; font-size:10.5px; }
                .eh-context-actions { display:grid; gap:5px; margin-top:7px; }
                .eh-context-btn { width:100%; min-height:31px; padding:6px 8px; border:1px solid #3b4554; border-radius:7px; background:#20262f; color:#fff; cursor:pointer; font-size:9.5px; font-weight:800; text-align:left; }
                .eh-context-more { margin-top:7px; border-top:1px solid #2c323c; padding-top:6px; }
                .eh-context-more > summary { list-style:none; cursor:pointer; color:#98a3b3; font-size:8.5px; font-weight:800; }
                .eh-context-more > summary::-webkit-details-marker { display:none; }
                .eh-context-more > summary::after { content:'＋'; float:right; color:#738093; }
                .eh-context-more[open] > summary::after { content:'−'; }
                .eh-context-actions-secondary { margin-top:6px; }
                .eh-context-btn.primary { border-color:#397bdd; background:#223957; }
                .eh-context-btn.success { border-color:#2f9e69; background:#16382a; }
                .eh-context-btn:disabled { opacity:.38; cursor:not-allowed; filter:grayscale(.25); }
                .eh-pix-mini { display:block; width:128px; max-width:100%; margin:7px auto; border:4px solid #fff; border-radius:7px; background:#fff; }
                .eh-tools-divider { height:1px; background:#2c323c; margin:8px 0 6px; }
                #eh-root .eh-actions-primary { grid-template-columns:1fr 1fr; }
                #eh-root .eh-actions-secondary { grid-template-columns:1fr 1fr; }
                @media (max-width: 720px) {
                    .eh-quick-routes { grid-template-columns:1fr; }
                    #eh-launcher { top:auto; bottom:22%; }
                }

                .eh-more-tools { margin-top:6px; border:1px solid #2d3540; border-radius:7px; overflow:hidden; background:#151a21; }
                .eh-more-tools > summary { padding:7px 8px; cursor:pointer; color:#aeb8c7; font-size:9px; font-weight:800; list-style:none; }
                .eh-more-tools > summary::-webkit-details-marker { display:none; }
                .eh-more-tools > summary::after { content:'＋'; float:right; color:#778396; }
                .eh-more-tools[open] > summary::after { content:'−'; }
                .eh-actions-secondary { padding:0 6px 6px; }

                /* WhatsApp Web integrado à direita do E-Pass */
                #eh-wa-dock, #eh-wa-dock * { box-sizing: border-box; }
                #eh-wa-dock {
                    position: fixed;
                    z-index: 2147482500;
                    top: 0;
                    right: 0;
                    width: var(--eh-wa-base, 360px);
                    height: var(--eh-right-logical-height, 100vh);
                    zoom: var(--eh-wa-zoom, 1);
                    display: grid;
                    grid-template-rows: 42px minmax(135px, 34%) minmax(0, 1fr) auto auto;
                    border-left: 1px solid #26343a;
                    background: #efeae2;
                    color: #111b21;
                    font-family: "Segoe UI", Arial, sans-serif;
                    box-shadow: -10px 0 30px rgba(0,0,0,.10);
                    overflow: hidden;
                }
                #eh-wa-dock.eh-wa-collapsed { display:none !important; }
                .eh-wa-dock-head {
                    display:flex;
                    align-items:center;
                    gap:8px;
                    min-width:0;
                    padding:0 8px 0 11px;
                    border-bottom:1px solid #d8dedf;
                    background:#f0f2f5;
                }
                .eh-wa-brand { display:flex; align-items:center; gap:7px; min-width:0; font-size:12px; }
                .eh-wa-brand strong { white-space:nowrap; }
                .eh-wa-status-dot { width:8px; height:8px; border-radius:50%; background:#9aa5aa; box-shadow:0 0 0 3px rgba(154,165,170,.15); }
                #eh-wa-dock.eh-wa-ready .eh-wa-status-dot { background:#25d366; box-shadow:0 0 0 3px rgba(37,211,102,.16); }
                #eh-wa-dock.eh-wa-no-chat .eh-wa-status-dot, #eh-wa-dock.eh-wa-loading .eh-wa-status-dot { background:#e7a83a; box-shadow:0 0 0 3px rgba(231,168,58,.16); }
                #eh-wa-dock.eh-wa-disconnected .eh-wa-status-dot { background:#e35d6a; box-shadow:0 0 0 3px rgba(227,93,106,.16); }
                .eh-wa-status-text { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#667781; font-size:9px; text-align:right; }
                .eh-wa-collapse { width:28px; height:28px; border:0; border-radius:7px; background:transparent; color:#54656f; cursor:pointer; font-size:20px; line-height:1; }
                .eh-wa-collapse:hover { background:#e3e7e9; }
                .eh-wa-chats { min-height:0; display:grid; grid-template-rows:42px minmax(0,1fr); border-bottom:1px solid #d8dedf; background:#fff; }
                .eh-wa-search { width:calc(100% - 16px); height:30px; margin:6px 8px; padding:0 11px; border:0; border-radius:8px; outline:none; background:#f0f2f5; color:#111b21; font:11px "Segoe UI",Arial,sans-serif; }
                .eh-wa-chat-list { min-height:0; overflow:auto; scrollbar-width:thin; }
                .eh-wa-chat { width:100%; min-height:50px; display:grid; grid-template-columns:34px minmax(0,1fr) auto; align-items:center; gap:8px; padding:6px 9px; border:0; border-bottom:1px solid #f1f3f4; background:#fff; color:#111b21; cursor:pointer; text-align:left; }
                .eh-wa-chat:hover, .eh-wa-chat.active { background:#f0f2f5; }
                .eh-wa-avatar { width:32px; height:32px; display:grid; place-items:center; border-radius:50%; background:#dfe5e7; color:#54656f; font-size:12px; font-weight:800; }
                .eh-wa-chat-info { min-width:0; display:grid; gap:2px; }
                .eh-wa-chat-info strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; font-weight:600; }
                .eh-wa-chat-info small { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#667781; font-size:9px; }
                .eh-wa-unread { min-width:18px; height:18px; display:grid; place-items:center; padding:0 5px; border-radius:10px; background:#25d366; color:#fff; font-size:8px; }
                .eh-wa-conversation { min-height:0; display:grid; grid-template-rows:38px minmax(0,1fr); background:#efeae2; }
                .eh-wa-conversation-head { display:flex; align-items:center; min-width:0; padding:0 10px; border-bottom:1px solid #d8dedf; background:#f0f2f5; }
                .eh-wa-conversation-head strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; }
                .eh-wa-messages { min-height:0; overflow:auto; display:flex; flex-direction:column; gap:4px; padding:9px 8px 12px; scrollbar-width:thin; }
                .eh-wa-msg { max-width:86%; padding:6px 7px 5px; border-radius:7px; box-shadow:0 1px 1px rgba(0,0,0,.08); font-size:10px; line-height:1.35; white-space:pre-wrap; overflow-wrap:anywhere; }
                .eh-wa-msg.in { align-self:flex-start; background:#fff; border-top-left-radius:2px; }
                .eh-wa-msg.out { align-self:flex-end; background:#d9fdd3; border-top-right-radius:2px; }
                .eh-wa-msg-sender { margin-bottom:2px; color:#008069; font-size:8px; font-weight:700; line-height:1.2; }
                .eh-wa-msg.out .eh-wa-msg-sender { color:#49724a; text-align:right; }
                .eh-wa-msg time { display:block; margin-top:3px; color:#667781; font-size:7px; text-align:right; }
                .eh-wa-paste-preview { position:relative; display:grid; grid-template-columns:48px minmax(0,1fr) 26px; align-items:center; gap:8px; padding:7px 8px; border-top:1px solid #d8dedf; background:#f7f9fa; }
                .eh-wa-paste-preview[hidden] { display:none !important; }
                .eh-wa-paste-preview img { width:48px; height:48px; object-fit:cover; border-radius:6px; background:#fff; border:1px solid #d8dedf; }
                .eh-wa-paste-meta { min-width:0; display:grid; gap:2px; }
                .eh-wa-paste-meta strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:9px; color:#111b21; }
                .eh-wa-paste-meta small { color:#667781; font-size:8px; }
                .eh-wa-paste-remove { width:25px; height:25px; border:0; border-radius:50%; background:#e9edef; color:#54656f; cursor:pointer; font-size:16px; line-height:1; }
                .eh-wa-paste-remove:hover { background:#dfe4e6; }
                .eh-wa-compose { display:grid; grid-template-columns:minmax(0,1fr) 34px; gap:6px; align-items:end; padding:7px 8px; border-top:1px solid #d8dedf; background:#f0f2f5; }
                .eh-wa-compose textarea { width:100%; max-height:88px; min-height:32px; resize:none; padding:8px 10px; border:0; border-radius:9px; outline:none; background:#fff; color:#111b21; font:10px/1.4 "Segoe UI",Arial,sans-serif; }
                .eh-wa-compose button { width:34px; height:34px; border:0; border-radius:50%; background:#00a884; color:#fff; cursor:pointer; font-size:15px; }
                .eh-wa-compose button:disabled, .eh-wa-compose textarea:disabled { opacity:.45; cursor:not-allowed; }
                .eh-wa-empty { padding:14px 12px; color:#667781; font-size:9px; line-height:1.45; text-align:center; }
                .eh-wa-empty-conversation { margin:auto; }
                #eh-wa-handle { position:fixed; z-index:2147482499; right:0; top:46%; width:22px; height:54px; border:1px solid #cfd6d8; border-right:0; border-radius:8px 0 0 8px; background:#f0f2f5; color:#008069; cursor:pointer; font:800 20px Arial,sans-serif; box-shadow:-4px 0 12px rgba(0,0,0,.08); }
                #eh-wa-handle[hidden] { display:none !important; }

                /* v5.42 — central operacional compacta da venda atual */
                #eh-root .eh-sale-host[hidden] { display:none !important; }
                #eh-root .eh-sale-host { margin-bottom:8px; }
                #eh-root .eh-sale-summary,
                #eh-root .eh-sale-cpfs {
                    border:1px solid #d9e0e8;
                    border-radius:9px;
                    background:#ffffff;
                    color:#26313f;
                    box-shadow:0 2px 8px rgba(28,45,68,.05);
                }
                #eh-root .eh-sale-summary { padding:8px; }
                #eh-root .eh-sale-summary-head {
                    display:flex;
                    justify-content:space-between;
                    align-items:baseline;
                    gap:8px;
                    padding-bottom:6px;
                    border-bottom:1px solid #edf0f4;
                }
                #eh-root .eh-sale-summary-head strong { color:#1f2a37; font-size:10.5px; }
                #eh-root .eh-sale-summary-head span { color:#6d7786; font-size:8.5px; white-space:nowrap; }
                #eh-root .eh-sale-summary-row {
                    padding:5px 1px 0;
                    color:#394555;
                    font-size:9.5px;
                    line-height:1.3;
                }
                #eh-root .eh-sale-summary-actions {
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:5px;
                    margin-top:7px;
                }
                #eh-root .eh-sale-cpfs {
                    display:grid;
                    gap:5px;
                    margin-top:7px;
                    padding:7px;
                }
                #eh-root .eh-sale-block-title {
                    color:#657183;
                    font-size:8.5px;
                    font-weight:900;
                    letter-spacing:.25px;
                    text-transform:uppercase;
                }
                #eh-root .eh-emission-row-actions {
                    display:flex;
                    gap:4px;
                    align-items:center;
                    flex-wrap:wrap;
                }
                #eh-root .eh-emission-row-actions .eh-context-btn {
                    width:auto;
                    min-width:58px;
                    padding:5px 7px;
                }
                #eh-root .eh-emission-persistent {
                    border-color:#cddcf0;
                    background:#f8fbff;
                }
                #eh-root .eh-emission-pending-summary {
                    border-color:#cddcf0;
                    background:#f8fbff;
                }
                #eh-root .eh-sale-passenger-row {
                    display:grid;
                    grid-template-columns:minmax(0,1fr) 58px;
                    align-items:center;
                    gap:6px;
                    padding:6px;
                    border:1px solid #edf0f4;
                    border-radius:7px;
                    background:#f8fafc;
                }
                #eh-root .eh-sale-passenger-text { min-width:0; display:grid; gap:2px; }
                #eh-root .eh-sale-passenger-text strong {
                    overflow:hidden;
                    text-overflow:ellipsis;
                    white-space:nowrap;
                    color:#253142;
                    font-size:9.5px;
                    margin:0;
                }
                #eh-root .eh-sale-passenger-text small { color:#788393; font-size:8px; }
                #eh-root .eh-sale-block-help { color:#7a8594; font-size:8px; line-height:1.35; }
                #eh-root .eh-ticket-captured-row {
                    display:grid;
                    grid-template-columns:18px minmax(0,1fr) 28px;
                    align-items:start;
                    gap:7px;
                    padding:6px;
                    border:1px solid #edf0f4;
                    border-radius:7px;
                    background:#f8fafc;
                }
                #eh-root .eh-ticket-captured-check { margin:2px 0 0; }
                #eh-root .eh-ticket-captured-meta { min-width:0; display:grid; gap:2px; }
                #eh-root .eh-ticket-captured-meta strong {
                    overflow:hidden;
                    text-overflow:ellipsis;
                    white-space:nowrap;
                    color:#253142;
                    font-size:9.5px;
                    margin:0;
                }
                #eh-root .eh-ticket-captured-meta small { color:#788393; font-size:8px; line-height:1.3; }
                #eh-root .eh-ticket-captured-remove {
                    width:28px;
                    min-width:28px;
                    height:28px;
                    padding:0;
                    display:inline-flex;
                    align-items:center;
                    justify-content:center;
                    font-size:12px;
                    font-weight:900;
                }

                /* Financeiro — usa a identidade visual já existente do Helper. */
                #eh-root .eh-finance-mini { display:grid; gap:7px; margin-top:7px; }
                #eh-root .eh-finance-kpis { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
                #eh-root .eh-finance-kpi { padding:7px; border:1px solid #e5e9ef; border-radius:8px; background:#f8fafc; }
                #eh-root .eh-finance-kpi small { display:block; color:#7a8594; font-size:7.5px; text-transform:uppercase; font-weight:900; }
                #eh-root .eh-finance-kpi strong { display:block; margin-top:2px; color:#243041; font-size:11px; }
                #eh-root .eh-finance-company-line { display:flex; justify-content:space-between; gap:7px; color:#566274; font-size:8.5px; }
                #eh-root .eh-finance-company-line b { color:#243041; }
                .eh-finance-summary-grid { display:grid; grid-template-columns:repeat(4,minmax(130px,1fr)); gap:8px; }
                .eh-finance-stat { border:1px solid #e1e6ed; border-radius:10px; background:#fff; padding:10px; }
                .eh-finance-stat small { display:block; color:#788393; font-size:9px; font-weight:800; text-transform:uppercase; }
                .eh-finance-stat strong { display:block; margin-top:4px; color:#253142; font-size:16px; }
                .eh-finance-stat span { display:block; margin-top:3px; color:#667284; font-size:9px; }
                .eh-finance-toolbar { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:9px; }
                .eh-finance-toolbar input, .eh-finance-toolbar select { min-height:34px; padding:6px 8px; border:1px solid #d6dce5; border-radius:8px; background:#fff; color:#253142; font-size:10px; }
                .eh-finance-list { display:grid; gap:6px; max-height:420px; overflow:auto; padding-right:2px; }
                .eh-finance-op { border:1px solid #e3e7ed; border-radius:9px; background:#fff; padding:8px; }
                .eh-finance-op-head { display:flex; justify-content:space-between; gap:8px; align-items:start; }
                .eh-finance-op-head strong { color:#26313f; font-size:10px; }
                .eh-finance-op-head time { color:#7b8695; font-size:8.5px; white-space:nowrap; }
                .eh-finance-op-values { display:flex; gap:12px; flex-wrap:wrap; margin-top:5px; color:#4e5a6a; font-size:9px; }
                .eh-finance-op-values b { color:#217d58; }
                .eh-finance-op details { margin-top:6px; font-size:8.5px; color:#697586; }
                .eh-finance-op details summary { cursor:pointer; font-weight:800; }
                .eh-finance-company-card { border:1px solid #e1e6ed; border-radius:10px; background:#fff; padding:10px; margin-bottom:7px; }
                .eh-finance-company-card h4 { margin:0 0 6px; color:#253142; font-size:11px; }
                .eh-finance-company-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; font-size:9px; color:#697586; }
                .eh-finance-company-grid b { display:block; margin-top:2px; color:#253142; font-size:10px; }
                .eh-finance-month-nav { display:flex; align-items:center; justify-content:center; gap:8px; margin:0 0 10px; }
                .eh-finance-month-nav strong { min-width:120px; text-align:center; color:#26313f; }
                @media (max-width:760px) {
                    .eh-finance-summary-grid { grid-template-columns:1fr 1fr; }
                    .eh-finance-company-grid { grid-template-columns:1fr 1fr; }
                }

                /* Seleção contextual na tela Passagens: aparece somente quando solicitada. */
                .eh-ticket-batch-bar {
                    position:sticky;
                    z-index:2147483190;
                    top:6px;
                    display:flex;
                    align-items:center;
                    gap:8px;
                    width:min(720px, calc(100% - 16px));
                    margin:8px auto 12px;
                    padding:8px 10px;
                    border:1px solid #cfd8e4;
                    border-radius:9px;
                    background:rgba(255,255,255,.98);
                    box-shadow:0 8px 22px rgba(26,46,74,.12);
                    color:#26313f;
                    font:700 11px "Segoe UI",Arial,sans-serif;
                }
                .eh-ticket-batch-status { flex:1; min-width:0; }
                .eh-ticket-batch-capture,
                .eh-ticket-batch-cancel {
                    min-height:32px;
                    padding:6px 10px;
                    border:1px solid #c7d0db;
                    border-radius:7px;
                    background:#fff;
                    color:#314052;
                    cursor:pointer;
                    font:800 10px "Segoe UI",Arial,sans-serif;
                }
                .eh-ticket-batch-capture { border-color:#2878df; background:#2878df; color:#fff; }
                .eh-ticket-batch-capture:disabled { opacity:.4; cursor:not-allowed; }
                .eh-ticket-selected {
                    outline:3px solid #2f80df !important;
                    outline-offset:-3px;
                    box-shadow:0 0 0 5px rgba(47,128,223,.13) !important;
                }

                /* Paleta mais neutra no helper; não altera elementos da plataforma E-Pass. */
                #eh-root { color:#273142; }
                #eh-root .eh-panel {
                    border-right-color:#d8dee7;
                    background:#f5f7f9;
                    box-shadow:8px 0 24px rgba(25,43,68,.11);
                }
                #eh-root .eh-header,
                #eh-root .eh-panel-footer { border-color:#dfe4ea; background:#eef1f4; }
                #eh-root .eh-icon-btn { color:#465365; }
                #eh-root .eh-flow-section,
                #eh-root .eh-more-tools {
                    border-color:#dde3ea;
                    background:#ffffff;
                }
                #eh-root .eh-flow-section > summary,
                #eh-root .eh-more-tools > summary,
                .eh-dock-title { color:#687487; }
                .eh-step { border-color:#e0e5eb; background:#fff; color:#7c8795; }
                .eh-step.active { border-color:#2f80df; background:#eaf3ff; color:#215ea8; }
                .eh-route-quick {
                    border-color:#dce2e9;
                    background:#ffffff;
                    color:#29384a;
                }
                .eh-route-quick:hover { border-color:#2f80df; background:#f3f8ff; }
                .eh-context-card {
                    border-color:#d9e0e8;
                    background:#ffffff;
                    color:#445064;
                }
                .eh-context-card strong { color:#243143; }
                .eh-context-btn {
                    border-color:#d7dee7;
                    background:#f7f9fb;
                    color:#2d3a4b;
                }
                .eh-context-btn.primary { border-color:#2f77d8; background:#327fdc; color:#fff; }
                .eh-context-btn.success { border-color:#2e9a68; background:#e9f7ef; color:#20714e; }
                .eh-tools-divider { background:#dfe4ea; }
                #eh-root .eh-btn {
                    border-color:#dbe1e8;
                    background:#ffffff;
                    color:#2f3b4d;
                }
                #eh-root .eh-btn:hover:not(:disabled) { border-color:#2f80df; background:#f4f8fd; }
                #eh-root .eh-btn.eh-primary { border-color:#6ba3e8; }
                #eh-root .eh-btn.eh-success { border-color:#6dc99a; }

                /* =========================================================
                   v5.46 — WORKSPACE FLUTUANTE / E-PASS INTACTO
                   Somente #eh-root, #eh-wa-dock e seus lançadores.
                   ========================================================= */
                #eh-root {
                    position: fixed !important;
                    top: var(--eh-overlay-top, 72px) !important;
                    right: var(--eh-overlay-edge, 14px) !important;
                    bottom: auto !important;
                    left: auto !important;
                    width: min(var(--eh-panel-width, 322px), calc(100vw - (var(--eh-overlay-edge, 14px) * 2))) !important;
                    height: var(--eh-overlay-main-height, 620px) !important;
                    max-height: calc(100vh - var(--eh-overlay-top, 72px) - var(--eh-overlay-edge, 14px)) !important;
                    zoom: 1 !important;
                    transform: none !important;
                    z-index: 2147483000;
                    pointer-events: auto;
                    filter: none;
                }
                #eh-root.eh-collapsed {
                    transform: translateX(calc(100% + 28px)) !important;
                    opacity: 0;
                    pointer-events: none;
                }
                #eh-root .eh-panel {
                    height: 100%;
                    overflow: hidden;
                    border: 1px solid #d9e1ea;
                    border-radius: var(--eh-panel-radius, 15px);
                    background: rgba(248, 250, 252, .985);
                    opacity: var(--eh-panel-opacity, 1);
                    box-shadow: 0 16px 44px rgba(26, 44, 72, .18), 0 2px 8px rgba(26, 44, 72, .08);
                    backdrop-filter: blur(10px);
                }
                #eh-root .eh-header {
                    min-height: 54px;
                    padding: 8px 9px 8px 12px;
                    justify-content: space-between;
                    gap: 10px;
                    border-bottom: 1px solid #dce3eb;
                    background: linear-gradient(180deg, #ffffff 0%, #f4f7fa 100%);
                }
                #eh-root .eh-panel-brand {
                    min-width: 0;
                    display: grid;
                    gap: 2px;
                    line-height: 1.05;
                }
                #eh-root .eh-panel-brand span {
                    color: #758397;
                    font-size: 7.5px;
                    font-weight: 900;
                    letter-spacing: .8px;
                }
                #eh-root .eh-panel-brand strong {
                    color: #1f3046;
                    font-size: 13px;
                    font-weight: 900;
                    letter-spacing: -.15px;
                }
                #eh-root .eh-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    flex: 0 0 auto;
                }
                #eh-root .eh-icon-btn {
                    width: 29px;
                    height: 29px;
                    border-radius: 8px;
                    color: #536276;
                }
                #eh-root .eh-icon-btn:hover { background: #e7edf4; color: #1f3046; }
                #eh-root .eh-body {
                    padding: 9px;
                    background: transparent;
                }
                #eh-root .eh-panel-footer {
                    padding: 7px 9px;
                    border-top: 1px solid #e0e6ed;
                    background: rgba(244, 247, 250, .96);
                }
                #eh-root .eh-context-card {
                    border-color: #d7e0ea;
                    border-radius: 11px;
                    box-shadow: 0 3px 12px rgba(35, 58, 88, .05);
                }
                #eh-root .eh-context-btn,
                #eh-root .eh-route-quick,
                #eh-root .eh-btn { border-radius: 9px; }
                #eh-root .eh-context-btn.primary {
                    box-shadow: 0 4px 12px rgba(50, 127, 220, .16);
                }
                #eh-root .eh-more-tools,
                #eh-root .eh-flow-section { border-radius: 10px; }

                #eh-launcher {
                    left: auto !important;
                    right: 0 !important;
                    top: 82px !important;
                    width: 20px;
                    height: 52px;
                    border: 1px solid #cbd5e1;
                    border-right: 0;
                    border-left: 1px solid #cbd5e1;
                    border-radius: 9px 0 0 9px;
                    background: rgba(255,255,255,.9);
                    color: #315b88;
                    box-shadow: -4px 4px 14px rgba(31,48,70,.12);
                    opacity: .6;
                }
                #eh-launcher:hover, #eh-launcher:focus-visible {
                    width: 28px;
                    opacity: 1;
                    background: #fff;
                }

                /* Conversa atual: visual secundário e complementar. */
                #eh-wa-dock {
                    position: fixed !important;
                    top: var(--eh-overlay-top, 72px) !important;
                    right: calc(var(--eh-overlay-edge, 14px) + var(--eh-panel-width, 322px) + var(--eh-overlay-gap, 12px)) !important;
                    bottom: auto !important;
                    left: auto !important;
                    width: min(var(--eh-conversation-width, 270px), calc(100vw - (var(--eh-overlay-edge, 14px) * 2))) !important;
                    height: auto !important;
                    max-height: var(--eh-overlay-conversation-height, 420px) !important;
                    zoom: 1 !important;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid #d8e0e6;
                    border-radius: var(--eh-wa-radius, 14px);
                    background: rgba(250, 252, 252, .985);
                    opacity: var(--eh-panel-opacity, 1);
                    color: #24313a;
                    box-shadow: 0 14px 36px rgba(30, 49, 62, .13), 0 2px 7px rgba(30, 49, 62, .07);
                    overflow: hidden;
                    font-family: Inter, "Segoe UI", Arial, sans-serif;
                }
                #eh-wa-dock.eh-wa-collapsed { display: none !important; }
                .eh-wa-dock-head {
                    min-height: 47px;
                    padding: 7px 7px 7px 11px;
                    background: linear-gradient(180deg, #fbfdfd 0%, #f1f5f5 100%);
                    border-bottom: 1px solid #dce4e5;
                }
                .eh-wa-brand { color: #25343d; font-size: 11px; font-family: Inter, "Segoe UI", Arial, sans-serif; }
                .eh-wa-brand strong { font-weight: 900; }
                .eh-wa-status-text { font-size: 8px; color: #74828a; }
                .eh-wa-collapse { color: #61747b; }
                .eh-wa-collapse:hover { background: #e8eeee; }

                .eh-conversation-organizer {
                    display: grid;
                    gap: 8px;
                    padding: 11px;
                    background: #fff;
                }
                .eh-conversation-eyebrow {
                    color: #829097;
                    font-size: 7.5px;
                    font-weight: 900;
                    letter-spacing: .7px;
                }
                .eh-conversation-client {
                    display: block;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: #152932;
                    font-size: 12px;
                    font-weight: 900;
                }
                .eh-conversation-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 6px;
                }
                .eh-conversation-item {
                    min-width: 0;
                    display: grid;
                    gap: 2px;
                    padding: 7px 8px;
                    border: 1px solid #e3e9eb;
                    border-radius: 9px;
                    background: #f8fafb;
                }
                .eh-conversation-item small {
                    color: #849198;
                    font-size: 7px;
                    font-weight: 850;
                    text-transform: uppercase;
                    letter-spacing: .3px;
                }
                .eh-conversation-item span {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: #34464f;
                    font-size: 8.5px;
                    font-weight: 750;
                }
                .eh-conversation-route { grid-column: 1 / -1; }
                .eh-conversation-route span { white-space: normal; line-height: 1.28; }

                .eh-wa-tools {
                    min-height: 0;
                    border-top: 1px solid #e2e8e9;
                    background: #f7f9f9;
                }
                .eh-wa-tools > summary {
                    position: relative;
                    list-style: none;
                    cursor: pointer;
                    padding: 9px 30px 9px 11px;
                    color: #66777e;
                    font-size: 8.5px;
                    font-weight: 850;
                    letter-spacing: .2px;
                }
                .eh-wa-tools > summary::-webkit-details-marker { display: none; }
                .eh-wa-tools > summary::after {
                    content: '＋';
                    position: absolute;
                    right: 11px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #829096;
                    font-size: 12px;
                }
                .eh-wa-tools[open] > summary::after { content: '−'; }
                .eh-wa-tools-body {
                    min-height: 0;
                    max-height: calc(var(--eh-overlay-conversation-height, 420px) - 190px);
                    display: grid;
                    grid-template-rows: minmax(110px, 30%) minmax(150px, 1fr) auto auto;
                    overflow: hidden;
                    border-top: 1px solid #e0e7e8;
                }
                .eh-wa-tools:not([open]) .eh-wa-tools-body { display: none !important; }
                .eh-wa-chats { min-height: 110px; }
                .eh-wa-conversation { min-height: 150px; }

                #eh-wa-handle {
                    top: 142px;
                    right: calc(var(--eh-overlay-edge, 14px) + var(--eh-panel-width, 322px) + var(--eh-overlay-gap, 12px) - 1px);
                    width: 20px;
                    height: 48px;
                    border-radius: 8px 0 0 8px;
                    background: rgba(248,251,251,.96);
                    color: #24836f;
                    opacity: .72;
                }
                #eh-wa-handle:hover { opacity: 1; }
                html:not(.eh-overlay-main-open) #eh-wa-dock {
                    right: var(--eh-overlay-edge, 14px) !important;
                }
                html:not(.eh-overlay-main-open) #eh-wa-handle {
                    right: 0;
                }

                /* Em telas menores, os overlays ficam empilhados no mesmo canto.
                   A plataforma permanece com 100% da largura original. */
                html.eh-overlay-stacked #eh-root {
                    top: var(--eh-overlay-top, 72px) !important;
                    right: var(--eh-overlay-edge, 14px) !important;
                }
                html.eh-overlay-stacked #eh-wa-dock {
                    top: auto !important;
                    right: var(--eh-overlay-edge, 14px) !important;
                    bottom: var(--eh-overlay-edge, 14px) !important;
                    max-height: var(--eh-overlay-conversation-height, 280px) !important;
                }
                html.eh-overlay-stacked #eh-wa-handle {
                    top: auto;
                    right: 0;
                    bottom: 82px;
                }
                html.eh-overlay-stacked .eh-wa-tools-body {
                    max-height: calc(var(--eh-overlay-conversation-height, 280px) - 175px);
                }

                /* Preferências visuais v5.49 — aplicadas somente aos overlays do Helper. */
                html.eh-density-compact #eh-root .eh-body { padding: 6px; }
                html.eh-density-compact #eh-root .eh-context-card { padding: 6px; margin-bottom: 6px; }
                html.eh-density-compact #eh-root .eh-context-btn,
                html.eh-density-compact #eh-root .eh-route-quick,
                html.eh-density-compact #eh-root .eh-btn { min-height: 27px; padding-top: 4px; padding-bottom: 4px; }
                html.eh-density-compact .eh-conversation-organizer { gap: 5px; padding: 8px; }
                html.eh-density-compact .eh-conversation-item { padding: 5px 6px; }

                html.eh-density-confortavel #eh-root .eh-body { padding: 11px; }
                html.eh-density-confortavel #eh-root .eh-context-card { padding: 10px; margin-bottom: 10px; }
                html.eh-density-confortavel #eh-root .eh-context-btn,
                html.eh-density-confortavel #eh-root .eh-route-quick,
                html.eh-density-confortavel #eh-root .eh-btn { min-height: 36px; padding-top: 8px; padding-bottom: 8px; }
                html.eh-density-confortavel .eh-conversation-organizer { gap: 10px; padding: 13px; }
                html.eh-density-confortavel .eh-conversation-item { padding: 9px 10px; }

                html.eh-shadow-none #eh-root .eh-panel,
                html.eh-shadow-none #eh-wa-dock { box-shadow: none !important; }
                html.eh-shadow-suave #eh-root .eh-panel {
                    box-shadow: 0 8px 22px rgba(26, 44, 72, .11), 0 1px 4px rgba(26, 44, 72, .06);
                }
                html.eh-shadow-suave #eh-wa-dock {
                    box-shadow: 0 8px 22px rgba(30, 49, 62, .09), 0 1px 4px rgba(30, 49, 62, .05);
                }

                /* Alternativa opcional: workspace ancorado à esquerda.
                   Nunca altera app-root/navbar/sidebar do E-Pass. */
                html.eh-overlay-side-left #eh-root {
                    left: var(--eh-overlay-edge, 14px) !important;
                    right: auto !important;
                }
                html.eh-overlay-side-left #eh-wa-dock {
                    left: calc(var(--eh-overlay-edge, 14px) + var(--eh-panel-width, 322px) + var(--eh-overlay-gap, 12px)) !important;
                    right: auto !important;
                }
                html.eh-overlay-side-left:not(.eh-overlay-main-open) #eh-wa-dock {
                    left: var(--eh-overlay-edge, 14px) !important;
                    right: auto !important;
                }
                html.eh-overlay-side-left #eh-launcher {
                    left: 0 !important;
                    right: auto !important;
                    border-left: 0;
                    border-right: 1px solid #cbd5e1;
                    border-radius: 0 9px 9px 0;
                }
                html.eh-overlay-side-left #eh-wa-handle {
                    left: calc(var(--eh-overlay-edge, 14px) + var(--eh-panel-width, 322px) + var(--eh-overlay-gap, 12px) - 1px);
                    right: auto;
                    border-radius: 0 8px 8px 0;
                }
                html.eh-overlay-side-left:not(.eh-overlay-main-open) #eh-wa-handle {
                    left: 0;
                    right: auto;
                }
                html.eh-overlay-side-left.eh-overlay-stacked #eh-root {
                    left: var(--eh-overlay-edge, 14px) !important;
                    right: auto !important;
                }
                html.eh-overlay-side-left.eh-overlay-stacked #eh-wa-dock {
                    left: var(--eh-overlay-edge, 14px) !important;
                    right: auto !important;
                }
                html.eh-overlay-side-left.eh-overlay-stacked #eh-wa-handle {
                    left: 0;
                    right: auto;
                }

                /* Central de configurações em abas. */
                #eh-settings-overlay .eh-modal { max-height: min(88vh, 760px); }
                .eh-settings-shell { display:grid; grid-template-columns: 158px minmax(0,1fr); gap:14px; min-height:420px; }
                .eh-settings-tabs {
                    display:flex; flex-direction:column; gap:5px; padding:4px;
                    border-right:1px solid #e1e6ec;
                }
                .eh-settings-tab {
                    width:100%; border:1px solid transparent; border-radius:9px; padding:9px 10px;
                    background:transparent; color:#5a6678; text-align:left; cursor:pointer;
                    font:800 10px/1.2 Inter,"Segoe UI",Arial,sans-serif;
                }
                .eh-settings-tab:hover { background:#f4f7fa; color:#2a3a4f; }
                .eh-settings-tab.active { background:#edf5ff; border-color:#c7ddf8; color:#2167b5; }
                .eh-settings-panes { min-width:0; }
                .eh-settings-pane { display:none; }
                .eh-settings-pane.active { display:block; }
                .eh-settings-pane h3 { margin:2px 0 4px; font-size:14px; color:#253448; }
                .eh-settings-pane > p { margin:0 0 12px; color:#718096; font-size:10px; line-height:1.45; }
                .eh-settings-card {
                    margin:0 0 10px; padding:11px; border:1px solid #e0e6ed; border-radius:11px;
                    background:#fafbfd;
                }
                .eh-settings-card-title { margin:0 0 8px; color:#46556a; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.45px; }
                .eh-settings-grid-compact { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
                .eh-settings-note { margin-top:7px; color:#7d8999; font-size:9px; line-height:1.4; }
                .eh-preset-row { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
                .eh-preset-btn {
                    border:1px solid #d6dee8; border-radius:9px; padding:9px 7px; background:#fff;
                    color:#445266; cursor:pointer; font-size:9.5px; font-weight:850;
                }
                .eh-preset-btn.active { border-color:#2f80df; background:#edf5ff; color:#2167b5; }
                .eh-field select {
                    width:100%; min-height:36px; padding:8px 9px; border:1px solid #cfd6df;
                    border-radius:8px; background:#fff; color:#273142;
                }
                .eh-settings-inline-actions { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
                .eh-settings-danger-note { color:#8b5a20; background:#fff8eb; border:1px solid #f2d8ad; border-radius:8px; padding:8px; font-size:9px; line-height:1.4; }


                @media (max-width: 760px) {
                    .eh-settings-shell { grid-template-columns:1fr; min-height:0; }
                    .eh-settings-tabs { flex-direction:row; overflow-x:auto; border-right:0; border-bottom:1px solid #e1e6ec; padding-bottom:8px; }
                    .eh-settings-tab { width:auto; flex:0 0 auto; }
                    .eh-settings-grid-compact { grid-template-columns:1fr; }
                    #eh-root,
                    #eh-wa-dock {
                        right: 10px !important;
                        max-width: calc(100vw - 20px) !important;
                    }
                    #eh-root { height: min(54vh, 520px) !important; }
                    #eh-wa-dock { max-height: min(32vh, 280px) !important; }
                    .eh-conversation-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                    .eh-conversation-route { grid-column: 1 / -1; }
                }

            `);
        }
    };

    // ============================================================
    // TOAST
    // ============================================================
    EH.Toast = {
        area: null,
        init() {
            if (this.area) return;
            this.area = document.createElement('div');
            this.area.id = 'eh-toast-area';
            document.body.appendChild(this.area);
        },
        show(message, type = 'info', duration = EH.Config.TOAST_DURATION) {
            this.init();
            const toast = document.createElement('div');
            toast.className = `eh-toast ${type}`;

            const icon = document.createElement('span');
            icon.textContent = ({ success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' })[type] || 'ℹ️';

            const text = document.createElement('span');
            text.className = 'eh-toast-text';
            text.textContent = String(message || '');

            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'eh-toast-close';
            close.textContent = '✕';
            close.addEventListener('click', () => toast.remove());

            toast.append(icon, text, close);
            this.area.appendChild(toast);
            setTimeout(() => toast.remove(), duration);
        },
        success(message, duration) { this.show(message, 'success', duration); },
        error(message, duration) { this.show(message, 'error', duration); },
        warning(message, duration) { this.show(message, 'warning', duration); },
        info(message, duration) { this.show(message, 'info', duration); }
    };

    // ============================================================
    // DETECÇÃO DE PÁGINA
    // ============================================================
    EH.Pages = {
        current: 'desconhecida',

        getCurrentEpassContext() {
            const path = String(location.pathname || '').toLocaleLowerCase('pt-BR');

            // Angular: a rota é a primeira fonte de verdade do contexto.
            if (path.includes('/caixa/comissoes')) return 'comissoes';
            if (path.includes('/caixa')) return 'caixa';
            if (path.includes('/solicitacoes/requisicoes') || path.includes('/solicitacoes')) return 'requisicao';
            if (path.includes('/vendas/passagens')) return 'passagens';
            if (path.includes('/vendas/pagamento')) return 'pagamento';
            if (path.includes('/vendas/carrinho') || path.includes('/vendas/confirmacao')) return 'confirmacao';
            if (path.includes('/vendas/reserva')) return 'reserva';
            if (path.includes('/vendas/pesquisa')) return 'pesquisa';

            // Fallbacks somente para variações reais da aplicação.
            if (EH.Utils.first(EH.Selectors.COMISSOES_ROOT)) return 'comissoes';
            if (EH.Utils.first(EH.Selectors.CAIXA_ROOT)) return 'caixa';
            if (EH.Utils.first(EH.Selectors.REQUISITION_FORM_ROOT) || document.querySelector('app-solicitacoes')) return 'requisicao';
            if (EH.Payment?.isPage()) return 'pagamento';
            if (EH.Tickets?.isPassagensPage()) return 'passagens';
            if (document.querySelector('app-carrinho')) return 'confirmacao';
            if (EH.Utils.first(EH.Selectors.MAPA_POLTRONAS) || EH.Utils.first(EH.Selectors.DADOS_RESERVA)) return 'reserva';
            if (EH.Utils.first(EH.Selectors.TABLE_HORARIOS)) return 'pesquisa';
            return 'desconhecida';
        },

        detect() {
            return this.getCurrentEpassContext();
        },
        update() {
            const page = this.detect();
            if (page !== this.current) {
                this.current = page;
                EH.Logger.debug('Página detectada:', page);
            }
            const safe = (scope, callback) => {
                try { return callback(); }
                catch (error) {
                    EH.Logger.error(`[${scope}] atualização isolada falhou:`, error);
                    return null;
                }
            };
            safe('Contexto de vendas', () => EH.SaleCpfs?.captureFromDom?.());
            safe('Requisições', () => EH.RequisitionManager?.scanDom?.());
            safe('Atendimento', () => EH.UI?.updateState?.(page));
            safe('Mapa dos carros', () => EH.OperationCars?.onPageUpdate?.(page));
            safe('Lembretes', () => EH.Reminders?.onPageUpdate?.(page));
            safe('Memória de emissões', () => EH.EmissionMemory?.onPageUpdate?.(page));
            safe('Conferência de bilhetes', () => EH.TicketVerificationQueue?.onPageUpdate?.(page));
            safe('WhatsApp', () => EH.WhatsAppDock?.renderOrganizer?.(page));
            safe('Painéis', () => EH.PanelManager?.bindAll?.());
            if ((page === 'caixa' || page === 'comissoes') && EH.Config.FINANCE_AUTO_REGISTER) {
                const now = Date.now();
                if (!this.lastFinanceSyncAt || (now - this.lastFinanceSyncAt) > 1800) {
                    this.lastFinanceSyncAt = now;
                    try { EH.FinanceLedger?.syncFromCurrentPage?.({ quiet: true }); } catch (error) { EH.Logger.debug('Sincronização financeira adiada:', error); }
                }
            }
            return page;
        }
    };

    // ============================================================
    // LEITOR FINANCEIRO — ETAPA 1 (READ-ONLY)
    // Baseado nos HTMLs reais CAIXA.html e COMISSÕES.html.
    // Não persiste, não soma e não altera valores oficiais do E-Pass nesta etapa.
    // ============================================================
    EH.FinanceReader = {
        normalizeLabel(value) {
            return EH.Utils.normalize(EH.Utils.clean(value || ''));
        },

        directChildren(element, selector) {
            if (!element) return [];
            return Array.from(element.children || []).filter(child => {
                try { return child.matches(selector); } catch (error) { return false; }
            });
        },

        isCaixaPage() {
            const path = String(location.pathname || '').toLocaleLowerCase('pt-BR');
            return path.includes('/caixa') && !path.includes('/caixa/comissoes')
                || Boolean(EH.Utils.first(EH.Selectors.CAIXA_ROOT));
        },

        isCommissionsPage() {
            const path = String(location.pathname || '').toLocaleLowerCase('pt-BR');
            return path.includes('/caixa/comissoes')
                || Boolean(EH.Utils.first(EH.Selectors.COMISSOES_ROOT));
        },

        findHeading(root, tagNames, text) {
            const wanted = this.normalizeLabel(text);
            const tags = Array.isArray(tagNames) ? tagNames.join(',') : String(tagNames || 'h1,h2,h3,h4,h5');
            return Array.from(root?.querySelectorAll?.(tags) || [])
                .find(element => this.normalizeLabel(element.textContent) === wanted) || null;
        },

        valueByLabel(root, labelText) {
            const wanted = this.normalizeLabel(labelText);
            const label = Array.from(root?.querySelectorAll?.('label') || [])
                .find(element => this.normalizeLabel(element.textContent) === wanted);
            if (!label) return null;
            const immediate = label.parentElement;
            const holder = label.closest('.text-center') || immediate;
            const valueElement = immediate?.querySelector?.('h4, h3, h2, strong, b')
                || holder?.querySelector?.('h4, h3, h2, strong, b');
            const raw = EH.Utils.clean(valueElement?.textContent || '');
            return {
                label: EH.Utils.clean(label.textContent || ''),
                raw,
                value: EH.Utils.parseMoney(raw)
            };
        },

        parseCompanySummaryFromHeading(root, headingText) {
            const heading = this.findHeading(root, ['h2', 'h3'], headingText);
            if (!heading) return [];
            const cardBody = heading.closest('.card-body') || heading.parentElement;
            const row = Array.from(cardBody?.querySelectorAll?.('.row.m-1') || [])[0];
            if (!row) return [];

            return Array.from(row.children || []).map(block => {
                const company = EH.Utils.clean(block.querySelector('i')?.textContent || '');
                const amountElement = block.querySelector('b.h4, b');
                const raw = EH.Utils.clean(amountElement?.textContent || '');
                if (!company || !raw) return null;
                return {
                    company,
                    amount: EH.Utils.parseMoney(raw),
                    raw
                };
            }).filter(Boolean);
        },

        tableHeaders(table) {
            const firstRow = table?.querySelector?.('thead tr') || table?.querySelector?.('tr');
            return Array.from(firstRow?.querySelectorAll?.('th,td') || [])
                .map(cell => EH.Utils.clean(cell.textContent || ''));
        },

        findTableByHeaders(root, requiredHeaders = []) {
            const required = requiredHeaders.map(value => this.normalizeLabel(value));
            return Array.from(root?.querySelectorAll?.('table.table-hover, table') || []).find(table => {
                const headers = this.tableHeaders(table).map(value => this.normalizeLabel(value));
                return required.every(value => headers.includes(value));
            }) || null;
        },

        headerIndex(headers = [], wanted) {
            const target = this.normalizeLabel(wanted);
            return headers.findIndex(value => this.normalizeLabel(value) === target);
        },

        parseCaixaHeader(root) {
            const title = Array.from(root?.querySelectorAll?.('h1') || [])
                .find(element => /CAIXA\s*#\s*\d+/i.test(element.textContent || ''));
            const titleText = EH.Utils.clean(title?.textContent || '');
            const number = titleText.match(/CAIXA\s*#\s*(\d+)/i)?.[1] || '';
            const titleRow = title?.parentElement;
            const totalElement = titleRow
                ? Array.from(titleRow.querySelectorAll('h2,h3,h4')).find(element => /R\$/i.test(element.textContent || ''))
                : null;
            const totalRaw = EH.Utils.clean(totalElement?.textContent || '');

            const openingContainer = Array.from(root?.querySelectorAll?.('label') || [])
                .find(element => this.normalizeLabel(element.textContent).startsWith('ABERTURA'))?.parentElement || null;
            const openingRaw = EH.Utils.clean(openingContainer?.textContent || '').replace(/^Abertura\s*:\s*/i, '');

            return {
                caixaNumber: number,
                title: titleText,
                caixaValue: EH.Utils.parseMoney(totalRaw),
                caixaValueRaw: totalRaw,
                opening: openingRaw,
                entradas: this.valueByLabel(root, 'Entradas'),
                saidasPagamentos: this.valueByLabel(root, 'Saídas/Pagamentos'),
                saidasBoletos: this.valueByLabel(root, 'Saídas/Boletos'),
                saldoDinheiro: this.valueByLabel(root, 'Saldo em Dinheiro')
            };
        },

        parseCaixaSales(root) {
            const table = this.findTableByHeaders(root, ['Data', 'Lançamentos', 'Total']);
            if (!table) return [];
            const headers = this.tableHeaders(table);
            const dataIndex = this.headerIndex(headers, 'Data');
            const launchIndex = this.headerIndex(headers, 'Lançamentos');
            const totalIndex = this.headerIndex(headers, 'Total');
            const tbodyRows = Array.from(table.querySelectorAll('tbody tr'));

            return tbodyRows.map((row, rowIndex) => {
                const cells = Array.from(row.querySelectorAll('td'));
                const launchCell = cells[launchIndex] || null;
                const launch = EH.Utils.clean(launchCell?.textContent || '');
                const saleMatch = launch.match(/\bVENDA\s*\|\s*(\d+)\s*-\s*(.*)$/i);
                if (!saleMatch) return null;

                const dateCell = EH.Utils.clean(cells[dataIndex]?.textContent || '');
                const dateMatch = dateCell.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/);
                const dateTime = EH.Utils.clean(dateMatch?.[1] || '');
                const agent = dateTime ? EH.Utils.clean(dateCell.replace(dateTime, '')) : '';
                const totalRaw = EH.Utils.clean(cells[totalIndex]?.textContent || '');
                const badge = EH.Utils.clean(launchCell?.querySelector?.('.badge')?.textContent || '');

                const breakdown = {};
                ['D', 'CC', 'CD', 'R', 'NC', 'PIX'].forEach(header => {
                    const index = this.headerIndex(headers, header);
                    if (index < 0 || !cells[index]) return;
                    const raw = EH.Utils.clean(cells[index].textContent || '');
                    breakdown[header] = { raw, value: EH.Utils.parseMoney(raw) };
                });

                return {
                    rowIndex,
                    saleId: saleMatch[1],
                    passenger: EH.Utils.clean(saleMatch[2] || ''),
                    companyCode: badge,
                    dateTime,
                    agent,
                    total: EH.Utils.parseMoney(totalRaw),
                    totalRaw,
                    breakdown,
                    rawLaunch: launch
                };
            }).filter(Boolean);
        },

        parseCaixaAgentSummary(root) {
            const table = this.findTableByHeaders(root, ['Lançamentos', 'Novo Horizonte', 'Maia', 'Central Bahia', 'Jotamar', 'Total']);
            if (!table) return null;
            const headers = this.tableHeaders(table);
            const rows = Array.from(table.querySelectorAll('tbody tr')).map(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                return cells.map(cell => EH.Utils.clean(cell.textContent || ''));
            });
            return { headers, rows };
        },

        parseCaixa() {
            const root = EH.Utils.first(EH.Selectors.CAIXA_ROOT);
            if (!root) return null;
            return {
                page: 'caixa',
                header: this.parseCaixaHeader(root),
                commissionSummary: this.parseCompanySummaryFromHeading(root, 'Comissão'),
                sales: this.parseCaixaSales(root),
                agentSummary: this.parseCaixaAgentSummary(root),
                commissionLink: Array.from(root.querySelectorAll('a[href]'))
                    .find(anchor => /\/caixa\/comissoes\/saque/i.test(anchor.getAttribute('href') || ''))?.getAttribute('href') || ''
            };
        },

        commissionRowKind(row) {
            if (row?.querySelector?.('.mes-anterior')) return 'SALDO_ANTERIOR';
            const operations = this.directChildren(row, 'b.ml-2.mr-1')
                .map(element => EH.Utils.clean(element.textContent || ''))
                .filter(Boolean);
            return operations[0] || '';
        },

        parseCommissionHistoryRow(row) {
            if (!row) return null;
            const saldoAnterior = EH.Utils.clean(row.querySelector('.mes-anterior')?.textContent || '');
            const valueElement = row.querySelector(EH.Selectors.COMISSOES_VALUE);
            const rawAmount = EH.Utils.clean(valueElement?.textContent || '');
            if (!rawAmount) return null;

            const originalElement = row.querySelector(EH.Selectors.COMISSOES_ORIGINAL_VALUE);
            const rawOriginal = EH.Utils.clean(originalElement?.textContent || '');
            const dateTime = EH.Utils.clean(row.querySelector(EH.Selectors.COMISSOES_DATE)?.textContent || '');
            const company = EH.Utils.clean(row.querySelector(EH.Selectors.COMISSOES_COMPANY)?.textContent || '');
            const directSpans = this.directChildren(row, 'span');
            const category = EH.Utils.clean(
                directSpans.find(element => !element.classList.contains('sublinhado') && !element.classList.contains('mes-anterior'))?.textContent || ''
            );
            const operationTags = this.directChildren(row, 'b.ml-2.mr-1');
            const operation = EH.Utils.clean(operationTags[0]?.textContent || '');
            const operationStatus = EH.Utils.clean(operationTags[1]?.textContent || '');
            const lowTexts = this.directChildren(row, 'i.low')
                .map(element => EH.Utils.clean(element.textContent || ''))
                .filter(Boolean);
            const operator = lowTexts.length ? lowTexts[lowTexts.length - 1] : '';

            return {
                // data-index é somente posição visual da lista; NÃO deve virar ID persistente.
                domIndex: EH.Utils.clean(row.getAttribute('data-index') || ''),
                kind: saldoAnterior ? 'SALDO_ANTERIOR' : (operation || category || 'MOVIMENTO'),
                category,
                company,
                operation,
                operationStatus,
                dateTime,
                amount: EH.Utils.parseMoney(rawAmount),
                amountRaw: rawAmount,
                originalValue: rawOriginal ? EH.Utils.parseMoney(rawOriginal) : null,
                originalValueRaw: rawOriginal,
                operator,
                isPriorBalance: Boolean(saldoAnterior),
                priorBalanceLabel: saldoAnterior,
                rawText: EH.Utils.clean(row.textContent || '')
            };
        },

        parseCommissions() {
            const root = EH.Utils.first(EH.Selectors.COMISSOES_ROOT);
            if (!root) return null;
            const rows = EH.Utils.all(EH.Selectors.COMISSOES_HISTORY_ROWS)
                .map(row => this.parseCommissionHistoryRow(row))
                .filter(Boolean);
            return {
                page: 'comissoes',
                summary: this.parseCompanySummaryFromHeading(root, 'Resumo'),
                history: rows
            };
        },

        snapshot() {
            if (this.isCommissionsPage()) return this.parseCommissions();
            if (this.isCaixaPage()) return this.parseCaixa();
            return null;
        }
    };

    // ============================================================
    // MEMÓRIA FINANCEIRA OPERACIONAL — CAIXA / COMISSÕES
    // Controle local auxiliar. Nunca altera valores oficiais do E-Pass.
    // ============================================================
    EH.FinanceLedger = {
        STORE_KEY: 'financeLedgerV1',
        META_KEY: 'financeMetaV1',

        money(value) {
            const number = Number(value);
            return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
        },

        normalizeCompany(value) {
            const raw = EH.Utils.clean(value || '').toUpperCase();
            const normalized = EH.Utils.normalize(raw);
            if (!normalized) return 'NÃO INFORMADA';
            if (normalized === 'MA' || normalized.includes('EXPRESSO MAIA') || normalized === 'MAIA') return 'EXPRESSO MAIA';
            if (normalized === 'JO' || normalized.includes('JOTAMAR')) return 'JOTAMAR';
            if (normalized === 'NH' || normalized.includes('NOVO HORIZONTE')) return 'NOVO HORIZONTE';
            if (normalized === 'CB' || normalized.includes('CENTRAL BAHIA')) return 'CENTRAL BAHIA';
            return raw || 'NÃO INFORMADA';
        },

        parseDateTime(value) {
            const text = EH.Utils.clean(value || '');
            let match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})[,\s]+(\d{2}):(\d{2})(?::(\d{2}))?/);
            if (match) {
                const [, dd, mm, yyyy, hh, mi, ss = '00'] = match;
                const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi), Number(ss));
                return Number.isNaN(date.getTime()) ? null : date;
            }
            match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
            if (match) {
                const [, yyyy, mm, dd, hh = '00', mi = '00', ss = '00'] = match;
                const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi), Number(ss));
                return Number.isNaN(date.getTime()) ? null : date;
            }
            const native = new Date(text);
            return Number.isNaN(native.getTime()) ? null : native;
        },

        formatDateTime(date) {
            const d = date instanceof Date ? date : this.parseDateTime(date);
            if (!d || Number.isNaN(d.getTime())) return '';
            const pad = n => String(n).padStart(2, '0');
            return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        },

        dayKey(value) {
            const d = value instanceof Date ? value : this.parseDateTime(value);
            if (!d) return '';
            const pad = n => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
        },

        monthKey(value) {
            const d = value instanceof Date ? value : this.parseDateTime(value);
            if (!d) return '';
            const pad = n => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
        },

        load() {
            const data = EH.Storage.get(this.STORE_KEY, []);
            return Array.isArray(data) ? data : [];
        },

        save(records) {
            const safe = Array.isArray(records) ? records : [];
            EH.Storage.set(this.STORE_KEY, safe);
            return safe;
        },

        loadMeta() {
            const data = EH.Storage.get(this.META_KEY, {});
            return data && typeof data === 'object' ? data : {};
        },

        saveMeta(meta) {
            EH.Storage.set(this.META_KEY, meta || {});
            return meta || {};
        },

        commissionPercentFor(company) {
            const meta = this.loadMeta();
            const map = meta.companyPercents && typeof meta.companyPercents === 'object' ? meta.companyPercents : {};
            const key = this.normalizeCompany(company);
            const specific = Number(map[key]);
            if (Number.isFinite(specific) && specific >= 0) return specific;
            return Math.max(0, EH.Utils.parseFiniteNumber(EH.Config.FINANCE_COMMISSION_PERCENT, 10));
        },

        estimateCommission(value, company) {
            return this.money(this.money(value) * this.commissionPercentFor(company) / 100);
        },

        effectiveCommission(record) {
            if (record?.commissionEpass !== null && record?.commissionEpass !== undefined && Number.isFinite(Number(record.commissionEpass))) {
                return this.money(record.commissionEpass);
            }
            return this.money(record?.commissionEstimated || 0);
        },

        effectiveMovement(record) {
            const base = this.money(record?.originalValue || 0);
            // Quando Caixa e Comissões representam a mesma venda, o E-Pass pode
            // usar uma base comissionável menor que o total efetivamente cobrado
            // (ex.: taxa de embarque). O ajuste é guardado separadamente para não
            // adulterar `originalValue`, mas entra uma única vez no movimento.
            const caixaAdjustment = this.money(record?.caixaAdjustment || 0);
            return this.money(base + caixaAdjustment);
        },

        isCountableMovement(record) {
            if (!record || record.deleted || record.mergedInto) return false;
            const status = EH.Utils.normalize(record.status || '');
            if (status.includes('SAQUE') || status.includes('SALDO ANTERIOR')) return false;
            if (record.category === 'PASSAGEM') return status === 'VENDA' || !status;
            return record.category === 'MERCADORIA_RECEBIDA' || record.category === 'MERCADORIA_ENVIADA';
        },

        isCommissionEffect(record) {
            if (!record || record.deleted || record.mergedInto) return false;
            const status = EH.Utils.normalize(record.status || '');
            if (status.includes('SAQUE') || status.includes('SALDO ANTERIOR')) return false;
            return record.category === 'PASSAGEM' || record.category === 'MERCADORIA_RECEBIDA' || record.category === 'MERCADORIA_ENVIADA' || status.includes('CANCELAMENTO') || status.includes('ESTORNO');
        },

        makeCommissionBaseKey(row) {
            return [
                'comissao',
                EH.Utils.normalize(row.dateTime || ''),
                EH.Utils.normalize(this.normalizeCompany(row.company)),
                EH.Utils.normalize(row.operation || row.kind || ''),
                EH.Utils.normalize(row.category || ''),
                this.money(row.originalValue || 0).toFixed(2),
                this.money(row.amount || 0).toFixed(2)
            ].join('|');
        },

        recordFromCommission(row, occurrence) {
            const date = this.parseDateTime(row.dateTime);
            const company = this.normalizeCompany(row.company);
            const operation = EH.Utils.clean(row.operation || row.kind || 'MOVIMENTO').toUpperCase();
            const category = EH.Utils.normalize(row.category).includes('PASSAGEM') || operation === 'CANCELAMENTO'
                ? 'PASSAGEM'
                : 'OUTRO';
            const original = row.originalValue === null || row.originalValue === undefined ? 0 : this.money(row.originalValue);
            const commission = this.money(row.amount);
            const base = this.makeCommissionBaseKey(row);
            const sourceKey = `${base}|${occurrence}`;
            return {
                id: sourceKey,
                sourceKey,
                source: 'epass_comissoes',
                sourceOrigin: 'epass',
                category,
                status: operation,
                operationStatus: EH.Utils.clean(row.operationStatus || ''),
                dateTime: this.formatDateTime(date) || EH.Utils.clean(row.dateTime || ''),
                timestamp: date?.getTime?.() || 0,
                dayKey: this.dayKey(date),
                monthKey: this.monthKey(date),
                company,
                companyCode: '',
                passenger: '',
                cpfMasked: '',
                identifier: '',
                saleId: '',
                originalValue: original,
                caixaValue: null,
                caixaAdjustment: 0,
                commissionPercent: original ? this.money((commission / original) * 100) : this.commissionPercentFor(company),
                commissionEpass: commission,
                commissionEstimated: original ? this.estimateCommission(original, company) : 0,
                nature: 'neutro',
                description: row.isPriorBalance ? 'Saldo anterior' : '',
                operator: EH.Utils.clean(row.operator || ''),
                rawReference: EH.Utils.clean(row.rawText || ''),
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
        },

        recordFromCaixa(sale) {
            const date = this.parseDateTime(sale.dateTime);
            const company = this.normalizeCompany(sale.companyCode);
            const value = this.money(sale.total);
            const sourceKey = `caixa|${sale.saleId || `${EH.Utils.normalize(sale.dateTime)}|${company}|${value.toFixed(2)}`}`;
            return {
                id: sourceKey,
                sourceKey,
                source: 'epass_caixa',
                sourceOrigin: 'epass',
                category: 'PASSAGEM',
                status: 'VENDA',
                operationStatus: '',
                dateTime: this.formatDateTime(date) || EH.Utils.clean(sale.dateTime || ''),
                timestamp: date?.getTime?.() || 0,
                dayKey: this.dayKey(date),
                monthKey: this.monthKey(date),
                company,
                companyCode: EH.Utils.clean(sale.companyCode || ''),
                passenger: EH.Utils.clean(sale.passenger || ''),
                cpfMasked: '',
                identifier: sale.saleId || '',
                saleId: sale.saleId || '',
                originalValue: value,
                caixaValue: value,
                caixaAdjustment: 0,
                commissionPercent: this.commissionPercentFor(company),
                commissionEpass: null,
                commissionEstimated: this.estimateCommission(value, company),
                nature: 'entrada',
                description: '',
                operator: EH.Utils.clean(sale.agent || ''),
                breakdown: sale.breakdown || {},
                rawReference: EH.Utils.clean(sale.rawLaunch || ''),
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
        },

        upsert(record, records = null) {
            const list = records || this.load();
            const index = list.findIndex(item => item.sourceKey === record.sourceKey || item.id === record.id);
            if (index >= 0) {
                const originalCreatedAt = list[index].createdAt || record.createdAt || Date.now();
                list[index] = { ...list[index], ...record, createdAt: originalCreatedAt, updatedAt: Date.now() };
                return { list, added: false, record: list[index] };
            }
            list.push(record);
            return { list, added: true, record };
        },

        reconcile(records) {
            const list = Array.isArray(records) ? records : [];
            list.forEach(record => {
                if (record.source === 'epass_caixa') {
                    delete record.mergedInto;
                    record.shadowedByCommission = false;
                    delete record.linkedCommissionKeys;
                }
                if (record.source === 'epass_comissoes') {
                    delete record.linkedToSaleSource;
                    delete record.mergedIntoSaleSource;
                    delete record.saleId;
                    delete record.identifier;
                    delete record.passenger;
                    delete record.companyCode;
                    record.caixaValue = null;
                    record.caixaAdjustment = 0;
                    delete record.reconciliationMode;
                }
            });
            const sales = list.filter(record => record.source === 'epass_caixa' && record.status === 'VENDA' && !record.deleted);
            const commissions = list.filter(record => record.source === 'epass_comissoes' && record.category === 'PASSAGEM' && record.status === 'VENDA' && !record.deleted);

            sales.forEach(sale => {
                const saleTime = Number(sale.timestamp || 0);
                const saleValue = this.money(sale.originalValue || sale.caixaValue || 0);
                if (!(saleValue > 0)) return;
                const candidates = commissions
                    .filter(item => !item.linkedToSaleSource && item.company === sale.company && Math.abs(Number(item.timestamp || 0) - saleTime) <= 5000)
                    .sort((a, b) => Math.abs(Number(a.timestamp || 0) - saleTime) - Math.abs(Number(b.timestamp || 0) - saleTime));
                if (!candidates.length) return;

                // 1) Preferência máxima: soma exata da base comissionável = total do Caixa.
                let sum = 0;
                let chosen = [];
                for (const item of candidates) {
                    const value = this.money(item.originalValue || 0);
                    if (!(value > 0)) continue;
                    if (sum + value > saleValue + 0.02) continue;
                    chosen.push(item);
                    sum = this.money(sum + value);
                    if (Math.abs(sum - saleValue) <= 0.02) break;
                }
                let reconciliationMode = 'exact';
                let adjustment = 0;

                // 2) Caso real do E-Pass: Caixa pode conter taxa que não faz parte
                // da base de comissão. Só aceitamos essa conciliação quando TODOS
                // os eventos muito próximos (<=2,5 s) cabem no total e a diferença
                // positiva é pequena. Isso evita esconder vendas apenas por horário.
                if (!chosen.length || Math.abs(sum - saleValue) > 0.02) {
                    const veryClose = candidates.filter(item =>
                        Math.abs(Number(item.timestamp || 0) - saleTime) <= 2500
                        && this.money(item.originalValue || 0) > 0
                    );
                    const closeSum = this.money(veryClose.reduce((acc, item) => acc + this.money(item.originalValue || 0), 0));
                    const gap = this.money(saleValue - closeSum);
                    const maxGap = this.money(Math.min(15, Math.max(0.50, saleValue * 0.12)));
                    if (veryClose.length && closeSum > 0 && gap > 0.02 && gap <= maxGap) {
                        chosen = veryClose;
                        sum = closeSum;
                        adjustment = gap;
                        reconciliationMode = 'caixa-vs-base-comissionavel';
                    } else {
                        return;
                    }
                }

                sale.shadowedByCommission = true;
                sale.caixaValue = saleValue;
                sale.commissionEpass = this.money(chosen.reduce((acc, item) => acc + this.effectiveCommission(item), 0));
                // Percentual real continua calculado sobre a BASE comissionável,
                // nunca sobre a taxa adicional do Caixa.
                const commissionBase = this.money(chosen.reduce((acc, item) => acc + this.money(item.originalValue || 0), 0));
                sale.commissionPercent = commissionBase > 0 ? this.money((sale.commissionEpass / commissionBase) * 100) : sale.commissionPercent;
                sale.linkedCommissionKeys = chosen.map(item => item.sourceKey);
                sale.reconciliationMode = reconciliationMode;
                sale.caixaAdjustment = adjustment;

                chosen.forEach((item, index) => {
                    item.saleId = sale.saleId || item.saleId;
                    item.identifier = sale.saleId || item.identifier;
                    item.passenger = item.passenger || sale.passenger;
                    item.companyCode = item.companyCode || sale.companyCode;
                    item.caixaValue = saleValue;
                    // A diferença Caixa - base é aplicada UMA ÚNICA VEZ ao primeiro
                    // evento; os demais continuam com sua base individual intacta.
                    item.caixaAdjustment = index === 0 ? adjustment : 0;
                    item.reconciliationMode = reconciliationMode;
                    item.mergedIntoSaleSource = sale.sourceKey;
                    item.linkedToSaleSource = sale.sourceKey;
                });
            });
            return list;
        },

        syncFromCurrentPage({ quiet = false } = {}) {
            if (!EH.Config.FINANCE_AUTO_REGISTER && quiet) return { added: 0, updated: 0, total: this.load().length };
            const snapshot = EH.FinanceReader?.snapshot?.();
            if (!snapshot) {
                if (!quiet) EH.Toast.warning('Abra a tela de Caixa ou Comissões para atualizar os dados.');
                return { added: 0, updated: 0, total: this.load().length };
            }

            let records = this.load();
            let added = 0;
            let updated = 0;
            const meta = this.loadMeta();

            if (snapshot.page === 'caixa') {
                (snapshot.sales || []).forEach(sale => {
                    const result = this.upsert(this.recordFromCaixa(sale), records);
                    records = result.list;
                    result.added ? added++ : updated++;
                });
                meta.lastCaixa = {
                    capturedAt: Date.now(),
                    header: snapshot.header || null,
                    commissionSummary: snapshot.commissionSummary || []
                };
            }

            if (snapshot.page === 'comissoes') {
                const occurrences = new Map();
                (snapshot.history || []).forEach(row => {
                    if (row.isPriorBalance) return;
                    const base = this.makeCommissionBaseKey(row);
                    const occurrence = (occurrences.get(base) || 0) + 1;
                    occurrences.set(base, occurrence);
                    const result = this.upsert(this.recordFromCommission(row, occurrence), records);
                    records = result.list;
                    result.added ? added++ : updated++;
                });
                meta.lastCommissionSummary = {
                    capturedAt: Date.now(),
                    summary: snapshot.summary || []
                };
            }

            records = this.reconcile(records);
            this.save(records);
            this.saveMeta(meta);
            if (!quiet) EH.Toast.success(`Financeiro atualizado: ${added} novo${added === 1 ? '' : 's'} • ${updated} conferido${updated === 1 ? '' : 's'}.`);
            EH.UI?.renderAutomation?.(EH.Pages?.detect?.() || 'desconhecida');
            return { added, updated, total: records.length };
        },

        addMerchandise(data = {}) {
            const type = data.category === 'MERCADORIA_ENVIADA' ? 'MERCADORIA_ENVIADA' : 'MERCADORIA_RECEBIDA';
            const company = this.normalizeCompany(data.company || 'NÃO INFORMADA');
            const value = this.money(data.originalValue);
            if (!(value > 0)) throw new Error('Informe um valor maior que zero.');
            const date = this.parseDateTime(data.dateTime) || new Date();
            const id = data.id || `manual|${date.getTime()}|${Math.random().toString(36).slice(2,8)}`;
            const percent = Number.isFinite(Number(data.commissionPercent)) ? Number(data.commissionPercent) : this.commissionPercentFor(company);
            const record = {
                id,
                sourceKey: id,
                source: 'manual',
                sourceOrigin: 'manual',
                category: type,
                status: 'ATIVO',
                operationStatus: '',
                dateTime: this.formatDateTime(date),
                timestamp: date.getTime(),
                dayKey: this.dayKey(date),
                monthKey: this.monthKey(date),
                company,
                companyCode: '',
                passenger: '',
                cpfMasked: '',
                identifier: id,
                saleId: '',
                originalValue: value,
                commissionPercent: this.money(percent),
                commissionEpass: null,
                commissionEstimated: this.money(value * percent / 100),
                nature: ['entrada','saida','neutro'].includes(data.nature) ? data.nature : 'neutro',
                description: EH.Utils.clean(data.description || ''),
                operator: '',
                rawReference: '',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            let records = this.load();
            const index = records.findIndex(item => item.id === id);
            if (index >= 0) records[index] = { ...records[index], ...record, createdAt: records[index].createdAt || record.createdAt };
            else records.push(record);
            this.save(records);
            EH.UI?.renderAutomation?.(EH.Pages?.detect?.() || 'desconhecida');
            return record;
        },

        deleteManual(id) {
            let records = this.load();
            const record = records.find(item => item.id === id);
            if (!record || record.sourceOrigin !== 'manual') return false;
            records = records.filter(item => item.id !== id);
            this.save(records);
            EH.UI?.renderAutomation?.(EH.Pages?.detect?.() || 'desconhecida');
            return true;
        },

        visibleRecords() {
            return this.load().filter(record => !record.deleted && !record.shadowedByCommission);
        },

        recordsForPeriod({ start = null, end = null, monthKey = '', dayKey = '' } = {}) {
            return this.visibleRecords().filter(record => {
                if (dayKey && record.dayKey !== dayKey) return false;
                if (monthKey && record.monthKey !== monthKey) return false;
                if (start && Number(record.timestamp || 0) < start.getTime()) return false;
                if (end && Number(record.timestamp || 0) > end.getTime()) return false;
                return true;
            });
        },

        summary(records = this.visibleRecords()) {
            const valid = Array.isArray(records) ? records : [];
            const result = {
                operations: 0,
                passageCount: 0,
                passageValue: 0,
                merchandiseReceivedCount: 0,
                merchandiseReceivedValue: 0,
                merchandiseSentCount: 0,
                merchandiseSentValue: 0,
                movement: 0,
                commission: 0,
                entradas: 0,
                saidas: 0,
                byCompany: {}
            };
            valid.forEach(record => {
                const movement = this.isCountableMovement(record) ? this.effectiveMovement(record) : 0;
                const commission = this.isCommissionEffect(record) ? this.effectiveCommission(record) : 0;
                if (movement || commission) result.operations += 1;
                if (record.category === 'PASSAGEM' && this.isCountableMovement(record)) {
                    result.passageCount += 1;
                    result.passageValue += movement;
                } else if (record.category === 'MERCADORIA_RECEBIDA' && this.isCountableMovement(record)) {
                    result.merchandiseReceivedCount += 1;
                    result.merchandiseReceivedValue += movement;
                } else if (record.category === 'MERCADORIA_ENVIADA' && this.isCountableMovement(record)) {
                    result.merchandiseSentCount += 1;
                    result.merchandiseSentValue += movement;
                }
                result.movement += movement;
                result.commission += commission;
                if (record.nature === 'entrada') result.entradas += movement;
                if (record.nature === 'saida') result.saidas += movement;

                const company = this.normalizeCompany(record.company);
                if (!result.byCompany[company]) result.byCompany[company] = { company, operations: 0, passageValue: 0, merchandiseValue: 0, movement: 0, commission: 0, percents: [] };
                const bucket = result.byCompany[company];
                if (movement || commission) bucket.operations += 1;
                if (record.category === 'PASSAGEM') bucket.passageValue += movement;
                if (record.category === 'MERCADORIA_RECEBIDA' || record.category === 'MERCADORIA_ENVIADA') bucket.merchandiseValue += movement;
                bucket.movement += movement;
                bucket.commission += commission;
                if (record.originalValue > 0) {
                    const pct = record.commissionEpass !== null && record.commissionEpass !== undefined
                        ? (Number(record.commissionEpass) / Number(record.originalValue)) * 100
                        : Number(record.commissionPercent || 0);
                    if (Number.isFinite(pct)) bucket.percents.push(pct);
                }
            });
            ['passageValue','merchandiseReceivedValue','merchandiseSentValue','movement','commission','entradas','saidas'].forEach(key => result[key] = this.money(result[key]));
            Object.values(result.byCompany).forEach(bucket => {
                bucket.passageValue = this.money(bucket.passageValue);
                bucket.merchandiseValue = this.money(bucket.merchandiseValue);
                bucket.movement = this.money(bucket.movement);
                bucket.commission = this.money(bucket.commission);
                bucket.averagePercent = bucket.percents.length ? this.money(bucket.percents.reduce((a,b)=>a+b,0) / bucket.percents.length) : 0;
                delete bucket.percents;
            });
            return result;
        },

        todaySummary() {
            return this.summary(this.recordsForPeriod({ dayKey: this.dayKey(new Date()) }));
        },

        monthSummary(monthKey = this.monthKey(new Date())) {
            return this.summary(this.recordsForPeriod({ monthKey }));
        },

        monthStats(monthKey = this.monthKey(new Date()), now = new Date()) {
            const match = String(monthKey || '').match(/^(\d{4})-(\d{2})$/);
            if (!match) return null;
            const year = Number(match[1]);
            const month = Number(match[2]);
            const daysInMonth = new Date(year, month, 0).getDate();
            const currentKey = this.monthKey(now);
            const summary = this.monthSummary(monthKey);
            const isCurrentMonth = monthKey === currentKey;
            const isPastMonth = monthKey < currentKey;
            const isFutureMonth = monthKey > currentKey;
            const elapsedDays = isCurrentMonth ? Math.max(1, now.getDate()) : (isPastMonth ? daysInMonth : 0);
            const divisor = Math.max(1, elapsedDays || 1);
            const merchandiseValue = this.money(summary.merchandiseReceivedValue + summary.merchandiseSentValue);
            const average = {
                movement: elapsedDays ? this.money(summary.movement / divisor) : 0,
                passage: elapsedDays ? this.money(summary.passageValue / divisor) : 0,
                merchandise: elapsedDays ? this.money(merchandiseValue / divisor) : 0,
                commission: elapsedDays ? this.money(summary.commission / divisor) : 0
            };
            const configuredCommissionPercent = Math.max(0, Number(EH.Config.FINANCE_COMMISSION_PERCENT) || 0);
            const projectedMovement = this.money(average.movement * daysInMonth);
            const projection = isCurrentMonth ? {
                movement: projectedMovement,
                passage: this.money(average.passage * daysInMonth),
                merchandise: this.money(average.merchandise * daysInMonth),
                // Projeção estatística: usa o percentual atualmente configurado no Helper.
                // Não altera comissão realizada nem cria operação financeira.
                commission: this.money(projectedMovement * configuredCommissionPercent / 100),
                commissionPercent: configuredCommissionPercent
            } : null;
            return {
                monthKey,
                year,
                month,
                daysInMonth,
                elapsedDays,
                isCurrentMonth,
                isPastMonth,
                isFutureMonth,
                summary,
                merchandiseValue,
                average,
                projection,
                projectionDate: `${String(daysInMonth).padStart(2,'0')}/${String(month).padStart(2,'0')}`
            };
        },

        companies() {
            const set = new Set(['EXPRESSO MAIA','JOTAMAR','NOVO HORIZONTE','CENTRAL BAHIA']);
            this.load().forEach(record => record.company && set.add(this.normalizeCompany(record.company)));
            return Array.from(set).filter(Boolean).sort((a,b)=>a.localeCompare(b,'pt-BR'));
        },

        officialCommissionByCompany() {
            const meta = this.loadMeta();
            const rows = meta.lastCommissionSummary?.summary || meta.lastCaixa?.commissionSummary || [];
            const map = {};
            rows.forEach(item => { map[this.normalizeCompany(item.company)] = this.money(item.amount); });
            return map;
        },

        exportCsv() {
            const rows = this.visibleRecords().slice().sort((a,b)=>Number(a.timestamp||0)-Number(b.timestamp||0));
            const header = ['data_hora','categoria','status','empresa','valor_original','comissao_epass','comissao_helper','percentual','natureza','identificador','passageiro','origem'];
            const escape = value => `"${String(value ?? '').replace(/"/g,'""')}"`;
            const lines = [header.join(';')];
            rows.forEach(record => lines.push([
                record.dateTime, record.category, record.status, record.company,
                Number(record.originalValue||0).toFixed(2).replace('.',','),
                record.commissionEpass === null || record.commissionEpass === undefined ? '' : Number(record.commissionEpass).toFixed(2).replace('.',','),
                Number(record.commissionEstimated||0).toFixed(2).replace('.',','),
                Number(record.commissionPercent||0).toFixed(2).replace('.',','),
                record.nature, record.identifier, record.passenger, record.sourceOrigin
            ].map(escape).join(';')));
            const blob = new Blob(['\ufeff'+lines.join('\n')], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `epass-helper-financeiro-${this.dayKey(new Date())}.csv`;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(()=>URL.revokeObjectURL(url),1000);
        },

        exportBackup() {
            const payload = { version: 1, exportedAt: new Date().toISOString(), records: this.load(), meta: this.loadMeta() };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `epass-helper-financeiro-backup-${this.dayKey(new Date())}.json`;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(()=>URL.revokeObjectURL(url),1000);
        }
    };

    // ============================================================
    // PARSER
    // ============================================================
    EH.Parser = {
        parsePesquisa() {
            const origemElement = EH.Utils.first(EH.Selectors.ORIGEM);
            const destinoElement = EH.Utils.first(EH.Selectors.DESTINO);
            const dateElement = EH.Utils.first(EH.Selectors.DATA);
            const candidateTables = Array.from(document.querySelectorAll('app-pesquisa-venda table, app-pesquisa table, table.table-hover, table.table-striped'));
            const tableByHeaders = candidateTables.find(item => {
                const headers = Array.from(item.querySelectorAll('thead th')).map(th => EH.Utils.normalize(th.textContent));
                return headers.some(h => h.includes('HORARIO DE SAIDA')) && headers.includes('LINHA') && headers.includes('VALOR');
            });
            const table = tableByHeaders || EH.Utils.first(EH.Selectors.TABLE_HORARIOS);

            const dados = {
                origem: EH.Utils.text(origemElement),
                destino: EH.Utils.text(destinoElement),
                data: EH.Utils.formatDate(dateElement ? dateElement.value : ''),
                horarios: []
            };

            if (!table) return dados;

            const groups = new Map();
            const rows = EH.Utils.all(EH.Selectors.TABLE_ROWS, table);
            const headers = Array.from(table.querySelectorAll('thead th')).map(th => EH.Utils.normalize(th.textContent));
            const headerIndex = (...patterns) => headers.findIndex(header => patterns.some(pattern => pattern instanceof RegExp ? pattern.test(header) : header === pattern));
            const indexes = {
                servico: headerIndex('SERVICO'),
                saida: headerIndex(/HORARIO DE SAIDA/),
                linha: headerIndex('LINHA'),
                chegada: headerIndex(/HORARIO DE CHEGADA/),
                valor: headerIndex('VALOR')
            };
            const cellAt = (row, index, fallbackSelector) => {
                if (index >= 0) return Array.from(row.children || []).filter(el => el.tagName === 'TD')[index] || null;
                return fallbackSelector ? row.querySelector(fallbackSelector) : null;
            };

            rows.forEach(row => {
                const serviceCell = cellAt(row, indexes.servico, 'td:first-child');
                const saidaCell = cellAt(row, indexes.saida, EH.Selectors.CELULA_SAIDA);
                const lineElement = cellAt(row, indexes.linha, EH.Selectors.CELULA_LINHA);
                const chegadaCell = cellAt(row, indexes.chegada, EH.Selectors.CELULA_CHEGADA);
                const valueCell = cellAt(row, indexes.valor, EH.Selectors.CELULA_VALOR);
                const servico = EH.Utils.clean(EH.Utils.text(serviceCell)).match(/\d+/)?.[0] || '';
                const saida = EH.Utils.extractTime(EH.Utils.text(saidaCell));
                const chegada = EH.Utils.extractTime(EH.Utils.text(chegadaCell));
                const badge = EH.Utils.text(lineElement?.querySelector?.('.badge'));
                const lineCell = EH.Utils.text(lineElement);
                const empresa = EH.Utils.mapLine(badge || '');
                const linhaReal = badge && EH.Utils.normalize(lineCell).startsWith(EH.Utils.normalize(badge))
                    ? EH.Utils.clean(lineCell.slice(badge.length))
                    : EH.Utils.clean(lineCell);
                // Compatibilidade: `linha` sempre foi o nome comercial exibido ao cliente.
                // A linha técnica real fica preservada separadamente em `linhaReal`.
                const linha = empresa || EH.Utils.mapLine(lineCell);
                const valueText = EH.Utils.text(valueCell);
                const valorBaseNum = EH.Utils.parseMoneyStrict(valueText);
                const fare = valorBaseNum === null
                    ? { success:false, valorBaseNum:0, taxaEmbarqueNum:0, valorFinalNum:0, taxaOrigem:'', valorBase:'', taxaEmbarque:'', valorFinal:'' }
                    : EH.Fares.calculate(valorBaseNum, dados.origem);
                const precoNum = fare.valorFinalNum;
                const preco = fare.valorFinal;
                const taxaAplicada = fare.taxaEmbarqueNum;
                const taxaOrigem = fare.taxaOrigem;

                if (EH.Config.DEBUG && valorBaseNum !== null) {
                    EH.Logger.trace('Valores',
                        `origem=${dados.origem || '—'}`,
                        `base=${fare.valorBaseNum.toFixed(2)}`,
                        `taxa=${fare.taxaEmbarqueNum.toFixed(2)}`,
                        `final=${fare.valorFinalNum.toFixed(2)}`
                    );
                }
                const typeElement = valueCell?.querySelector?.('small') || row.querySelector(EH.Selectors.CELULA_TIPO);
                const typeRaw = EH.Utils.extractVehicleType(EH.Utils.text(typeElement), valueText);
                const typeNormalized = EH.Utils.normalize(typeRaw);
                let tipo = typeRaw;
                let andar = '';

                if (typeNormalized.includes('DOUBLE DECK') || typeNormalized.includes('DOIS ANDARES')) {
                    tipo = typeNormalized.includes('CONVENCIONAL') ? 'CONVENCIONAL COM SANITARIO - DOIS ANDARES' : 'DOIS ANDARES';
                    if (typeNormalized.includes('1º ANDAR') || typeNormalized.includes('1O ANDAR')) andar = '1º ANDAR';
                    if (typeNormalized.includes('2º ANDAR') || typeNormalized.includes('2O ANDAR')) andar = '2º ANDAR';
                }

                if (!saida && !chegada && !linha && !preco) return;

                const key = [saida, chegada, linha, preco].join('|');
                if (!groups.has(key)) {
                    groups.set(key, {
                        saida,
                        chegada,
                        linha,
                        empresa,
                        linhaReal,
                        servicos: servico ? [servico] : [],
                        // Campos novos são a fonte de verdade; aliases preco/precoNum
                        // permanecem para compatibilidade com módulos antigos.
                        valorBaseNum: fare.valorBaseNum,
                        taxaEmbarqueNum: fare.taxaEmbarqueNum,
                        valorFinalNum: fare.valorFinalNum,
                        valorBase: fare.valorBase,
                        taxaEmbarque: fare.taxaEmbarque,
                        valorFinal: fare.valorFinal,
                        preco,
                        precoNum,
                        taxaAplicada,
                        taxaOrigem,
                        tipo,
                        andares: []
                    });
                }

                const item = groups.get(key);
                if (servico && !item.servicos.includes(servico)) item.servicos.push(servico);
                if (!item.linhaReal && linhaReal) item.linhaReal = linhaReal;
                if (!item.empresa && empresa) item.empresa = empresa;
                if (andar) item.andares.push(andar);
                if (!item.tipo && tipo) item.tipo = tipo;
            });

            dados.horarios = Array.from(groups.values()).map(item => {
                const andares = EH.Utils.unique(item.andares);
                let tipo = item.tipo;
                if (EH.Utils.normalize(tipo).includes('DOIS ANDARES') && andares.length) {
                    tipo = `${EH.Utils.prettifyWords(tipo)} (${andares.join(' E ')})`;
                } else {
                    tipo = EH.Utils.prettifyWords(tipo);
                }
                return { ...item, tipo, andares };
            });

            dados.horarios.sort((a, b) => {
                return EH.Utils.timeToMinutes(a.saida) - EH.Utils.timeToMinutes(b.saida);
            });
            EH.Logger.trace('Horarios', `${dados.horarios.length} horário(s) normalizado(s)`, {
                origem: dados.origem,
                destino: dados.destino,
                taxaAtiva: EH.Config.APLICAR_TAXAS_ORIGEM
            });

            return dados;
        },

        findValueByLabel(root, patterns) {
            if (!root) return '';
            const regexes = patterns.map(pattern => pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i'));
            const cards = EH.Utils.all('.card, [class*="card"]', root);

            for (const card of cards) {
                const normalized = EH.Utils.normalize(card.innerText || card.textContent);
                if (!regexes.some(regex => regex.test(normalized))) continue;

                const candidates = EH.Utils.all('h1, h2, h3, h4, strong, .valor, .value', card)
                    .map(element => EH.Utils.text(element))
                    .filter(Boolean);

                for (let index = candidates.length - 1; index >= 0; index -= 1) {
                    const value = candidates[index];
                    const valueNormalized = EH.Utils.normalize(value);
                    const isOnlyLabel = regexes.some(regex => regex.test(valueNormalized)) && valueNormalized.length < 28;
                    if (!isOnlyLabel) return value;
                }
            }

            const labels = EH.Utils.all('span, small, p, label, h4, h5', root);
            for (const label of labels) {
                const normalized = EH.Utils.normalize(label.textContent);
                if (!regexes.some(regex => regex.test(normalized))) continue;

                const card = label.closest('.card, [class*="card"]') || label.parentElement;
                if (!card) continue;
                const valueElement = card.querySelector('h1, h2, h3, strong, .valor, .value');
                const value = EH.Utils.text(valueElement);
                if (value && EH.Utils.normalize(value) !== normalized) return value;
            }

            return '';
        },

        findRoute(root) {
            if (!root) return '';
            const headings = EH.Utils.all('h1, h2, h3, h4, strong', root)
                .map(element => EH.Utils.text(element))
                .filter(Boolean);

            const route = headings.find(text => /\s[xX×]\s|\s→\s|\s-\s/.test(text));
            return route || headings[0] || '';
        },

        parseReserva() {
            const panel = EH.Utils.first(EH.Selectors.DADOS_RESERVA);
            const map = EH.Utils.first(EH.Selectors.MAPA_POLTRONAS);

            const dados = {
                origemDestino: this.findRoute(panel),
                linha: this.findValueByLabel(panel, [/\bLINHA\b/, /EMPRESA/]),
                tarifa: this.findValueByLabel(panel, [/TARIFA/, /PASSAGEM/]),
                taxa: this.findValueByLabel(panel, [/TAXA DE EMBARQUE/, /\bTAXA\b/]),
                tipo: this.findValueByLabel(panel, [/\bTIPO\b/, /VEICULO/, /SERVICO/]),
                horaSaida: this.findValueByLabel(panel, [/HORA DE SAIDA/, /HORARIO DE SAIDA/, /\bSAIDA\b/]),
                valorParcial: EH.Utils.text(EH.Utils.first(EH.Selectors.VALOR_PARCIAL)),
                poltronasCount: this.findValueByLabel(panel, [/POLTRONAS?/, /OCUPACOES?/]),
                poltronasOcupadas: [],
                poltronasReservadas: [],
                poltronasLivres: [],
                poltronasSelecionadas: []
            };

            dados.linha = EH.Utils.mapLine(dados.linha);
            dados.horaSaida = EH.Utils.extractTime(dados.horaSaida) || dados.horaSaida;

            if (map) {
                EH.Utils.all(EH.Selectors.POLTRONA_BUTTON, map).forEach(button => {
                    const number = EH.Utils.clean(
                        button.getAttribute('aria-label') ||
                        button.getAttribute('title') ||
                        button.textContent
                    ).match(/\d+/)?.[0] || '';
                    if (!number) return;

                    const classes = EH.Utils.normalize(button.className);
                    const disabled = button.disabled || classes.includes('DESABILITAD');
                    const selected = classes.includes('SELECIONAD') || button.getAttribute('aria-pressed') === 'true';
                    const occupied = classes.includes('OCUPAD');
                    const reserved = classes.includes('RESERVAD');

                    if (disabled) return;
                    if (selected) dados.poltronasSelecionadas.push(number);
                    else if (occupied) dados.poltronasOcupadas.push(number);
                    else if (reserved) dados.poltronasReservadas.push(number);
                    else dados.poltronasLivres.push(number);
                });
            }

            dados.poltronasOcupadas = EH.Utils.sortSeats(dados.poltronasOcupadas);
            dados.poltronasReservadas = EH.Utils.sortSeats(dados.poltronasReservadas);
            dados.poltronasLivres = EH.Utils.sortSeats(dados.poltronasLivres);
            dados.poltronasSelecionadas = EH.Utils.sortSeats(dados.poltronasSelecionadas);

            const total =
                dados.poltronasOcupadas.length +
                dados.poltronasReservadas.length +
                dados.poltronasLivres.length +
                dados.poltronasSelecionadas.length;

            dados.totalPoltronas = total;
            dados.quantidadeLivres = dados.poltronasLivres.length;
            dados.valorTotalNum = EH.Utils.parseMoney(dados.valorParcial);

            if (!dados.valorTotalNum) {
                dados.valorTotalNum = EH.Utils.parseMoney(dados.tarifa) + EH.Utils.parseMoney(dados.taxa);
            }

            return dados;
        },

        shortPlace(value) {
            const clean = EH.Utils.clean(value).replace(/\s*-\s*[A-Z]{2}\s*$/i, '').trim();
            if (!clean) return '';
            return clean.toLocaleLowerCase('pt-BR').replace(/(^|[\s-])([a-záàâãéêíóôõúüç])/g, (_m, sep, chr) => `${sep}${chr.toLocaleUpperCase('pt-BR')}`);
        },

        shortDate(value) {
            const match = String(value || '').match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?/);
            return match ? `${match[1]}/${match[2]}` : EH.Utils.clean(value);
        },

        formatPesquisaResumo(dados) {
            const horarios = Array.isArray(dados?.horarios) ? dados.horarios.filter(item => item?.saida) : [];
            const origem = this.shortPlace(dados?.origem) || 'Origem';
            const destino = this.shortPlace(dados?.destino) || 'Destino';
            const lines = [`${origem} → ${destino}`, ''];

            if (!horarios.length) {
                lines.push('⚠️ Nenhum horário encontrado.');
                return lines.join('\n').trim();
            }

            const prices = horarios.map(item => Math.round(EH.Fares.finalNumber(item) * 100));
            const validPrices = prices.filter(value => value > 0);
            const samePrice = validPrices.length === horarios.length && new Set(validPrices).size === 1;

            if (samePrice) {
                const times = EH.Utils.unique(horarios.map(item => item.saida).filter(Boolean));
                lines.push(`🕐 ${times.join(' | ')}`);
                lines.push(`💰 ${EH.Fares.display(horarios[0], EH.Utils.formatMoney(validPrices[0] / 100))}`);
            } else {
                horarios.forEach(item => {
                    const value = EH.Fares.display(item, 'Consulte o valor');
                    lines.push(`🕐 ${item.saida} — ${value}`);
                });
            }

            lines.push('', 'Escolha o horário desejado.');
            return lines.join('\n').trim();
        },

        formatPesquisaDetalhes(dados) {
            const lines = [];
            if (dados.origem) lines.push(`🚍 *ORIGEM:* ${dados.origem}`);
            if (dados.destino) lines.push(`📍 *DESTINO:* ${dados.destino}`);
            lines.push(dados.data ? `🗓️ *DATA:* ${dados.data}` : '🗓️ *CONSULTE A DATA DA VIAGEM*');

            if (!dados.horarios.length) {
                lines.push('', '⚠️ Nenhum horário foi encontrado nesta pesquisa.');
                return lines.join('\n');
            }

            lines.push('', '🕐 *HORÁRIOS DISPONÍVEIS*');
            const numberEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

            dados.horarios.forEach((item, index) => {
                lines.push('');
                const number = numberEmoji[index] || `${index + 1}.`;
                const timeParts = [];
                if (item.saida) timeParts.push(`Saída às ${item.saida}`);
                if (item.chegada) timeParts.push(`Chegada às ${item.chegada}`);
                lines.push(`${number} ${timeParts.join(' | ')}`.trim());
                if (item.linha) lines.push(`🚌 ${item.linha}`);
                if (item.tipo) lines.push(`💺 ${item.tipo}`);
                const finalPrice = EH.Fares.display(item, '');
                if (finalPrice) lines.push(`💰 ${finalPrice}`);
            });

            return lines.join('\n');
        },

        formatReservaResumo(dados) {
            const lines = [];
            if (dados.origemDestino) lines.push(`📍 ${dados.origemDestino}`);
            if (dados.horaSaida) lines.push(`🕐 Saída: ${dados.horaSaida}`);
            if (dados.poltronasLivres?.length) lines.push(`💺 Disponíveis: ${dados.poltronasLivres.join(', ')}`);
            if (dados.valorTotalNum > 0) lines.push(`💰 ${EH.Utils.formatMoney(dados.valorTotalNum)}`);
            return lines.length ? lines.join('\n') : this.formatReserva(dados);
        },

        formatReserva(dados) {
            const lines = ['🎫 *INFORMAÇÕES DA VIAGEM*'];
            if (dados.origemDestino) lines.push(`📍 *Trecho:* ${dados.origemDestino}`);
            if (dados.linha) lines.push(`🚌 *Linha:* ${dados.linha}`);
            if (dados.horaSaida) lines.push(`🕐 *Saída:* ${dados.horaSaida}`);
            if (dados.tipo) lines.push(`💺 *Tipo:* ${dados.tipo}`);
            if (dados.tarifa) lines.push(`💰 *Tarifa:* ${dados.tarifa}`);
            if (dados.taxa) lines.push(`🏷️ *Taxa de embarque:* ${dados.taxa}`);
            if (dados.valorTotalNum > 0) lines.push(`💳 *Valor total:* ${EH.Utils.formatMoney(dados.valorTotalNum)}`);

            if (dados.totalPoltronas > 0) {
                lines.push(`🪑 *Poltronas livres:* ${dados.quantidadeLivres} de ${dados.totalPoltronas}`);
            } else if (dados.poltronasCount) {
                lines.push(`🪑 *Poltronas:* ${dados.poltronasCount}`);
            }

            if (dados.poltronasLivres.length) {
                lines.push(`✅ *Disponíveis:* ${dados.poltronasLivres.join(', ')}`);
            }
            if (dados.poltronasSelecionadas.length) {
                lines.push(`☑️ *Selecionadas:* ${dados.poltronasSelecionadas.join(', ')}`);
            }

            return lines.join('\n');
        },

        formatSummary(data, page) {
            return page === 'reserva' ? this.formatReservaResumo(data) : this.formatPesquisaResumo(data);
        },

        formatDetails(data, page) {
            return page === 'reserva' ? this.formatReserva(data) : this.formatPesquisaDetalhes(data);
        },

        formatForWhatsApp(data, page, mode = 'summary') {
            return mode === 'details' ? this.formatDetails(data, page) : this.formatSummary(data, page);
        }
    };

    // ============================================================
    // CLIPBOARD
    // ============================================================
    EH.Clipboard = {
        lastImage: null,

        rememberImage(dataUrl, filename = 'captura-epass.png', mime = 'image/png') {
            const value = String(dataUrl || '');
            if (!value.startsWith('data:image/')) return null;
            this.lastImage = { dataUrl: value, filename, mime, at: Date.now() };
            return this.lastImage;
        },

        getRecentImage(maxAge = 90000) {
            if (!this.lastImage?.dataUrl) return null;
            return (Date.now() - Number(this.lastImage.at || 0)) <= maxAge ? this.lastImage : null;
        },

        blobToDataUrl(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => reject(reader.error || new Error('Não foi possível ler a imagem.'));
                reader.readAsDataURL(blob);
            });
        },

        async copyText(text) {
            const value = String(text || '');
            if (!value) throw new Error('Não há texto para copiar.');
            this.lastImage = null;

            try {
                if (navigator.clipboard?.writeText && window.isSecureContext) {
                    await navigator.clipboard.writeText(value);
                    return 'clipboard';
                }
            } catch (error) {
                EH.Logger.debug('Clipboard de texto bloqueado:', error);
            }

            if (typeof GM_setClipboard === 'function') {
                GM_setClipboard(value, 'text');
                return 'tampermonkey';
            }

            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.style.cssText = 'position:fixed;left:-9999px;top:0;';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            const copied = document.execCommand('copy');
            textarea.remove();
            if (!copied) throw new Error('O navegador bloqueou a cópia do texto.');
            return 'legacy';
        },

        canvasToBlob(canvas) {
            return new Promise((resolve, reject) => {
                canvas.toBlob(blob => {
                    if (blob) resolve(blob);
                    else reject(new Error('Não foi possível criar o arquivo PNG.'));
                }, 'image/png', 1);
            });
        },

        tryAutoCopyImage(blobPromise) {
            if (!window.isSecureContext) {
                return Promise.resolve({ copied: false, reason: 'O E-Pass está em HTTP. O navegador não permite gravar PNG binário no clipboard nesta página.' });
            }
            if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
                return Promise.resolve({ copied: false, reason: 'A Clipboard API para imagens não está disponível neste navegador.' });
            }

            try {
                const item = new ClipboardItem({ 'image/png': blobPromise });
                return navigator.clipboard.write([item])
                    .then(() => ({ copied: true, method: 'clipboard-png' }))
                    .catch(error => ({ copied: false, reason: error.message || String(error) }));
            } catch (error) {
                return Promise.resolve({ copied: false, reason: error.message || String(error) });
            }
        },

        async finishAutoCopy(autoCopy) {
            // Não usar execCommand/seleção de <img>: em HTTP o Chromium pode copiar
            // apenas o alt-text (ex.: “Captura E-Pass”) e não o PNG.
            return autoCopy || { copied: false, reason: 'O navegador não aceitou a imagem na área de transferência.' };
        },

        async copyImageAnyContext(blob, dataUrl = '', filename = 'captura-epass.png') {
            try {
                const rememberedDataUrl = dataUrl || await this.blobToDataUrl(blob);
                this.rememberImage(rememberedDataUrl, filename, blob?.type || 'image/png');
            } catch (error) {
                EH.Logger.debug('Não foi possível manter a imagem em memória:', error);
            }
            if (!window.isSecureContext) {
                return { copied: false, reason: 'O E-Pass está em HTTP. A cópia binária de PNG é bloqueada pelo navegador; use “Enviar ao WhatsApp” ou “Baixar PNG”.' };
            }
            if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
                return { copied: false, reason: 'Este navegador não oferece Clipboard API para imagens.' };
            }
            try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                return { copied: true, method: 'clipboard-png' };
            } catch (error) {
                EH.Logger.debug('Clipboard PNG bloqueado:', error);
                return { copied: false, reason: error.message || 'O navegador bloqueou a cópia da imagem.' };
            }
        },

        dataUrlToBlob(dataUrl) {
            const [header, body] = String(dataUrl || '').split(',');
            const mime = header.match(/data:([^;]+)/)?.[1] || 'image/png';
            const binary = atob(body || '');
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
            return new Blob([bytes], { type: mime });
        },

        openImageForNativeCopy() {
            throw new Error('A cópia binária foi bloqueada. Use “Enviar ao WhatsApp” ou “Baixar PNG”.');
        }
    };

    // ============================================================
    // QR CODE LOCAL — sem serviços externos
    // QRCode for JavaScript — Copyright (c) 2009 Kazuhiko Arase — MIT License.
    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the "Software"), to deal
    // in the Software without restriction, including without limitation the rights
    // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    // copies of the Software, subject to inclusion of this copyright and permission notice.
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
    // O payload recebido do E-Pass é codificado sem alterações.
    // ============================================================
    EH.LocalQR = (() => {
        const modules = {};
        modules["QR8bitByte"] = function(module, exports, require) {
            var QRMode = require('QRMode');
            function QR8bitByte(data) {
                this.mode = QRMode.MODE_8BIT_BYTE;
                this.data = String(data == null ? '' : data);
                if (typeof TextEncoder !== 'undefined') {
                    this.bytes = Array.from(new TextEncoder().encode(this.data));
                } else {
                    var utf8 = unescape(encodeURIComponent(this.data));
                    this.bytes = [];
                    for (var i = 0; i < utf8.length; i++) this.bytes.push(utf8.charCodeAt(i));
                }
            }
            QR8bitByte.prototype = {
                getLength: function() { return this.bytes.length; },
                write: function(buffer) {
                    for (var i = 0; i < this.bytes.length; i++) buffer.put(this.bytes[i], 8);
                }
            };
            module.exports = QR8bitByte;
        };
        modules["QRBitBuffer"] = function(module, exports, require) {
            function QRBitBuffer() {
            	this.buffer = [];
            	this.length = 0;
            }
            
            QRBitBuffer.prototype = {
            
            	get : function(index) {
            		var bufIndex = Math.floor(index / 8);
            		return ( (this.buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
            	},
            	
            	put : function(num, length) {
            		for (var i = 0; i < length; i++) {
            			this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
            		}
            	},
            	
            	getLengthInBits : function() {
            		return this.length;
            	},
            	
            	putBit : function(bit) {
            	
            		var bufIndex = Math.floor(this.length / 8);
            		if (this.buffer.length <= bufIndex) {
            			this.buffer.push(0);
            		}
            	
            		if (bit) {
            			this.buffer[bufIndex] |= (0x80 >>> (this.length % 8) );
            		}
            	
            		this.length++;
            	}
            };
            
            module.exports = QRBitBuffer;
        };
        modules["QRErrorCorrectLevel"] = function(module, exports, require) {
            module.exports = {
            	L : 1,
            	M : 0,
            	Q : 3,
            	H : 2
            };
            
        };
        modules["QRMaskPattern"] = function(module, exports, require) {
            module.exports = {
            	PATTERN000 : 0,
            	PATTERN001 : 1,
            	PATTERN010 : 2,
            	PATTERN011 : 3,
            	PATTERN100 : 4,
            	PATTERN101 : 5,
            	PATTERN110 : 6,
            	PATTERN111 : 7
            };
        };
        modules["QRMath"] = function(module, exports, require) {
            var QRMath = {
            
            	glog : function(n) {
            	
            		if (n < 1) {
            			throw new Error("glog(" + n + ")");
            		}
            		
            		return QRMath.LOG_TABLE[n];
            	},
            	
            	gexp : function(n) {
            	
            		while (n < 0) {
            			n += 255;
            		}
            	
            		while (n >= 256) {
            			n -= 255;
            		}
            	
            		return QRMath.EXP_TABLE[n];
            	},
            	
            	EXP_TABLE : new Array(256),
            	
            	LOG_TABLE : new Array(256)
            
            };
            	
            for (var i = 0; i < 8; i++) {
            	QRMath.EXP_TABLE[i] = 1 << i;
            }
            for (var i = 8; i < 256; i++) {
            	QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4]
            		^ QRMath.EXP_TABLE[i - 5]
            		^ QRMath.EXP_TABLE[i - 6]
            		^ QRMath.EXP_TABLE[i - 8];
            }
            for (var i = 0; i < 255; i++) {
            	QRMath.LOG_TABLE[QRMath.EXP_TABLE[i] ] = i;
            }
            
            module.exports = QRMath;
        };
        modules["QRMode"] = function(module, exports, require) {
            module.exports = {
                MODE_NUMBER :       1 << 0,
                MODE_ALPHA_NUM :    1 << 1,
                MODE_8BIT_BYTE :    1 << 2,
                MODE_KANJI :        1 << 3
            };
        };
        modules["QRPolynomial"] = function(module, exports, require) {
            var QRMath = require('QRMath');
            
            function QRPolynomial(num, shift) {
            	if (num.length === undefined) {
            		throw new Error(num.length + "/" + shift);
            	}
            
            	var offset = 0;
            
            	while (offset < num.length && num[offset] === 0) {
            		offset++;
            	}
            
            	this.num = new Array(num.length - offset + shift);
            	for (var i = 0; i < num.length - offset; i++) {
            		this.num[i] = num[i + offset];
            	}
            }
            
            QRPolynomial.prototype = {
            
            	get : function(index) {
            		return this.num[index];
            	},
            	
            	getLength : function() {
            		return this.num.length;
            	},
            	
            	multiply : function(e) {
            	
            		var num = new Array(this.getLength() + e.getLength() - 1);
            	
            		for (var i = 0; i < this.getLength(); i++) {
            			for (var j = 0; j < e.getLength(); j++) {
            				num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i) ) + QRMath.glog(e.get(j) ) );
            			}
            		}
            	
            		return new QRPolynomial(num, 0);
            	},
            	
            	mod : function(e) {
            	
            		if (this.getLength() - e.getLength() < 0) {
            			return this;
            		}
            	
            		var ratio = QRMath.glog(this.get(0) ) - QRMath.glog(e.get(0) );
            	
            		var num = new Array(this.getLength() );
            		
            		for (var i = 0; i < this.getLength(); i++) {
            			num[i] = this.get(i);
            		}
            		
            		for (var x = 0; x < e.getLength(); x++) {
            			num[x] ^= QRMath.gexp(QRMath.glog(e.get(x) ) + ratio);
            		}
            	
            		// recursive call
            		return new QRPolynomial(num, 0).mod(e);
            	}
            };
            
            module.exports = QRPolynomial;
        };
        modules["QRRSBlock"] = function(module, exports, require) {
            var QRErrorCorrectLevel = require('QRErrorCorrectLevel');
            
            function QRRSBlock(totalCount, dataCount) {
            	this.totalCount = totalCount;
            	this.dataCount  = dataCount;
            }
            
            QRRSBlock.RS_BLOCK_TABLE = [
            
            	// L
            	// M
            	// Q
            	// H
            
            	// 1
            	[1, 26, 19],
            	[1, 26, 16],
            	[1, 26, 13],
            	[1, 26, 9],
            	
            	// 2
            	[1, 44, 34],
            	[1, 44, 28],
            	[1, 44, 22],
            	[1, 44, 16],
            
            	// 3
            	[1, 70, 55],
            	[1, 70, 44],
            	[2, 35, 17],
            	[2, 35, 13],
            
            	// 4		
            	[1, 100, 80],
            	[2, 50, 32],
            	[2, 50, 24],
            	[4, 25, 9],
            	
            	// 5
            	[1, 134, 108],
            	[2, 67, 43],
            	[2, 33, 15, 2, 34, 16],
            	[2, 33, 11, 2, 34, 12],
            	
            	// 6
            	[2, 86, 68],
            	[4, 43, 27],
            	[4, 43, 19],
            	[4, 43, 15],
            	
            	// 7		
            	[2, 98, 78],
            	[4, 49, 31],
            	[2, 32, 14, 4, 33, 15],
            	[4, 39, 13, 1, 40, 14],
            	
            	// 8
            	[2, 121, 97],
            	[2, 60, 38, 2, 61, 39],
            	[4, 40, 18, 2, 41, 19],
            	[4, 40, 14, 2, 41, 15],
            	
            	// 9
            	[2, 146, 116],
            	[3, 58, 36, 2, 59, 37],
            	[4, 36, 16, 4, 37, 17],
            	[4, 36, 12, 4, 37, 13],
            	
            	// 10		
            	[2, 86, 68, 2, 87, 69],
            	[4, 69, 43, 1, 70, 44],
            	[6, 43, 19, 2, 44, 20],
            	[6, 43, 15, 2, 44, 16],
            
            	// 11
            	[4, 101, 81],
            	[1, 80, 50, 4, 81, 51],
            	[4, 50, 22, 4, 51, 23],
            	[3, 36, 12, 8, 37, 13],
            
            	// 12
            	[2, 116, 92, 2, 117, 93],
            	[6, 58, 36, 2, 59, 37],
            	[4, 46, 20, 6, 47, 21],
            	[7, 42, 14, 4, 43, 15],
            
            	// 13
            	[4, 133, 107],
            	[8, 59, 37, 1, 60, 38],
            	[8, 44, 20, 4, 45, 21],
            	[12, 33, 11, 4, 34, 12],
            
            	// 14
            	[3, 145, 115, 1, 146, 116],
            	[4, 64, 40, 5, 65, 41],
            	[11, 36, 16, 5, 37, 17],
            	[11, 36, 12, 5, 37, 13],
            
            	// 15
            	[5, 109, 87, 1, 110, 88],
            	[5, 65, 41, 5, 66, 42],
            	[5, 54, 24, 7, 55, 25],
            	[11, 36, 12],
            
            	// 16
            	[5, 122, 98, 1, 123, 99],
            	[7, 73, 45, 3, 74, 46],
            	[15, 43, 19, 2, 44, 20],
            	[3, 45, 15, 13, 46, 16],
            
            	// 17
            	[1, 135, 107, 5, 136, 108],
            	[10, 74, 46, 1, 75, 47],
            	[1, 50, 22, 15, 51, 23],
            	[2, 42, 14, 17, 43, 15],
            
            	// 18
            	[5, 150, 120, 1, 151, 121],
            	[9, 69, 43, 4, 70, 44],
            	[17, 50, 22, 1, 51, 23],
            	[2, 42, 14, 19, 43, 15],
            
            	// 19
            	[3, 141, 113, 4, 142, 114],
            	[3, 70, 44, 11, 71, 45],
            	[17, 47, 21, 4, 48, 22],
            	[9, 39, 13, 16, 40, 14],
            
            	// 20
            	[3, 135, 107, 5, 136, 108],
            	[3, 67, 41, 13, 68, 42],
            	[15, 54, 24, 5, 55, 25],
            	[15, 43, 15, 10, 44, 16],
            
            	// 21
            	[4, 144, 116, 4, 145, 117],
            	[17, 68, 42],
            	[17, 50, 22, 6, 51, 23],
            	[19, 46, 16, 6, 47, 17],
            
            	// 22
            	[2, 139, 111, 7, 140, 112],
            	[17, 74, 46],
            	[7, 54, 24, 16, 55, 25],
            	[34, 37, 13],
            
            	// 23
            	[4, 151, 121, 5, 152, 122],
            	[4, 75, 47, 14, 76, 48],
            	[11, 54, 24, 14, 55, 25],
            	[16, 45, 15, 14, 46, 16],
            
            	// 24
            	[6, 147, 117, 4, 148, 118],
            	[6, 73, 45, 14, 74, 46],
            	[11, 54, 24, 16, 55, 25],
            	[30, 46, 16, 2, 47, 17],
            
            	// 25
            	[8, 132, 106, 4, 133, 107],
            	[8, 75, 47, 13, 76, 48],
            	[7, 54, 24, 22, 55, 25],
            	[22, 45, 15, 13, 46, 16],
            
            	// 26
            	[10, 142, 114, 2, 143, 115],
            	[19, 74, 46, 4, 75, 47],
            	[28, 50, 22, 6, 51, 23],
            	[33, 46, 16, 4, 47, 17],
            
            	// 27
            	[8, 152, 122, 4, 153, 123],
            	[22, 73, 45, 3, 74, 46],
            	[8, 53, 23, 26, 54, 24],
            	[12, 45, 15, 28, 46, 16],
            
            	// 28
            	[3, 147, 117, 10, 148, 118],
            	[3, 73, 45, 23, 74, 46],
            	[4, 54, 24, 31, 55, 25],
            	[11, 45, 15, 31, 46, 16],
            
            	// 29
            	[7, 146, 116, 7, 147, 117],
            	[21, 73, 45, 7, 74, 46],
            	[1, 53, 23, 37, 54, 24],
            	[19, 45, 15, 26, 46, 16],
            
            	// 30
            	[5, 145, 115, 10, 146, 116],
            	[19, 75, 47, 10, 76, 48],
            	[15, 54, 24, 25, 55, 25],
            	[23, 45, 15, 25, 46, 16],
            
            	// 31
            	[13, 145, 115, 3, 146, 116],
            	[2, 74, 46, 29, 75, 47],
            	[42, 54, 24, 1, 55, 25],
            	[23, 45, 15, 28, 46, 16],
            
            	// 32
            	[17, 145, 115],
            	[10, 74, 46, 23, 75, 47],
            	[10, 54, 24, 35, 55, 25],
            	[19, 45, 15, 35, 46, 16],
            
            	// 33
            	[17, 145, 115, 1, 146, 116],
            	[14, 74, 46, 21, 75, 47],
            	[29, 54, 24, 19, 55, 25],
            	[11, 45, 15, 46, 46, 16],
            
            	// 34
            	[13, 145, 115, 6, 146, 116],
            	[14, 74, 46, 23, 75, 47],
            	[44, 54, 24, 7, 55, 25],
            	[59, 46, 16, 1, 47, 17],
            
            	// 35
            	[12, 151, 121, 7, 152, 122],
            	[12, 75, 47, 26, 76, 48],
            	[39, 54, 24, 14, 55, 25],
            	[22, 45, 15, 41, 46, 16],
            
            	// 36
            	[6, 151, 121, 14, 152, 122],
            	[6, 75, 47, 34, 76, 48],
            	[46, 54, 24, 10, 55, 25],
            	[2, 45, 15, 64, 46, 16],
            
            	// 37
            	[17, 152, 122, 4, 153, 123],
            	[29, 74, 46, 14, 75, 47],
            	[49, 54, 24, 10, 55, 25],
            	[24, 45, 15, 46, 46, 16],
            
            	// 38
            	[4, 152, 122, 18, 153, 123],
            	[13, 74, 46, 32, 75, 47],
            	[48, 54, 24, 14, 55, 25],
            	[42, 45, 15, 32, 46, 16],
            
            	// 39
            	[20, 147, 117, 4, 148, 118],
            	[40, 75, 47, 7, 76, 48],
            	[43, 54, 24, 22, 55, 25],
            	[10, 45, 15, 67, 46, 16],
            
            	// 40
            	[19, 148, 118, 6, 149, 119],
            	[18, 75, 47, 31, 76, 48],
            	[34, 54, 24, 34, 55, 25],
            	[20, 45, 15, 61, 46, 16]
            ];
            
            QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
            	
            	var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
            	
            	if (rsBlock === undefined) {
            		throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
            	}
            
            	var length = rsBlock.length / 3;
            	
            	var list = [];
            	
            	for (var i = 0; i < length; i++) {
            
            		var count = rsBlock[i * 3 + 0];
            		var totalCount = rsBlock[i * 3 + 1];
            		var dataCount  = rsBlock[i * 3 + 2];
            
            		for (var j = 0; j < count; j++) {
            			list.push(new QRRSBlock(totalCount, dataCount) );	
            		}
            	}
            	
            	return list;
            };
            
            QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {
            
            	switch(errorCorrectLevel) {
            	case QRErrorCorrectLevel.L :
            		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
            	case QRErrorCorrectLevel.M :
            		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
            	case QRErrorCorrectLevel.Q :
            		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
            	case QRErrorCorrectLevel.H :
            		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
            	default :
            		return undefined;
            	}
            };
            
            module.exports = QRRSBlock;
        };
        modules["QRUtil"] = function(module, exports, require) {
            var QRMode = require('QRMode');
            var QRPolynomial = require('QRPolynomial');
            var QRMath = require('QRMath');
            var QRMaskPattern = require('QRMaskPattern');
            
            var QRUtil = {
            
                PATTERN_POSITION_TABLE : [
                    [],
                    [6, 18],
                    [6, 22],
                    [6, 26],
                    [6, 30],
                    [6, 34],
                    [6, 22, 38],
                    [6, 24, 42],
                    [6, 26, 46],
                    [6, 28, 50],
                    [6, 30, 54],        
                    [6, 32, 58],
                    [6, 34, 62],
                    [6, 26, 46, 66],
                    [6, 26, 48, 70],
                    [6, 26, 50, 74],
                    [6, 30, 54, 78],
                    [6, 30, 56, 82],
                    [6, 30, 58, 86],
                    [6, 34, 62, 90],
                    [6, 28, 50, 72, 94],
                    [6, 26, 50, 74, 98],
                    [6, 30, 54, 78, 102],
                    [6, 28, 54, 80, 106],
                    [6, 32, 58, 84, 110],
                    [6, 30, 58, 86, 114],
                    [6, 34, 62, 90, 118],
                    [6, 26, 50, 74, 98, 122],
                    [6, 30, 54, 78, 102, 126],
                    [6, 26, 52, 78, 104, 130],
                    [6, 30, 56, 82, 108, 134],
                    [6, 34, 60, 86, 112, 138],
                    [6, 30, 58, 86, 114, 142],
                    [6, 34, 62, 90, 118, 146],
                    [6, 30, 54, 78, 102, 126, 150],
                    [6, 24, 50, 76, 102, 128, 154],
                    [6, 28, 54, 80, 106, 132, 158],
                    [6, 32, 58, 84, 110, 136, 162],
                    [6, 26, 54, 82, 110, 138, 166],
                    [6, 30, 58, 86, 114, 142, 170]
                ],
            
                G15 : (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
                G18 : (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
                G15_MASK : (1 << 14) | (1 << 12) | (1 << 10)    | (1 << 4) | (1 << 1),
            
                getBCHTypeInfo : function(data) {
                    var d = data << 10;
                    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
                        d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) ) );    
                    }
                    return ( (data << 10) | d) ^ QRUtil.G15_MASK;
                },
            
                getBCHTypeNumber : function(data) {
                    var d = data << 12;
                    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
                        d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) ) );    
                    }
                    return (data << 12) | d;
                },
            
                getBCHDigit : function(data) {
            
                    var digit = 0;
            
                    while (data !== 0) {
                        digit++;
                        data >>>= 1;
                    }
            
                    return digit;
                },
            
                getPatternPosition : function(typeNumber) {
                    return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
                },
            
                getMask : function(maskPattern, i, j) {
                    
                    switch (maskPattern) {
                        
                    case QRMaskPattern.PATTERN000 : return (i + j) % 2 === 0;
                    case QRMaskPattern.PATTERN001 : return i % 2 === 0;
                    case QRMaskPattern.PATTERN010 : return j % 3 === 0;
                    case QRMaskPattern.PATTERN011 : return (i + j) % 3 === 0;
                    case QRMaskPattern.PATTERN100 : return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 === 0;
                    case QRMaskPattern.PATTERN101 : return (i * j) % 2 + (i * j) % 3 === 0;
                    case QRMaskPattern.PATTERN110 : return ( (i * j) % 2 + (i * j) % 3) % 2 === 0;
                    case QRMaskPattern.PATTERN111 : return ( (i * j) % 3 + (i + j) % 2) % 2 === 0;
            
                    default :
                        throw new Error("bad maskPattern:" + maskPattern);
                    }
                },
            
                getErrorCorrectPolynomial : function(errorCorrectLength) {
            
                    var a = new QRPolynomial([1], 0);
            
                    for (var i = 0; i < errorCorrectLength; i++) {
                        a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0) );
                    }
            
                    return a;
                },
            
                getLengthInBits : function(mode, type) {
            
                    if (1 <= type && type < 10) {
            
                        // 1 - 9
            
                        switch(mode) {
                        case QRMode.MODE_NUMBER     : return 10;
                        case QRMode.MODE_ALPHA_NUM  : return 9;
                        case QRMode.MODE_8BIT_BYTE  : return 8;
                        case QRMode.MODE_KANJI      : return 8;
                        default :
                            throw new Error("mode:" + mode);
                        }
            
                    } else if (type < 27) {
            
                        // 10 - 26
            
                        switch(mode) {
                        case QRMode.MODE_NUMBER     : return 12;
                        case QRMode.MODE_ALPHA_NUM  : return 11;
                        case QRMode.MODE_8BIT_BYTE  : return 16;
                        case QRMode.MODE_KANJI      : return 10;
                        default :
                            throw new Error("mode:" + mode);
                        }
            
                    } else if (type < 41) {
            
                        // 27 - 40
            
                        switch(mode) {
                        case QRMode.MODE_NUMBER     : return 14;
                        case QRMode.MODE_ALPHA_NUM  : return 13;
                        case QRMode.MODE_8BIT_BYTE  : return 16;
                        case QRMode.MODE_KANJI      : return 12;
                        default :
                            throw new Error("mode:" + mode);
                        }
            
                    } else {
                        throw new Error("type:" + type);
                    }
                },
            
                getLostPoint : function(qrCode) {
                    
                    var moduleCount = qrCode.getModuleCount();
                    var lostPoint = 0;
                    var row = 0; 
                    var col = 0;
            
                    
                    // LEVEL1
                    
                    for (row = 0; row < moduleCount; row++) {
            
                        for (col = 0; col < moduleCount; col++) {
            
                            var sameCount = 0;
                            var dark = qrCode.isDark(row, col);
            
                            for (var r = -1; r <= 1; r++) {
            
                                if (row + r < 0 || moduleCount <= row + r) {
                                    continue;
                                }
            
                                for (var c = -1; c <= 1; c++) {
            
                                    if (col + c < 0 || moduleCount <= col + c) {
                                        continue;
                                    }
            
                                    if (r === 0 && c === 0) {
                                        continue;
                                    }
            
                                    if (dark === qrCode.isDark(row + r, col + c) ) {
                                        sameCount++;
                                    }
                                }
                            }
            
                            if (sameCount > 5) {
                                lostPoint += (3 + sameCount - 5);
                            }
                        }
                    }
            
                    // LEVEL2
            
                    for (row = 0; row < moduleCount - 1; row++) {
                        for (col = 0; col < moduleCount - 1; col++) {
                            var count = 0;
                            if (qrCode.isDark(row,     col    ) ) count++;
                            if (qrCode.isDark(row + 1, col    ) ) count++;
                            if (qrCode.isDark(row,     col + 1) ) count++;
                            if (qrCode.isDark(row + 1, col + 1) ) count++;
                            if (count === 0 || count === 4) {
                                lostPoint += 3;
                            }
                        }
                    }
            
                    // LEVEL3
            
                    for (row = 0; row < moduleCount; row++) {
                        for (col = 0; col < moduleCount - 6; col++) {
                            if (qrCode.isDark(row, col) && 
                                    !qrCode.isDark(row, col + 1) && 
                                     qrCode.isDark(row, col + 2) && 
                                     qrCode.isDark(row, col + 3) && 
                                     qrCode.isDark(row, col + 4) && 
                                    !qrCode.isDark(row, col + 5) && 
                                     qrCode.isDark(row, col + 6) ) {
                                lostPoint += 40;
                            }
                        }
                    }
            
                    for (col = 0; col < moduleCount; col++) {
                        for (row = 0; row < moduleCount - 6; row++) {
                            if (qrCode.isDark(row, col) &&
                                    !qrCode.isDark(row + 1, col) &&
                                     qrCode.isDark(row + 2, col) &&
                                     qrCode.isDark(row + 3, col) &&
                                     qrCode.isDark(row + 4, col) &&
                                    !qrCode.isDark(row + 5, col) &&
                                     qrCode.isDark(row + 6, col) ) {
                                lostPoint += 40;
                            }
                        }
                    }
            
                    // LEVEL4
                    
                    var darkCount = 0;
            
                    for (col = 0; col < moduleCount; col++) {
                        for (row = 0; row < moduleCount; row++) {
                            if (qrCode.isDark(row, col) ) {
                                darkCount++;
                            }
                        }
                    }
                    
                    var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
                    lostPoint += ratio * 10;
            
                    return lostPoint;       
                }
            
            };
            
            module.exports = QRUtil;
        };
        modules["index"] = function(module, exports, require) {
            //---------------------------------------------------------------------
            // QRCode for JavaScript
            //
            // Copyright (c) 2009 Kazuhiko Arase
            //
            // URL: http://www.d-project.com/
            //
            // Licensed under the MIT license:
            //   http://www.opensource.org/licenses/mit-license.php
            //
            // The word "QR Code" is registered trademark of 
            // DENSO WAVE INCORPORATED
            //   http://www.denso-wave.com/qrcode/faqpatent-e.html
            //
            //---------------------------------------------------------------------
            // Modified to work in node for this project (and some refactoring)
            //---------------------------------------------------------------------
            
            var QR8bitByte = require('QR8bitByte');
            var QRUtil = require('QRUtil');
            var QRPolynomial = require('QRPolynomial');
            var QRRSBlock = require('QRRSBlock');
            var QRBitBuffer = require('QRBitBuffer');
            
            function QRCode(typeNumber, errorCorrectLevel) {
            	this.typeNumber = typeNumber;
            	this.errorCorrectLevel = errorCorrectLevel;
            	this.modules = null;
            	this.moduleCount = 0;
            	this.dataCache = null;
            	this.dataList = [];
            }
            
            QRCode.prototype = {
            	
            	addData : function(data) {
            		var newData = new QR8bitByte(data);
            		this.dataList.push(newData);
            		this.dataCache = null;
            	},
            	
            	isDark : function(row, col) {
            		if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
            			throw new Error(row + "," + col);
            		}
            		return this.modules[row][col];
            	},
            
            	getModuleCount : function() {
            		return this.moduleCount;
            	},
            	
            	make : function() {
            		// Calculate automatically typeNumber if provided is < 1
            		if (this.typeNumber < 1 ){
            			var typeNumber = 1;
            			for (typeNumber = 1; typeNumber < 40; typeNumber++) {
            				var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);
            
            				var buffer = new QRBitBuffer();
            				var totalDataCount = 0;
            				for (var i = 0; i < rsBlocks.length; i++) {
            					totalDataCount += rsBlocks[i].dataCount;
            				}
            
            				for (var x = 0; x < this.dataList.length; x++) {
            					var data = this.dataList[x];
            					buffer.put(data.mode, 4);
            					buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
            					data.write(buffer);
            				}
            				if (buffer.getLengthInBits() <= totalDataCount * 8)
            					break;
            			}
            			this.typeNumber = typeNumber;
            		}
            		this.makeImpl(false, this.getBestMaskPattern() );
            	},
            	
            	makeImpl : function(test, maskPattern) {
            		
            		this.moduleCount = this.typeNumber * 4 + 17;
            		this.modules = new Array(this.moduleCount);
            		
            		for (var row = 0; row < this.moduleCount; row++) {
            			
            			this.modules[row] = new Array(this.moduleCount);
            			
            			for (var col = 0; col < this.moduleCount; col++) {
            				this.modules[row][col] = null;//(col + row) % 3;
            			}
            		}
            	
            		this.setupPositionProbePattern(0, 0);
            		this.setupPositionProbePattern(this.moduleCount - 7, 0);
            		this.setupPositionProbePattern(0, this.moduleCount - 7);
            		this.setupPositionAdjustPattern();
            		this.setupTimingPattern();
            		this.setupTypeInfo(test, maskPattern);
            		
            		if (this.typeNumber >= 7) {
            			this.setupTypeNumber(test);
            		}
            	
            		if (this.dataCache === null) {
            			this.dataCache = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
            		}
            	
            		this.mapData(this.dataCache, maskPattern);
            	},
            
            	setupPositionProbePattern : function(row, col)  {
            		
            		for (var r = -1; r <= 7; r++) {
            			
            			if (row + r <= -1 || this.moduleCount <= row + r) continue;
            			
            			for (var c = -1; c <= 7; c++) {
            				
            				if (col + c <= -1 || this.moduleCount <= col + c) continue;
            				
            				if ( (0 <= r && r <= 6 && (c === 0 || c === 6) ) || 
                                 (0 <= c && c <= 6 && (r === 0 || r === 6) ) || 
                                 (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
            					this.modules[row + r][col + c] = true;
            				} else {
            					this.modules[row + r][col + c] = false;
            				}
            			}		
            		}		
            	},
            	
            	getBestMaskPattern : function() {
            	
            		var minLostPoint = 0;
            		var pattern = 0;
            	
            		for (var i = 0; i < 8; i++) {
            			
            			this.makeImpl(true, i);
            	
            			var lostPoint = QRUtil.getLostPoint(this);
            	
            			if (i === 0 || minLostPoint >  lostPoint) {
            				minLostPoint = lostPoint;
            				pattern = i;
            			}
            		}
            	
            		return pattern;
            	},
            	
            	createMovieClip : function(target_mc, instance_name, depth) {
            	
            		var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
            		var cs = 1;
            	
            		this.make();
            
            		for (var row = 0; row < this.modules.length; row++) {
            			
            			var y = row * cs;
            			
            			for (var col = 0; col < this.modules[row].length; col++) {
            	
            				var x = col * cs;
            				var dark = this.modules[row][col];
            			
            				if (dark) {
            					qr_mc.beginFill(0, 100);
            					qr_mc.moveTo(x, y);
            					qr_mc.lineTo(x + cs, y);
            					qr_mc.lineTo(x + cs, y + cs);
            					qr_mc.lineTo(x, y + cs);
            					qr_mc.endFill();
            				}
            			}
            		}
            		
            		return qr_mc;
            	},
            
            	setupTimingPattern : function() {
            		
            		for (var r = 8; r < this.moduleCount - 8; r++) {
            			if (this.modules[r][6] !== null) {
            				continue;
            			}
            			this.modules[r][6] = (r % 2 === 0);
            		}
            	
            		for (var c = 8; c < this.moduleCount - 8; c++) {
            			if (this.modules[6][c] !== null) {
            				continue;
            			}
            			this.modules[6][c] = (c % 2 === 0);
            		}
            	},
            	
            	setupPositionAdjustPattern : function() {
            	
            		var pos = QRUtil.getPatternPosition(this.typeNumber);
            		
            		for (var i = 0; i < pos.length; i++) {
            		
            			for (var j = 0; j < pos.length; j++) {
            			
            				var row = pos[i];
            				var col = pos[j];
            				
            				if (this.modules[row][col] !== null) {
            					continue;
            				}
            				
            				for (var r = -2; r <= 2; r++) {
            				
            					for (var c = -2; c <= 2; c++) {
            					
            						if (Math.abs(r) === 2 || 
                                        Math.abs(c) === 2 ||
                                        (r === 0 && c === 0) ) {
            							this.modules[row + r][col + c] = true;
            						} else {
            							this.modules[row + r][col + c] = false;
            						}
            					}
            				}
            			}
            		}
            	},
            	
            	setupTypeNumber : function(test) {
            	
            		var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
                    var mod;
            	
            		for (var i = 0; i < 18; i++) {
            			mod = (!test && ( (bits >> i) & 1) === 1);
            			this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
            		}
            	
            		for (var x = 0; x < 18; x++) {
            			mod = (!test && ( (bits >> x) & 1) === 1);
            			this.modules[x % 3 + this.moduleCount - 8 - 3][Math.floor(x / 3)] = mod;
            		}
            	},
            	
            	setupTypeInfo : function(test, maskPattern) {
            	
            		var data = (this.errorCorrectLevel << 3) | maskPattern;
            		var bits = QRUtil.getBCHTypeInfo(data);
                    var mod;
            	
            		// vertical		
            		for (var v = 0; v < 15; v++) {
            	
            			mod = (!test && ( (bits >> v) & 1) === 1);
            	
            			if (v < 6) {
            				this.modules[v][8] = mod;
            			} else if (v < 8) {
            				this.modules[v + 1][8] = mod;
            			} else {
            				this.modules[this.moduleCount - 15 + v][8] = mod;
            			}
            		}
            	
            		// horizontal
            		for (var h = 0; h < 15; h++) {
            	
            			mod = (!test && ( (bits >> h) & 1) === 1);
            			
            			if (h < 8) {
            				this.modules[8][this.moduleCount - h - 1] = mod;
            			} else if (h < 9) {
            				this.modules[8][15 - h - 1 + 1] = mod;
            			} else {
            				this.modules[8][15 - h - 1] = mod;
            			}
            		}
            	
            		// fixed module
            		this.modules[this.moduleCount - 8][8] = (!test);
            	
            	},
            	
            	mapData : function(data, maskPattern) {
            		
            		var inc = -1;
            		var row = this.moduleCount - 1;
            		var bitIndex = 7;
            		var byteIndex = 0;
            		
            		for (var col = this.moduleCount - 1; col > 0; col -= 2) {
            	
            			if (col === 6) col--;
            	
            			while (true) {
            	
            				for (var c = 0; c < 2; c++) {
            					
            					if (this.modules[row][col - c] === null) {
            						
            						var dark = false;
            	
            						if (byteIndex < data.length) {
            							dark = ( ( (data[byteIndex] >>> bitIndex) & 1) === 1);
            						}
            	
            						var mask = QRUtil.getMask(maskPattern, row, col - c);
            	
            						if (mask) {
            							dark = !dark;
            						}
            						
            						this.modules[row][col - c] = dark;
            						bitIndex--;
            	
            						if (bitIndex === -1) {
            							byteIndex++;
            							bitIndex = 7;
            						}
            					}
            				}
            								
            				row += inc;
            	
            				if (row < 0 || this.moduleCount <= row) {
            					row -= inc;
            					inc = -inc;
            					break;
            				}
            			}
            		}
            		
            	}
            
            };
            
            QRCode.PAD0 = 0xEC;
            QRCode.PAD1 = 0x11;
            
            QRCode.createData = function(typeNumber, errorCorrectLevel, dataList) {
            	
            	var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
            	
            	var buffer = new QRBitBuffer();
            	
            	for (var i = 0; i < dataList.length; i++) {
            		var data = dataList[i];
            		buffer.put(data.mode, 4);
            		buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
            		data.write(buffer);
            	}
            
            	// calc num max data.
            	var totalDataCount = 0;
            	for (var x = 0; x < rsBlocks.length; x++) {
            		totalDataCount += rsBlocks[x].dataCount;
            	}
            
            	if (buffer.getLengthInBits() > totalDataCount * 8) {
            		throw new Error("code length overflow. (" + 
                        buffer.getLengthInBits() + 
                        ">" +  
                        totalDataCount * 8 + 
                        ")");
            	}
            
            	// end code
            	if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
            		buffer.put(0, 4);
            	}
            
            	// padding
            	while (buffer.getLengthInBits() % 8 !== 0) {
            		buffer.putBit(false);
            	}
            
            	// padding
            	while (true) {
            		
            		if (buffer.getLengthInBits() >= totalDataCount * 8) {
            			break;
            		}
            		buffer.put(QRCode.PAD0, 8);
            		
            		if (buffer.getLengthInBits() >= totalDataCount * 8) {
            			break;
            		}
            		buffer.put(QRCode.PAD1, 8);
            	}
            
            	return QRCode.createBytes(buffer, rsBlocks);
            };
            
            QRCode.createBytes = function(buffer, rsBlocks) {
            
            	var offset = 0;
            	
            	var maxDcCount = 0;
            	var maxEcCount = 0;
            	
            	var dcdata = new Array(rsBlocks.length);
            	var ecdata = new Array(rsBlocks.length);
            	
            	for (var r = 0; r < rsBlocks.length; r++) {
            
            		var dcCount = rsBlocks[r].dataCount;
            		var ecCount = rsBlocks[r].totalCount - dcCount;
            
            		maxDcCount = Math.max(maxDcCount, dcCount);
            		maxEcCount = Math.max(maxEcCount, ecCount);
            		
            		dcdata[r] = new Array(dcCount);
            		
            		for (var i = 0; i < dcdata[r].length; i++) {
            			dcdata[r][i] = 0xff & buffer.buffer[i + offset];
            		}
            		offset += dcCount;
            		
            		var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
            		var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
            
            		var modPoly = rawPoly.mod(rsPoly);
            		ecdata[r] = new Array(rsPoly.getLength() - 1);
            		for (var x = 0; x < ecdata[r].length; x++) {
                        var modIndex = x + modPoly.getLength() - ecdata[r].length;
            			ecdata[r][x] = (modIndex >= 0)? modPoly.get(modIndex) : 0;
            		}
            
            	}
            	
            	var totalCodeCount = 0;
            	for (var y = 0; y < rsBlocks.length; y++) {
            		totalCodeCount += rsBlocks[y].totalCount;
            	}
            
            	var data = new Array(totalCodeCount);
            	var index = 0;
            
            	for (var z = 0; z < maxDcCount; z++) {
            		for (var s = 0; s < rsBlocks.length; s++) {
            			if (z < dcdata[s].length) {
            				data[index++] = dcdata[s][z];
            			}
            		}
            	}
            
            	for (var xx = 0; xx < maxEcCount; xx++) {
            		for (var t = 0; t < rsBlocks.length; t++) {
            			if (xx < ecdata[t].length) {
            				data[index++] = ecdata[t][xx];
            			}
            		}
            	}
            
            	return data;
            
            };
            
            module.exports = QRCode;
        };
        const cache = {};
        const requireLocal = name => {
            if (cache[name]) return cache[name].exports;
            const factory = modules[name];
            if (!factory) throw new Error(`Módulo QR local não encontrado: ${name}`);
            const module = { exports: {} };
            cache[name] = module;
            factory(module, module.exports, requireLocal);
            return module.exports;
        };
        const QRCode = requireLocal('index');
        const QRErrorCorrectLevel = requireLocal('QRErrorCorrectLevel');
        return {
            createCanvas(payload, targetSize = 420) {
                const value = String(payload == null ? '' : payload);
                if (!value) throw new Error('Código PIX vazio.');
                const qr = new QRCode(-1, QRErrorCorrectLevel.M);
                qr.addData(value);
                qr.make();
                const modulesCount = qr.getModuleCount();
                const quiet = 4;
                const cell = Math.max(2, Math.floor(targetSize / (modulesCount + quiet * 2)));
                const size = (modulesCount + quiet * 2) * cell;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d', { alpha: false });
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, size, size);
                ctx.fillStyle = '#000';
                for (let row = 0; row < modulesCount; row += 1) {
                    for (let col = 0; col < modulesCount; col += 1) {
                        if (qr.isDark(row, col)) {
                            ctx.fillRect((col + quiet) * cell, (row + quiet) * cell, cell, cell);
                        }
                    }
                }
                return canvas;
            }
        };
    })();

    // ============================================================
    // VENDA ATUAL / MEMÓRIA TEMPORÁRIA DE PASSAGEIROS
    // Evolução do antigo SaleCpfs: existe uma única fonte de verdade em
    // sessionStorage, agora com nome, nascimento, estado do bilhete e vínculo.
    // ============================================================
    EH.SaleContext = {
        KEY: 'epassHelper.currentSale.v2',
        LEGACY_KEY: 'epassHelper.saleCpfs.v1',
        started: false,
        searchBusy: false,

        normalizeCpf(value) {
            return String(value || '').replace(/\D/g, '').slice(0, 11);
        },

        maskCpf(value) {
            const digits = this.normalizeCpf(value);
            if (digits.length !== 11) return digits;
            return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
        },

        maskCpfPublic(value) {
            const digits = this.normalizeCpf(value);
            if (digits.length !== 11) return 'CPF não identificado';
            return `***.***.***-${digits.slice(9)}`;
        },

        newSale() {
            const now = Date.now();
            return {
                id: `sale-${now}-${Math.random().toString(36).slice(2, 8)}`,
                createdAt: now,
                updatedAt: now,
                status: 'active',
                paymentType: null,
                activePassengerId: null,
                passengers: []
            };
        },

        normalizePassenger(item = {}) {
            const cpf = this.normalizeCpf(item.cpf);
            return {
                id: item.id || (cpf ? `p-${cpf}` : `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
                cpf,
                name: EH.Utils.clean(item.name || ''),
                birthDate: EH.Utils.clean(item.birthDate || ''),
                requestCode: EH.Utils.clean(item.requestCode || ''),
                requestStatus: EH.Utils.clean(item.requestStatus || ''),
                ticketStatus: item.ticketStatus || 'pending',
                tickets: Array.isArray(item.tickets) ? item.tickets.slice(0, 12) : [],
                createdAt: Number(item.createdAt || item.at || Date.now()),
                updatedAt: Number(item.updatedAt || item.at || Date.now())
            };
        },

        migrateLegacy() {
            try {
                if (sessionStorage.getItem(this.KEY)) return;
                const legacy = JSON.parse(sessionStorage.getItem(this.LEGACY_KEY) || 'null');
                if (!legacy?.savedAt || !Array.isArray(legacy.items)) return;
                const sale = this.newSale();
                sale.createdAt = Number(legacy.savedAt) || Date.now();
                sale.passengers = legacy.items
                    .map(item => this.normalizePassenger(item))
                    .filter(item => item.cpf.length === 11);
                if (sale.passengers.length) sessionStorage.setItem(this.KEY, JSON.stringify(sale));
                sessionStorage.removeItem(this.LEGACY_KEY);
            } catch (error) {
                EH.Logger.warn('Não foi possível migrar a memória temporária da venda.');
            }
        },

        loadSale() {
            this.migrateLegacy();
            try {
                const parsed = JSON.parse(sessionStorage.getItem(this.KEY) || 'null');
                if (!parsed || !Array.isArray(parsed.passengers)) return this.newSale();
                const lastActivity = Number(parsed.updatedAt || parsed.createdAt || 0);
                if (lastActivity && (Date.now() - lastActivity) > EH.Config.SALE_CPF_TTL_MS) {
                    sessionStorage.removeItem(this.KEY);
                    return this.newSale();
                }
                return {
                    ...this.newSale(),
                    ...parsed,
                    passengers: parsed.passengers
                        .map(item => this.normalizePassenger(item))
                        .filter(item => item.cpf.length === 11)
                };
            } catch (error) {
                EH.Logger.warn('Não foi possível ler a venda atual.');
                return this.newSale();
            }
        },

        saveSale(sale) {
            const next = {
                ...sale,
                updatedAt: Date.now(),
                passengers: (sale?.passengers || [])
                    .map(item => this.normalizePassenger(item))
                    .filter(item => item.cpf.length === 11)
            };
            try {
                if (!next.passengers.length) sessionStorage.removeItem(this.KEY);
                else sessionStorage.setItem(this.KEY, JSON.stringify(next));
            } catch (error) {
                EH.Logger.warn('Não foi possível salvar a venda atual.');
            }
            // v5.61: a sessão visual continua temporária, mas cada passageiro passa
            // imediatamente para a memória persistente. O envio remoto ocorre pelo
            // SyncManager/Sync periódico, nunca a cada tecla digitada.
            try { EH.EmissionMemory?.captureSale?.(next, { page: EH.Pages?.detect?.() || 'desconhecida' }); }
            catch (error) { EH.Logger.debug('Memória persistente da emissão será atualizada no próximo ciclo:', error); }
            EH.UI?.renderSaleSummary?.(EH.Pages?.detect?.() || 'desconhecida');
            return next;
        },

        load() {
            return this.loadSale().passengers;
        },

        findPassengerByCpf(cpf) {
            const digits = this.normalizeCpf(cpf);
            return this.load().find(item => item.cpf === digits) || null;
        },

        getActivePassenger() {
            const sale = this.loadSale();
            return sale.passengers.find(item => item.id === sale.activePassengerId) || null;
        },

        setActivePassenger(passengerId) {
            const sale = this.loadSale();
            if (!sale.passengers.some(item => item.id === passengerId)) return null;
            sale.activePassengerId = passengerId;
            return this.saveSale(sale);
        },

        upsertPassenger(data = {}) {
            const cpf = this.normalizeCpf(data.cpf);
            if (cpf.length !== 11) return null;
            const sale = this.loadSale();
            let passenger = sale.passengers.find(item => item.cpf === cpf);
            let changed = false;
            if (!passenger) {
                passenger = this.normalizePassenger({ ...data, cpf });
                sale.passengers.push(passenger);
                changed = true;
            } else {
                const nextName = data.name ? EH.Utils.clean(data.name) : passenger.name;
                const nextBirthDate = data.birthDate ? EH.Utils.clean(data.birthDate) : passenger.birthDate;
                if (nextName !== passenger.name) {
                    passenger.name = nextName;
                    changed = true;
                }
                if (nextBirthDate !== passenger.birthDate) {
                    passenger.birthDate = nextBirthDate;
                    changed = true;
                }
                if (changed) passenger.updatedAt = Date.now();
            }
            if (changed) this.saveSale(sale);
            EH.PassengerMemory?.upsert?.({ cpf: passenger.cpf, name: passenger.name, birthDate: passenger.birthDate, updatedAt: passenger.updatedAt || Date.now() });
            return passenger;
        },

        fieldValue(card, selectors = []) {
            for (const selector of selectors) {
                const element = card?.querySelector?.(selector);
                if (element && 'value' in element && String(element.value || '').trim()) return String(element.value || '').trim();
            }
            return '';
        },

        captureCard(card) {
            if (!card) return false;
            const cpf = this.fieldValue(card, [
                'input[formcontrolname="cpf"]',
                'input[formcontrolname*="cpf" i]',
                'input[placeholder*="CPF" i]'
            ]);
            const digits = this.normalizeCpf(cpf);
            if (digits.length !== 11) return false;
            const name = this.fieldValue(card, [
                'input[formcontrolname="nome"]',
                'input[formcontrolname*="nome" i]',
                'input[placeholder*="NOME" i]'
            ]);
            const birthDate = this.fieldValue(card, [
                'input[formcontrolname="data_nascimento"]',
                'input[formcontrolname*="nascimento" i]',
                'input[placeholder*="NASC" i]',
                'input[aria-label*="NASC" i]'
            ]);
            this.upsertPassenger({ cpf: digits, name, birthDate });
            return true;
        },

        captureFromDom() {
            const cards = Array.from(document.querySelectorAll('.card.cadastro-passageiro, .cadastro-passageiro'));
            if (!cards.length) return false;
            let changed = false;
            cards.forEach(card => { changed = this.captureCard(card) || changed; });
            return changed;
        },

        clear() {
            const saleBeforeClear = this.loadSale();
            try {
                if (saleBeforeClear?.passengers?.length) EH.EmissionMemory?.finalizeSale?.(saleBeforeClear.id);
                sessionStorage.removeItem(this.KEY);
                sessionStorage.removeItem(this.LEGACY_KEY);
            } catch (error) {
                EH.Logger.debug('Não foi possível limpar o contexto temporário da venda:', error);
            }
            EH.Tickets?.clearSelection?.();
            EH.Tickets?.clearStoredCaptures?.({ quiet: true });
            EH.UI?.renderSaleSummary?.(EH.Pages?.detect?.() || 'desconhecida');
            EH.UI?.renderAutomation?.(EH.Pages?.detect?.() || 'desconhecida');
        },

        setNativeValue(input, value) {
            if (!input) return false;
            const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
            if (descriptor?.set) descriptor.set.call(input, value);
            else input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            return true;
        },

        findSearchButton(input) {
            const form = input?.closest('form');
            const root = form || EH.Utils.first(EH.Selectors.PASSAGENS_ROOT) || document.body;
            const candidates = Array.from(root.querySelectorAll('button, input[type="submit"]'));
            return candidates.find(el => {
                if (el.disabled) return false;
                const label = EH.Utils.normalize(el.textContent || el.value || el.title || el.getAttribute('aria-label') || '');
                return /PESQUISAR|BUSCAR|CONSULTAR/.test(label) || String(el.type || '').toLowerCase() === 'submit';
            }) || null;
        },

        navigateToPassagens() {
            const anchor = document.querySelector('a[routerlink="/vendas/passagens"], a[href$="/vendas/passagens"]');
            if (anchor) {
                anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                return true;
            }
            const base = location.pathname.includes('/epass/') ? '/epass/vendas/passagens' : '/vendas/passagens';
            location.assign(base);
            return true;
        },

        async searchTicket(item) {
            if (this.searchBusy) {
                EH.Toast.warning('Aguarde a busca atual terminar antes de pesquisar outro passageiro.');
                return;
            }
            const cpf = this.normalizeCpf(item?.cpf);
            if (cpf.length !== 11) return EH.Toast.warning('CPF temporário inválido.');
            const input = EH.Utils.first(EH.Selectors.PASSAGENS_CPF_INPUT);
            if (!input) return EH.Toast.warning('Abra a tela de Passagens para fazer a busca.');

            this.searchBusy = true;
            EH.UI?.renderAutomation?.('passagens');
            try {
                const sale = this.loadSale();
                const passenger = sale.passengers.find(p => p.cpf === cpf);
                if (passenger) {
                    sale.activePassengerId = passenger.id;
                    passenger.ticketStatus = 'searching';
                    this.saveSale(sale);
                }

                EH.Tickets?.clearSelection?.();
                const beforeSignature = EH.Tickets?.cardsSignature?.() || '';
                this.setNativeValue(input, this.maskCpf(cpf));
                input.focus();
                await EH.Utils.sleep(80);
                input.blur();

                const button = this.findSearchButton(input);
                const form = input.closest('form');
                if (button) button.click();
                else if (form?.requestSubmit) form.requestSubmit();
                else form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

                EH.Toast.info(`Buscando bilhete de ${item?.name || this.maskCpfPublic(cpf)}…`);
                const found = await EH.Utils.waitFor(() => {
                    const cards = EH.Tickets?.findCards?.() || [];
                    if (!cards.length) return null;
                    const signature = EH.Tickets?.cardsSignature?.(cards) || '';
                    if (!signature) return null;
                    if (!beforeSignature || signature !== beforeSignature) return cards;
                    return null;
                }, 9000, 220);

                const refreshed = this.loadSale();
                const current = refreshed.passengers.find(p => p.cpf === cpf);
                if (current) {
                    current.ticketStatus = found?.length ? 'found' : 'pending';
                    this.saveSale(refreshed);
                }

                if (found?.length) {
                    EH.Toast.success(`${found.length} passagem(ns) encontrada(s). Selecione até 2 para capturar.`);
                    EH.Tickets.activateSelection();
                } else {
                    EH.Toast.warning('A busca foi executada, mas nenhuma passagem nova apareceu dentro do tempo esperado.');
                }
            } finally {
                this.searchBusy = false;
                EH.UI?.renderAutomation?.('passagens');
            }
        },

        markTicketCaptured(passengerId, ticketItems = []) {
            const sale = this.loadSale();
            const passenger = sale.passengers.find(item => item.id === passengerId);
            if (!passenger) return;
            const existing = new Map((passenger.tickets || []).map(item => [String(item.number || item.id || ''), item]));
            ticketItems.forEach(item => {
                const key = String(item.number || item.id || `${item.origin || ''}|${item.destination || ''}|${item.date || ''}`);
                if (!key) return;
                existing.set(key, {
                    id: key,
                    number: EH.Utils.clean(item.number || ''),
                    date: EH.Utils.clean(item.date || ''),
                    origin: EH.Utils.clean(item.origin || ''),
                    destination: EH.Utils.clean(item.destination || ''),
                    capturedAt: Date.now()
                });
            });
            passenger.tickets = Array.from(existing.values()).slice(0, 12);
            passenger.ticketStatus = 'captured';
            passenger.updatedAt = Date.now();
            this.saveSale(sale);
        },

        statusIcon(passenger) {
            if (passenger.ticketStatus === 'captured') return '✅';
            if (passenger.ticketStatus === 'searching') return '🔎';
            if (passenger.ticketStatus === 'found') return '☑️';
            return '⏳';
        },

        renderBlock() {
            const sale = this.loadSale();
            if (!sale.passengers.length) return null;
            const block = document.createElement('div');
            block.className = 'eh-sale-cpfs';

            const label = document.createElement('div');
            label.className = 'eh-sale-block-title';
            label.textContent = 'Bilhetes desta venda';
            block.appendChild(label);

            sale.passengers.forEach((item, index) => {
                const row = document.createElement('div');
                row.className = 'eh-sale-passenger-row';

                const text = document.createElement('div');
                text.className = 'eh-sale-passenger-text';
                const strong = document.createElement('strong');
                strong.textContent = `${this.statusIcon(item)} ${item.name || `Passageiro ${index + 1}`}`;
                const cpfText = document.createElement('small');
                cpfText.textContent = this.maskCpfPublic(item.cpf);
                text.append(strong, cpfText);

                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'eh-context-btn primary';
                button.textContent = item.ticketStatus === 'searching' ? 'Buscando…' : 'Buscar';
                button.disabled = this.searchBusy || item.ticketStatus === 'searching';
                button.addEventListener('click', () => this.searchTicket(item));
                row.append(text, button);
                block.appendChild(row);
            });
            return block;
        },

        renderSaleCard() {
            const sale = this.loadSale();
            if (!sale.passengers.length) return null;
            const wrap = document.createElement('div');
            wrap.className = 'eh-sale-summary';

            const captured = sale.passengers.filter(item => item.ticketStatus === 'captured').length;
            const pending = sale.passengers.length - captured;
            const header = document.createElement('div');
            header.className = 'eh-sale-summary-head';
            header.innerHTML = `<strong>Venda atual</strong><span>${sale.passengers.length} passageiro${sale.passengers.length === 1 ? '' : 's'} • ${pending} pendente${pending === 1 ? '' : 's'}</span>`;
            wrap.appendChild(header);

            sale.passengers.forEach((item, index) => {
                const row = document.createElement('div');
                row.className = 'eh-sale-summary-row';
                row.textContent = `${this.statusIcon(item)} ${item.name || `Passageiro ${index + 1}`}`;
                wrap.appendChild(row);
            });

            const actions = document.createElement('div');
            actions.className = 'eh-sale-summary-actions';
            if (!EH.Tickets?.isPassagensPage?.()) {
                const passagens = document.createElement('button');
                passagens.type = 'button';
                passagens.className = 'eh-context-btn primary';
                passagens.textContent = '🎫 Ir para Passagens';
                passagens.addEventListener('click', () => this.navigateToPassagens());
                actions.appendChild(passagens);
            }
            const finish = document.createElement('button');
            finish.type = 'button';
            finish.className = 'eh-context-btn';
            finish.textContent = '✓ Finalizar venda';
            finish.addEventListener('click', () => {
                if (confirm('Finalizar esta venda e apagar os passageiros temporários?')) this.clear();
            });
            actions.appendChild(finish);
            wrap.appendChild(actions);
            return wrap;
        },

        init() {
            if (this.started || EH.WhatsAppBridge.isWhatsAppHost()) return;
            this.started = true;
            const capture = event => {
                const target = event.target;
                if (!(target instanceof HTMLInputElement)) return;
                if (!target.matches('input[formcontrolname*="cpf" i], input[formcontrolname*="nome" i], input[formcontrolname*="nascimento" i], input[placeholder*="CPF" i], input[placeholder*="NOME" i], input[placeholder*="NASC" i]')) return;
                const card = target.closest('.card.cadastro-passageiro, .cadastro-passageiro');
                if (!card) return;
                this.captureCard(card);
            };
            EH.Runtime.on('sale-context-input', document, 'input', capture, true);
            EH.Runtime.on('sale-context-change', document, 'change', capture, true);
            EH.Runtime.on('sale-context-blur', document, 'blur', capture, true);
            this.captureFromDom();
        }
    };

    // Alias de compatibilidade: o restante do script continua usando o mesmo
    // módulo que antes se chamava SaleCpfs, sem criar um segundo armazenamento.
    EH.SaleCpfs = EH.SaleContext;

    // ============================================================
    // REQUISIÇÕES DE PREFEITURA — PASSAGEIRO + IDA/VOLTA + CÓDIGO POR TRECHO
    // Persistência local via GM storage. Não cria uma segunda memória de venda:
    // a venda atual continua em EH.SaleContext/sessionStorage; requisições ficam
    // separadas porque podem ser aprovadas posteriormente.
    // ============================================================
    EH.RequisitionManager = {
        STORAGE_KEY: 'requisitionsV1',
        ACTIVE_KEY: 'epassHelper.activeRequisitionEmission.v1',
        started: false,
        pendingNumeroLogico: '',
        lastModalFingerprint: '',

        normalizeCpf(value) {
            return EH.SaleContext.normalizeCpf(value);
        },

        normalizeName(value) {
            return EH.Utils.normalize(value);
        },

        normalizeBirthDate(value) {
            const raw = EH.Utils.clean(value || '');
            if (!raw) return '';
            let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (match) return `${match[1]}-${match[2]}-${match[3]}`;
            match = raw.match(/^(\d{2})[\/.-](\d{2})[\/.-](\d{4})$/);
            if (match) return `${match[3]}-${match[2]}-${match[1]}`;
            return raw;
        },

        displayBirthDate(value) {
            const normalized = this.normalizeBirthDate(value);
            const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            return match ? `${match[3]}/${match[2]}/${match[1]}` : normalized;
        },

        normalizeCity(value) {
            return EH.Utils.normalize(value)
                .replace(/\s*-\s*[A-Z]{2}\s*$/, '')
                .replace(/\s+/g, ' ')
                .trim();
        },

        cleanMarket(value) {
            return EH.Utils.clean(String(value || '').replace(/\u00a0/g, ' '));
        },

        parseMarket(value) {
            const mercadoCompleto = this.cleanMarket(value);
            if (!mercadoCompleto) return { mercadoCompleto: '', origem: '', destino: '' };
            const match = mercadoCompleto.match(/^(.*?)\s+-\s+(.*)$/);
            if (!match) return { mercadoCompleto, origem: '', destino: '' };
            const origem = EH.Utils.clean(match[1]);
            let destino = EH.Utils.clean(match[2]);
            const serviceSuffix = /\s+(?:CONVENCIONAL(?:\s+COM\s+SANITARIO)?|EXECUTIVO(?:\s+COM\s+SANITARIO)?|SEMI[\s-]?LEITO(?:\s+COM\s+SANITARIO)?|SEMILEITO(?:\s+COM\s+SANITARIO)?|LEITO(?:\s+CAMA)?(?:\s+COM\s+SANITARIO)?|CAMA(?:\s+TOTAL)?|PREMIUM|DUPLO\s+DECK|DD)\s*$/i;
            destino = destino.replace(serviceSuffix, '').trim();
            return { mercadoCompleto, origem, destino };
        },

        sameRoute(aOrigem, aDestino, bOrigem, bDestino) {
            const aO = this.normalizeCity(aOrigem);
            const aD = this.normalizeCity(aDestino);
            const bO = this.normalizeCity(bOrigem);
            const bD = this.normalizeCity(bDestino);
            return Boolean(aO && aD && bO && bD && aO === bO && aD === bD);
        },

        legMatchesRoute(leg, origem, destino) {
            if (!leg || !origem || !destino) return false;
            if (this.sameRoute(leg.origem, leg.destino, origem, destino)) return true;
            const full = EH.Utils.normalize(leg.mercadoCompleto || '');
            const wantedOrigin = this.normalizeCity(origem);
            const wantedDestination = this.normalizeCity(destino);
            if (!full || !wantedOrigin || !wantedDestination) return false;
            const dash = full.indexOf('-');
            if (dash < 0) return false;
            const left = this.normalizeCity(full.slice(0, dash));
            const right = full.slice(dash + 1).trim();
            return left === wantedOrigin && right.startsWith(wantedDestination);
        },

        selectedNgValue(element) {
            return this.cleanMarket(element?.querySelector?.('.ng-value-label')?.textContent || '');
        },

        normalizeLeg(item = {}) {
            const parsed = this.parseMarket(item.mercadoCompleto || item.mercado || '');
            return {
                tipo: item.tipo === 'volta' ? 'volta' : 'ida',
                mercadoCompleto: parsed.mercadoCompleto || this.cleanMarket(item.mercadoCompleto || item.mercado || ''),
                origem: EH.Utils.clean(item.origem || parsed.origem || ''),
                destino: EH.Utils.clean(item.destino || parsed.destino || ''),
                codigo: EH.Utils.clean(item.codigo || ''),
                updatedAt: Number(item.updatedAt || Date.now())
            };
        },

        normalizePassenger(item = {}) {
            return {
                cpf: this.normalizeCpf(item.cpf),
                nome: EH.Utils.clean(item.nome || item.name || ''),
                dataNascimento: this.normalizeBirthDate(item.dataNascimento || item.birthDate || ''),
                legs: (Array.isArray(item.legs) ? item.legs : Array.isArray(item.mercados) ? item.mercados : [])
                    .map(leg => this.normalizeLeg(leg))
                    .filter(leg => leg.mercadoCompleto || (leg.origem && leg.destino))
            };
        },

        normalizeRequest(item = {}) {
            const now = Date.now();
            return {
                id: item.id || `req-${now}-${Math.random().toString(36).slice(2, 8)}`,
                numeroLogico: EH.Utils.clean(item.numeroLogico || ''),
                prefeitura: EH.Utils.clean(item.prefeitura || ''),
                secretaria: EH.Utils.clean(item.secretaria || ''),
                contrato: EH.Utils.clean(item.contrato || ''),
                status: EH.Utils.clean(item.status || 'pending'),
                passengers: (Array.isArray(item.passengers) ? item.passengers : [])
                    .map(passenger => this.normalizePassenger(passenger))
                    .filter(passenger => passenger.cpf.length === 11),
                createdAt: Number(item.createdAt || now),
                updatedAt: Number(item.updatedAt || now),
                deviceId: String(item.deviceId || EH.Device.id())
            };
        },

        loadStore() {
            const raw = EH.Storage.get(this.STORAGE_KEY, { version: 1, items: [] });
            const limit = Date.now() - EH.Config.REQUISITION_TTL_MS;
            const items = (Array.isArray(raw?.items) ? raw.items : [])
                .map(item => this.normalizeRequest(item))
                .filter(item => item.passengers.length && item.updatedAt >= limit);
            if ((raw?.items || []).length !== items.length) this.saveStore(items);
            return items;
        },

        saveStore(items) {
            const previousRaw = EH.Storage.get(this.STORAGE_KEY, { version: 1, items: [] });
            const previousById = new Map((Array.isArray(previousRaw?.items) ? previousRaw.items : []).map(item => [String(item?.id || ''), item]));
            const normalized = (items || [])
                .map(item => this.normalizeRequest(item))
                .filter(item => item.passengers.length)
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .slice(0, 80);
            EH.Storage.set(this.STORAGE_KEY, { version: 1, updatedAt: Date.now(), items: normalized });
            normalized.forEach(request => {
                (request.passengers || []).forEach(passenger => EH.PassengerMemory?.upsert?.({ cpf:passenger.cpf, name:passenger.nome, birthDate:passenger.dataNascimento, updatedAt:request.updatedAt }, { fromSync:Boolean(EH.Sync?.applyingRemote) }));
                if (!EH.Sync?.applyingRemote) {
                    const previous = previousById.get(String(request.id || ''));
                    const changed = !previous || Number(request.updatedAt || 0) > Number(previous.updatedAt || 0) || JSON.stringify(previous) !== JSON.stringify(request);
                    if (changed) EH.Sync?.markPendingRecord?.('requisition', request.id);
                }
            });
            EH.UI?.renderSaleSummary?.(EH.Pages?.detect?.() || 'desconhecida');
            return normalized;
        },

        codesForCpf(cpf) {
            const digits = this.normalizeCpf(cpf);
            if (digits.length !== 11) return [];
            const rows = [];
            this.loadStore().forEach(request => {
                (request.passengers || []).forEach(passenger => {
                    if (this.normalizeCpf(passenger.cpf) !== digits) return;
                    (passenger.legs || []).forEach(leg => {
                        if (!leg.codigo) return;
                        rows.push({
                            requestId: request.id,
                            numeroLogico: request.numeroLogico || '',
                            tipo: leg.tipo || 'ida',
                            codigo: EH.Utils.clean(leg.codigo || ''),
                            origem: EH.Utils.clean(leg.origem || ''),
                            destino: EH.Utils.clean(leg.destino || ''),
                            updatedAt: Number(leg.updatedAt || request.updatedAt || 0)
                        });
                    });
                });
            });
            const unique = new Map();
            rows.sort((a,b)=>b.updatedAt-a.updatedAt).forEach(row => {
                const key = `${row.tipo}|${EH.Utils.normalize(row.origem)}|${EH.Utils.normalize(row.destino)}|${row.codigo}`;
                if (!unique.has(key)) unique.set(key,row);
            });
            return Array.from(unique.values());
        },

        requestFingerprint(request) {
            const people = (request.passengers || []).map(passenger => {
                const legs = (passenger.legs || []).map(leg => `${leg.tipo}:${EH.Utils.normalize(leg.mercadoCompleto)}`).sort().join('|');
                return `${passenger.cpf}:${this.normalizeName(passenger.nome)}:${passenger.dataNascimento}:${legs}`;
            }).sort().join('||');
            return [
                EH.Utils.normalize(request.prefeitura),
                EH.Utils.normalize(request.secretaria),
                EH.Utils.normalize(request.contrato),
                people
            ].join('::');
        },

        mergePassengerData(previous = [], incoming = []) {
            const byCpf = new Map((previous || []).map(passenger => [this.normalizeCpf(passenger.cpf), passenger]));
            return (incoming || []).map(passenger => {
                const nextPassenger = this.normalizePassenger(passenger);
                const oldPassenger = byCpf.get(nextPassenger.cpf);
                if (!oldPassenger) return nextPassenger;
                nextPassenger.legs = (nextPassenger.legs || []).map(leg => {
                    const oldLeg = (oldPassenger.legs || []).find(candidate => {
                        const exact = EH.Utils.normalize(candidate.mercadoCompleto) === EH.Utils.normalize(leg.mercadoCompleto);
                        return exact || this.sameRoute(candidate.origem, candidate.destino, leg.origem, leg.destino);
                    });
                    if (oldLeg?.codigo && !leg.codigo) leg.codigo = oldLeg.codigo;
                    if (oldLeg?.updatedAt) leg.updatedAt = Math.max(Number(leg.updatedAt || 0), Number(oldLeg.updatedAt || 0));
                    return leg;
                });
                return nextPassenger;
            });
        },

        upsertRequest(request) {
            const next = this.normalizeRequest(request);
            if (!next.passengers.length) return null;
            const items = this.loadStore();
            const fingerprint = this.requestFingerprint(next);
            const now = Date.now();
            let existing = next.numeroLogico
                ? items.find(item => item.numeroLogico === next.numeroLogico)
                : items.find(item => {
                    if (item.numeroLogico || item.status === 'approved') return false;
                    if (this.requestFingerprint(item) !== fingerprint) return false;
                    return (now - Number(item.updatedAt || 0)) <= (2 * 60 * 1000);
                });
            if (existing) {
                existing.prefeitura = next.prefeitura || existing.prefeitura;
                existing.secretaria = next.secretaria || existing.secretaria;
                existing.contrato = next.contrato || existing.contrato;
                existing.numeroLogico = next.numeroLogico || existing.numeroLogico;
                if (existing.status !== 'approved') existing.status = next.status || existing.status;
                existing.passengers = this.mergePassengerData(existing.passengers, next.passengers);
                existing.updatedAt = now;
                this.saveStore(items);
                return existing;
            }
            next.createdAt = now;
            next.updatedAt = now;
            items.unshift(next);
            this.saveStore(items);
            return next;
        },

        captureRequestForm() {
            const root = EH.Utils.first(EH.Selectors.REQUISITION_FORM_ROOT);
            if (!root) return null;
            const form = root.querySelector('form');
            const info = root.querySelector('[formarrayname="info"]');
            if (!form || !info) return null;

            const prefeitura = this.selectedNgValue(root.querySelector('ng-select[formcontrolname="id_prefeitura"]'));
            const secretaria = this.selectedNgValue(root.querySelector('ng-select[formcontrolname="id_secretaria"]'));
            const contrato = this.selectedNgValue(root.querySelector('ng-select[formcontrolname="id_contrato"]'));
            const passengers = [];
            const cpfInputs = Array.from(info.querySelectorAll('input[formcontrolname="cpf"][id^="cpf_"]'));

            cpfInputs.forEach((cpfInput, position) => {
                const indexMatch = String(cpfInput.id || '').match(/_(\d+)$/);
                const index = indexMatch ? indexMatch[1] : String(position);
                const cpf = this.normalizeCpf(cpfInput.value);
                if (cpf.length !== 11) return;
                const nome = EH.Utils.clean(root.querySelector(`#nome_${index}[formcontrolname="nome"]`)?.value || '');
                const dataNascimento = this.normalizeBirthDate(root.querySelector(`#data_nascimento_${index}[formcontrolname="data_nascimento"]`)?.value || '');
                const idaEl = root.querySelector(`#id_mercado_ida_${index}[formcontrolname="id_mercado_ida"]`);
                const voltaEl = root.querySelector(`#id_mercado_volta_${index}[formcontrolname="id_mercado_volta"]`);
                const switchEl = root.querySelector(`#tem_volta${index}[formcontrolname="tem_volta"]`);
                const temVolta = String(switchEl?.querySelector('button[role="switch"]')?.getAttribute('aria-checked') || '').toLowerCase() === 'true';
                const legs = [];
                const idaText = this.selectedNgValue(idaEl);
                if (idaText) legs.push(this.normalizeLeg({ tipo: 'ida', mercadoCompleto: idaText }));
                const voltaText = this.selectedNgValue(voltaEl);
                if (temVolta && voltaText) legs.push(this.normalizeLeg({ tipo: 'volta', mercadoCompleto: voltaText }));
                passengers.push({ cpf, nome, dataNascimento, legs });
            });

            if (!passengers.length) return null;
            const saved = this.upsertRequest({ prefeitura, secretaria, contrato, status: 'pending', passengers });
            passengers.forEach(passenger => {
                EH.SaleContext?.upsertPassenger?.({ cpf: passenger.cpf, name: passenger.nome, birthDate: passenger.dataNascimento });
            });
            if (saved) EH.Toast.success(`Requisição salva: ${passengers.length} passageiro${passengers.length === 1 ? '' : 's'}.`);
            return saved;
        },

        parseRequestSummaryBlock(block) {
            if (!block) return null;
            const text = EH.Utils.clean(block.textContent || '');
            const marketEl = block.querySelector('h5 span.font-weight-bold') || Array.from(block.querySelectorAll('span')).find(el => /\s-\s/.test(el.textContent || ''));
            const mercadoCompleto = this.cleanMarket(marketEl?.textContent || text.replace(/^.*?MERCADO:\s*/i, '').split(/PASSAGEIRO:/i)[0]);
            const nameMatch = text.match(/PASSAGEIRO\s*:\s*(.*?)\s+DATA DE NASCIMENTO\s*:/i);
            const birthMatch = text.match(/DATA DE NASCIMENTO\s*:\s*(\d{2}[\/.-]\d{2}[\/.-]\d{4}|\d{4}-\d{2}-\d{2})/i);
            const parsedMarket = this.parseMarket(mercadoCompleto);
            return {
                nome: EH.Utils.clean(nameMatch?.[1] || ''),
                dataNascimento: this.normalizeBirthDate(birthMatch?.[1] || ''),
                ...parsedMarket
            };
        },

        requestContainsSummary(request, blocks) {
            return (blocks || []).every(block => {
                return (request.passengers || []).some(passenger => {
                    if (block.nome && this.normalizeName(passenger.nome) !== this.normalizeName(block.nome)) return false;
                    if (block.dataNascimento && passenger.dataNascimento !== block.dataNascimento) return false;
                    return (passenger.legs || []).some(leg => {
                        if (EH.Utils.normalize(leg.mercadoCompleto) === EH.Utils.normalize(block.mercadoCompleto)) return true;
                        return this.legMatchesRoute(leg, block.origem, block.destino);
                    });
                });
            });
        },

        numeroLogicoFromCard(root) {
            const text = EH.Utils.clean(root?.textContent || '');
            return EH.Utils.clean(text.match(/N[ÚU]MERO\s+L[ÓO]GICO\s*:\s*([A-Z0-9.-]+)/i)?.[1] || '');
        },

        scanRequestCards() {
            const app = EH.Utils.first(EH.Selectors.REQUISITION_LIST_ROOT);
            if (!app) return 0;
            const cards = Array.from(app.querySelectorAll('.dados-passagem')).filter(card => /REQUISICAO\s+PREFEITURA|REQUISIÇÃO\s+PREFEITURA/i.test(card.textContent || ''));
            if (!cards.length) return 0;
            const items = this.loadStore();
            let changed = 0;
            cards.forEach(card => {
                const numeroLogico = this.numeroLogicoFromCard(card);
                if (!numeroLogico) return;
                const blocks = Array.from(card.querySelectorAll('.mt-4.border-top')).map(block => this.parseRequestSummaryBlock(block)).filter(Boolean);
                if (!blocks.length) return;
                const exact = items.filter(item => item.numeroLogico === numeroLogico);
                const candidates = exact.length ? exact : items.filter(item => !item.numeroLogico && this.requestContainsSummary(item, blocks));
                if (candidates.length !== 1) return;
                const request = candidates[0];
                const statusText = EH.Utils.normalize(card.textContent || '');
                const nextStatus = statusText.includes('SOLICITACAO ANALISADA') ? 'analyzed' : request.status;
                if (request.numeroLogico !== numeroLogico || request.status !== nextStatus) {
                    request.numeroLogico = numeroLogico;
                    request.status = nextStatus;
                    request.updatedAt = Date.now();
                    changed += 1;
                }
            });
            if (changed) this.saveStore(items);
            return changed;
        },

        findCodeButtonContext(element) {
            const card = element?.closest?.('.dados-passagem');
            return card ? this.numeroLogicoFromCard(card) : '';
        },

        parseCodeBlock(codeElement) {
            const block = codeElement?.closest?.('.border-bottom') || codeElement?.parentElement?.parentElement;
            if (!block) return null;
            const mercadoCompleto = this.cleanMarket(block.querySelector('[id="nome_mercado"]')?.textContent || '');
            const nome = EH.Utils.clean(block.querySelector('[id="passageiro"]')?.textContent || '');
            const dataNascimento = this.normalizeBirthDate(block.querySelector('[id="data_nascimento"]')?.textContent || '');
            const codigo = EH.Utils.clean(codeElement.textContent || '');
            if (!mercadoCompleto || !nome || !dataNascimento || !codigo) return null;
            return { nome, dataNascimento, codigo, ...this.parseMarket(mercadoCompleto) };
        },

        findCodeTargets(items, block) {
            const targets = [];
            let requests = Array.isArray(items) ? items : [];
            if (this.pendingNumeroLogico) {
                const exactLogical = requests.filter(request => request.numeroLogico === this.pendingNumeroLogico);
                requests = exactLogical.length ? exactLogical : requests.filter(request => !request.numeroLogico);
            }
            requests.forEach(request => {
                (request.passengers || []).forEach(passenger => {
                    if (this.normalizeName(passenger.nome) !== this.normalizeName(block.nome)) return;
                    if (passenger.dataNascimento !== block.dataNascimento) return;
                    (passenger.legs || []).forEach(leg => {
                        const exactMarket = EH.Utils.normalize(leg.mercadoCompleto) === EH.Utils.normalize(block.mercadoCompleto);
                        if (!exactMarket && !this.legMatchesRoute(leg, block.origem, block.destino)) return;
                        targets.push({ request, passenger, leg });
                    });
                });
            });
            return targets;
        },

        captureCodeModal() {
            const modal = EH.Utils.first(EH.Selectors.REQUISITION_CODE_MODAL);
            if (!modal) return 0;
            const blocks = Array.from(modal.querySelectorAll('[id^="codigoPrefeitura-"]'))
                .map(element => this.parseCodeBlock(element))
                .filter(Boolean);
            if (!blocks.length) return 0;
            const fingerprint = blocks.map(block => `${EH.Utils.normalize(block.mercadoCompleto)}|${this.normalizeName(block.nome)}|${block.dataNascimento}|${block.codigo}`).join('||');
            if (fingerprint === this.lastModalFingerprint) return 0;
            this.lastModalFingerprint = fingerprint;

            const items = this.loadStore();
            let updated = 0;
            let ambiguous = 0;
            blocks.forEach(block => {
                const targets = this.findCodeTargets(items, block);
                if (targets.length !== 1) {
                    ambiguous += 1;
                    return;
                }
                const { request, leg } = targets[0];
                if (this.pendingNumeroLogico && !request.numeroLogico) request.numeroLogico = this.pendingNumeroLogico;
                if (leg.codigo !== block.codigo || leg.mercadoCompleto !== block.mercadoCompleto) {
                    leg.codigo = block.codigo;
                    leg.mercadoCompleto = block.mercadoCompleto;
                    const parsed = this.parseMarket(block.mercadoCompleto);
                    leg.origem = parsed.origem || leg.origem;
                    leg.destino = parsed.destino || leg.destino;
                    leg.updatedAt = Date.now();
                    request.updatedAt = Date.now();
                    updated += 1;
                }
            });

            items.forEach(request => {
                const legs = request.passengers.flatMap(passenger => passenger.legs || []);
                if (legs.length && legs.every(leg => leg.codigo)) request.status = 'approved';
            });
            if (updated) {
                this.saveStore(items);
                EH.Toast.success(`${updated} código${updated === 1 ? '' : 's'} de requisição associado${updated === 1 ? '' : 's'} ao trecho correto.`);
            }
            if (ambiguous) EH.Toast.warning('Há código de requisição que não pôde ser associado com segurança. Nenhum passageiro foi escolhido automaticamente.');
            return updated;
        },

        parseRouteText(value) {
            let raw = EH.Utils.clean(value || '');
            if (!raw) return null;
            raw = raw.replace(/\s+-\s+\d{2}\/\d{2}\/\d{4}(?:\s+\d{1,2}:\d{2})?.*$/, '').trim();
            let match = raw.match(/^(.*?)\s+[xX×]\s+(.*?)$/);
            if (!match) match = raw.match(/^(.*?)\s+→\s+(.*?)$/);
            if (!match) return null;
            return { origem: EH.Utils.clean(match[1]), destino: EH.Utils.clean(match[2]) };
        },

        routeFromEmissionCard(card) {
            const badge = card?.querySelector?.('.card-header .badge');
            const parsed = this.parseRouteText(badge?.textContent || '');
            if (parsed) return parsed;
            const route = EH.Workflow?.route;
            if (route?.origem && route?.destino) return { origem: route.origem, destino: route.destino };
            return null;
        },

        findEmissionCards() {
            return Array.from(document.querySelectorAll('.card.cadastro-passageiro, .cadastro-passageiro'));
        },

        chooseEmissionCard(cpf) {
            const cards = this.findEmissionCards();
            if (!cards.length) return null;
            const active = document.activeElement?.closest?.('.card.cadastro-passageiro, .cadastro-passageiro');
            if (active && cards.includes(active)) return active;
            const same = cards.find(card => this.normalizeCpf(card.querySelector('input[formcontrolname="cpf"]')?.value || '') === cpf);
            if (same) return same;
            const empty = cards.find(card => !this.normalizeCpf(card.querySelector('input[formcontrolname="cpf"]')?.value || ''));
            if (empty) return empty;
            return cards.length === 1 ? cards[0] : null;
        },

        setActiveEmission(value) {
            try {
                if (!value) sessionStorage.removeItem(this.ACTIVE_KEY);
                else {
                    const next = { ...value, updatedAt: Date.now() };
                    sessionStorage.setItem(this.ACTIVE_KEY, JSON.stringify(next));
                    EH.EmissionMemory?.attachRequestData?.(next);
                }
            } catch (error) {
                EH.Logger.debug('Não foi possível atualizar a emissão temporária da requisição:', error);
            }
        },

        getActiveEmission() {
            try {
                const value = JSON.parse(sessionStorage.getItem(this.ACTIVE_KEY) || 'null');
                if (!value?.cpf || (Date.now() - Number(value.updatedAt || 0)) > EH.Config.REQUISITION_ACTIVE_TTL_MS) {
                    sessionStorage.removeItem(this.ACTIVE_KEY);
                    return null;
                }
                return value;
            } catch (error) {
                return null;
            }
        },

        codeCandidates(cpf, origem, destino) {
            const digits = this.normalizeCpf(cpf);
            const candidates = [];
            this.loadStore().forEach(request => {
                request.passengers.forEach(passenger => {
                    if (passenger.cpf !== digits) return;
                    passenger.legs.forEach(leg => {
                        if (!this.legMatchesRoute(leg, origem, destino)) return;
                        candidates.push({ request, passenger, leg });
                    });
                });
            });
            return candidates;
        },

        async usePassenger(requestId, cpf) {
            const request = this.loadStore().find(item => item.id === requestId);
            const passenger = request?.passengers?.find(item => item.cpf === this.normalizeCpf(cpf));
            if (!request || !passenger) return EH.Toast.warning('Passageiro da requisição não encontrado.');

            const initialCard = this.chooseEmissionCard(passenger.cpf);
            if (!initialCard) return EH.Toast.warning('Abra os dados do passageiro ou deixe um cadastro vazio para usar esta requisição.');

            // ETAPA 1: o CPF é o único dado preenchido ANTES da consulta do E-Pass.
            // Nome e nascimento só são tratados depois que a plataforma retorna o passageiro.
            const cpfInput = initialCard.querySelector('input[formcontrolname="cpf"]');
            if (!cpfInput) return EH.Toast.warning('Não encontrei o campo CPF nos dados do passageiro.');

            cpfInput.focus();
            EH.SaleContext.setNativeValue(cpfInput, EH.SaleContext.maskCpf(passenger.cpf));

            // Aguarda o Angular manter o CPF e liberar a ação de busca. Não depende de timeout fixo
            // para concluir o fluxo; a condição real é o CPF reconhecido + botão disponível.
            const readyToSearch = await EH.Utils.waitFor(() => {
                if (this.normalizeCpf(cpfInput.value) !== passenger.cpf) return null;
                const button = EH.SaleContext.findSearchButton(cpfInput);
                return button && !button.disabled ? button : null;
            }, 5000, 100);

            if (!readyToSearch) {
                return EH.Toast.error('O E-Pass não reconheceu o CPF ou não liberou o botão Buscar.');
            }

            const searchButton = readyToSearch;
            searchButton.click();
            EH.Toast.info(`Buscando ${passenger.nome || EH.SaleContext.maskCpfPublic(passenger.cpf)} no E-Pass…`);

            // A conclusão da consulta é detectada pelo resultado real: o cartão continua com o CPF
            // consultado e o campo Nome passa a conter um passageiro retornado pelo E-Pass.
            // Se o Angular recriar o cartão durante a consulta, procuramos novamente pelo mesmo CPF.
            const lookup = await EH.Utils.waitFor(() => {
                const currentCard = this.findEmissionCards().find(candidate => {
                    const input = candidate.querySelector('input[formcontrolname="cpf"]');
                    return this.normalizeCpf(input?.value || '') === passenger.cpf;
                }) || (initialCard.isConnected ? initialCard : null);
                if (!currentCard) return null;

                const currentCpf = currentCard.querySelector('input[formcontrolname="cpf"]');
                if (this.normalizeCpf(currentCpf?.value || '') !== passenger.cpf) return null;

                const currentName = currentCard.querySelector('input[formcontrolname="nome"]');
                const returnedName = EH.Utils.clean(currentName?.value || '');
                if (!currentName || !returnedName) return null;

                return {
                    card: currentCard,
                    cpfInput: currentCpf,
                    nameInput: currentName,
                    birthInput: currentCard.querySelector('input[formcontrolname="data_nascimento"]'),
                    returnedName
                };
            }, 10000, 180);

            if (!lookup) {
                // Mantém o CPF preenchido para permitir continuidade/manual sem apagar dados.
                return EH.Toast.warning('A busca pelo CPF foi executada, mas o E-Pass não retornou o nome do passageiro dentro do tempo esperado.');
            }

            const { card, nameInput, birthInput } = lookup;

            // Somente AGORA, depois da busca, o nome confiável salvo na requisição pode corrigir
            // capitalização ou divergências retornadas pelo cadastro do E-Pass.
            if (passenger.nome && EH.Utils.clean(nameInput.value || '') !== passenger.nome) {
                EH.SaleContext.setNativeValue(nameInput, passenger.nome);
            }

            // Nascimento é opcional. Em horários/empresas em que o campo não existe, segue normal.
            if (birthInput && passenger.dataNascimento) {
                EH.SaleContext.setNativeValue(birthInput, passenger.dataNascimento);
                if (this.normalizeBirthDate(birthInput.value) !== passenger.dataNascimento) {
                    // Alguns campos textuais usam DD/MM/AAAA; tenta esse formato sem criar
                    // dependência do campo nem interferir quando o input é type=date.
                    EH.SaleContext.setNativeValue(birthInput, this.displayBirthDate(passenger.dataNascimento));
                }
            }

            const validCpf = this.normalizeCpf(card.querySelector('input[formcontrolname="cpf"]')?.value || '') === passenger.cpf;
            const finalNameInput = card.querySelector('input[formcontrolname="nome"]');
            const validName = !passenger.nome || (finalNameInput && this.normalizeName(finalNameInput.value) === this.normalizeName(passenger.nome));
            const finalBirthInput = card.querySelector('input[formcontrolname="data_nascimento"]');
            const validBirth = !finalBirthInput || !passenger.dataNascimento || this.normalizeBirthDate(finalBirthInput.value) === passenger.dataNascimento;

            if (!validCpf || !validName || !validBirth) {
                return EH.Toast.error('O E-Pass não manteve os dados corrigidos da passageira. O preenchimento foi interrompido.');
            }

            const route = this.routeFromEmissionCard(card);
            let matched = null;
            if (route) {
                const candidates = this.codeCandidates(passenger.cpf, route.origem, route.destino);
                if (candidates.length === 1) matched = candidates[0];
            }
            this.setActiveEmission({
                requestId: request.id,
                numeroLogico: request.numeroLogico,
                cpf: passenger.cpf,
                nome: passenger.nome || EH.Utils.clean(nameInput.value || ''),
                origem: route?.origem || '',
                destino: route?.destino || '',
                tipo: matched?.leg?.tipo || '',
                codigo: matched?.leg?.codigo || ''
            });
            EH.SaleContext.upsertPassenger({
                cpf: passenger.cpf,
                name: passenger.nome || EH.Utils.clean(nameInput.value || ''),
                birthDate: passenger.dataNascimento || (birthInput ? this.normalizeBirthDate(birthInput.value) : '')
            });
            EH.UI?.renderSaleSummary?.(EH.Pages?.detect?.() || 'desconhecida');

            if (!route) return EH.Toast.success('Passageira localizada e preenchida. A rota ainda não foi identificada para selecionar o código.');
            if (matched?.leg?.codigo) return EH.Toast.success(`Passageira localizada e preenchida. Código da ${matched.leg.tipo} disponível para esta rota.`);
            if (matched) return EH.Toast.warning('Passageira localizada e preenchida, mas este trecho ainda está aguardando código.');
            return EH.Toast.warning('Passageira localizada e preenchida. Não encontrei um único trecho compatível com a rota atual.');
        },

        paymentRoute() {
            const summary = EH.Payment?.parseSummary?.();
            const raw = summary?.cards?.[0]?.routeDate || '';
            const parsed = this.parseRouteText(raw);
            if (parsed) return parsed;
            const active = this.getActiveEmission();
            return active?.origem && active?.destino ? { origem: active.origem, destino: active.destino } : null;
        },

        resolvePaymentMatch() {
            const active = this.getActiveEmission();
            if (!active?.cpf) return { match: null, reason: 'Nenhuma passageira de requisição está ativa nesta emissão.' };
            const route = this.paymentRoute();
            if (!route?.origem || !route?.destino) return { match: null, reason: 'A rota atual não pôde ser identificada com segurança.' };
            if (active.origem && active.destino && !this.sameRoute(active.origem, active.destino, route.origem, route.destino)) {
                return { match: null, reason: 'A rota do pagamento é diferente da requisição ativa.' };
            }
            const candidates = this.codeCandidates(active.cpf, route.origem, route.destino);
            if (candidates.length !== 1) {
                return { match: null, reason: candidates.length ? 'Existe mais de uma requisição compatível. Selecione manualmente.' : 'Não encontrei requisição compatível com passageira e rota.' };
            }
            if (!candidates[0].leg.codigo) return { match: candidates[0], reason: 'Este trecho ainda está aguardando código.' };
            return { match: candidates[0], reason: '' };
        },

        async fillPaymentCode() {
            const input = EH.Utils.first(EH.Selectors.REQUISITION_CODE_INPUT);
            if (!input) return EH.Toast.warning('O campo Código da requisição não está disponível nesta forma de pagamento.');
            const resolved = this.resolvePaymentMatch();
            if (!resolved.match?.leg?.codigo) return EH.Toast.warning(resolved.reason || 'Código não encontrado.');
            const code = resolved.match.leg.codigo;
            input.focus();
            EH.SaleContext.setNativeValue(input, code);
            await EH.Utils.sleep(120);
            if (EH.Utils.clean(input.value) !== code) return EH.Toast.error('O E-Pass não manteve o código preenchido.');
            const active = this.getActiveEmission() || {};
            this.setActiveEmission({ ...active, requestId: resolved.match.request.id, numeroLogico: resolved.match.request.numeroLogico, tipo: resolved.match.leg.tipo, codigo: code });
            EH.Toast.success(`Código da ${resolved.match.leg.tipo} preenchido para a rota atual.`);
            return true;
        },

        async copyLegCode(code) {
            const value = EH.Utils.clean(code || '');
            if (!value) return EH.Toast.warning('Este trecho ainda não possui código.');
            await EH.Clipboard.copyText(value);
            EH.Toast.success('Código da requisição copiado.');
        },

        renderCard() {
            const requests = this.loadStore();
            if (!requests.length) return null;
            const block = document.createElement('div');
            block.className = 'eh-sale-cpfs';
            const title = document.createElement('div');
            title.className = 'eh-sale-block-title';
            title.textContent = 'Requisições';
            block.appendChild(title);

            const codeInput = EH.Utils.first(EH.Selectors.REQUISITION_CODE_INPUT);
            if (codeInput) {
                const resolved = this.resolvePaymentMatch();
                const status = document.createElement('div');
                status.className = 'eh-sale-passenger-row';
                const text = document.createElement('div');
                text.className = 'eh-sale-passenger-text';
                const strong = document.createElement('strong');
                strong.textContent = resolved.match?.leg?.codigo ? '🟢 Requisição encontrada' : '🟡 Requisição';
                const small = document.createElement('small');
                small.textContent = resolved.match
                    ? `${resolved.match.leg.origem} → ${resolved.match.leg.destino}${resolved.match.leg.codigo ? ' • código disponível' : ' • aguardando código'}`
                    : resolved.reason;
                text.append(strong, small);
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'eh-context-btn primary';
                button.textContent = 'Preencher';
                button.disabled = !resolved.match?.leg?.codigo;
                button.addEventListener('click', () => this.fillPaymentCode());
                status.append(text, button);
                block.appendChild(status);
            }

            const canUsePassenger = this.findEmissionCards().length > 0;
            const rendered = new Set();
            requests.slice(0, 12).forEach(request => {
                request.passengers.forEach((passenger, index) => {
                    const key = `${request.id}|${passenger.cpf}`;
                    if (rendered.has(key)) return;
                    rendered.add(key);
                    const row = document.createElement('div');
                    row.className = 'eh-sale-passenger-row';
                    const text = document.createElement('div');
                    text.className = 'eh-sale-passenger-text';
                    const allCoded = passenger.legs.length && passenger.legs.every(leg => leg.codigo);
                    const strong = document.createElement('strong');
                    strong.textContent = `${allCoded ? '🟢' : '🟡'} ${passenger.nome || `Passageiro ${index + 1}`}`;
                    const identity = document.createElement('small');
                    identity.textContent = `${EH.SaleContext.maskCpfPublic(passenger.cpf)}${passenger.dataNascimento ? ` • ${this.displayBirthDate(passenger.dataNascimento)}` : ''}`;
                    text.append(strong, identity);
                    passenger.legs.forEach(leg => {
                        const line = document.createElement('small');
                        line.textContent = `${leg.tipo.toUpperCase()} • ${leg.origem || '?'} → ${leg.destino || '?'} • ${leg.codigo ? '🟢 código' : '🟡 aguardando'}`;
                        text.appendChild(line);
                    });
                    const use = document.createElement('button');
                    use.type = 'button';
                    use.className = 'eh-context-btn primary';
                    use.textContent = 'Usar passageira';
                    use.disabled = !canUsePassenger;
                    use.title = canUsePassenger ? 'Preencher CPF, buscar no E-Pass e completar os dados depois da consulta' : 'Disponível quando os dados do passageiro estiverem abertos';
                    use.addEventListener('click', () => this.usePassenger(request.id, passenger.cpf));
                    row.append(text, use);
                    block.appendChild(row);

                    const coded = passenger.legs.filter(leg => leg.codigo);
                    if (coded.length) {
                        const actions = document.createElement('div');
                        actions.className = 'eh-sale-summary-actions';
                        coded.slice(0, 2).forEach(leg => {
                            const copy = document.createElement('button');
                            copy.type = 'button';
                            copy.className = 'eh-context-btn';
                            copy.textContent = `Copiar ${leg.tipo}`;
                            copy.addEventListener('click', () => this.copyLegCode(leg.codigo));
                            actions.appendChild(copy);
                        });
                        block.appendChild(actions);
                    }
                });
            });
            return block;
        },

        scanDom() {
            if (EH.WhatsAppBridge.isWhatsAppHost()) return;
            this.scanRequestCards();
            this.captureCodeModal();
        },

        init() {
            if (this.started || EH.WhatsAppBridge.isWhatsAppHost()) return;
            this.started = true;
            const beforeClick = event => {
                const button = event.target?.closest?.('button');
                if (!button) return;
                const label = EH.Utils.normalize(button.textContent || button.title || '');
                if (button.closest('app-solicitacao-requisicoes-prefeitura') && button.type === 'submit' && label.includes('ENVIAR SOLICITACAO')) {
                    this.captureRequestForm();
                    return;
                }
                if (button.closest('app-solicitacoes') && label.includes('CODIGO DA REQUISICAO')) {
                    this.pendingNumeroLogico = this.findCodeButtonContext(button);
                    this.lastModalFingerprint = '';
                }
            };
            const beforeSubmit = event => {
                if (event.target?.closest?.('app-solicitacao-requisicoes-prefeitura')) this.captureRequestForm();
            };
            EH.Runtime.on('requisition-click', document, 'click', beforeClick, true);
            EH.Runtime.on('requisition-submit', document, 'submit', beforeSubmit, true);
            this.scanDom();
        }
    };

    // ============================================================
    // PASSAGENS EMITIDAS — SELEÇÃO E CAPTURA DO CARTÃO ORIGINAL
    // ============================================================
    EH.Tickets = {
        active: false,
        cards: [],
        selected: new Set(),
        storedSelected: new Set(),
        bar: null,
        STORE_KEY: 'epassHelper.capturedTickets.v1',

        storeSnapshot() {
            try {
                return JSON.parse(sessionStorage.getItem(this.STORE_KEY) || '[]');
            } catch (error) {
                EH.Logger.warn('Não foi possível ler os bilhetes capturados.');
                return [];
            }
        },

        saveStore(entries = []) {
            const safeEntries = Array.isArray(entries) ? entries.slice(0, 24) : [];
            try {
                if (!safeEntries.length) sessionStorage.removeItem(this.STORE_KEY);
                else sessionStorage.setItem(this.STORE_KEY, JSON.stringify(safeEntries));
            } catch (error) {
                EH.Logger.warn('Não foi possível salvar os bilhetes capturados.');
            }
            this.syncStoredSelection(safeEntries);
            EH.UI?.renderAutomation?.(EH.Pages?.detect?.() || 'desconhecida');
            EH.UI?.renderSaleSummary?.(EH.Pages?.detect?.() || 'desconhecida');
            return safeEntries;
        },

        listStoredCaptures() {
            return this.storeSnapshot()
                .filter(item => item && item.data && Array.isArray(item.data.tickets))
                .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
        },

        clearStoredCaptures({ quiet = false } = {}) {
            this.storedSelected.clear();
            this.saveStore([]);
            if (!quiet) EH.Toast.info('Bilhetes capturados temporários limpos.');
        },

        syncStoredSelection(entries = this.listStoredCaptures()) {
            const validIds = new Set((entries || []).map(item => String(item.id || '')));
            this.storedSelected.forEach(id => {
                if (!validIds.has(String(id))) this.storedSelected.delete(id);
            });
        },

        storedTicketId(item = {}) {
            const primary = item?.ticket || item?.data?.tickets?.[0] || {};
            const passengerId = String(item.passengerId || '');
            const cpf = String(item.cpf || '').replace(/\D/g, '');
            const number = EH.Utils.clean(primary.number || '');
            const date = EH.Utils.clean(primary.date || '');
            const route = [primary.origin || '', primary.destination || ''].map(value => EH.Utils.clean(value)).join('>');
            const fallback = EH.Utils.clean(item?.data?.header || item?.data?.text || '') || `ticket-${Date.now()}`;
            return [passengerId || cpf || 'anon', number, date, route || fallback].join('|');
        },

        cloneTicketData(data) {
            try {
                return JSON.parse(JSON.stringify(data || null));
            } catch (error) {
                return null;
            }
        },

        passengerNameFor(item = {}) {
            if (item.name) return EH.Utils.clean(item.name);
            const byId = item.passengerId ? EH.SaleContext?.load?.().find(passenger => passenger.id === item.passengerId) : null;
            if (byId?.name) return EH.Utils.clean(byId.name);
            const byCpf = item.cpf ? EH.SaleContext?.findPassengerByCpf?.(item.cpf) : null;
            if (byCpf?.name) return EH.Utils.clean(byCpf.name);
            const active = EH.SaleContext?.getActivePassenger?.() || null;
            return EH.Utils.clean(active?.name || '');
        },

        rememberCapturedItems(items = []) {
            const current = this.listStoredCaptures();
            const map = new Map(current.map(item => [String(item.id || ''), item]));
            let added = 0;

            (Array.isArray(items) ? items : []).forEach(item => {
                if (!item?.data) return;
                const id = this.storedTicketId(item);
                const name = this.passengerNameFor(item);
                const cpf = String(item.cpf || '').replace(/\D/g, '');
                const primary = item.ticket || item.data?.tickets?.[0] || {};
                const existing = map.get(id);
                map.set(id, {
                    id,
                    passengerId: item.passengerId || existing?.passengerId || null,
                    cpf: cpf || existing?.cpf || '',
                    name: name || existing?.name || '',
                    ticketNumber: EH.Utils.clean(primary.number || existing?.ticketNumber || ''),
                    route: {
                        origin: EH.Utils.clean(primary.origin || existing?.route?.origin || ''),
                        destination: EH.Utils.clean(primary.destination || existing?.route?.destination || ''),
                        date: EH.Utils.clean(primary.date || existing?.route?.date || '')
                    },
                    filename: EH.Utils.clean(item.data?.filename || existing?.filename || `bilhete-${Date.now()}.png`),
                    text: EH.Utils.clean(item.data?.text || existing?.text || ''),
                    data: this.cloneTicketData(item.data) || existing?.data || null,
                    createdAt: Number(existing?.createdAt || Date.now()),
                    updatedAt: Date.now()
                });
                this.storedSelected.add(id);
                added += 1;
            });

            this.saveStore(Array.from(map.values()));
            return added;
        },

        selectedStoredEntries() {
            const entries = this.listStoredCaptures();
            this.syncStoredSelection(entries);
            return entries.filter(item => this.storedSelected.has(String(item.id || '')));
        },

        removeStoredCapture(id) {
            const next = this.listStoredCaptures().filter(item => String(item.id || '') !== String(id || ''));
            this.storedSelected.delete(String(id || ''));
            this.saveStore(next);
        },

        renderCapturedBlock() {
            const entries = this.listStoredCaptures();
            if (!entries.length) return null;
            this.syncStoredSelection(entries);

            const block = document.createElement('div');
            block.className = 'eh-sale-cpfs';

            const title = document.createElement('div');
            title.className = 'eh-sale-block-title';
            title.textContent = 'Bilhetes capturados';
            block.appendChild(title);

            const help = document.createElement('div');
            help.className = 'eh-sale-block-help';
            help.textContent = 'Selecione os bilhetes desejados. Eles podem ser unidos em uma única imagem, mesmo quando pertencem a CPFs diferentes.';
            block.appendChild(help);

            entries.forEach((entry, index) => {
                const row = document.createElement('div');
                row.className = 'eh-ticket-captured-row';

                const check = document.createElement('input');
                check.type = 'checkbox';
                check.className = 'eh-ticket-captured-check';
                check.checked = this.storedSelected.has(String(entry.id || ''));
                check.addEventListener('change', () => {
                    if (check.checked) this.storedSelected.add(String(entry.id || ''));
                    else this.storedSelected.delete(String(entry.id || ''));
                    EH.UI?.renderAutomation?.(EH.Pages?.detect?.() || 'desconhecida');
                });

                const meta = document.createElement('div');
                meta.className = 'eh-ticket-captured-meta';
                const strong = document.createElement('strong');
                strong.textContent = `${entry.name || `Passageiro ${index + 1}`}${entry.ticketNumber ? ` • Nº ${entry.ticketNumber}` : ''}`;
                const small1 = document.createElement('small');
                const masked = entry.cpf ? EH.SaleContext.maskCpfPublic(entry.cpf) : 'CPF não identificado';
                const routeSummary = [entry.route?.origin, entry.route?.destination].filter(Boolean).join(' → ');
                small1.textContent = `${masked}${routeSummary ? ` • ${routeSummary}` : ''}`;
                const small2 = document.createElement('small');
                small2.textContent = entry.route?.date || 'Bilhete capturado e pronto para uso';
                meta.append(strong, small1, small2);

                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'eh-mini-btn danger eh-ticket-captured-remove';
                remove.textContent = '✕';
                remove.title = 'Remover este bilhete da lista';
                remove.addEventListener('click', () => {
                    this.removeStoredCapture(entry.id);
                    EH.Toast.info('Bilhete removido da lista temporária.');
                });

                row.append(check, meta, remove);
                block.appendChild(row);
            });

            const actions = document.createElement('div');
            actions.className = 'eh-sale-summary-actions';
            const selectedCount = this.selectedStoredEntries().length;

            const combine = document.createElement('button');
            combine.type = 'button';
            combine.className = 'eh-context-btn primary';
            combine.textContent = '🧩 Gerar imagem conjunta';
            combine.disabled = selectedCount < 1;
            combine.addEventListener('click', () => this.generateCombinedFromStoredSelection());

            const individual = document.createElement('button');
            individual.type = 'button';
            individual.className = 'eh-context-btn';
            individual.textContent = '🎫 Capturar individualmente';
            individual.disabled = selectedCount !== 1;
            individual.addEventListener('click', () => this.captureStoredIndividualSelection());

            const clear = document.createElement('button');
            clear.type = 'button';
            clear.className = 'eh-context-btn';
            clear.textContent = '🗑️ Limpar capturados';
            clear.disabled = !entries.length;
            clear.addEventListener('click', () => {
                if (!confirm('Limpar todos os bilhetes capturados desta venda?')) return;
                this.clearStoredCaptures();
            });

            actions.append(combine, individual, clear);
            block.appendChild(actions);
            return block;
        },

        captureStoredIndividualSelection() {
            const entries = this.selectedStoredEntries();
            if (entries.length !== 1) {
                EH.Toast.warning('Selecione somente 1 bilhete para usar individualmente.');
                return;
            }
            return EH.UI?.captureStoredTicketEntries?.(entries);
        },

        generateCombinedFromStoredSelection() {
            const entries = this.selectedStoredEntries();
            if (!entries.length) {
                EH.Toast.warning('Selecione pelo menos 1 bilhete capturado.');
                return;
            }
            return EH.UI?.captureStoredTicketEntries?.(entries);
        },

        isPassagensPage() {
            return location.pathname.includes('/vendas/passagens') || Boolean(
                EH.Utils.first(EH.Selectors.PASSAGENS_ROOT) &&
                EH.Utils.first(EH.Selectors.PASSAGENS_CPF_INPUT)
            );
        },

        countTicketLabels(element) {
            const text = EH.Utils.normalize(element?.innerText || element?.textContent || '');
            return (text.match(/BILHETE\(S\)\s*:/g) || []).length;
        },

        qualifiesAsTicketCard(element) {
            if (!element || element === document.body || element === document.documentElement) return false;
            const text = EH.Utils.normalize(element.innerText || element.textContent || '');
            if (!text.includes('BILHETE(S):')) return false;
            if (!text.includes('VALOR PAGO')) return false;
            if (!text.includes('VENDA REALIZADA')) return false;
            if (!/N[º°O]?\s*:\s*\d+/i.test(element.innerText || element.textContent || '')) return false;
            return this.countTicketLabels(element) === 1;
        },

        findByDadosPassagem(root) {
            return EH.Utils.all('.dados-passagem', root)
                .map(element => element.closest('.card') || element.parentElement)
                .filter(element => this.qualifiesAsTicketCard(element));
        },

        findByTextMarkers(root) {
            const results = [];
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
                if (!EH.Utils.normalize(node.nodeValue).includes('BILHETE(S):')) continue;
                let current = node.parentElement;
                while (current && current !== root.parentElement) {
                    if (this.qualifiesAsTicketCard(current)) {
                        results.push(current);
                        break;
                    }
                    current = current.parentElement;
                }
            }
            return results;
        },

        findCards() {
            const root = EH.Utils.first(EH.Selectors.PASSAGENS_ROOT) || document.body;
            const candidates = [
                ...this.findByDadosPassagem(root),
                ...this.findByTextMarkers(root)
            ];
            const unique = [];
            const seen = new Set();
            candidates.forEach(card => {
                if (!card || seen.has(card)) return;
                seen.add(card);
                unique.push(card);
            });
            unique.sort((a, b) => {
                if (a === b) return 0;
                const position = a.compareDocumentPosition(b);
                return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
            });
            return unique;
        },

        summary(card) {
            const raw = EH.Utils.clean(card?.innerText || card?.textContent || '');
            const normalized = EH.Utils.normalize(raw);
            const status = ['VALIDA', 'SUBSTITUIDA', 'NAO EMBARCADA', 'EMBARCADA']
                .find(value => normalized.includes(value)) || 'PASSAGEM';
            const value = raw.match(/Valor\s*Pago\s*:\s*(R\$\s*[\d.,]+)/i)?.[1] || '';
            const seat = raw.match(/Poltrona\s*:\s*([\w-]+)/i)?.[1] || '';
            const service = raw.match(/Servi[cç]o\s*:\s*([\w-]+)/i)?.[1] || '';
            const ticket = raw.match(/N[º°O]?\s*:\s*(\d+)/i)?.[1] || '';
            return { raw, status, value, seat, service, ticket };
        },

        cardsSignature(cards = this.findCards()) {
            return (cards || []).map(card => {
                const raw = EH.Utils.clean(card?.innerText || card?.textContent || '');
                const tickets = Array.from(raw.matchAll(/N[º°O]?\s*:\s*(\d+)/gi)).map(match => match[1]).join(',');
                const route = raw.match(/Origem\s*:\s*(.*?)\s*-\s*Destino\s*:\s*([^\n]+)/i);
                return `${tickets}|${route?.[1] || ''}|${route?.[2] || ''}`;
            }).join('||');
        },

        clearSelection() {
            this.active = false;
            this.selected.clear();
            this.bar?.remove?.();
            this.bar = null;
            document.querySelectorAll('.eh-ticket-pick-btn').forEach(button => button.remove());
            document.querySelectorAll('.eh-ticket-choice, .eh-ticket-selected').forEach(card => {
                card.classList.remove('eh-ticket-choice', 'eh-ticket-selected');
                if (card.dataset.ehTicketOldPosition !== undefined) {
                    card.style.position = card.dataset.ehTicketOldPosition;
                    delete card.dataset.ehTicketOldPosition;
                }
            });
            this.cards = [];
        },

        updateSelectionBar() {
            if (!this.bar) return;
            const count = this.selected.size;
            const status = this.bar.querySelector('.eh-ticket-batch-status');
            const capture = this.bar.querySelector('.eh-ticket-batch-capture');
            if (status) status.textContent = count ? `${count} selecionado${count === 1 ? '' : 's'}` : 'Selecione 1 ou 2 bilhetes para esta captura';
            if (capture) {
                capture.disabled = count < 1 || count > 2;
                capture.textContent = count === 2 ? '📸 Capturar os 2' : '📸 Capturar selecionado';
            }
        },

        renderSelectionBar(root) {
            this.bar?.remove?.();
            const bar = document.createElement('div');
            bar.className = 'eh-ticket-batch-bar';

            const status = document.createElement('span');
            status.className = 'eh-ticket-batch-status';
            status.textContent = 'Selecione 1 ou 2 bilhetes para esta captura';

            const capture = document.createElement('button');
            capture.type = 'button';
            capture.className = 'eh-ticket-batch-capture';
            capture.disabled = true;
            capture.textContent = '📸 Capturar selecionado';
            capture.addEventListener('click', () => this.captureSelected());

            const cancel = document.createElement('button');
            cancel.type = 'button';
            cancel.className = 'eh-ticket-batch-cancel';
            cancel.textContent = 'Cancelar';
            cancel.addEventListener('click', () => this.clearSelection());

            bar.append(status, capture, cancel);
            const host = root || EH.Utils.first(EH.Selectors.PASSAGENS_ROOT) || document.body;
            host.prepend(bar);
            this.bar = bar;
            return bar;
        },

        toggleCard(card, button) {
            if (!card) return;
            const already = this.selected.has(card);
            if (already) {
                this.selected.delete(card);
                card.classList.remove('eh-ticket-selected');
                if (button) button.textContent = '☐ Selecionar';
            } else {
                if (this.selected.size >= 2) {
                    EH.Toast.warning('Selecione no máximo dois bilhetes por vez. Depois, eles ficam guardados para unir com outros CPFs.');
                    return;
                }
                this.selected.add(card);
                card.classList.add('eh-ticket-selected');
                if (button) button.textContent = '☑ Selecionado';
            }
            this.updateSelectionBar();
        },

        activateSelection() {
            if (this.active) {
                this.clearSelection();
                EH.Toast.info('Seleção de passagem cancelada.');
                return;
            }

            const cards = this.findCards();
            if (!cards.length) {
                EH.Toast.warning('Digite o CPF, faça a busca e aguarde aparecerem as passagens.');
                return;
            }

            this.clearSelection();
            this.active = true;
            this.cards = cards;
            const root = EH.Utils.first(EH.Selectors.PASSAGENS_ROOT) || cards[0]?.parentElement;
            this.renderSelectionBar(root);

            cards.forEach((card, index) => {
                const computed = getComputedStyle(card).position;
                card.dataset.ehTicketOldPosition = card.style.position || '';
                if (computed === 'static') card.style.position = 'relative';
                card.classList.add('eh-ticket-choice');

                const summary = this.summary(card);
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'eh-ticket-pick-btn';
                button.title = [summary.status, summary.value, summary.seat ? `Poltrona ${summary.seat}` : '']
                    .filter(Boolean).join(' • ');
                button.textContent = '☐ Selecionar';
                button.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.toggleCard(card, button);
                });
                card.appendChild(button);
            });

            cards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            EH.Toast.info(
                cards.length === 1
                    ? 'Uma passagem encontrada. Selecione e capture.'
                    : `${cards.length} passagens encontradas. Selecione até duas por vez para capturar; o Helper guarda as capturas para unir depois.`,
                6000
            );
        },

        selectedCards() {
            return Array.from(this.selected).filter(card => document.contains(card));
        },

        flattenSelectedTickets(cards = this.selectedCards()) {
            const passenger = EH.SaleContext?.getActivePassenger?.() || null;
            const items = (cards || []).map(card => {
                const data = this.extractTicketData(card);
                return {
                    passengerId: passenger?.id || null,
                    cpf: passenger?.cpf || '',
                    name: passenger?.name || '',
                    data,
                    tickets: data.tickets.slice(),
                    ticket: data.tickets[0] || null
                };
            });
            if (!items.length) throw new Error('Nenhum bilhete selecionado foi encontrado.');
            if (items.length > 2) {
                throw new Error('Selecione no máximo dois cartões de passagem por captura.');
            }
            return items;
        },

        async captureSelected() {
            const cards = this.selectedCards();
            if (!cards.length) return EH.Toast.warning('Selecione pelo menos um bilhete.');
            try {
                const items = this.flattenSelectedTickets(cards);
                await EH.UI.captureTicketSelection(items);
            } catch (error) {
                EH.Logger.error('Falha na captura selecionada:', error);
                EH.Toast.error(error.message || 'Não foi possível capturar os bilhetes.');
            }
        },

        stabilizeCaptureText(root) {
            if (!root) return;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            const nodes = [];
            let node;
            while ((node = walker.nextNode())) {
                const parent = node.parentElement;
                if (!parent) continue;
                if (/^(SCRIPT|STYLE|TEXTAREA|INPUT|SELECT|OPTION|SVG|PATH)$/i.test(parent.tagName)) continue;
                if (!node.nodeValue || !/\S/.test(node.nodeValue)) continue;
                nodes.push(node);
            }

            nodes.forEach(textNode => {
                const value = String(textNode.nodeValue || '');
                const parts = value.split(/(\s+)/).filter(Boolean);
                if (parts.length < 2) return;

                const fragment = document.createDocumentFragment();
                parts.forEach(part => {
                    if (/^\s+$/.test(part)) {
                        const spacer = document.createElement('span');
                        spacer.className = 'eh-ticket-space';
                        spacer.setAttribute('aria-hidden', 'true');
                        spacer.textContent = '\u00A0';
                        fragment.appendChild(spacer);
                    } else {
                        fragment.appendChild(document.createTextNode(part));
                    }
                });
                textNode.replaceWith(fragment);
            });
        },

        extractTicketData(card) {
            if (!card || !document.contains(card)) {
                throw new Error('A passagem selecionada não está mais disponível na tela.');
            }

            const headerElement = card.querySelector('.dados-passagem .col-12 h6')
                || card.querySelector('.dados-passagem h6');
            if (!headerElement) {
                throw new Error('Não foi possível localizar os dados principais da passagem.');
            }

            const headerClone = headerElement.cloneNode(true);
            const badgeClone = headerClone.querySelector('.badge');
            const status = EH.Utils.clean(badgeClone?.textContent || '');
            badgeClone?.remove();
            const header = EH.Utils.clean(headerClone.textContent)
                .replace(/\s*-\s*$/, '')
                .trim();

            const infoLines = Array.from(card.querySelectorAll('.dados-passagem .col-10 h6'))
                .map(element => EH.Utils.clean(element.textContent))
                .filter(Boolean);
            const seller = infoLines.find(line => /Venda\s+realizada\s+por\s*:/i.test(line)) || '';
            const soldAt = infoLines.find(line => /Venda\s+realizada\s+em\s*:/i.test(line)) || '';

            const tickets = Array.from(card.querySelectorAll('ul.list-group > li.list-group-item'))
                .map(item => {
                    const leadingText = Array.from(item.childNodes)
                        .filter(node => node.nodeType === Node.TEXT_NODE)
                        .map(node => node.nodeValue || '')
                        .join(' ');
                    const firstLine = EH.Utils.clean(leadingText);
                    const route = EH.Utils.clean(item.querySelector('.viagem')?.textContent || '');
                    const headMatch = firstLine.match(/N[º°O]?\s*:\s*(\d+)\s*-\s*Data\s*de\s*Embarque\s*:\s*(.+)$/i);
                    const routeMatch = route.match(/Origem\s*:\s*(.*?)\s*-\s*Destino\s*:\s*(.*)$/i);
                    return {
                        number: EH.Utils.clean(headMatch?.[1] || ''),
                        date: EH.Utils.clean(headMatch?.[2] || ''),
                        origin: EH.Utils.clean(routeMatch?.[1] || ''),
                        destination: EH.Utils.clean(routeMatch?.[2] || ''),
                        firstLine,
                        route
                    };
                })
                .filter(ticket => ticket.number || ticket.firstLine || ticket.route);

            if (!tickets.length) {
                throw new Error('Os bilhetes não foram encontrados dentro da passagem selecionada.');
            }

            const summary = this.summary(card);
            return {
                header,
                status: status || summary.status || 'PASSAGEM',
                seller,
                soldAt,
                tickets,
                filename: `bilhete-${tickets[0]?.number || summary.ticket || Date.now()}.png`,
                text: EH.Utils.clean(card.innerText || card.textContent || '')
                    .replace(/\s*📸\s*CAPTURAR ESTA\s*\d*/gi, '')
                    .trim()
            };
        },

        prepareCapture(card) {
            const data = this.extractTicketData(card);
            const { shell } = EH.Capture.createShell();
            const width = Math.min(520, Math.max(360, Number(EH.Config.TICKET_CAPTURE_WIDTH) || 430));
            return {
                shell,
                data,
                width,
                filename: data.filename,
                text: data.text
            };
        }

    };

    // ============================================================
    // CAPTURA
    // ============================================================
    EH.Capture = {
        getLibrary() {
            if (typeof html2canvas === 'function') return html2canvas;
            throw new Error('A biblioteca html2canvas não foi carregada.');
        },


        drawRoundRect(ctx, x, y, width, height, radius) {
            const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + width, y, x + width, y + height, r);
            ctx.arcTo(x + width, y + height, x, y + height, r);
            ctx.arcTo(x, y + height, x, y, r);
            ctx.arcTo(x, y, x + width, y, r);
            ctx.closePath();
        },

        wrapCanvasText(ctx, text, maxWidth) {
            const words = String(text || '').trim().split(/\s+/).filter(Boolean);
            if (!words.length) return [];
            const lines = [];
            let current = words[0];
            for (let i = 1; i < words.length; i += 1) {
                const test = `${current} ${words[i]}`;
                if (ctx.measureText(test).width <= maxWidth) current = test;
                else {
                    lines.push(current);
                    current = words[i];
                }
            }
            lines.push(current);
            return lines;
        },

        async renderHorariosCanvas(data) {
            const width = 1180;
            const outerPad = 24;
            const panelPad = 22;
            const cardWidth = width - outerPad * 2 - panelPad * 2;
            const titleBlockHeight = 72;
            const headerHeight = 48;
            const footerHeight = 44;
            const col1 = 430;
            const col2 = 220;
            const col3 = 220;
            const rows = data.horarios.map(item => {
                const company = EH.Utils.clean(item.linha || 'Linha não informada');
                let type = EH.Utils.prettifyWords ? EH.Utils.prettifyWords(item.tipo || '') : EH.Utils.clean(item.tipo || '');
                type = type
                    .replace(/CONVENCIONALCOM/gi, 'CONVENCIONAL COM ')
                    .replace(/COMSANITARIO/gi, 'COM SANITARIO')
                    .replace(/EXPRESSOMAIA/gi, 'EXPRESSO MAIA')
                    .replace(/DOISANDARES/gi, 'DOIS ANDARES')
                    .replace(/DOUBLEDECK/gi, 'DOUBLE DECK')
                    .replace(/\s+/g, ' ')
                    .trim();
                const typeLinesRaw = type
                    ? (type.includes(' - DOIS ANDARES')
                        ? type.replace(/\s*-\s*DOIS ANDARES\s*/i, '\\nDOIS ANDARES ').split('\\n')
                        : [type])
                    : [];
                return {
                    company,
                    typeLines: typeLinesRaw,
                    saida: item.saida || '—',
                    chegada: item.chegada || '—',
                    preco: EH.Fares.display(item, 'Consultar')
                };
            });

            const measureCanvas = document.createElement('canvas');
            const mctx = measureCanvas.getContext('2d');
            let totalRowsHeight = 0;
            const rowMetrics = rows.map(row => {
                mctx.font = '700 13px Arial';
                const wrapped = [];
                row.typeLines.forEach(line => {
                    const lines = this.wrapCanvasText(mctx, line, col1 - 34);
                    if (lines.length) wrapped.push(...lines);
                });
                const lineCount = Math.max(1, wrapped.length);
                const height = 62 + (lineCount - 1) * 16;
                totalRowsHeight += height;
                return { wrapped, height };
            });

            const panelHeight = titleBlockHeight + headerHeight + totalRowsHeight + footerHeight + 18;
            const height = outerPad * 2 + panelHeight;
            const scale = Math.max(1.5, EH.Config.CAPTURE_SCALE || 2);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(width * scale);
            canvas.height = Math.round(height * scale);
            const ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);
            ctx.fillStyle = '#edf1f5';
            ctx.fillRect(0, 0, width, height);

            const panelX = outerPad;
            const panelY = outerPad;
            const panelWidth = width - outerPad * 2;
            this.drawRoundRect(ctx, panelX, panelY, panelWidth, panelHeight, 16);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#dde3ea';
            ctx.lineWidth = 1;
            ctx.stroke();

            const innerX = panelX + panelPad;
            let y = panelY + 18;
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#1f2a3b';
            ctx.font = '700 21px Arial';
            ctx.fillText([data.origem, data.destino].filter(Boolean).join(' → ') || 'Horários disponíveis', innerX, y);
            y += 30;
            ctx.fillStyle = '#6c7789';
            ctx.font = '400 14px Arial';
            if (data.data) ctx.fillText(data.data, innerX, y);
            y += 26;
            ctx.strokeStyle = '#e3e8ef';
            ctx.beginPath();
            ctx.moveTo(innerX, y);
            ctx.lineTo(innerX + cardWidth, y);
            ctx.stroke();
            y += 14;

            const cardX = innerX;
            const cardY = y;
            this.drawRoundRect(ctx, cardX, cardY, cardWidth, headerHeight + totalRowsHeight, 14);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#dce2ea';
            ctx.stroke();

            ctx.save();
            this.drawRoundRect(ctx, cardX, cardY, cardWidth, headerHeight, 14);
            ctx.clip();
            ctx.fillStyle = '#263349';
            ctx.fillRect(cardX, cardY, cardWidth, headerHeight + 4);
            ctx.restore();

            const cardInnerW = cardWidth;
            const col4 = cardInnerW - col1 - col2 - col3;
            const colXs = [cardX, cardX + col1, cardX + col1 + col2, cardX + col1 + col2 + col3, cardX + cardWidth];
            ctx.strokeStyle = 'rgba(255,255,255,0.10)';
            for (let i = 1; i < 4; i += 1) {
                ctx.beginPath();
                ctx.moveTo(colXs[i], cardY);
                ctx.lineTo(colXs[i], cardY + headerHeight);
                ctx.stroke();
            }

            ctx.fillStyle = '#ffffff';
            ctx.font = '700 12px Arial';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText('LINHA', cardX + 18, cardY + headerHeight / 2 + 1);
            ctx.textAlign = 'center';
            ctx.fillText('HORÁRIO DE SAÍDA', cardX + col1 + col2 / 2, cardY + headerHeight / 2 + 1);
            ctx.fillText('HORÁRIO DE CHEGADA', cardX + col1 + col2 + col3 / 2, cardY + headerHeight / 2 + 1);
            ctx.textAlign = 'right';
            ctx.fillText('VALOR', cardX + cardWidth - 18, cardY + headerHeight / 2 + 1);

            let rowY = cardY + headerHeight;
            rows.forEach((row, idx) => {
                const metric = rowMetrics[idx];
                const rowHeight = metric.height;
                if (idx % 2 === 1) {
                    ctx.fillStyle = '#f7f9fc';
                    ctx.fillRect(cardX + 1, rowY, cardWidth - 2, rowHeight);
                }
                ctx.strokeStyle = '#e3e8ef';
                ctx.beginPath();
                ctx.moveTo(cardX, rowY + rowHeight);
                ctx.lineTo(cardX + cardWidth, rowY + rowHeight);
                ctx.stroke();

                ctx.textBaseline = 'top';
                ctx.textAlign = 'left';
                ctx.fillStyle = '#202735';
                ctx.font = '700 16px Arial';
                ctx.fillText(row.company, cardX + 18, rowY + 14);

                ctx.fillStyle = '#6a7487';
                ctx.font = '700 11px Arial';
                let typeY = rowY + 40;
                metric.wrapped.forEach(line => {
                    ctx.fillText(line, cardX + 18, typeY);
                    typeY += 14;
                });

                ctx.fillStyle = '#202735';
                ctx.font = '700 18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(row.saida, cardX + col1 + col2 / 2, rowY + rowHeight / 2);
                ctx.fillText(row.chegada, cardX + col1 + col2 + col3 / 2, rowY + rowHeight / 2);

                const pillW = 112;
                const pillH = 40;
                const pillX = cardX + cardWidth - 18 - pillW;
                const pillY = rowY + (rowHeight - pillH) / 2;
                this.drawRoundRect(ctx, pillX, pillY, pillW, pillH, 10);
                ctx.fillStyle = '#edf8f2';
                ctx.fill();
                ctx.strokeStyle = '#cce4d7';
                ctx.stroke();
                ctx.fillStyle = '#167447';
                ctx.font = '700 17px Arial';
                ctx.fillText(row.preco, pillX + pillW / 2, pillY + pillH / 2 + 1);
                rowY += rowHeight;
            });

            ctx.fillStyle = '#6f7a8e';
            ctx.font = '700 15px Arial';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText('- Escolha seu horário após isso vou encaminhar as poltronas disponíveis', cardX, rowY + 16);
            return canvas;
        },

        async renderReservaCanvas(data) {
            const width = 1320;
            const outerPad = 20;
            const leftW = 770;
            const gap = 20;
            const rightW = width - outerPad * 2 - leftW - gap;
            const titleH = 84;
            const mapRows = 12;
            const mapCardH = 960;
            const rightTopH = 338;
            const rightMidH = 560;
            const footerH = 44;
            const totalHeight = outerPad * 2 + titleH + mapCardH + footerH;
            const scale = Math.max(1.8, (EH.Config.CAPTURE_SCALE || 2));

            const canvas = document.createElement('canvas');
            canvas.width = Math.round(width * scale);
            canvas.height = Math.round(totalHeight * scale);
            const ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);
            ctx.fillStyle = '#edf1f5';
            ctx.fillRect(0, 0, width, totalHeight);

            const sets = {
                livres: new Set((data.poltronasLivres || []).map(String)),
                ocupadas: new Set((data.poltronasOcupadas || []).map(String)),
                reservadas: new Set((data.poltronasReservadas || []).map(String)),
                selecionadas: new Set((data.poltronasSelecionadas || []).map(String))
            };

            const route = data.origemDestino || 'Mapa de poltronas';
            let subtitle = [data.linha, data.horaSaida ? `Saída ${data.horaSaida}` : ''].filter(Boolean).join(' • ');
            subtitle = EH.Utils.prettifyWords ? EH.Utils.prettifyWords(subtitle) : EH.Utils.clean(subtitle);
            subtitle = subtitle.replace(/\s+/g, ' ').trim();

            const baseX = outerPad;
            let y = outerPad;
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#1f2a3b';
            ctx.font = '700 25px Arial';
            ctx.fillText(route, baseX, y + 8);
            ctx.fillStyle = '#6c7789';
            ctx.font = '400 15px Arial';
            if (subtitle) ctx.fillText(subtitle, baseX, y + 46);
            ctx.strokeStyle = '#dfe5ec';
            ctx.beginPath();
            ctx.moveTo(baseX, y + titleH - 12);
            ctx.lineTo(width - outerPad, y + titleH - 12);
            ctx.stroke();
            y += titleH + 6;

            const leftX = outerPad;
            const topY = y;
            const rightX = leftX + leftW + gap;

            const drawCard = (x, y0, w, h, title) => {
                this.drawRoundRect(ctx, x, y0, w, h, 18);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.strokeStyle = '#d7dee8';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = '#223149';
                ctx.font = '700 18px Arial';
                ctx.textBaseline = 'top';
                ctx.textAlign = 'left';
                ctx.fillText(title, x + 18, y0 + 16);
                ctx.strokeStyle = '#e1e6ed';
                ctx.beginPath();
                ctx.moveTo(x + 18, y0 + 46);
                ctx.lineTo(x + w - 18, y0 + 46);
                ctx.stroke();
            };

            drawCard(leftX, topY, leftW, mapCardH, 'MAPA DE POLTRONAS');
            const mapInnerX = leftX + 34;
            const mapInnerY = topY + 72;
            const colXs = [mapInnerX + 24, mapInnerX + 148, mapInnerX + 412, mapInnerX + 536];
            const seatW = 46;
            const seatH = 46;
            const rowStep = 56;
            const seatStyle = (seat) => {
                if (sets.selecionadas.has(seat)) return { fill: '#35b879', text: '#ffffff' };
                if (sets.reservadas.has(seat)) return { fill: '#e2c13c', text: '#263349' };
                if (sets.ocupadas.has(seat)) return { fill: '#e6683e', text: '#ffffff' };
                return { fill: '#3c437d', text: '#ffffff' };
            };
            const drawSeat = (seat, x1, y1) => {
                const s = seatStyle(String(seat));
                this.drawRoundRect(ctx, x1, y1, seatW, seatH, 6);
                ctx.fillStyle = s.fill;
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x1, y1 + seatH - 5, seatW, 2);
                ctx.fillStyle = s.text;
                ctx.font = '700 17px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(seat), x1 + seatW / 2, y1 + seatH / 2 + 1);
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
            };

            ctx.save();
            ctx.translate(leftX + 18, mapInnerY + 290);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = '#7b8799';
            ctx.font = '700 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('LADO DO MOTORISTA', 0, 0);
            ctx.restore();

            let seat = 1;
            for (let r = 0; r < mapRows; r += 1) {
                const y1 = mapInnerY + r * rowStep;
                const seats = [seat, seat + 1, seat + 3, seat + 2].filter(n => n <= (data.totalPoltronas || 46));
                if (seats[0]) drawSeat(seats[0], colXs[0], y1);
                if (seats[1]) drawSeat(seats[1], colXs[1], y1);
                if (seats[2]) drawSeat(seats[2], colXs[2], y1);
                if (seats[3]) drawSeat(seats[3], colXs[3], y1);
                seat += 4;
            }

            const legendTitleY = topY + mapCardH - 152;
            ctx.fillStyle = '#223149';
            ctx.font = '700 16px Arial';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText('LEGENDA DO MAPA', leftX + 18, legendTitleY);
            ctx.strokeStyle = '#e1e6ed';
            ctx.beginPath();
            ctx.moveTo(leftX + 18, legendTitleY + 30);
            ctx.lineTo(leftX + leftW - 18, legendTitleY + 30);
            ctx.stroke();

            const legendY = legendTitleY + 50;
            const legendItems = [
                ['#243c63', 'Livre'],
                ['#e58a29', 'Ocupada'],
                ['#e2c13c', 'Reservada'],
                ['#35b879', 'Selecionada']
            ];
            let lx = leftX + 18;
            legendItems.forEach(([color, label]) => {
                this.drawRoundRect(ctx, lx, legendY, 16, 16, 4);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.fillStyle = '#2c3443';
                ctx.font = '400 12px Arial';
                ctx.fillText(label, lx + 22, legendY + 1);
                lx += 22 + ctx.measureText(label).width + 28;
            });

            const tipY = legendY + 30;
            ctx.fillStyle = '#6b7688';
            ctx.font = '400 12px Arial';
            const tipText = 'Poltronas com numeração pares são as do corredor, e números ímpares são janela.';
            const tipLines = this.wrapCanvasText(ctx, tipText, leftW - 36);
            tipLines.slice(0, 2).forEach((line, idx) => ctx.fillText(line, leftX + 18, tipY + idx * 15));

            drawCard(rightX, topY, rightW, rightTopH, 'INFORMAÇÕES DA VIAGEM');
            const boxGap = 12;
            const boxW = (rightW - 18 * 2 - boxGap) / 2;
            const boxH = 74;
            const infoStartY = topY + 64;
            const infoItems = [
                ['LINHA', EH.Utils.prettifyWords ? EH.Utils.prettifyWords(data.linha || 'Não informada') : (data.linha || 'Não informada')],
                ['HORÁRIO DE SAÍDA', data.horaSaida || 'Não informado'],
                ['VALOR TOTAL', data.valorTotalNum > 0 ? EH.Utils.formatMoney(data.valorTotalNum) : (data.valorParcial || 'Consultar'), 'money'],
                ['TARIFA', data.tarifa || '—'],
                ['TAXA DE EMBARQUE', data.taxa || '—', 'full']
            ];
            infoItems.forEach((item, idx) => {
                const row = Math.floor(idx / 2);
                const col = idx % 2;
                const isFull = item[2] === 'full';
                const drawX = isFull ? (rightX + 18) : (rightX + 18 + col * (boxW + boxGap));
                const drawW = isFull ? (rightW - 36) : boxW;
                const yBox = infoStartY + row * (boxH + 12);
                this.drawRoundRect(ctx, drawX, yBox, drawW, boxH, 12);
                ctx.fillStyle = '#f4f7fb';
                ctx.fill();
                ctx.fillStyle = '#7a8597';
                ctx.font = '700 11px Arial';
                ctx.textBaseline = 'top';
                ctx.textAlign = 'left';
                ctx.fillText(item[0], drawX + 12, yBox + 12);
                ctx.fillStyle = item[2] === 'money' ? '#167447' : '#202735';
                ctx.font = item[2] === 'money' ? '700 17px Arial' : '700 15px Arial';
                const lines = this.wrapCanvasText(ctx, String(item[1] || '—'), drawW - 24);
                lines.slice(0, 2).forEach((line, i) => ctx.fillText(line, drawX + 12, yBox + 30 + i * 18));
            });

            const midY = topY + rightTopH + 16;
            drawCard(rightX, midY, rightW, rightMidH, 'SITUAÇÃO DAS POLTRONAS');
            const statY = midY + 68;
            const statW = (rightW - 18 * 2 - 12 * 3) / 4;
            const statColors = {
                LIVRES: '#243c63',
                OCUPADAS: '#e58a29',
                RESERVADAS: '#e2c13c',
                SELECIONADAS: '#35b879'
            };
            [
                ['LIVRES', data.poltronasLivres.length],
                ['OCUPADAS', data.poltronasOcupadas.length],
                ['RESERVADAS', data.poltronasReservadas.length],
                ['SELECIONADAS', data.poltronasSelecionadas.length]
            ].forEach((item, idx) => {
                const x1 = rightX + 18 + idx * (statW + 12);
                this.drawRoundRect(ctx, x1, statY, statW, 66, 12);
                ctx.fillStyle = '#f9fbfd';
                ctx.fill();
                ctx.strokeStyle = '#d7dee8';
                ctx.stroke();
                ctx.fillStyle = statColors[item[0]];
                ctx.fillRect(x1 + 1, statY + 1, statW - 2, 4);
                ctx.fillStyle = '#202735';
                ctx.font = '700 18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(String(item[1]), x1 + statW / 2, statY + 16);
                ctx.fillStyle = '#6c7789';
                ctx.font = '700 11px Arial';
                ctx.fillText(item[0], x1 + statW / 2, statY + 40);
            });
            ctx.textAlign = 'left';

            const groupStartY = statY + 84;
            const formatSeatList = (values, limit = 22) => {
                if (!Array.isArray(values) || !values.length) return 'Nenhuma';
                const shown = values.slice(0, limit);
                const suffix = values.length > shown.length ? ` e mais ${values.length - shown.length}` : '';
                return shown.join(', ') + suffix;
            };
            const groups = [
                ['POLTRONAS LIVRES', data.poltronasLivres],
                ['POLTRONAS SELECIONADAS', data.poltronasSelecionadas],
                ['POLTRONAS OCUPADAS', data.poltronasOcupadas]
            ];
            groups.forEach((g, idx) => {
                const boxY = groupStartY + idx * 90;
                this.drawRoundRect(ctx, rightX + 18, boxY, rightW - 36, 78, 12);
                ctx.fillStyle = '#f4f7fb';
                ctx.fill();
                ctx.fillStyle = '#4b5569';
                ctx.font = '700 11px Arial';
                ctx.textBaseline = 'top';
                ctx.textAlign = 'left';
                ctx.fillText(g[0], rightX + 30, boxY + 12);
                ctx.textAlign = 'right';
                ctx.fillText(String(g[1].length), rightX + rightW - 30, boxY + 12);
                ctx.textAlign = 'left';
                ctx.fillStyle = g[1].length ? '#202735' : '#8b95a5';
                ctx.font = g[1].length ? '700 12px Arial' : 'italic 12px Arial';
                const listLines = this.wrapCanvasText(ctx, formatSeatList(g[1]), rightW - 60);
                listLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, rightX + 30, boxY + 34 + i * 16));
            });

            const footerY = topY + mapCardH + 18;
            ctx.fillStyle = '#5c6778';
            ctx.font = '700 15px Arial';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText('A disponibilidade pode mudar até a conclusão da compra da passagem.', leftX, footerY);
            return canvas;
        },

        removeActionColumn(tableClone) {
            EH.Utils.all('button, .btn, [role="button"]', tableClone).forEach(element => element.remove());
            EH.Utils.all('tr', tableClone).forEach(row => {
                const cells = Array.from(row.children);
                if (!cells.length) return;
                const last = cells[cells.length - 1];
                const normalized = EH.Utils.normalize(last.textContent);
                if (!normalized || normalized.includes('ACAO') || normalized.includes('RESERVAR')) {
                    last.remove();
                }
            });
        },

        createShell() {
            EH.UI.root?.setAttribute('hidden', 'hidden');
            const shell = document.createElement('div');
            shell.className = 'eh-capture-overlay';

            const message = document.createElement('div');
            message.className = 'eh-capture-message';
            message.textContent = 'Gerando a imagem…';

            const stage = document.createElement('div');
            stage.className = 'eh-capture-stage';

            shell.append(stage, message);
            document.body.appendChild(shell);
            return { shell, stage };
        },

        destroyShell(shell) {
            shell?.remove();
            EH.UI.root?.removeAttribute('hidden');
        },

        appendTitle(stage, title, subtitle) {
            const header = document.createElement('div');
            header.className = 'eh-capture-title';

            const strong = document.createElement('strong');
            strong.textContent = title;
            header.appendChild(strong);

            if (subtitle) {
                const span = document.createElement('span');
                span.textContent = subtitle;
                header.appendChild(span);
            }

            stage.appendChild(header);
        },

        prepareHorarios(data) {
            if (!data || !Array.isArray(data.horarios) || !data.horarios.length) {
                throw new Error('Nenhum horário foi encontrado para montar a imagem.');
            }

            const { shell, stage } = this.createShell();
            const route = [data.origem, data.destino].filter(Boolean).join(' → ') || 'Horários disponíveis';
            const subtitle = data.data || '';
            this.appendTitle(stage, route, subtitle);

            const card = document.createElement('div');
            card.className = 'eh-horarios-card';

            const table = document.createElement('table');
            table.className = 'eh-horarios-table';
            table.setAttribute('aria-label', 'Horários disponíveis');

            const colgroup = document.createElement('colgroup');
            for (let index = 0; index < 4; index += 1) {
                colgroup.appendChild(document.createElement('col'));
            }

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Linha', 'Horário de saída', 'Horário de chegada', 'Valor'].forEach(label => {
                const th = document.createElement('th');
                th.scope = 'col';
                th.textContent = label;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            const tbody = document.createElement('tbody');
            data.horarios.forEach(item => {
                const row = document.createElement('tr');

                const departure = document.createElement('td');
                const departureValue = document.createElement('span');
                departureValue.className = 'eh-time-value';
                departureValue.textContent = item.saida || '—';
                departure.appendChild(departureValue);

                const company = document.createElement('td');
                const companyName = document.createElement('div');
                companyName.className = 'eh-company-name';
                companyName.textContent = EH.Utils.stabilizeDisplayText(item.linha || 'Linha não informada');
                company.appendChild(companyName);
                if (item.tipo) {
                    const vehicleType = document.createElement('div');
                    vehicleType.className = 'eh-vehicle-type';
                    const typeLines = EH.Utils.formatVehicleTypeLines(item.tipo);
                    (typeLines.length ? typeLines : [item.tipo]).forEach(line => {
                        const lineNode = document.createElement('div');
                        lineNode.className = 'eh-vehicle-type-line';
                        lineNode.textContent = line;
                        vehicleType.appendChild(lineNode);
                    });
                    company.appendChild(vehicleType);
                }

                const arrival = document.createElement('td');
                const arrivalValue = document.createElement('span');
                arrivalValue.className = 'eh-time-value';
                arrivalValue.textContent = item.chegada || '—';
                arrival.appendChild(arrivalValue);

                const price = document.createElement('td');
                const priceValue = document.createElement('span');
                priceValue.className = 'eh-price-value';
                priceValue.textContent = EH.Fares.display(item, 'Consultar');
                price.appendChild(priceValue);

                row.append(company, departure, arrival, price);
                tbody.appendChild(row);
            });

            table.append(colgroup, thead, tbody);
            card.appendChild(table);
            stage.appendChild(card);

            const footer = document.createElement('div');
            footer.className = 'eh-capture-footer single';
            const bullet = document.createElement('span');
            bullet.className = 'eh-footer-bullet';
            bullet.textContent = '';
            const note = document.createElement('span');
            note.className = 'eh-footer-text';
            note.textContent = EH.Utils.stabilizeDisplayText('- Escolha seu horário após isso vou encaminhar as poltronas disponíveis');
            footer.append(bullet, note);
            stage.appendChild(footer);

            return { shell, stage, filename: `horarios-${EH.Utils.safeFilePart(route)}.png` };
        },

        prepareReserva(data) {
            const map = EH.Utils.first(EH.Selectors.MAPA_POLTRONAS);
            if (!map) throw new Error('O mapa de poltronas não foi encontrado.');

            const { shell, stage } = this.createShell();
            this.appendTitle(
                stage,
                data.origemDestino || 'Mapa de poltronas',
                [data.linha, data.horaSaida ? `Saída: ${data.horaSaida}` : ''].filter(Boolean).join(' • ')
            );

            const layout = document.createElement('div');
            layout.className = 'eh-reserva-layout';

            const mapCard = document.createElement('section');
            mapCard.className = 'eh-reserva-map-card';

            const mapTitle = document.createElement('h3');
            mapTitle.className = 'eh-reserva-section-title';
            mapTitle.textContent = 'Mapa de poltronas';

            const mapWrap = document.createElement('div');
            mapWrap.className = 'eh-reserva-map';
            const mapClone = map.cloneNode(true);
            EH.Utils.all('button', mapClone).forEach(button => {
                button.tabIndex = -1;
                button.style.pointerEvents = 'none';
            });
            mapWrap.appendChild(mapClone);
            mapCard.append(mapTitle, mapWrap);

            const summary = document.createElement('aside');
            summary.className = 'eh-reserva-summary';

            const createSection = titleText => {
                const card = document.createElement('section');
                card.className = 'eh-summary-card';
                const title = document.createElement('h3');
                title.className = 'eh-reserva-section-title';
                title.textContent = titleText;
                card.appendChild(title);
                return card;
            };

            const appendInfo = (grid, label, value, extraClass = '') => {
                if (!value) return;
                const item = document.createElement('div');
                item.className = 'eh-info-item';
                const labelNode = document.createElement('span');
                labelNode.className = 'eh-info-label';
                labelNode.textContent = label;
                const valueNode = document.createElement('span');
                valueNode.className = `eh-info-value ${extraClass}`.trim();
                valueNode.textContent = value;
                item.append(labelNode, valueNode);
                grid.appendChild(item);
            };

            const tripCard = createSection('Informações da viagem');
            const infoGrid = document.createElement('div');
            infoGrid.className = 'eh-info-grid';
            appendInfo(infoGrid, 'Linha', data.linha || 'Não informada');
            appendInfo(infoGrid, 'Horário de saída', data.horaSaida || 'Não informado');
            appendInfo(infoGrid, 'Tipo de veículo', data.tipo || 'Não informado');
            appendInfo(
                infoGrid,
                'Valor total',
                data.valorTotalNum > 0 ? EH.Utils.formatMoney(data.valorTotalNum) : (data.valorParcial || 'Consultar'),
                'money'
            );
            appendInfo(infoGrid, 'Tarifa', data.tarifa);
            appendInfo(infoGrid, 'Taxa de embarque', data.taxa);
            tripCard.appendChild(infoGrid);

            const seatsCard = createSection('Situação das poltronas');
            const stats = document.createElement('div');
            stats.className = 'eh-seat-stats';

            [
                ['free', data.poltronasLivres.length, 'Livres'],
                ['occupied', data.poltronasOcupadas.length, 'Ocupadas'],
                ['reserved', data.poltronasReservadas.length, 'Reservadas'],
                ['selected', data.poltronasSelecionadas.length, 'Selecionadas']
            ].forEach(([className, amount, label]) => {
                const stat = document.createElement('div');
                stat.className = `eh-seat-stat ${className}`;
                const strong = document.createElement('strong');
                strong.textContent = String(amount);
                const span = document.createElement('span');
                span.textContent = label;
                stat.append(strong, span);
                stats.appendChild(stat);
            });
            seatsCard.appendChild(stats);

            const formatSeatList = (values, limit = 36) => {
                if (!Array.isArray(values) || !values.length) return '';
                const shown = values.slice(0, limit);
                const remaining = values.length - shown.length;
                return `${shown.join(', ')}${remaining > 0 ? ` e mais ${remaining}` : ''}`;
            };

            const groups = document.createElement('div');
            groups.className = 'eh-seat-groups';
            [
                ['Poltronas livres', data.poltronasLivres],
                ['Poltronas selecionadas', data.poltronasSelecionadas],
                ['Poltronas ocupadas', data.poltronasOcupadas],
                ['Poltronas reservadas', data.poltronasReservadas]
            ].forEach(([label, values]) => {
                const group = document.createElement('div');
                group.className = 'eh-seat-group';

                const head = document.createElement('div');
                head.className = 'eh-seat-group-head';
                const headLabel = document.createElement('span');
                headLabel.textContent = label;
                const count = document.createElement('span');
                count.textContent = String(values.length);
                head.append(headLabel, count);

                const list = document.createElement('div');
                const listText = formatSeatList(values);
                list.className = `eh-seat-list${listText ? '' : ' empty'}`;
                list.textContent = listText || 'Nenhuma';

                group.append(head, list);
                groups.appendChild(group);
            });
            seatsCard.appendChild(groups);

            const legendCard = createSection('Legenda do mapa');
            const legend = document.createElement('div');
            legend.className = 'eh-legend';
            [
                ['livre', 'Livre'],
                ['ocupada', 'Ocupada'],
                ['reservada', 'Reservada'],
                ['selecionada', 'Selecionada']
            ].forEach(([className, label]) => {
                const item = document.createElement('div');
                item.className = 'eh-legend-item';
                const color = document.createElement('span');
                color.className = `eh-legend-color ${className}`;
                const text = document.createElement('span');
                text.textContent = label;
                item.append(color, text);
                legend.appendChild(item);
            });
            legendCard.appendChild(legend);

            summary.append(tripCard, seatsCard, legendCard);
            layout.append(mapCard, summary);
            stage.appendChild(layout);

            const footer = document.createElement('div');
            footer.className = 'eh-capture-footer';
            const total = document.createElement('span');
            total.innerHTML = `<strong>${data.poltronasLivres.length}</strong> poltronas livres de <strong>${data.totalPoltronas || 0}</strong>`;
            const warning = document.createElement('span');
            warning.textContent = 'A disponibilidade pode mudar até a conclusão da reserva.';
            footer.append(total, warning);
            stage.appendChild(footer);

            return {
                shell,
                stage,
                filename: `reserva-${EH.Utils.safeFilePart(data.origemDestino)}.png`
            };
        },

        async render(prepared) {
            const library = this.getLibrary();
            const { shell, stage } = prepared;

            try {
                if (document.fonts?.ready) await document.fonts.ready;
                await EH.Utils.waitForImages(stage);
                await EH.Utils.sleep(180);

                const width = Math.max(stage.scrollWidth, stage.offsetWidth, 1);
                const height = Math.max(stage.scrollHeight, stage.offsetHeight, 1);
                const safeScale = Math.max(
                    1,
                    Math.min(
                        EH.Config.CAPTURE_SCALE,
                        Math.sqrt(EH.Config.MAX_CAPTURE_PIXELS / (width * height))
                    )
                );

                EH.Logger.debug('Capturando:', { width, height, safeScale });

                const canvas = await library(stage, {
                    backgroundColor: '#ffffff',
                    scale: safeScale,
                    foreignObjectRendering: true,
                    useCORS: true,
                    allowTaint: false,
                    logging: EH.Config.DEBUG,
                    imageTimeout: 15000,
                    removeContainer: true,
                    scrollX: 0,
                    scrollY: 0,
                    windowWidth: Math.max(document.documentElement.clientWidth, width + 60),
                    windowHeight: Math.max(document.documentElement.clientHeight, height + 60),
                    onclone(clonedDocument) {
                        clonedDocument.querySelector('#eh-root')?.remove();
                        clonedDocument.querySelector('#eh-toast-area')?.remove();
                        clonedDocument.querySelectorAll('.eh-capture-message').forEach(element => element.remove());
                    }
                });

                if (!canvas.width || !canvas.height) {
                    throw new Error('A captura foi criada sem largura ou altura.');
                }

                return canvas;
            } finally {
                this.destroyShell(shell);
            }
        },

        ticketStatusStyle(status) {
            const normalized = EH.Utils.normalize(status);
            if (normalized.includes('VALIDA')) return { fill: '#22ad43', text: '#ffffff' };
            if (normalized.includes('EMBARCADA')) return { fill: '#1aa6c8', text: '#ffffff' };
            if (normalized.includes('NAO EMBARCADA')) return { fill: '#e5b522', text: '#252525' };
            if (normalized.includes('SUBSTITUIDA')) return { fill: '#e4a719', text: '#252525' };
            return { fill: '#6c757d', text: '#ffffff' };
        },

        renderTicketCanvas(data, requestedWidth) {
            const width = Math.min(520, Math.max(360, Number(requestedWidth) || 430));
            const scale = Math.max(1.5, Math.min(2.5, Number(EH.Config.CAPTURE_SCALE) || 2));
            const padding = 22;
            const innerWidth = width - padding * 2;
            const borderColor = '#d8d8d8';
            const mainColor = '#272727';
            const mutedColor = '#4a4a4a';
            const lineHeight = 20;

            const measureCanvas = document.createElement('canvas');
            const measure = measureCanvas.getContext('2d');
            const linesFor = (text, font, maxWidth = innerWidth) => {
                measure.font = font;
                return this.wrapCanvasText(measure, EH.Utils.clean(text), maxWidth);
            };

            const headerFont = '600 14px Arial';
            const bodyFont = '400 14px Arial';
            const labelFont = '700 16px Arial';
            const itemFont = '400 14px Arial';
            const statusFont = '700 13px Arial';

            const headerText = `${data.header}${data.header ? ' -' : ''}`;
            const headerLines = linesFor(headerText, headerFont);
            measure.font = statusFont;
            const badgePadX = 9;
            const badgeHeight = 24;
            const badgeWidth = Math.ceil(measure.measureText(data.status).width) + badgePadX * 2;
            measure.font = headerFont;
            const headerLastWidth = headerLines.length ? measure.measureText(headerLines[headerLines.length - 1]).width : 0;
            const badgeInline = headerLines.length > 0 && headerLastWidth + 8 + badgeWidth <= innerWidth;
            const headerHeight = headerLines.length * lineHeight + (badgeInline ? 0 : badgeHeight + 4);

            const sellerLines = linesFor(data.seller, bodyFont);
            const soldAtLines = linesFor(data.soldAt, bodyFont);

            const ticketLayouts = data.tickets.map(ticket => {
                const line1 = ticket.number
                    ? `Nº: ${ticket.number} - Data de Embarque:`
                    : ticket.firstLine;
                const line1Lines = linesFor(line1, itemFont, innerWidth - 32);
                const dateLines = linesFor(ticket.date, itemFont, innerWidth - 32);
                const routeText = ticket.origin || ticket.destination
                    ? `Origem: ${ticket.origin} - Destino: ${ticket.destination}`
                    : ticket.route;
                const routeLines = linesFor(routeText, itemFont, innerWidth - 32);
                const contentHeight = line1Lines.length * lineHeight
                    + (dateLines.length ? dateLines.length * lineHeight + 2 : 0)
                    + (routeLines.length ? routeLines.length * lineHeight + 2 : 0);
                return {
                    line1Lines,
                    dateLines,
                    routeLines,
                    height: Math.max(78, contentHeight + 26)
                };
            });

            let height = padding;
            height += headerHeight;
            height += 14;
            height += sellerLines.length * lineHeight;
            height += 10;
            height += soldAtLines.length * lineHeight;
            height += 20;
            height += 24; // Bilhete(s)
            height += 10;
            height += ticketLayouts.reduce((sum, item) => sum + item.height, 0);
            height += padding;

            const canvas = document.createElement('canvas');
            canvas.width = Math.round(width * scale);
            canvas.height = Math.round(height * scale);
            const ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            this.drawRoundRect(ctx, 0.5, 0.5, width - 1, height - 1, 4);
            ctx.stroke();

            let y = padding;
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillStyle = mainColor;
            ctx.font = headerFont;
            headerLines.forEach(line => {
                ctx.fillText(line, padding, y);
                y += lineHeight;
            });

            const badgeStyle = this.ticketStatusStyle(data.status);
            const badgeY = badgeInline ? (y - lineHeight - 2) : (y + 2);
            const badgeX = badgeInline ? (padding + headerLastWidth + 8) : padding;
            this.drawRoundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 5);
            ctx.fillStyle = badgeStyle.fill;
            ctx.fill();
            ctx.fillStyle = badgeStyle.text;
            ctx.font = statusFont;
            ctx.textBaseline = 'middle';
            ctx.fillText(data.status, badgeX + badgePadX, badgeY + badgeHeight / 2 + 0.5);
            ctx.textBaseline = 'top';
            if (!badgeInline) y = badgeY + badgeHeight;

            y += 14;
            ctx.fillStyle = mainColor;
            ctx.font = bodyFont;
            sellerLines.forEach(line => {
                ctx.fillText(line, padding, y);
                y += lineHeight;
            });
            y += 10;
            soldAtLines.forEach(line => {
                ctx.fillText(line, padding, y);
                y += lineHeight;
            });

            y += 20;
            ctx.fillStyle = mainColor;
            ctx.font = labelFont;
            ctx.fillText('Bilhete(s):', padding, y);
            y += 34;

            const listX = padding;
            const listW = innerWidth;
            const listTop = y;
            const listH = ticketLayouts.reduce((sum, item) => sum + item.height, 0);
            ctx.strokeStyle = borderColor;
            this.drawRoundRect(ctx, listX, listTop, listW, listH, 2);
            ctx.stroke();

            ctx.font = itemFont;
            ctx.fillStyle = mutedColor;
            data.tickets.forEach((ticket, index) => {
                const layout = ticketLayouts[index];
                if (index > 0) {
                    ctx.strokeStyle = borderColor;
                    ctx.beginPath();
                    ctx.moveTo(listX, y);
                    ctx.lineTo(listX + listW, y);
                    ctx.stroke();
                }
                let itemY = y + 13;
                layout.line1Lines.forEach(line => {
                    ctx.fillText(line, listX + 16, itemY);
                    itemY += lineHeight;
                });
                if (layout.dateLines.length) itemY += 2;
                layout.dateLines.forEach(line => {
                    ctx.fillText(line, listX + 16, itemY);
                    itemY += lineHeight;
                });
                if (layout.routeLines.length) itemY += 2;
                layout.routeLines.forEach(line => {
                    ctx.fillText(line, listX + 16, itemY);
                    itemY += lineHeight;
                });
                y += layout.height;
            });

            return canvas;
        },

        combineTicketCanvases(canvases = []) {
            const items = (canvases || []).filter(canvas => canvas?.width && canvas?.height);
            if (!items.length) throw new Error('Nenhuma imagem de bilhete foi gerada.');
            if (items.length === 1) return items[0];

            const count = items.length;
            const gap = 24;
            const padding = 20;
            const cols = count === 2 ? 2 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
            const rows = Math.ceil(count / cols);
            const colWidths = Array(cols).fill(0);
            const rowHeights = Array(rows).fill(0);

            items.forEach((canvas, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                colWidths[col] = Math.max(colWidths[col], canvas.width);
                rowHeights[row] = Math.max(rowHeights[row], canvas.height);
            });

            const width = padding * 2 + colWidths.reduce((sum, value) => sum + value, 0) + gap * (cols - 1);
            const height = padding * 2 + rowHeights.reduce((sum, value) => sum + value, 0) + gap * (rows - 1);

            const combined = document.createElement('canvas');
            combined.width = width;
            combined.height = height;
            const ctx = combined.getContext('2d', { alpha: false });
            ctx.fillStyle = '#f4f6f8';
            ctx.fillRect(0, 0, width, height);

            let y = padding;
            for (let row = 0; row < rows; row += 1) {
                let x = padding;
                for (let col = 0; col < cols; col += 1) {
                    const index = row * cols + col;
                    if (index >= items.length) break;
                    const canvas = items[index];
                    const cellWidth = colWidths[col];
                    const offsetX = Math.round((cellWidth - canvas.width) / 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x + offsetX - 1, y - 1, canvas.width + 2, canvas.height + 2);
                    ctx.drawImage(canvas, x + offsetX, y);
                    x += cellWidth + gap;
                }
                y += rowHeights[row] + gap;
            }
            return combined;
        },

        async renderTicket(prepared) {
            const { shell, data, width } = prepared;
            try {
                return this.renderTicketCanvas(data, width);
            } finally {
                this.destroyShell(shell);
            }
        },

        start(page, data) {
            if (page === 'pesquisa') {
                const route = [data.origem, data.destino].filter(Boolean).join(' → ') || 'horarios';
                return {
                    prepared: { filename: `horarios-${EH.Utils.safeFilePart(route)}.png` },
                    canvasPromise: this.renderHorariosCanvas(data)
                };
            }

            return {
                prepared: { filename: `reserva-${EH.Utils.safeFilePart(data.origemDestino || 'reserva')}.png` },
                canvasPromise: this.renderReservaCanvas(data)
            };
        }
    };

    // ============================================================
    // DIAGNÓSTICO
    // ============================================================
    EH.Diagnostics = {
        runSelfCheck() {
            const checks = [];
            const add = (name, ok, detail = '') => checks.push({ name, ok: Boolean(ok), detail: EH.Utils.clean(detail || '') });
            const sample = EH.Fares.calculate(96.17, 'IPORA - GO', { applyFee: false });
            add('Config carregada', Boolean(EH.Config && EH.Config.VERSION), `v${EH.Config.VERSION}`);
            add('Parser monetário BR', Math.abs(EH.Utils.parseMoney('R$ 1.234,56') - 1234.56) < 0.001, String(EH.Utils.parseMoney('R$ 1.234,56')));
            add('Parser decimal com vírgula', Math.abs(EH.Utils.parseMoney('6,69') - 6.69) < 0.001, String(EH.Utils.parseMoney('6,69')));
            add('Cálculo de tarifa', sample.success && Math.abs(sample.valorFinalNum - 96.17) < 0.001, String(sample.valorFinalNum));
            add('Storage', typeof GM_getValue === 'function' && typeof GM_setValue === 'function');
            add('Runtime listeners', Boolean(EH.Runtime?.listeners instanceof Map), String(EH.Runtime?.listeners?.size || 0));
            add('Observer único', Boolean(EH.Observer && ('observer' in EH.Observer)), EH.Observer?.observer ? 'ativo' : 'aguardando');
            add('WhatsApp Bridge', Boolean(EH.WhatsAppBridge?.makeCommand && EH.WhatsAppBridge?.send));
            add('Financeiro', Boolean(EH.FinanceLedger?.summary && EH.FinanceReader?.snapshot));
            add('Mapa 287', Boolean(EH.OperationCars?.agencySummary && EH.OperationCars?.readVehicleMap));
            return {
                success: checks.every(item => item.ok),
                checks,
                failed: checks.filter(item => !item.ok).map(item => item.name)
            };
        },

        report() {
            const table = EH.Utils.first(EH.Selectors.TABLE_HORARIOS);
            const map = EH.Utils.first(EH.Selectors.MAPA_POLTRONAS);
            const panel = EH.Utils.first(EH.Selectors.DADOS_RESERVA);

            return {
                epassHelper: {
                    version: EH.Config.VERSION,
                    date: new Date().toISOString()
                },
                page: {
                    url: location.href,
                    title: document.title,
                    detected: EH.Pages.detect(),
                    secureContext: window.isSecureContext,
                    insideIframe: window.top !== window.self,
                    visibility: document.visibilityState
                },
                browser: {
                    userAgent: navigator.userAgent,
                    clipboardWrite: Boolean(navigator.clipboard?.write),
                    clipboardWriteText: Boolean(navigator.clipboard?.writeText),
                    clipboardItem: typeof ClipboardItem !== 'undefined',
                    html2canvas: typeof html2canvas
                },
                selectors: {
                    tableFound: Boolean(table),
                    tableRows: table ? EH.Utils.all(EH.Selectors.TABLE_ROWS, table).length : 0,
                    mapFound: Boolean(map),
                    seatButtons: map ? EH.Utils.all(EH.Selectors.POLTRONA_BUTTON, map).length : 0,
                    reservationPanelFound: Boolean(panel)
                },
                settings: {
                    captureScale: EH.Config.CAPTURE_SCALE,
                    applyOriginFees: EH.Config.APLICAR_TAXAS_ORIGEM,
                    originFees: { ...(EH.Config.TAXAS_ORIGEM || {}) },
                    panelZoom: EH.Config.PANEL_ZOOM,
                    whatsappZoom: EH.Config.WHATSAPP_DOCK_ZOOM
                },
                interface: {
                    state: EH.State?.snapshot?.() || null,
                    layout: EH.Layout?.lastMetrics || null,
                    whatsapp: EH.WhatsAppBridge?.getConnectionStatus?.() || null
                },
                financeReadOnly: (() => {
                    const snapshot = EH.FinanceReader?.snapshot?.();
                    if (!snapshot) return null;
                    if (snapshot.page === 'caixa') {
                        return {
                            page: 'caixa',
                            caixaNumber: snapshot.header?.caixaNumber || '',
                            salesFound: snapshot.sales?.length || 0,
                            companiesFound: snapshot.commissionSummary?.length || 0,
                            hasAgentSummary: Boolean(snapshot.agentSummary)
                        };
                    }
                    return {
                        page: 'comissoes',
                        historyRowsFound: snapshot.history?.length || 0,
                        companiesFound: snapshot.summary?.length || 0
                    };
                })(),
                runtime: {
                    listeners: EH.Runtime?.listeners?.size || 0,
                    intervals: EH.Runtime?.intervals?.size || 0,
                    timeouts: EH.Runtime?.timeouts?.size || 0,
                    selfCheck: this.runSelfCheck(),
                    observerActive: Boolean(EH.Observer?.observer)
                }
            };
        },

        relevantHtml() {
            const table = EH.Utils.first(EH.Selectors.TABLE_HORARIOS);
            const map = EH.Utils.first(EH.Selectors.MAPA_POLTRONAS);
            const panel = EH.Utils.first(EH.Selectors.DADOS_RESERVA);

            return JSON.stringify({
                warning: 'Não envie dados pessoais de passageiros.',
                url: location.href,
                table: table?.outerHTML || 'NÃO ENCONTRADA',
                seatMap: map?.outerHTML || 'NÃO ENCONTRADO',
                reservationPanel: panel?.outerHTML || 'NÃO ENCONTRADO'
            }, null, 2);
        }
    };

    // ============================================================
    // FLUXO DE ATENDIMENTO + PAGAMENTO
    // ============================================================
    EH.Workflow = {
        stage: EH.Storage.get('workflowStage', 'consulta'),
        route: EH.Storage.get('workflowRoute', null),
        setStage(stage) {
            this.stage = stage || 'consulta';
            EH.Storage.set('workflowStage', this.stage);
            EH.UI?.renderAutomation?.(EH.Pages?.detect?.() || 'desconhecida');
        },
        setRoute(route) {
            this.route = route || null;
            EH.Storage.set('workflowRoute', this.route);
            this.setStage('consulta');
        },
        stages: [
            ['consulta', '1', 'Horários'],
            ['poltronas', '2', 'Poltronas'],
            ['confirmacao', '3', 'Confirmar'],
            ['pix', '4', 'PIX'],
            ['bilhete', '5', 'Bilhete']
        ],
        infer(page) {
            if (page === 'pesquisa') return 'consulta';
            if (page === 'reserva') return 'poltronas';
            if (page === 'confirmacao') return 'confirmacao';
            if (page === 'pagamento') return EH.Payment?.parsePix?.() ? 'pix' : 'confirmacao';
            if (page === 'passagens') return 'bilhete';
            return this.stage || 'consulta';
        }
    };

    EH.Payment = {
        lastPixCode: '',
        lastPixPackage: null,

        clean(text) { return EH.Utils.clean(String(text || '').replace(/\u00a0/g, ' ')); },
        pixOriginal(value) { return String(value == null ? '' : value).trim(); },

        isPage() {
            return location.pathname.includes('/vendas/pagamento') || Boolean(EH.Utils.first(EH.Selectors.PAGAMENTO_ROOT));
        },

        parseSummary() {
            const bodies = EH.Utils.all('.resumo-reserva .card .body');
            if (!bodies.length) return null;
            const cards = bodies.map(body => {
                const badges = Array.from(body.querySelectorAll('.badge')).map(el => this.clean(el.textContent)).filter(Boolean);
                const routeDate = this.clean(body.querySelector('.badge-primary')?.textContent || badges[0] || '');
                const vehicle = this.clean(body.querySelector('.badge-info')?.textContent || badges[1] || '');
                const lines = Array.from(body.querySelectorAll('.col-12')).map(el => this.clean(el.textContent)).filter(Boolean);
                const byPrefix = prefix => lines.find(line => EH.Utils.normalize(line).startsWith(EH.Utils.normalize(prefix))) || '';
                const valueLines = Array.from(body.querySelectorAll('.valores .col-12')).map(el => this.clean(el.textContent)).filter(Boolean);
                const findValue = prefix => valueLines.find(line => EH.Utils.normalize(line).startsWith(EH.Utils.normalize(prefix))) || '';
                return {
                    routeDate,
                    vehicle,
                    passenger: byPrefix('PASSAGEIRO:').replace(/^PASSAGEIRO\s*:\s*/i, '').trim(),
                    seat: this.clean(body.querySelector('.numero_poltrona')?.textContent || byPrefix('NÚMERO DA POLTRONA:')).replace(/^N[ÚU]MERO DA POLTRONA\s*:\s*/i, '').trim(),
                    tarifa: findValue('TARIFA:'),
                    taxa: findValue('TAXA DE EMBARQUE:'),
                    pedagio: findValue('PEDAGIO:'),
                    beneficio: findValue('BENEFÍCIO:') || findValue('BENEFICIO:'),
                    credito: findValue('CRÉDITO:') || findValue('CREDITO:'),
                    total: this.clean(body.querySelector('.valores b')?.textContent || findValue('TOTAL:'))
                };
            });
            return { cards };
        },

        formatSummary(summary) {
            if (!summary?.cards?.length) return '';

            const moneyValue = value => {
                const raw = String(value || '').trim();
                const match = raw.match(/R\$\s*[\d.,]+/i);
                return match ? match[0].replace(/\s+/g, ' ') : raw;
            };
            const positiveMoney = value => EH.Utils.parseMoney(moneyValue(value)) > 0;
            const splitRouteDate = value => {
                const raw = String(value || '').replace(/\s+/g, ' ').trim();
                const match = raw.match(/^(.*?)\s*-\s*(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{1,2}:\d{2}))?$/);
                if (!match) return { route: raw.replace(/\s+[xX×]\s+/g, ' → '), date: '', time: '' };
                return {
                    route: String(match[1] || '').replace(/\s+[xX×]\s+/g, ' → ').trim(),
                    date: match[2] || '',
                    time: match[3] || ''
                };
            };

            const parts = ['*CONFIRMAÇÃO DA VIAGEM*', ''];
            summary.cards.forEach((card, index) => {
                const routeInfo = splitRouteDate(card.routeDate);
                if (summary.cards.length > 1) parts.push(`*Passageiro ${index + 1}*`);
                if (routeInfo.route) parts.push(`🚌 *${routeInfo.route}*`);
                if (routeInfo.date || routeInfo.time) {
                    const when = [routeInfo.date ? `📅 *${routeInfo.date}*` : '', routeInfo.time ? `🕐 *${routeInfo.time}*` : ''].filter(Boolean).join('  ');
                    if (when) parts.push(when);
                }
                if (card.passenger) parts.push('', `👤 *Passageiro: ${card.passenger}*`);
                if (card.seat) parts.push(`💺 *Poltrona: ${card.seat}*`);

                const fare = moneyValue(card.tarifa);
                const fee = moneyValue(card.taxa);
                const toll = moneyValue(card.pedagio);
                const benefit = moneyValue(card.beneficio);
                const credit = moneyValue(card.credito);
                const total = moneyValue(card.total);
                const valueLines = [];
                if (fare) valueLines.push(`💰 Tarifa: ${fare}`);
                if (positiveMoney(fee)) valueLines.push(`Taxa de embarque: + ${fee}`);
                if (positiveMoney(toll)) valueLines.push(`Pedágio: + ${toll}`);
                if (positiveMoney(benefit)) valueLines.push(`Benefício: - ${benefit}`);
                if (positiveMoney(credit)) valueLines.push(`Crédito: - ${credit}`);
                if (valueLines.length) parts.push('', ...valueLines);
                if (total) parts.push('', `*Total: ${total}*`);
                if (summary.cards.length > 1 && index < summary.cards.length - 1) parts.push('');
            });
            parts.push('', 'Confira os dados da sua viagem.', '', 'Se estiver tudo correto, responda *SIM*.');
            return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        },

        toUtf8Bytes(text) {
            const value = String(text == null ? '' : text);
            if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value);
            const utf8 = unescape(encodeURIComponent(value));
            const bytes = new Uint8Array(utf8.length);
            for (let i = 0; i < utf8.length; i += 1) bytes[i] = utf8.charCodeAt(i);
            return bytes;
        },

        crc16Bytes(bytes) {
            let crc = 0xFFFF;
            for (const byte of bytes) {
                crc ^= (byte << 8);
                for (let bit = 0; bit < 8; bit += 1) {
                    crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
                    crc &= 0xFFFF;
                }
            }
            return crc.toString(16).toUpperCase().padStart(4, '0');
        },

        validatePix(value) {
            const pixOriginal = this.pixOriginal(value);
            if (!pixOriginal) return { valid: false, structureValid: false, crcValid: false, reason: 'Código PIX vazio.' };

            const bytes = this.toUtf8Bytes(pixOriginal);
            const fields = [];
            let offset = 0;
            let error = '';

            while (offset < bytes.length) {
                if (offset + 4 > bytes.length) {
                    error = 'O código termina antes do cabeçalho de um campo EMV.';
                    break;
                }
                const id = String.fromCharCode(bytes[offset], bytes[offset + 1]);
                const lengthText = String.fromCharCode(bytes[offset + 2], bytes[offset + 3]);
                if (!/^\d{2}$/.test(lengthText)) {
                    error = `Comprimento inválido no campo ${id || '?'}.`;
                    break;
                }
                const length = Number(lengthText);
                const valueStart = offset + 4;
                const end = valueStart + length;
                if (end > bytes.length) {
                    error = `O campo ${id || '?'} está incompleto.`;
                    break;
                }
                fields.push({ id, length, start: offset, valueStart, end });
                offset = end;
            }

            if (!error && offset !== bytes.length) error = 'A estrutura do código PIX está incompleta.';
            const crcField = fields.length ? fields[fields.length - 1] : null;
            if (!error && (!crcField || crcField.id !== '63' || crcField.length !== 4 || crcField.end !== bytes.length)) {
                error = 'Campo final 6304 não encontrado ou incompleto.';
            }

            let crcExpected = '';
            let crcCalculated = '';
            let crcValid = false;
            if (!error && crcField) {
                crcExpected = Array.from(bytes.slice(crcField.valueStart, crcField.end), b => String.fromCharCode(b)).join('').toUpperCase();
                if (!/^[0-9A-F]{4}$/.test(crcExpected)) {
                    error = 'CRC16 final não possui quatro caracteres hexadecimais.';
                } else {
                    crcCalculated = this.crc16Bytes(bytes.slice(0, crcField.valueStart));
                    crcValid = crcCalculated === crcExpected;
                    if (!crcValid) error = `CRC16 não confere (${crcCalculated} ≠ ${crcExpected}).`;
                }
            }

            const structureValid = !error || (!error && Boolean(crcField));
            const valid = !error && crcValid;
            return {
                valid,
                structureValid: valid || Boolean(crcField && crcField.end === bytes.length),
                crcValid,
                crcExpected,
                crcCalculated,
                fieldsCount: fields.length,
                reason: valid ? '' : (error || 'Código PIX aparentemente inválido.')
            };
        },

        detectDynamicPix(value) {
            const pixOriginal = this.pixOriginal(value);
            if (!pixOriginal) return false;
            return /https?:\/\//i.test(pixOriginal) || /(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\.[a-z]{2,})?\//i.test(pixOriginal) || /\.com\.br\//i.test(pixOriginal);
        },

        parsePix() {
            const modal = EH.Utils.first(EH.Selectors.PIX_MODAL);
            if (!modal) return null;
            const codeElement = EH.Utils.first(EH.Selectors.PIX_CODIGO, modal) || document.querySelector('#pixCopiaEColaContent');
            // REGRA: preservar o payload exatamente como veio do E-Pass; apenas trim nas extremidades.
            const pixOriginal = this.pixOriginal(codeElement?.textContent || '');
            if (!pixOriginal) return null;
            const value = this.clean(EH.Utils.first(EH.Selectors.PIX_VALOR)?.textContent || modal.querySelector('.pixValor strong')?.textContent || '');
            const expires = this.clean(EH.Utils.first(EH.Selectors.PIX_EXPIRA)?.textContent || modal.querySelector('.pixExpiraEm strong')?.textContent || '');
            const qrSource = EH.Utils.first(EH.Selectors.PIX_QR)?.getAttribute('src') || modal.querySelector('.qrCodeImg')?.getAttribute('src') || '';
            const validation = this.validatePix(pixOriginal);
            const dynamic = this.detectDynamicPix(pixOriginal);
            return {
                code: pixOriginal, // alias legado: não modificar
                pixOriginal,
                pixParaExibicao: pixOriginal,
                value,
                expires,
                qr: qrSource,
                validation,
                dynamic,
                whatsappMode: dynamic ? 'isolated' : 'isolated'
            };
        },

        payload(pix = this.parsePix()) {
            return this.pixOriginal(pix?.pixOriginal ?? pix?.code ?? '');
        },

        formatPixInstruction() {
            return [
                '👇 Para copiar o PIX:',
                '',
                '*Segure a próxima mensagem e toque em Copiar*.',
                '',
                '⚠️ Não toque somente no trecho azul.'
            ].join('\n');
        },

        formatPixInfo() { return this.formatPixInstruction(); },
        formatPix() { return this.formatPixInstruction(); },

        formatPixMonospace(pix = this.parsePix()) {
            const payload = this.payload(pix);
            return payload ? `\`${payload}\`` : '';
        },

        async copyPixCode(pix = this.parsePix(), silent = false) {
            const payload = this.payload(pix);
            if (!payload) {
                if (!silent) EH.Toast.warning('⚠️ Código PIX não encontrado.');
                return false;
            }
            const validation = pix?.validation || this.validatePix(payload);
            if (!validation.valid) {
                if (!silent) EH.Toast.warning(`⚠️ O código PIX parece incompleto ou inválido. ${validation.reason || ''}`.trim());
                return false;
            }
            try {
                // Clipboard sempre em texto puro; nunca HTML/rich text.
                await EH.Clipboard.copyText(payload);
                if (!silent) EH.Toast.success('✅ Código PIX copiado');
                return true;
            } catch (error) {
                EH.Logger.warn('Falha ao copiar código PIX:', error);
                if (!silent) EH.Toast.error('❌ Não foi possível copiar o PIX.');
                return false;
            }
        },

        async getOriginalQrDataUrl(pix = this.parsePix()) {
            const direct = String(pix?.qr || '').trim();
            if (direct.startsWith('data:image/')) return direct;

            const element = EH.Utils.first(EH.Selectors.PIX_QR) || document.querySelector('.qrCodeImg');
            const canvas = element?.tagName === 'CANVAS' ? element : element?.querySelector?.('canvas');
            if (canvas?.toDataURL) {
                try { return canvas.toDataURL('image/png'); } catch (error) { EH.Logger.warn('QR original em canvas não pôde ser lido:', error); }
            }

            const image = element?.tagName === 'IMG' ? element : element?.querySelector?.('img');
            const source = direct || String(image?.getAttribute?.('src') || image?.src || '').trim();
            if (source.startsWith('data:image/')) return source;
            if (source) {
                try {
                    const response = await fetch(source);
                    if (response.ok) return await EH.Clipboard.blobToDataUrl(await response.blob());
                } catch (error) {
                    EH.Logger.warn('Não foi possível obter o QR original da plataforma:', error);
                }
            }

            return this.getQrDataUrl(pix);
        },

        generateQrCanvas(pix = this.parsePix()) {
            const payload = this.payload(pix);
            if (!payload) throw new Error('Código PIX não encontrado.');
            const validation = pix?.validation || this.validatePix(payload);
            if (!validation.valid) throw new Error(`PIX inválido: ${validation.reason || 'falha de validação'}`);
            return EH.LocalQR.createCanvas(payload, 440);
        },

        getQrDataUrl(pix = this.parsePix()) {
            const canvas = this.generateQrCanvas(pix);
            return canvas.toDataURL('image/png');
        },

        async copyQrCode(pix = this.parsePix()) {
            try {
                const canvas = this.generateQrCanvas(pix);
                const blob = await EH.Clipboard.canvasToBlob(canvas);
                const result = await EH.Clipboard.copyImageAnyContext(blob);
                if (!result?.copied) {
                    EH.Toast.warning(`QR Code gerado, mas o navegador bloqueou a cópia da imagem. ${result?.reason || ''}`.trim());
                    return false;
                }
                EH.Toast.success('✅ QR Code copiado');
                return true;
            } catch (error) {
                EH.Logger.warn('Falha ao copiar QR Code:', error);
                EH.Toast.error(`❌ Não foi possível copiar o QR Code. ${error.message || ''}`.trim());
                return false;
            }
        },

        downloadPixTxt(pix = this.parsePix()) {
            const payload = this.payload(pix);
            if (!payload) return EH.Toast.warning('⚠️ Código PIX não encontrado.');
            const validation = pix?.validation || this.validatePix(payload);
            if (!validation.valid) return EH.Toast.warning(`⚠️ O código PIX parece incompleto ou inválido. ${validation.reason || ''}`.trim());
            const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'PIX-COPIA-E-COLA.txt';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1200);
            EH.Toast.success('✅ Arquivo PIX criado');
        },

        findGeneratePixButton() {
            return Array.from(document.querySelectorAll('button, .click-cartao, span.badge')).find(el => /GERAR\s+QR\s*CODE/i.test(EH.Utils.normalize(el.textContent)));
        },

        async clientConfirmed() {
            const trigger = this.findGeneratePixButton();
            if (!trigger) {
                EH.Toast.warning('Não encontrei “Gerar QR Code”. Escolha PIX como forma de pagamento e tente novamente.');
                return;
            }
            EH.Workflow.setStage('pix');
            trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            EH.Toast.info('Gerando PIX…');
            const pix = await EH.Utils.waitFor(() => this.parsePix(), 12000, 250);
            if (!pix) EH.Toast.warning('⚠️ Código PIX não encontrado.');
            else await this.handlePixReady(pix, true);
        },

        async handlePixReady(pix = this.parsePix(), force = false) {
            const payload = this.payload(pix);
            if (!payload) return;
            if (!force && payload === this.lastPixCode) return;
            this.lastPixCode = payload;
            this.lastPixPackage = pix;
            EH.Workflow.setStage('pix');

            const validation = pix.validation || this.validatePix(payload);
            const saved = { ...pix, pixOriginal: payload, code: payload, validation, savedAt: new Date().toISOString() };
            EH.Storage.set('lastPixPackage', saved);

            if (!validation.valid) {
                EH.Toast.error(`🔴 PIX aparentemente incompleto ou inválido. ${validation.reason || ''}`.trim());
                EH.UI?.renderAutomation?.('pagamento');
                return;
            }

            const copied = await this.copyPixCode(pix, true);
            if (pix.dynamic) {
                EH.Toast.warning('⚠️ PIX dinâmico detectado. Modo WhatsApp com código isolado ativado.');
                setTimeout(() => EH.Toast.success(copied ? '✅ PIX válido e código copiado' : '🟢 PIX válido'), 500);
            } else {
                EH.Toast.success(copied ? '✅ PIX válido. Código PIX copiado' : '🟢 PIX válido');
            }
            EH.UI?.renderAutomation?.('pagamento');
        },

        openQr(pix = this.parsePix()) {
            try {
                const url = this.getQrDataUrl(pix);
                const win = window.open(url, '_blank');
                if (!win) EH.Toast.warning('O navegador bloqueou a abertura do QR Code.');
            } catch (error) {
                EH.Toast.error(`Não foi possível gerar o QR Code. ${error.message || ''}`.trim());
            }
        }
    };

    // ============================================================
    // PAINEL OPERACIONAL DOS CARROS — v5.55
    // Regra operacional principal: CÓDIGO NUMÉRICO FINAL DA AGÊNCIA.
    // 287 é a chave: origem 287 = embarque; destino 287 = desembarque; resumo 287 = números oficiais.
    // Cidade/UF são somente descritivos. Não soma cidades, não recompõe saldo e não altera o E-Pass.
    // ============================================================
    // ============================================================
    // LEMBRETES DE IMPRESSÃO / EMBARQUE — v5.56
    // Persistentes, deduplicados por bilhete/localizador quando disponível.
    // ============================================================

    // ============================================================
    // SINCRONIZAÇÃO REAL DE LEMBRETES — SUPABASE (opcional) v5.57
    // - Desativada por padrão.
    // - Nunca usa service_role/secret no navegador.
    // - O Helper continua localmente se a rede cair.
    // - Merge é por registro + updatedAt; não substitui o banco inteiro.
    // ============================================================
    EH.Sync = {
        AUTH_KEY: 'sync.supabase.auth.v1',
        STATUS_KEY: 'sync.status.v2',
        PENDING_KEY: 'sync.pendingRecords.v1',
        TABLE: 'epass_reminders', // tabela já criada nas versões anteriores; agora funciona como envelope genérico.
        timer: null,
        busy: false,
        applyingRemote: false,
        lastStatus: { state: 'local', pending: 0, message: 'Somente local' },
        lastRemoteReceivedAt: 0,
        lastServerConfirmedAt: 0,
        failCount: 0,

        config() {
            return {
                enabled: Boolean(EH.Config.SYNC_ENABLED), provider: String(EH.Config.SYNC_PROVIDER || 'none'),
                url: String(EH.Config.SYNC_SUPABASE_URL || '').replace(/\/+$/, ''), key: String(EH.Config.SYNC_SUPABASE_KEY || '').trim(),
                email: String(EH.Config.SYNC_SUPABASE_EMAIL || '').trim(), reminders:Boolean(EH.Config.SYNC_REMINDERS),
                requisitions:Boolean(EH.Config.SYNC_REQUISITIONS), emission:Boolean(EH.Config.SYNC_EMISSION_DATA), settings:Boolean(EH.Config.SYNC_SETTINGS)
            };
        },
        safeKey(key) {
            const raw=String(key||'').trim(); if(!raw)return'';
            if(raw.startsWith('sb_secret_'))throw new Error('Não use uma chave secret do Supabase no UserScript.');
            if(raw.split('.').length===3){try{const segment=raw.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const payload=JSON.parse(atob(segment+'='.repeat((4-segment.length%4)%4)));if(String(payload?.role||'').toLowerCase()==='service_role')throw new Error('Não use service_role no navegador. Use apenas a publishable/anon key com RLS.');}catch(error){if(String(error?.message||'').includes('service_role'))throw error;}}
            return raw;
        },
        normalizeUrl(url){const value=String(url||'').trim().replace(/\/+$/,'');if(!value)return'';if(!/^https:\/\/[a-z0-9.-]+/i.test(value))throw new Error('Use a URL HTTPS do projeto Supabase.');return value;},
        auth(){const auth=EH.Storage.get(this.AUTH_KEY,null);return auth&&typeof auth==='object'?auth:null;},
        setStatus(state,message='',pending=null){const status={state,message,pending:pending===null?this.pendingCount():Number(pending||0),at:Date.now()};this.lastStatus=status;EH.Storage.set(this.STATUS_KEY,status);EH.Reminders?.render?.();return status;},
        status(){return this.lastStatus?.at?this.lastStatus:(EH.Storage.get(this.STATUS_KEY,null)||this.lastStatus);},
        configured(){const cfg=this.config();return cfg.enabled&&cfg.provider==='supabase'&&Boolean(cfg.url&&cfg.key);},
        pendingIds(){const rows=EH.Storage.get(this.PENDING_KEY,[]);return Array.isArray(rows)?rows:[];},
        pendingCount(){return this.pendingIds().length;},
        shouldSyncType(type){
            const cfg=this.config(),kind=String(type||'');
            if(!cfg.enabled||cfg.provider!=='supabase')return false;
            if(kind==='reminder')return cfg.reminders;
            if(kind==='requisition')return cfg.requisitions;
            if(kind==='passenger'||kind==='emission')return cfg.emission;
            if(kind==='config')return cfg.settings;
            return false;
        },
        recordKey(type,id){
            const kind=String(type||'record'),safeId=String(id||'');
            // Compatibilidade com a v5.57-v5.59: lembretes já existentes no Supabase usam o ID original.
            return kind==='reminder' ? safeId : `${kind}:${safeId}`;
        },
        markPendingRecord(type,id){if(this.applyingRemote||!id||!this.shouldSyncType(type))return;const key=this.recordKey(type,id);const set=new Set(this.pendingIds());set.add(key);EH.Storage.set(this.PENDING_KEY,Array.from(set).slice(-3000));this.lastStatus={...(this.status()||{}),pending:set.size};},
        clearPending(keys=[]){const remove=new Set(keys);EH.Storage.set(this.PENDING_KEY,this.pendingIds().filter(key=>!remove.has(key)));},

        async request(path,options={}, {auth=true}={}){
            const cfg=this.config(),url=this.normalizeUrl(cfg.url),key=this.safeKey(cfg.key);if(!url||!key)throw new Error('Sincronização Supabase ainda não configurada.');
            const headers={'Content-Type':'application/json',apikey:key,...(options.headers||{})};if(auth){const token=await this.ensureToken();if(!token)throw new Error('Entre na conta de sincronização primeiro.');headers.Authorization=`Bearer ${token}`;}
            const target=`${url}${path}`,method=String(options.method||'GET').toUpperCase(),body=options.body??null;let status=0,raw='';
            if(typeof GM_xmlhttpRequest==='function'){const response=await new Promise((resolve,reject)=>GM_xmlhttpRequest({method,url:target,headers,data:body,timeout:15000,onload:resolve,onerror:error=>{const detail=String(error?.error||error?.message||'').trim();reject(new Error(`Falha de rede ao acessar o Supabase${detail?`: ${detail}`:''}. Verifique a permissão @connect, a URL do projeto e sua conexão.`));},ontimeout:()=>reject(new Error('Tempo esgotado ao acessar o Supabase.'))}));status=Number(response?.status||0);raw=String(response?.responseText||'');}
            else{const response=await fetch(target,{method,headers,body});status=response.status;raw=await response.text();}
            let data=null;if(raw){try{data=JSON.parse(raw);}catch(_error){data=raw;}}if(status<200||status>=300){const message=data?.msg||data?.message||data?.error_description||data?.error||`HTTP ${status}`;throw new Error(String(message));}return data;
        },
        async login(email,password){const cfg=this.config(),normalizedEmail=String(email||cfg.email||'').trim(),pwd=String(password||'');if(!normalizedEmail||!pwd)throw new Error('Informe e-mail e senha da conta de sincronização.');const data=await this.request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:normalizedEmail,password:pwd})},{auth:false});EH.Storage.set(this.AUTH_KEY,{accessToken:data?.access_token||'',refreshToken:data?.refresh_token||'',expiresAt:Date.now()+Math.max(60,Number(data?.expires_in||3600))*1000,userId:data?.user?.id||'',email:data?.user?.email||normalizedEmail});EH.Config.SYNC_SUPABASE_EMAIL=normalizedEmail;EH.Storage.set('syncSupabaseEmail',normalizedEmail);this.setStatus('connected','Conta conectada.');await this.syncAll({quiet:true});return data;},
        logout(){EH.Storage.remove(this.AUTH_KEY);this.setStatus(this.configured()?'auth-required':'local',this.configured()?'Entre para sincronizar.':'Somente local');},
        async ensureToken(){const auth=this.auth();if(!auth?.accessToken)return'';if(Number(auth.expiresAt||0)>Date.now()+60000)return String(auth.accessToken);if(!auth.refreshToken)return'';try{const data=await this.request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:auth.refreshToken})},{auth:false});const next={...auth,accessToken:data?.access_token||'',refreshToken:data?.refresh_token||auth.refreshToken,expiresAt:Date.now()+Math.max(60,Number(data?.expires_in||3600))*1000,userId:data?.user?.id||auth.userId||'',email:data?.user?.email||auth.email||''};EH.Storage.set(this.AUTH_KEY,next);return next.accessToken;}catch(_error){this.logout();return'';}},

        usefulText(incoming,current=''){const next=EH.Utils.clean(incoming||''),old=EH.Utils.clean(current||'');if(!next)return old;if(/[*Xx•]{2,}/.test(next)&&old&&!/[*Xx•]{2,}/.test(old))return old;return next.length>=old.length?next:old;},
        smartMerge(oldData={},newData={}){
            if(Array.isArray(oldData)||Array.isArray(newData))return Array.isArray(newData)&&newData.length?newData:(Array.isArray(oldData)?oldData:[]);
            if(!oldData||typeof oldData!=='object'||!newData||typeof newData!=='object')return newData??oldData;
            const result={...oldData};Object.entries(newData).forEach(([key,value])=>{const old=result[key];if(typeof value==='string'){result[key]=this.usefulText(value,typeof old==='string'?old:'');}else if(Array.isArray(value)){result[key]=value.length?value:(Array.isArray(old)?old:[]);}else if(value&&typeof value==='object'){result[key]=this.smartMerge(old&&typeof old==='object'?old:{},value);}else if(value!==undefined&&value!==null){result[key]=value;}});return result;
        },
        statusRank(status) {
            const value=String(status||'').toLowerCase();
            return value==='pending'?0:value==='checked'?1:value==='printed'?2:(value==='completed'||value==='concluded')?3:0;
        },
        requestStatusRank(status) {
            const value=String(status||'').toLowerCase();
            return value==='pending'?0:(value==='analyzed'||value==='analysed')?1:value==='approved'?2:0;
        },
        mergeReminderData(localData={},remoteData={},localTs=0,remoteTs=0) {
            const remoteNewer=Number(remoteTs||0)>=Number(localTs||0);
            const merged=remoteNewer?this.smartMerge(localData,remoteData):this.smartMerge(remoteData,localData);
            const localStatus=String(localData?.status||'pending').toLowerCase(), remoteStatus=String(remoteData?.status||'pending').toLowerCase();
            merged.status=this.statusRank(remoteStatus)>this.statusRank(localStatus)?remoteStatus:localStatus;
            merged.completedAt=Math.max(Number(localData?.completedAt||0),Number(remoteData?.completedAt||0));
            merged.createdAt=Math.min(Number(localData?.createdAt||Date.now()),Number(remoteData?.createdAt||Date.now()));
            merged.updatedAt=Math.max(Number(localTs||localData?.updatedAt||0),Number(remoteTs||remoteData?.updatedAt||0));
            return merged;
        },
        legKey(leg={}) {
            const tipo=String(leg.tipo||'ida').toLowerCase();
            const market=EH.Utils.normalize(leg.mercadoCompleto||'');
            const route=`${EH.Utils.normalize(leg.origem||'')}→${EH.Utils.normalize(leg.destino||'')}`;
            return `${tipo}|${market||route}`;
        },
        mergeLeg(localLeg={},remoteLeg={}) {
            const l=EH.RequisitionManager?.normalizeLeg?.(localLeg)||localLeg, r=EH.RequisitionManager?.normalizeLeg?.(remoteLeg)||remoteLeg;
            const remoteNewer=Number(r.updatedAt||0)>=Number(l.updatedAt||0);
            const preferred=remoteNewer?r:l, secondary=remoteNewer?l:r;
            return {
                ...secondary,...preferred,
                tipo: preferred.tipo||secondary.tipo||'ida',
                mercadoCompleto:this.usefulText(preferred.mercadoCompleto,secondary.mercadoCompleto),
                origem:this.usefulText(preferred.origem,secondary.origem),
                destino:this.usefulText(preferred.destino,secondary.destino),
                codigo:this.usefulText(preferred.codigo,secondary.codigo),
                updatedAt:Math.max(Number(l.updatedAt||0),Number(r.updatedAt||0))
            };
        },
        mergeRequestPassenger(localPassenger={},remotePassenger={}) {
            const l=EH.RequisitionManager?.normalizePassenger?.(localPassenger)||localPassenger, r=EH.RequisitionManager?.normalizePassenger?.(remotePassenger)||remotePassenger;
            const legs=new Map();
            (l.legs||[]).forEach(leg=>legs.set(this.legKey(leg),leg));
            (r.legs||[]).forEach(leg=>{const key=this.legKey(leg);legs.set(key,legs.has(key)?this.mergeLeg(legs.get(key),leg):leg);});
            return {
                ...l,...r,
                cpf:String(r.cpf||l.cpf||'').replace(/\D/g,'').slice(0,11),
                nome:this.usefulText(r.nome,l.nome),
                dataNascimento:this.usefulText(r.dataNascimento,l.dataNascimento),
                legs:Array.from(legs.values())
            };
        },
        mergeRequisitionData(localData={},remoteData={},localTs=0,remoteTs=0) {
            const remoteNewer=Number(remoteTs||0)>=Number(localTs||0);
            const preferred=remoteNewer?remoteData:localData, secondary=remoteNewer?localData:remoteData;
            const merged=this.smartMerge(secondary,preferred);
            const passengers=new Map();
            (localData.passengers||[]).forEach(p=>{const cpf=String(p?.cpf||'').replace(/\D/g,'').slice(0,11);if(cpf)passengers.set(cpf,p);});
            (remoteData.passengers||[]).forEach(p=>{const cpf=String(p?.cpf||'').replace(/\D/g,'').slice(0,11);if(!cpf)return;passengers.set(cpf,passengers.has(cpf)?this.mergeRequestPassenger(passengers.get(cpf),p):p);});
            merged.passengers=Array.from(passengers.values());
            const lStatus=String(localData.status||'pending'),rStatus=String(remoteData.status||'pending');
            merged.status=this.requestStatusRank(rStatus)>this.requestStatusRank(lStatus)?rStatus:lStatus;
            merged.numeroLogico=this.usefulText(preferred.numeroLogico,secondary.numeroLogico);
            merged.createdAt=Math.min(Number(localData.createdAt||Date.now()),Number(remoteData.createdAt||Date.now()));
            merged.updatedAt=Math.max(Number(localTs||localData.updatedAt||0),Number(remoteTs||remoteData.updatedAt||0));
            merged.deviceId=remoteNewer?(remoteData.deviceId||localData.deviceId||EH.Device.id()):(localData.deviceId||remoteData.deviceId||EH.Device.id());
            return merged;
        },
        mergeRecordData(type,localData={},remoteData={},localTs=0,remoteTs=0) {
            if(type==='reminder')return this.mergeReminderData(localData,remoteData,localTs,remoteTs);
            if(type==='requisition')return this.mergeRequisitionData(localData,remoteData,localTs,remoteTs);
            if(type==='emission'){
                if(EH.EmissionMemory?.merge)return EH.EmissionMemory.merge({...localData,updatedAt:localTs},{...remoteData,updatedAt:remoteTs});
            }
            const remoteNewer=Number(remoteTs||0)>=Number(localTs||0);
            const merged=remoteNewer?this.smartMerge(localData,remoteData):this.smartMerge(remoteData,localData);
            merged.updatedAt=Math.max(Number(localTs||localData?.updatedAt||0),Number(remoteTs||remoteData?.updatedAt||0));
            return merged;
        },
        syncPayload(data={}){
            if(!data||typeof data!=='object'||Array.isArray(data))return data;
            const {syncState:_syncState,...payload}=data;
            return payload;
        },
        sameData(a,b){try{return JSON.stringify(this.syncPayload(a)||{})===JSON.stringify(this.syncPayload(b)||{});}catch(_error){return false;}},
        envelope(type,id,data,updatedAt=0){const safeId=String(id||'');const ts=Number(updatedAt||data?.updatedAt||data?.createdAt||Date.now());return{id:this.recordKey(type,safeId),recordType:type,recordId:safeId,data,updatedAt:ts,deviceId:String(data?.deviceId||EH.Device.id())};},
        normalizeRemote(row={}){const p=row?.payload||{};if(p?.recordType&&p?.recordId)return this.envelope(p.recordType,p.recordId,p.data||{},p.updatedAt||Date.parse(row.updated_at)||0);const legacyId=String(p.id||row.id||'');return this.envelope('reminder',legacyId,p,Number(p.updatedAt||Date.parse(row.updated_at)||0));},
        collectLocalRecords(){
            const cfg=this.config(),rows=[];
            if(cfg.reminders)(EH.Reminders?.load?.()||[]).forEach(item=>rows.push(this.envelope('reminder',item.id,EH.SyncLegacyReminder?.sanitize?.(item)||item,item.updatedAt||item.createdAt)));
            if(cfg.requisitions)(EH.RequisitionManager?.loadStore?.()||[]).forEach(item=>rows.push(this.envelope('requisition',item.id,item,item.updatedAt||item.createdAt)));
            if(cfg.emission){
                (EH.PassengerMemory?.load?.()||[]).forEach(item=>rows.push(this.envelope('passenger',item.id||`cpf:${item.cpf}`,item,item.updatedAt||item.createdAt)));
                (EH.EmissionMemory?.load?.()||[]).forEach(item=>rows.push(this.envelope('emission',item.id,this.syncPayload(item),item.updatedAt||item.createdAt)));
            }
            if(cfg.settings){const fees=EH.BoardingFeeManager?.load?.()||[];const feeUpdated=Number(EH.Storage.get('boardingFees.updatedAt',1))||1;const opUpdated=Number(EH.Storage.get('operationConfig.updatedAt',1))||1;rows.push(this.envelope('config','boarding-fees',{fees,updatedAt:feeUpdated},feeUpdated));rows.push(this.envelope('config','operation',{agencyCode:EH.Config.OPERATION_AGENCY_CODE,routines:EH.Config.OPERATION_ROUTINES,tolerance:EH.Config.OPERATION_TIME_TOLERANCE_MINUTES,updatedAt:opUpdated},opUpdated));}
            return rows.filter(row=>row.recordId);
        },
        applyEnvelope(env){
            if(!env?.recordType||!env?.recordId)return;
            this.applyingRemote=true;
            try{
                if(env.recordType==='reminder'){
                    const local=EH.Reminders?.load?.()||[],idx=local.findIndex(x=>String(x.id)===env.recordId),current=idx>=0?local[idx]:{};
                    const merged=this.mergeReminderData(current,env.data||{},Number(current.updatedAt||0),Number(env.updatedAt||0));
                    merged.id=env.recordId;merged.syncState='synced';
                    if(idx>=0)local[idx]=merged;else local.push(merged);
                    EH.Storage.set(EH.Reminders.KEY,local.slice(-1000));
                } else if(env.recordType==='requisition'){
                    const rows=EH.RequisitionManager?.loadStore?.()||[],idx=rows.findIndex(x=>String(x.id)===env.recordId),current=idx>=0?rows[idx]:{};
                    const merged=this.mergeRequisitionData(current,env.data||{},Number(current.updatedAt||0),Number(env.updatedAt||0));
                    merged.id=env.recordId;
                    if(idx>=0)rows[idx]=merged;else rows.push(merged);
                    EH.RequisitionManager?.saveStore?.(rows);
                } else if(env.recordType==='passenger'){
                    EH.PassengerMemory?.applyRemote?.({...env.data,id:env.recordId,updatedAt:env.updatedAt});
                } else if(env.recordType==='emission'){
                    EH.EmissionMemory?.applyRemote?.({...env.data,id:env.recordId,updatedAt:env.updatedAt});
                } else if(env.recordType==='config'&&this.config().settings){
                    if(env.recordId==='boarding-fees'&&Array.isArray(env.data?.fees))EH.BoardingFeeManager?.save?.(env.data.fees,{fromSync:true});
                    if(env.recordId==='operation'){
                        if(env.data?.agencyCode)EH.Config.OPERATION_AGENCY_CODE=String(env.data.agencyCode).replace(/\D/g,'')||EH.Config.OPERATION_AGENCY_CODE;
                        if(Array.isArray(env.data?.routines)&&env.data.routines.length)EH.Config.OPERATION_ROUTINES=env.data.routines;
                        if(Number.isFinite(Number(env.data?.tolerance)))EH.Config.OPERATION_TIME_TOLERANCE_MINUTES=Number(env.data.tolerance);
                        EH.Storage.set('operationAgencyCode',EH.Config.OPERATION_AGENCY_CODE);
                        EH.Storage.set('operationRoutines',EH.Config.OPERATION_ROUTINES);
                        EH.Storage.set('operationTimeToleranceMinutes',EH.Config.OPERATION_TIME_TOLERANCE_MINUTES);
                    }
                }
            } finally { this.applyingRemote=false; }
        },
        async syncAll({quiet=false}={}){
            if(this.busy)return this.status();
            if(!this.configured())return this.setStatus('local','Sincronização entre computadores não configurada.');
            const auth=this.auth();
            if(!auth?.userId||!(await this.ensureToken()))return this.setStatus('auth-required','Entre na conta Supabase para sincronizar.');
            this.busy=true;this.setStatus('syncing','Sincronizando…');
            try{
                const userId=this.auth()?.userId;
                // REGRA CRÍTICA: sempre PULL antes de qualquer PUSH. Um PC vazio nunca
                // envia "vazio" como substituição do remoto; esta sincronização é por registro.
                const remoteRows=await this.request(`/rest/v1/${this.TABLE}?select=id,payload,updated_at,device_id&order=updated_at.asc`,{method:'GET',headers:{Accept:'application/json'}});
                const remoteMap=new Map((Array.isArray(remoteRows)?remoteRows:[]).map(row=>{const env=this.normalizeRemote(row);return[env.id,env];}));
                this.lastRemoteReceivedAt=Date.now();
                EH.Storage.set('sync.lastRemoteReceivedAt',this.lastRemoteReceivedAt);

                const before=this.collectLocalRecords(),localMap=new Map(before.map(local=>[local.id,local]));
                let received=0;
                remoteMap.forEach(remote=>{
                    const local=localMap.get(remote.id);
                    if(!local){this.applyEnvelope(remote);received+=1;return;}
                    const mergedData=this.mergeRecordData(remote.recordType,local.data||{},remote.data||{},local.updatedAt,remote.updatedAt);
                    if(!this.sameData(local.data,mergedData)||Number(remote.updatedAt||0)>Number(local.updatedAt||0)){
                        this.applyEnvelope({...remote,data:mergedData,updatedAt:Math.max(Number(local.updatedAt||0),Number(remote.updatedAt||0))});
                        received+=1;
                    }
                });

                // Somente DEPOIS do pull/merge calculamos alterações locais a enviar.
                const localAfter=this.collectLocalRecords(),push=[];
                localAfter.forEach(local=>{
                    const remote=remoteMap.get(local.id);
                    const needsPush=!remote||Number(local.updatedAt||0)>Number(remote.updatedAt||0)||!this.sameData(local.data,remote.data);
                    if(needsPush){
                        push.push({
                            user_id:userId,
                            id:local.recordType==='reminder'?local.recordId:local.id,
                            payload:{recordType:local.recordType,recordId:local.recordId,data:local.data,updatedAt:local.updatedAt,deviceId:local.deviceId},
                            updated_at:new Date(local.updatedAt||Date.now()).toISOString(),
                            device_id:local.deviceId
                        });
                    }
                });
                if(push.length)await this.request(`/rest/v1/${this.TABLE}?on_conflict=user_id,id`,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(push)});

                // Não declare "Sincronizado" só porque POST respondeu. Faz uma leitura de
                // confirmação e só remove da fila aquilo que realmente existe no servidor.
                const verifyRows=await this.request(`/rest/v1/${this.TABLE}?select=id,payload,updated_at,device_id&order=updated_at.asc`,{method:'GET',headers:{Accept:'application/json'}});
                const verifyMap=new Map((Array.isArray(verifyRows)?verifyRows:[]).map(row=>{const env=this.normalizeRemote(row);return[env.id,env];}));
                const confirmed=[];
                this.collectLocalRecords().forEach(local=>{
                    const remote=verifyMap.get(local.id);
                    if(!remote)return;
                    const merged=this.mergeRecordData(local.recordType,local.data||{},remote.data||{},local.updatedAt,remote.updatedAt);
                    const serverHasLocal=Number(remote.updatedAt||0)>=Number(local.updatedAt||0)&&this.sameData(merged,remote.data||{});
                    if(serverHasLocal){confirmed.push(local.id);this.applyEnvelope(remote);}
                });
                this.clearPending(confirmed);
                this.lastServerConfirmedAt=Date.now();
                EH.Storage.set('sync.lastServerConfirmedAt',this.lastServerConfirmedAt);
                this.failCount=0;

                // Dados recebidos precisam reconstruir a interface imediatamente.
                const page=EH.Pages?.detect?.()||'desconhecida';
                EH.Reminders?.render?.();
                EH.OperationCars?.render?.();
                EH.TicketVerificationQueue?.render?.();
                EH.UI?.renderAutomation?.(page);
                EH.UI?.renderSaleSummary?.(page);

                const pending=this.pendingCount();
                const message=pending
                    ? `Servidor confirmado • ${pending} alteração(ões) ainda pendente(s)`
                    : `Sincronizado • ${received} recebido(s) • ${push.length} enviado(s)`;
                const status=this.setStatus(pending?'pending':'synced',message,pending);
                if(!quiet){
                    if(pending)EH.Toast?.warning?.(message);
                    else EH.Toast?.success?.('Dados operacionais confirmados no servidor e reconstruídos neste computador.');
                }
                return status;
            }catch(error){
                this.failCount=Math.min(8,Number(this.failCount||0)+1);
                const status=this.setStatus(navigator.onLine===false?'offline':'error',navigator.onLine===false?'Sem conexão • dados preservados localmente.':`Falha na sincronização: ${error.message}`);
                if(!quiet)EH.Toast?.warning?.(status.message);
                return status;
            }finally{this.busy=false;}
        },
        syncReminders(options={}){return this.syncAll(options);},
        start(){if(this.timer)clearInterval(this.timer);const cfg=this.config();if(!cfg.enabled||cfg.provider!=='supabase'){this.setStatus('local','Somente local');return;}this.setStatus(this.auth()?.accessToken?'connected':'auth-required',this.auth()?.accessToken?'Conta conectada.':'Entre para sincronizar.');EH.Runtime.timeout('sync-first-run',()=>this.syncAll({quiet:true}),2500);this.timer=setInterval(()=>this.syncAll({quiet:true}),Math.max(30000,Number(EH.Config.SYNC_INTERVAL_MS||60000)));EH.Runtime?.on?.('sync-online',window,'online',()=>this.syncAll({quiet:true}),{passive:true});}
    };

    // Sanitização compatível com lembretes antigos.
    EH.SyncLegacyReminder = {
        sanitize(item={}){const createdAt=Number(item.createdAt||Date.now()),updatedAt=Number(item.updatedAt||item.completedAt||createdAt),{syncState:_syncState,...rest}=item;return{...rest,id:String(item.id||''),name:EH.Utils.clean(item.name||''),cpf:String(item.cpf||'').replace(/\D/g,'').slice(0,11),origin:EH.Utils.clean(item.origin||''),destination:EH.Utils.clean(item.destination||''),service:String(item.service||'').replace(/\D/g,''),seat:EH.Utils.clean(item.seat||''),ticketNumber:EH.Utils.clean(item.ticketNumber||''),status:['pending','printed','checked','completed'].includes(String(item.status||'').toLowerCase())?String(item.status).toLowerCase():'pending',createdAt,updatedAt,completedAt:Number(item.completedAt||0),deviceId:String(item.deviceId||EH.Device.id())};}
    };

    EH.Reminders = {
        KEY: 'ticketReminders.v1',
        PENDING_SEARCH_KEY: 'ticketReminders.pendingSearch.v1',
        searchBusy: false,
        stylesInjected: false,

        normalizeCpf(value) { return String(value || '').replace(/\D/g, '').slice(0, 11); },
        load() {
            const items = EH.Storage.get(this.KEY, []);
            return Array.isArray(items) ? items : [];
        },
        save(items) {
            const safe = (Array.isArray(items) ? items : []).slice(-1000);
            EH.Storage.set(this.KEY, safe);
            safe.forEach(item => {
                if (item?.cpf) EH.PassengerMemory?.upsert?.({ cpf:item.cpf, name:item.name, updatedAt:item.updatedAt || item.createdAt || Date.now() });
                if (!EH.Sync?.applyingRemote && item?.id) EH.Sync?.markPendingRecord?.('reminder', item.id);
            });
            this.render();
            return safe;
        },
        parseTravel(raw) {
            const text = EH.Utils.clean(raw || '');
            const m = text.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?)?/);
            if (!m) return { raw:text, key:'', timestamp:0, dateBr:'', time:'' };
            const day=Number(m[1]), month=Number(m[2])-1, year=Number(m[3]);
            const hour=Number(m[4] || 12), minute=Number(m[5] || 0);
            const date = new Date(year, month, day, hour, minute, 0, 0);
            return {
                raw:text,
                key:`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
                timestamp:date.getTime(),
                dateBr:`${String(day).padStart(2,'0')}/${String(month+1).padStart(2,'0')}/${year}`,
                time:m[4] ? `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}` : ''
            };
        },
        keyFor(item, ticket, cpf) {
            const number = EH.Utils.clean(ticket?.number || '');
            if (number) return `ticket:${number}`;
            const date = EH.Utils.clean(ticket?.date || '');
            const origin = EH.Utils.normalize(ticket?.origin || '');
            const destination = EH.Utils.normalize(ticket?.destination || '');
            return `route:${cpf}|${date}|${origin}|${destination}`;
        },
        candidateItems(items=[]) {
            const result=[];
            (Array.isArray(items)?items:[]).forEach(item => {
                const cpf=this.normalizeCpf(item?.cpf || '');
                const passenger = item?.passengerId ? EH.SaleContext?.load?.().find(p=>p.id===item.passengerId) : (cpf ? EH.SaleContext?.findPassengerByCpf?.(cpf) : null);
                const name=EH.Utils.clean(item?.name || passenger?.name || '');
                const tickets=(item?.data?.tickets || item?.tickets || []).filter(Boolean);
                tickets.forEach(ticket => {
                    const travel=this.parseTravel(ticket.date);
                    result.push({
                        id:this.keyFor(item,ticket,cpf), ticketNumber:EH.Utils.clean(ticket.number||''),
                        cpf, name, passengerId:item?.passengerId || passenger?.id || null,
                        origin:EH.Utils.clean(ticket.origin||''), destination:EH.Utils.clean(ticket.destination||''),
                        travelRaw:EH.Utils.clean(ticket.date||''), travelDate:travel.key, travelDateBr:travel.dateBr,
                        travelTime:travel.time, travelTimestamp:travel.timestamp,
                        service:String(item?.service || ticket?.service || '').replace(/\D/g,''),
                        status:'pending', source:'epass-ticket', createdAt:Date.now(), updatedAt:Date.now(), completedAt:0,
                        deviceId:EH.Device.id(), syncState:EH.Sync?.configured?.() ? 'pending' : 'local'
                    });
                });
            });
            return result;
        },
        captureItems(items=[]) {
            EH.EmissionMemory?.captureItems?.(items);
            if (!EH.Config.REMINDER_CREATE_AFTER_TICKET) return 0;
            const candidates=this.candidateItems(items);
            if (!candidates.length) return 0;
            const existing=this.load();
            const ids=new Set(existing.map(x=>String(x.id||'')));
            const fresh=candidates.filter(x=>!ids.has(x.id));
            if (!fresh.length) return 0;
            if (EH.Config.REMINDER_ASK_AFTER_TICKET) {
                const ok=window.confirm(`Criar lembrete de impressão/embarque para ${fresh.length} passagem(ns)?`);
                if (!ok) return 0;
            }
            this.save([...existing,...fresh]);
            EH.Sync?.syncReminders?.({ quiet: true });
            EH.Toast?.success?.(`${fresh.length} lembrete(s) de passagem criado(s).`);
            return fresh.length;
        },
        complete(id) { const item=this.markStatus(id,'printed'); if(item) EH.Toast?.success?.('Lembrete marcado como impresso.'); },
        reopen(id) { this.markStatus(id,'pending'); },
        todayKey(offset=0) {
            const d=new Date(); d.setDate(d.getDate()+offset);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        },
        pending() { return this.load().filter(x=>!this.isDoneStatus(x.status)).sort((a,b)=>(a.travelTimestamp||9e15)-(b.travelTimestamp||9e15)||a.createdAt-b.createdAt); },
        maskCpf(cpf) { return EH.Config.REMINDER_MASK_CPF ? EH.SaleContext.maskCpfPublic(cpf) : EH.SaleContext.maskCpf(cpf); },
        isDoneStatus(status) { return ['printed','checked','completed','concluded'].includes(String(status || '').toLowerCase()); },
        statusRank(status) {
            const value=String(status||'').toLowerCase();
            return value==='pending'?0:value==='checked'?1:value==='printed'?2:(value==='completed'||value==='concluded')?3:0;
        },
        markStatus(id, status) {
            const items=this.load(); const item=items.find(x=>x.id===id); if(!item)return null;
            const allowed=['pending','printed','checked','completed'];
            const requested=allowed.includes(String(status||'').toLowerCase())?String(status).toLowerCase():'pending';
            item.status=requested==='pending'?'pending':(this.statusRank(requested)>=this.statusRank(item.status)?requested:String(item.status||'pending').toLowerCase());
            item.completedAt=this.isDoneStatus(item.status)?Date.now():0; item.updatedAt=Date.now(); item.deviceId=EH.Device.id(); item.syncState=EH.Sync?.configured?.()?'pending':'local';
            this.save(items); EH.Sync?.syncAll?.({quiet:true}); return item;
        },
        async copyCpf(item) {
            const cpf=this.normalizeCpf(item?.cpf); if(cpf.length!==11) return EH.Toast.warning('CPF não disponível neste lembrete.');
            await EH.Clipboard.copyText(cpf); EH.Toast.success('CPF copiado.');
        },
        searchTicket(item) {
            const cpf=this.normalizeCpf(item?.cpf); if(cpf.length!==11) return EH.Toast.warning('CPF não disponível neste lembrete.');
            EH.Storage.set(this.PENDING_SEARCH_KEY,{ cpf, reminderId:item.id, expiresAt:Date.now()+60000 });
            if (EH.Pages.detect()==='passagens') this.runPendingSearch(); else EH.SaleContext.navigateToPassagens();
        },
        async runPendingSearch() {
            if (this.searchBusy) return;
            const pending=EH.Storage.get(this.PENDING_SEARCH_KEY,null);
            if(!pending?.cpf || Number(pending.expiresAt||0)<Date.now()) { EH.Storage.remove(this.PENDING_SEARCH_KEY); return; }
            const input=EH.Utils.first(EH.Selectors.PASSAGENS_CPF_INPUT); if(!input) return;
            this.searchBusy=true;
            try {
                EH.SaleContext.setNativeValue(input, EH.SaleContext.maskCpf(pending.cpf));
                input.focus(); await EH.Utils.sleep(90); input.blur();
                const button=EH.SaleContext.findSearchButton(input); const form=input.closest('form');
                if(button) button.click(); else if(form?.requestSubmit) form.requestSubmit(); else form?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
                EH.Storage.remove(this.PENDING_SEARCH_KEY);
                EH.Toast.success('CPF preenchido e busca iniciada.');
            } finally { this.searchBusy=false; }
        },
        onPageUpdate(page) { if(page==='passagens') EH.Runtime.timeout('reminder-pending-search',()=>this.runPendingSearch(),350); },
        labelFor(item) {
            const today=this.todayKey(0), tomorrow=this.todayKey(1);
            if(item.travelDate===today) return `HOJE${item.travelTime?` — ${item.travelTime}`:''}`;
            if(item.travelDate===tomorrow) return `AMANHÃ${item.travelTime?` — ${item.travelTime}`:''}`;
            return [item.travelDateBr,item.travelTime].filter(Boolean).join(' — ') || 'DATA NÃO IDENTIFICADA';
        },

        matchPassenger(passenger, record = null) {
            if (!passenger) return null;
            const cpf = this.normalizeCpf(passenger.cpf || '');
            const ticket = EH.Utils.clean(passenger.ticket || '');
            const service = String(record?.service || '').replace(/\D/g, '');
            const date = String(record?.date || '');
            const candidates = this.load().filter(item => {
                if (this.isDoneStatus(item.status) && !ticket && !cpf) return false;
                if (ticket && item.ticketNumber && EH.Utils.clean(item.ticketNumber) === ticket) return true;
                if (cpf && this.normalizeCpf(item.cpf) === cpf) {
                    if (service && item.service && String(item.service) !== service) return false;
                    if (date && item.travelDate && item.travelDate !== date) return false;
                    return true;
                }
                return false;
            });
            if (!candidates.length) return null;
            return candidates.sort((a,b)=>Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0))[0] || null;
        },

        pendingForService(service, date = '') {
            const serviceId = String(service || '').replace(/\D/g, '');
            return this.pending().filter(item => {
                if (serviceId && item.service && String(item.service) !== serviceId) return false;
                if (date && item.travelDate && item.travelDate !== date) return false;
                return true;
            });
        },

        linkMapRecord(record) {
            if (!record?.service || !record?.agency?.exists || record?.agency?.multiple) return 0;
            const passengers=[...(record.agency.boarders||[]),...(record.agency.alighters||[])];
            if(!passengers.length)return 0;
            const items=this.load();
            let changed=0;
            passengers.forEach(passenger=>{
                const cpf=this.normalizeCpf(passenger?.cpf||'');
                const ticket=EH.Utils.clean(passenger?.ticket||'');
                const candidates=items.filter(item=>{
                    if(ticket && item.ticketNumber && EH.Utils.clean(item.ticketNumber)===ticket)return true;
                    if(cpf && this.normalizeCpf(item.cpf)===cpf){
                        if(item.travelDate && record.date && item.travelDate!==record.date)return false;
                        return true;
                    }
                    return false;
                });
                if(candidates.length!==1)return;
                const item=candidates[0];
                const nextService=String(record.service||'').replace(/\D/g,'');
                const nextSeat=EH.Utils.clean(passenger?.seat||'');
                if(String(item.service||'')!==nextService || (nextSeat && EH.Utils.clean(item.seat||'')!==nextSeat)){
                    item.service=nextService;
                    if(nextSeat)item.seat=nextSeat;
                    item.mapFoundAt=Date.now();
                    item.updatedAt=Date.now();
                    item.deviceId=EH.Device.id();
                    item.syncState=EH.Sync?.configured?.()?'pending':'local';
                    changed++;
                }
            });
            if(changed){
                this.save(items);
                EH.Sync?.syncReminders?.({quiet:true});
            }
            return changed;
        },

        openModal() {
            document.querySelector('#eh-reminders-overlay')?.remove();
            const overlay=document.createElement('div'); overlay.className='eh-overlay'; overlay.id='eh-reminders-overlay';
            const modal=document.createElement('div'); modal.className='eh-modal'; modal.style.width='min(760px,96vw)';
            const head=document.createElement('div'); head.className='eh-modal-head';
            const title=document.createElement('div'); title.className='eh-modal-title'; title.textContent='Lembretes de passagens';
            const close=document.createElement('button'); close.type='button'; close.className='eh-modal-close'; close.textContent='✕'; head.append(title,close);
            const content=document.createElement('div'); content.className='eh-modal-content eh-reminder-list';
            const renderList=()=>{
                content.innerHTML=''; const items=this.load().slice().sort((a,b)=>(this.isDoneStatus(a.status)?1:0)-(this.isDoneStatus(b.status)?1:0)||(a.travelTimestamp||9e15)-(b.travelTimestamp||9e15));
                if(!items.length){ const empty=document.createElement('div'); empty.className='eh-reminder-empty'; empty.textContent='Nenhum lembrete salvo.'; content.appendChild(empty); return; }
                items.forEach(item=>{
                    const card=document.createElement('div'); card.className=`eh-reminder-card ${this.isDoneStatus(item.status)?'completed':''}`;
                    const top=document.createElement('div'); top.className='eh-reminder-card-top';
                    const when=document.createElement('strong'); when.textContent=this.labelFor(item);
                    const state=document.createElement('span'); state.textContent=this.isDoneStatus(item.status)?(String(item.status).toLowerCase()==='checked'?'✓ CONFERIDO':'✓ IMPRESSO'):'PENDENTE'; top.append(when,state);
                    const name=document.createElement('b'); name.textContent=item.name || 'Passageiro';
                    const cpf=document.createElement('div'); cpf.className='eh-reminder-cpf'; cpf.textContent=`CPF: ${this.maskCpf(item.cpf)}`;
                    const route=document.createElement('small'); route.textContent=[item.origin,item.destination].filter(Boolean).join(' → ') || 'Trecho não identificado';
                    const id=document.createElement('small'); id.textContent=item.ticketNumber?`Bilhete ${item.ticketNumber}`:'Identificador por CPF + trecho + data';
                    const mapInfo=document.createElement('small'); mapInfo.textContent=[item.service?`Serviço ${item.service}`:'',item.seat?`Poltrona ${item.seat}`:''].filter(Boolean).join(' • '); mapInfo.hidden=!mapInfo.textContent;
                    const requestCodes=EH.RequisitionManager?.codesForCpf?.(item.cpf)||[];
                    const requestInfo=document.createElement('small');
                    requestInfo.textContent=requestCodes.length?`Requisição: ${requestCodes.map(row=>`${String(row.tipo||'ida').toUpperCase()} ${row.codigo}`).join(' • ')}`:'';
                    requestInfo.hidden=!requestInfo.textContent;
                    const actions=document.createElement('div'); actions.className='eh-reminder-actions';
                    const copy=document.createElement('button'); copy.type='button'; copy.className='eh-modal-btn'; copy.textContent='Copiar CPF'; copy.addEventListener('click',()=>this.copyCpf(item));
                    const search=document.createElement('button'); search.type='button'; search.className='eh-modal-btn primary'; search.textContent='Buscar passagem'; search.addEventListener('click',()=>this.searchTicket(item));
                    const done=document.createElement('button'); done.type='button'; done.className='eh-modal-btn'; done.textContent=this.isDoneStatus(item.status)?'Reabrir':'✓ Impresso'; done.addEventListener('click',()=>{ this.isDoneStatus(item.status)?this.reopen(item.id):this.complete(item.id); renderList(); });
                    actions.append(copy,search,done); card.append(top,name,cpf,route,id,mapInfo,requestInfo,actions); content.appendChild(card);
                });
            }; renderList();
            const foot=document.createElement('div'); foot.className='eh-modal-actions'; const close2=document.createElement('button'); close2.type='button'; close2.className='eh-modal-btn'; close2.textContent='Fechar'; foot.appendChild(close2);
            modal.append(head,content,foot); overlay.appendChild(modal); document.body.appendChild(overlay);
            const dismiss=()=>overlay.remove(); close.onclick=dismiss; close2.onclick=dismiss; overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss();});
        },
        render() {
            const host=EH.UI?.reminderBox; if(!host)return;
            const pending=this.pending();
            if(!pending.length){ host.hidden=true; host.innerHTML=''; return; }
            host.hidden=false; host.innerHTML='';
            const today=pending.filter(x=>x.travelDate===this.todayKey(0)); const tomorrow=pending.filter(x=>x.travelDate===this.todayKey(1));
            const title=document.createElement('div'); title.className='eh-reminder-host-title'; title.innerHTML='<span>PENDÊNCIAS</span><strong>Embarques e requisições</strong>';
            const syncStatus=EH.Sync?.status?.() || {state:'local',pending:0};
            const syncLine=document.createElement('small'); syncLine.className=`eh-reminder-sync ${syncStatus.state||'local'}`;
            syncLine.textContent = syncStatus.state==='synced' ? '☁ Sincronizado'
                : syncStatus.state==='syncing' ? '☁ Sincronizando…'
                    : syncStatus.state==='offline' ? `⚠ Sem conexão${syncStatus.pending?` • ${syncStatus.pending} pendente(s)`:''}`
                        : syncStatus.state==='auth-required' ? '☁ Sincronização: entrar na conta'
                            : syncStatus.state==='error' ? `⚠ ${syncStatus.pending||0} alteração(ões) pendente(s)`
                                : 'Somente neste computador';
            const summary=document.createElement('div'); summary.className='eh-reminder-host-summary';
            const todayBtn=document.createElement('button'); todayBtn.type='button'; todayBtn.textContent=`Hoje ${today.length}`;
            const tomorrowBtn=document.createElement('button'); tomorrowBtn.type='button'; tomorrowBtn.textContent=`Amanhã ${tomorrow.length}`;
            const totalBtn=document.createElement('button'); totalBtn.type='button'; totalBtn.textContent=`Impressão ${pending.length}`;
            const reqPending=(EH.RequisitionManager?.loadStore?.()||[]).filter(request=>(request.passengers||[]).some(passenger=>(passenger.legs||[]).some(leg=>!leg.codigo))).length;
            const reqBtn=document.createElement('button'); reqBtn.type='button'; reqBtn.textContent=`Requisições ${reqPending}`; reqBtn.addEventListener('click',()=>EH.Toast.info(reqPending?'Abra a tela de Requisições para concluir os códigos pendentes.':'Nenhuma requisição aguardando código.'));
            [todayBtn,tomorrowBtn,totalBtn].forEach(btn=>btn.addEventListener('click',()=>this.openModal())); summary.append(todayBtn,tomorrowBtn,totalBtn,reqBtn);
            const next=pending[0]; const nextLine=document.createElement('div'); nextLine.className='eh-reminder-next';
            const main=document.createElement('strong'); main.textContent=`${next.travelTime||'—'} • ${next.name||'Passageiro'}`;
            const sub=document.createElement('small'); sub.textContent=`${this.maskCpf(next.cpf)} • ${[next.origin,next.destination].filter(Boolean).join(' → ')}`; nextLine.append(main,sub);
            host.append(title,syncLine,summary,nextLine);
        },
        injectStyles() {
            if(this.stylesInjected)return; this.stylesInjected=true;
            GM_addStyle(`
                #eh-root .eh-reminder-host{display:grid;gap:6px;margin:7px 0;padding:8px;border:1px solid #e1d7bd;border-radius:9px;background:#fffaf0;color:#303946}
                #eh-root .eh-reminder-host[hidden]{display:none!important}.eh-reminder-host-title{display:grid;gap:1px}.eh-reminder-host-title span{font-size:7px;font-weight:950;letter-spacing:.5px;color:#92703a}.eh-reminder-host-title strong{font-size:10px;color:#334155}
                .eh-reminder-sync{font-size:7.4px;color:#7a6c54}.eh-reminder-sync.synced{color:#2f7a5f}.eh-reminder-sync.offline,.eh-reminder-sync.error{color:#a36535}.eh-reminder-host-summary{display:grid;grid-template-columns:repeat(2,1fr);gap:4px}.eh-reminder-host-summary button{min-height:27px;border:1px solid #e4d7ba;border-radius:7px;background:#fff;color:#6b5734;font-size:8px;font-weight:850;cursor:pointer}.eh-reminder-next{display:grid;gap:2px;padding-top:5px;border-top:1px solid #eee2c9}.eh-reminder-next strong{font-size:9px}.eh-reminder-next small{font-size:7.8px;color:#746956;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
                .eh-reminder-list{display:grid;gap:8px}.eh-reminder-card{display:grid;gap:5px;padding:11px;border:1px solid #dfe5eb;border-radius:10px;background:#fff}.eh-reminder-card.completed{opacity:.68;background:#f7f9fa}.eh-reminder-card-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.eh-reminder-card-top strong{font-size:12px;color:#253348}.eh-reminder-card-top span{font-size:8px;font-weight:900;color:#697687}.eh-reminder-card>b{font-size:12px}.eh-reminder-cpf{font-size:11px;font-weight:800;color:#334155}.eh-reminder-card small{font-size:10px;color:#6d7888}.eh-reminder-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:3px}.eh-reminder-empty{padding:25px;text-align:center;color:#718092}
            `);
        },
        init(){ this.injectStyles(); this.render(); }
    };



    // ============================================================
    // MEMÓRIA DE EMISSÕES — v5.60
    // Guarda somente dados operacionais úteis da passagem; nunca imagens/documentos.
    // ============================================================
    EH.EmissionMemory = {
        KEY: 'emissionMemory.v1',
        MIGRATION_KEY: 'emissionMemory.migrated.v561',
        searchBusy: false,
        load() {
            const rows = EH.Storage.get(this.KEY, []);
            return Array.isArray(rows) ? rows : [];
        },
        normalizeCpf(value) { return String(value || '').replace(/\D/g, '').slice(0, 11); },
        statusRank(value) {
            const status=String(value||'pending').toLowerCase();
            return status==='pending'?0:status==='checked'?1:status==='printed'?2:(status==='completed'||status==='concluded')?3:0;
        },
        issueRank(value) {
            const status=String(value||'draft').toLowerCase();
            return status==='draft'?0:status==='confirmed'?1:status==='payment'?2:status==='issued'?3:status==='captured'?4:0;
        },
        normalize(item = {}) {
            const cpf = this.normalizeCpf(item.cpf);
            const ticketNumber = EH.Utils.clean(item.ticketNumber || item.ticket || '');
            const origin = EH.Utils.clean(item.origin || '');
            const destination = EH.Utils.clean(item.destination || '');
            const travelDate = EH.Utils.clean(item.travelDate || '');
            const saleId=EH.Utils.clean(item.saleId||'');
            const salePassengerId=EH.Utils.clean(item.salePassengerId||'');
            const fallbackId = saleId && salePassengerId
                ? `sale:${saleId}:${salePassengerId}`
                : (ticketNumber ? `ticket:${ticketNumber}` : `trip:${cpf}|${travelDate}|${EH.Utils.normalize(origin)}|${EH.Utils.normalize(destination)}`);
            return {
                id: String(item.id || fallbackId),
                saleId, salePassengerId, cpf,
                name: EH.Utils.clean(item.name || ''),
                birthDate: EH.Utils.clean(item.birthDate || ''),
                origin, destination, travelDate,
                travelDateBr: EH.Utils.clean(item.travelDateBr || ''),
                travelTime: EH.Utils.clean(item.travelTime || ''),
                travelTimestamp: Number(item.travelTimestamp || 0),
                service: String(item.service || '').replace(/\D/g, ''),
                line: EH.Utils.clean(item.line || ''),
                seat: EH.Utils.clean(item.seat || ''),
                ticketNumber,
                locator: EH.Utils.clean(item.locator || ''),
                transactionId: EH.Utils.clean(item.transactionId || ''),
                saleReference: EH.Utils.clean(item.saleReference || item.saleIdReal || ''),
                requestCodes: item.requestCodes && typeof item.requestCodes==='object' ? { ...item.requestCodes } : {},
                benefit: EH.Utils.clean(item.benefit || ''),
                issueStatus: EH.Utils.clean(item.issueStatus || item.status || 'draft').toLowerCase() || 'draft',
                ticketStatus: EH.Utils.clean(item.ticketStatus || 'pending').toLowerCase() || 'pending',
                printStatus: EH.Utils.clean(item.printStatus || 'pending').toLowerCase() || 'pending',
                checkStatus: EH.Utils.clean(item.checkStatus || 'pending').toLowerCase() || 'pending',
                saleFinalized: Boolean(item.saleFinalized),
                createdAt: Number(item.createdAt || Date.now()),
                updatedAt: Number(item.updatedAt || item.createdAt || Date.now()),
                deviceId: String(item.deviceId || EH.Device.id()),
                sourceDevice: String(item.sourceDevice || item.deviceId || EH.Device.id()),
                syncState: EH.Utils.clean(item.syncState || 'local') || 'local'
            };
        },
        merge(oldItem = {}, incoming = {}) {
            const old = this.normalize(oldItem), next = this.normalize(incoming);
            const newer = Number(next.updatedAt || 0) >= Number(old.updatedAt || 0);
            const preferred = newer ? next : old, secondary = newer ? old : next;
            const useful = (a,b) => EH.Sync?.usefulText?.(a,b) || EH.Utils.clean(a || b || '');
            const requestCodes={...(secondary.requestCodes||{}),...(preferred.requestCodes||{})};
            const issueStatus=this.issueRank(next.issueStatus)>=this.issueRank(old.issueStatus)?next.issueStatus:old.issueStatus;
            const printStatus=this.statusRank(next.printStatus)>=this.statusRank(old.printStatus)?next.printStatus:old.printStatus;
            const checkStatus=this.statusRank(next.checkStatus)>=this.statusRank(old.checkStatus)?next.checkStatus:old.checkStatus;
            return {
                ...secondary, ...preferred,
                id: old.id || next.id,
                saleId: preferred.saleId || secondary.saleId,
                salePassengerId: preferred.salePassengerId || secondary.salePassengerId,
                cpf: preferred.cpf || secondary.cpf,
                name: useful(preferred.name, secondary.name),
                birthDate: useful(preferred.birthDate, secondary.birthDate),
                origin: useful(preferred.origin, secondary.origin),
                destination: useful(preferred.destination, secondary.destination),
                travelDate: preferred.travelDate || secondary.travelDate,
                travelDateBr: preferred.travelDateBr || secondary.travelDateBr,
                travelTime: preferred.travelTime || secondary.travelTime,
                travelTimestamp: Math.max(Number(old.travelTimestamp||0),Number(next.travelTimestamp||0)),
                service: preferred.service || secondary.service,
                line: useful(preferred.line, secondary.line),
                seat: preferred.seat || secondary.seat,
                ticketNumber: preferred.ticketNumber || secondary.ticketNumber,
                locator: preferred.locator || secondary.locator,
                transactionId: preferred.transactionId || secondary.transactionId,
                saleReference: preferred.saleReference || secondary.saleReference,
                requestCodes,
                benefit: useful(preferred.benefit,secondary.benefit),
                issueStatus,
                ticketStatus: this.issueRank(next.ticketStatus)>=this.issueRank(old.ticketStatus)?next.ticketStatus:old.ticketStatus,
                printStatus,
                checkStatus,
                saleFinalized: Boolean(old.saleFinalized||next.saleFinalized),
                createdAt: Math.min(Number(old.createdAt || Date.now()), Number(next.createdAt || Date.now())),
                updatedAt: Math.max(Number(old.updatedAt || 0), Number(next.updatedAt || 0)),
                deviceId: preferred.deviceId || secondary.deviceId || EH.Device.id(),
                sourceDevice: secondary.sourceDevice || preferred.sourceDevice || EH.Device.id(),
                syncState: preferred.syncState || secondary.syncState || 'local'
            };
        },
        findMatch(rows, next) {
            let index=rows.findIndex(row=>String(row.id)===String(next.id));
            if(index>=0)return index;
            if(next.ticketNumber){
                index=rows.findIndex(row=>EH.Utils.clean(row.ticketNumber||'')===next.ticketNumber);
                if(index>=0)return index;
            }
            if(next.saleId&&next.salePassengerId){
                index=rows.findIndex(row=>String(row.saleId||'')===next.saleId&&String(row.salePassengerId||'')===next.salePassengerId);
                if(index>=0)return index;
            }
            if(next.cpf.length===11){
                const candidates=rows.map((row,i)=>({row:this.normalize(row),i})).filter(x=>x.row.cpf===next.cpf&&!x.row.ticketNumber);
                const compatible=candidates.filter(x=>{
                    if(next.travelDate&&x.row.travelDate&&next.travelDate!==x.row.travelDate)return false;
                    if(next.origin&&x.row.origin&&EH.Utils.normalize(next.origin)!==EH.Utils.normalize(x.row.origin))return false;
                    if(next.destination&&x.row.destination&&EH.Utils.normalize(next.destination)!==EH.Utils.normalize(x.row.destination))return false;
                    return true;
                });
                if(compatible.length===1)return compatible[0].i;
            }
            return -1;
        },
        sameContent(left = {}, right = {}) {
            const comparable = item => {
                const normalized = this.normalize(item);
                const { updatedAt:_updatedAt, deviceId:_deviceId, syncState:_syncState, ...content } = normalized;
                return content;
            };
            try { return JSON.stringify(comparable(left)) === JSON.stringify(comparable(right)); }
            catch (_error) { return false; }
        },
        upsert(item = {}, { fromSync = false } = {}) {
            let next = this.normalize(item);
            if (!next.id || (!next.ticketNumber && next.cpf.length !== 11)) return null;
            const rows = this.load();
            const index = this.findMatch(rows,next);
            if(index>=0)next={...next,id:String(rows[index].id||next.id)};
            const merged = index >= 0 ? this.merge(rows[index], next) : next;
            const before = index >= 0 ? JSON.stringify(rows[index]) : '';
            if (!fromSync && index >= 0 && this.sameContent(rows[index], merged)) return rows[index];
            if (!fromSync) { merged.updatedAt = Date.now(); merged.deviceId=EH.Device.id(); merged.syncState=EH.Sync?.configured?.()?'pending':'local'; }
            else merged.syncState='synced';
            if (index >= 0) rows[index] = merged; else rows.push(merged);
            if (index < 0 || before !== JSON.stringify(merged)) {
                EH.Storage.set(this.KEY, rows.sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0)).slice(0, 3000));
                if (!fromSync) EH.Sync?.markPendingRecord?.('emission', merged.id);
            }
            if (merged.cpf) EH.PassengerMemory?.upsert?.({ cpf:merged.cpf, name:merged.name, birthDate:merged.birthDate, updatedAt:merged.updatedAt }, { fromSync });
            return merged;
        },
        issueStatusForPage(page='') {
            return page==='passagens'?'issued':page==='pagamento'?'payment':page==='confirmacao'?'confirmed':'draft';
        },
        captureSale(sale, { page = '' } = {}) {
            if(!sale?.id||!Array.isArray(sale.passengers)||!sale.passengers.length)return 0;
            const issueStatus=this.issueStatusForPage(page||EH.Pages?.detect?.()||'');
            let count=0;
            sale.passengers.forEach(passenger=>{
                const cpf=this.normalizeCpf(passenger?.cpf||'');
                if(cpf.length!==11)return;
                const saved=this.upsert({
                    id:`sale:${sale.id}:${passenger.id||`p-${cpf}`}`,
                    saleId:String(sale.id),salePassengerId:String(passenger.id||`p-${cpf}`),
                    cpf,name:passenger.name,birthDate:passenger.birthDate,
                    ticketStatus:passenger.ticketStatus||'pending',
                    issueStatus,printStatus:'pending',checkStatus:'pending',
                    createdAt:Number(passenger.createdAt||sale.createdAt||Date.now()),
                    updatedAt:Number(passenger.updatedAt||sale.updatedAt||Date.now()),
                    sourceDevice:EH.Device.id()
                });
                if(saved)count+=1;
            });
            return count;
        },
        finalizeSale(saleId) {
            const id=String(saleId||'');if(!id)return 0;
            const rows=this.load();let changed=0;
            rows.forEach((row,index)=>{if(String(row.saleId||'')!==id)return;const next=this.normalize(row);if(next.saleFinalized)return;next.saleFinalized=true;next.updatedAt=Date.now();next.deviceId=EH.Device.id();next.syncState=EH.Sync?.configured?.()?'pending':'local';rows[index]=next;EH.Sync?.markPendingRecord?.('emission',next.id);changed+=1;});
            if(changed)EH.Storage.set(this.KEY,rows);
            return changed;
        },
        attachRequestData(active={}) {
            const cpf=this.normalizeCpf(active.cpf||'');if(cpf.length!==11)return null;
            const rows=this.load().map(row=>this.normalize(row)).filter(row=>row.cpf===cpf).sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0));
            if(!rows.length)return null;
            const target=rows[0];
            const tipo=String(active.tipo||'').toLowerCase();
            const key=tipo.includes('volta')?'volta':tipo.includes('ida')?'ida':'atual';
            return this.upsert({...target,requestCodes:{...(target.requestCodes||{}),[key]:EH.Utils.clean(active.codigo||'')},updatedAt:Date.now()});
        },
        captureItems(items = []) {
            const candidates = EH.Reminders?.candidateItems?.(items) || [];
            let count = 0;
            candidates.forEach(candidate => {
                const saved = this.upsert({ ...candidate, issueStatus:'captured', ticketStatus:'captured', printStatus:'pending' });
                if (saved) count += 1;
            });
            return count;
        },
        markStatus(id,status) {
            const rows=this.load();const index=rows.findIndex(row=>String(row.id)===String(id));if(index<0)return null;
            const current=this.normalize(rows[index]),requested=String(status||'').toLowerCase();
            if(requested==='printed')current.printStatus='printed';
            else if(requested==='checked')current.checkStatus='checked';
            else if(requested==='completed'){current.printStatus='completed';current.checkStatus='completed';}
            else if(requested==='pending')current.printStatus='pending';
            current.updatedAt=Date.now();current.deviceId=EH.Device.id();current.syncState=EH.Sync?.configured?.()?'pending':'local';rows[index]=current;EH.Storage.set(this.KEY,rows);EH.Sync?.markPendingRecord?.('emission',current.id);EH.Sync?.syncAll?.({quiet:true});
            const reminder=EH.Reminders?.matchPassenger?.({cpf:current.cpf,ticket:current.ticketNumber},{service:current.service,date:current.travelDate});
            if(reminder&&(requested==='printed'||requested==='checked'||requested==='completed'))EH.Reminders?.markStatus?.(reminder.id,requested==='completed'?'completed':requested);
            EH.UI?.renderAutomation?.(EH.Pages?.detect?.()||'desconhecida');EH.UI?.renderSaleSummary?.(EH.Pages?.detect?.()||'desconhecida');
            return current;
        },
        isIssued(row) { const item=this.normalize(row);return this.issueRank(item.issueStatus)>=this.issueRank('issued')||Boolean(item.ticketNumber); },
        isPending(row) { const item=this.normalize(row);return this.isIssued(item)&&this.statusRank(item.printStatus)<this.statusRank('printed'); },
        pending({ excludeSaleId = '' } = {}) {
            const excluded=String(excludeSaleId||'');
            return this.load().map(row=>this.normalize(row)).filter(row=>this.isPending(row)&&(!excluded||row.saleId!==excluded)).sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0));
        },
        maskCpf(cpf){return EH.SaleContext?.maskCpfPublic?.(cpf)||'CPF não identificado';},
        async searchTicket(item){
            const cpf=this.normalizeCpf(item?.cpf);if(cpf.length!==11)return EH.Toast.warning('CPF não disponível nesta emissão.');
            if(EH.Pages?.detect?.()==='passagens')return EH.SaleContext.searchTicket({cpf,name:item.name});
            EH.Storage.set('emissionMemory.pendingSearch.v1',{cpf,emissionId:item.id,expiresAt:Date.now()+60000});EH.SaleContext.navigateToPassagens();
        },
        async runPendingSearch(){
            if(this.searchBusy)return;const pending=EH.Storage.get('emissionMemory.pendingSearch.v1',null);if(!pending?.cpf||Number(pending.expiresAt||0)<Date.now()){EH.Storage.remove('emissionMemory.pendingSearch.v1');return;}if(EH.Pages?.detect?.()!=='passagens')return;
            this.searchBusy=true;try{await EH.SaleContext.searchTicket({cpf:pending.cpf,name:'Emissão sincronizada'});EH.Storage.remove('emissionMemory.pendingSearch.v1');}finally{this.searchBusy=false;}
        },
        renderPendingBlock({ excludeSaleId = '' } = {}) {
            const items=this.pending({excludeSaleId});if(!items.length)return null;
            const block=document.createElement('div');block.className='eh-sale-cpfs eh-emission-persistent';
            const label=document.createElement('div');label.className='eh-sale-block-title';label.textContent=`Emissões pendentes • ${items.length}`;block.appendChild(label);
            items.slice(0,20).forEach((item,index)=>{
                const row=document.createElement('div');row.className='eh-sale-passenger-row';
                const text=document.createElement('div');text.className='eh-sale-passenger-text';
                const strong=document.createElement('strong');strong.textContent=`☁ ${item.name||`Passageiro ${index+1}`}`;
                const sub=document.createElement('small');const route=[item.origin,item.destination].filter(Boolean).join(' → ');sub.textContent=`${this.maskCpf(item.cpf)}${route?` • ${route}`:''}`;text.append(strong,sub);
                const buttons=document.createElement('div');buttons.className='eh-emission-row-actions';
                const search=document.createElement('button');search.type='button';search.className='eh-context-btn primary';search.textContent='Buscar';search.addEventListener('click',()=>this.searchTicket(item));
                const printed=document.createElement('button');printed.type='button';printed.className='eh-context-btn';printed.textContent='✓ Impresso';printed.addEventListener('click',()=>this.markStatus(item.id,'printed'));
                buttons.append(search,printed);row.append(text,buttons);block.appendChild(row);
            });
            if(items.length>20){const more=document.createElement('small');more.textContent=`+ ${items.length-20} registro(s) no histórico operacional.`;block.appendChild(more);}
            return block;
        },
        renderPendingCard({ excludeSaleId = '' } = {}) {
            const items=this.pending({excludeSaleId});if(!items.length)return null;
            const wrap=document.createElement('div');wrap.className='eh-sale-summary eh-emission-pending-summary';
            const head=document.createElement('div');head.className='eh-sale-summary-head';head.innerHTML=`<strong>Emissões pendentes</strong><span>${items.length} passageiro${items.length===1?'':'s'} • sincronizável</span>`;wrap.appendChild(head);
            items.slice(0,8).forEach(item=>{const row=document.createElement('div');row.className='eh-sale-summary-row';row.textContent=`☁ ${item.name||this.maskCpf(item.cpf)}`;wrap.appendChild(row);});
            return wrap;
        },
        migrateCurrentSale() {
            if(EH.Storage.get(this.MIGRATION_KEY,false))return 0;
            let count=0;try{const sale=EH.SaleContext?.loadSale?.();if(sale?.passengers?.length)count+=this.captureSale(sale,{page:EH.Pages?.detect?.()||'passagens'});}catch(error){EH.Logger.debug('Migração da venda atual adiada:',error);}EH.Storage.set(this.MIGRATION_KEY,{at:Date.now(),count});return count;
        },
        init(){
            this.migrateCurrentSale();
            const page=EH.Pages?.detect?.()||'desconhecida';
            if(page==='passagens')this.captureSale(EH.SaleContext?.loadSale?.(),{page:'passagens'});
            this.runPendingSearch();
        },
        onPageUpdate(page){
            if(['confirmacao','pagamento','passagens'].includes(page))this.captureSale(EH.SaleContext?.loadSale?.(),{page});
            if(page==='passagens')this.runPendingSearch();
        },
        applyRemote(item = {}) { return this.upsert(item, { fromSync:true }); }
    };



    // ============================================================
    // FILA DE CONFERÊNCIA DE BILHETES — v5.60
    // Persiste a lista do mapa ao navegar para Passagens e permite conferir um CPF por vez.
    // ============================================================
    EH.TicketVerificationQueue = {
        KEY:'ticketVerificationQueue.v2',
        LEGACY_KEY:'ticketVerificationQueue.v1',
        SEARCH_KEY:'ticketVerificationQueue.search.v1',
        searchBusy:false,

        load() {
            let value=EH.Storage.get(this.KEY,null);
            if(!value){
                const legacy=EH.Storage.get(this.LEGACY_KEY,null);
                if(legacy&&typeof legacy==='object'){
                    value={
                        ...legacy,
                        activeKind:legacy.kind==='alight'?'alight':'board',
                        lists:{
                            board:legacy.kind==='alight'?[]:(Array.isArray(legacy.passengers)?legacy.passengers:[]),
                            alight:legacy.kind==='alight'?(Array.isArray(legacy.passengers)?legacy.passengers:[]):[]
                        }
                    };
                    EH.Storage.set(this.KEY,value);
                }
            }
            return value&&typeof value==='object'?value:null;
        },
        save(queue) {
            if(!queue){EH.Storage.remove(this.KEY);return null;}
            queue.activeKind=queue.activeKind==='alight'?'alight':'board';
            queue.lists=queue.lists&&typeof queue.lists==='object'?queue.lists:{board:[],alight:[]};
            queue.lists.board=Array.isArray(queue.lists.board)?queue.lists.board:[];
            queue.lists.alight=Array.isArray(queue.lists.alight)?queue.lists.alight:[];
            queue.updatedAt=Date.now();
            EH.Storage.set(this.KEY,queue);
            return queue;
        },
        passengerId(item,index=0,kind='board') {
            const cpf=String(item?.cpf||'').replace(/\D/g,'').slice(0,11),ticket=EH.Utils.clean(item?.ticket||'');
            return ticket?`${kind}:ticket:${ticket}`:cpf?`${kind}:cpf:${cpf}|${item?.seat||''}`:`${kind}:row:${index}|${item?.seat||''}|${EH.Utils.normalize(item?.name||'')}`;
        },
        statusRank(status) {
            const value=String(status||'pending').toLowerCase();
            return value==='pending'?0:value==='checked'?1:value==='printed'?2:0;
        },
        buildList(records=[],kind='board',oldList=[]) {
            const previous=new Map((oldList||[]).map(item=>[String(item.id||''),item]));
            const passengers=[];
            (records||[]).forEach(record=>{
                const list=kind==='alight'?(record?.agency?.alighters||[]):(record?.agency?.boarders||[]);
                list.forEach((item,index)=>{
                    const id=this.passengerId(item,index,kind);
                    if(passengers.some(p=>p.id===id))return;
                    const reminder=EH.Reminders?.matchPassenger?.(item,record);
                    let reminderStatus='pending';
                    if(EH.Reminders?.isDoneStatus?.(reminder?.status)){
                        reminderStatus=String(reminder?.status||'').toLowerCase()==='checked'?'checked':'printed';
                    }
                    const old=previous.get(id);
                    const oldStatus=old?.status||'pending';
                    const status=this.statusRank(oldStatus)>=this.statusRank(reminderStatus)?oldStatus:reminderStatus;
                    passengers.push({
                        id,
                        name:EH.Utils.clean(item.name||old?.name||''),
                        cpf:String(item.cpf||old?.cpf||'').replace(/\D/g,'').slice(0,11),
                        seat:EH.Utils.clean(item.seat||old?.seat||''),
                        ticket:EH.Utils.clean(item.ticket||old?.ticket||''),
                        origin:item.origin||old?.origin||null,
                        destination:item.destination||old?.destination||null,
                        service:String(record.service||old?.service||''),
                        floor:EH.Utils.clean(record.floor||old?.floor||''),
                        status,
                        reminderId:reminder?.id||old?.reminderId||'',
                        checkedAt:Number(old?.checkedAt||0),
                        printedAt:Number(old?.printedAt||0)
                    });
                });
            });
            return passengers;
        },
        fromRecords(records=[],kind='board',meta={}) {
            const valid=(records||[]).filter(Boolean);
            if(!valid.length)return null;
            const date=meta.date||valid[0]?.date||'',routineId=meta.routineId||valid[0]?.routineId||'';
            const queueId=`${date}|${routineId||meta.operationalTime||valid.map(r=>r.service).join('+')}`;
            const existing=this.load(),same=existing&&String(existing.id||'')===queueId?existing:null;
            const lists={
                board:this.buildList(valid,'board',same?.lists?.board||[]),
                alight:this.buildList(valid,'alight',same?.lists?.alight||[])
            };
            return this.save({
                id:queueId,date,
                operationalTime:meta.operationalTime||valid[0]?.operationalTime||'',
                name:meta.name||valid[0]?.operationalName||'',
                activeKind:kind==='alight'?'alight':'board',
                services:Array.from(new Set(valid.map(r=>String(r.service||'')).filter(Boolean))),
                lists,
                createdAt:Number(same?.createdAt||Date.now()),
                updatedAt:Date.now()
            });
        },
        activeList(queue=this.load()) {
            if(!queue)return[];
            const kind=queue.activeKind==='alight'?'alight':'board';
            return Array.isArray(queue?.lists?.[kind])?queue.lists[kind]:[];
        },
        switchKind(kind) {
            const q=this.load();if(!q)return;
            q.activeKind=kind==='alight'?'alight':'board';this.save(q);this.render();
        },
        findPassenger(queue,id) {
            if(!queue)return null;
            for(const kind of ['board','alight']){
                const item=(queue.lists?.[kind]||[]).find(p=>p.id===id);
                if(item)return{item,kind};
            }
            return null;
        },
        setStatus(id,status) {
            const q=this.load(),found=this.findPassenger(q,id);if(!found)return;
            const requested=['pending','checked','printed'].includes(String(status||'').toLowerCase())?String(status).toLowerCase():'pending';
            if(requested==='pending'||this.statusRank(requested)>=this.statusRank(found.item.status))found.item.status=requested;
            if(found.item.status==='checked')found.item.checkedAt=Date.now();
            if(found.item.status==='printed')found.item.printedAt=Date.now();
            this.save(q);
            if(found.item.reminderId){
                if(found.item.status==='printed')EH.Reminders?.markStatus?.(found.item.reminderId,'printed');
                else if(found.item.status==='checked')EH.Reminders?.markStatus?.(found.item.reminderId,'checked');
            }
            this.render();
        },
        nextPending() {
            const q=this.load();
            return this.activeList(q).find(p=>p.status==='pending')||null;
        },
        async copyCpf(item) {
            const cpf=String(item?.cpf||'').replace(/\D/g,'').slice(0,11);
            if(cpf.length!==11)return EH.Toast.warning('CPF não disponível no mapa.');
            await EH.Clipboard.copyText(cpf);EH.Toast.success('CPF copiado.');
        },
        search(item) {
            const cpf=String(item?.cpf||'').replace(/\D/g,'').slice(0,11);
            if(cpf.length!==11)return EH.Toast.warning('CPF não disponível para busca.');
            EH.Storage.set(this.SEARCH_KEY,{cpf,passengerId:item.id,expiresAt:Date.now()+120000});
            if(EH.Pages.detect()==='passagens')this.runPendingSearch();else EH.SaleContext.navigateToPassagens();
        },
        async runPendingSearch() {
            if(this.searchBusy)return;
            const pending=EH.Storage.get(this.SEARCH_KEY,null);
            if(!pending?.cpf||Number(pending.expiresAt||0)<Date.now()){EH.Storage.remove(this.SEARCH_KEY);return;}
            const input=EH.Utils.first(EH.Selectors.PASSAGENS_CPF_INPUT);if(!input)return;
            this.searchBusy=true;
            try{
                EH.SaleContext.setNativeValue(input,EH.SaleContext.maskCpf(pending.cpf));
                input.focus();await EH.Utils.sleep(80);input.blur();
                const button=EH.SaleContext.findSearchButton(input),form=input.closest('form');
                if(button)button.click();else if(form?.requestSubmit)form.requestSubmit();else form?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
                EH.Storage.remove(this.SEARCH_KEY);
                EH.Toast.success('CPF preenchido e busca iniciada.');
            }finally{this.searchBusy=false;}
        },
        next() {
            const item=this.nextPending();
            if(!item)return EH.Toast.info('Não há passageiro pendente nesta lista.');
            this.search(item);
        },
        render() {
            const existing=document.querySelector('#eh-ticket-verification-queue'),q=this.load();
            if(EH.Pages.detect()!=='passagens'||!q||(q.lists?.board?.length||0)+(q.lists?.alight?.length||0)===0){existing?.remove();return;}
            let box=existing;
            if(!box){box=document.createElement('div');box.id='eh-ticket-verification-queue';box.className='eh-verification-queue';document.body.append(box);}
            box.innerHTML='';
            const title=document.createElement('strong');title.textContent=`CONFERÊNCIA DO CARRO • ${q.operationalTime||'—'} • ${q.name||''}`;
            const tabs=document.createElement('div');tabs.className='eh-verification-tabs';
            ['board','alight'].forEach(kind=>{
                const label=kind==='board'?'Embarques':'Desembarques',list=q.lists?.[kind]||[],pending=list.filter(p=>p.status==='pending').length;
                const btn=document.createElement('button');btn.className=q.activeKind===kind?'active':'';btn.textContent=`${label} ${pending}/${list.length}`;btn.addEventListener('click',()=>this.switchKind(kind));tabs.append(btn);
            });
            box.append(title,tabs);
            const active=this.activeList(q);
            if(!active.length){const empty=document.createElement('small');empty.textContent=q.activeKind==='alight'?'Nenhum desembarque da agência 287 nesta fila.':'Nenhum embarque da agência 287 nesta fila.';box.append(empty);}
            active.forEach(item=>{
                const row=document.createElement('div');row.className='eh-verification-row';
                const text=document.createElement('span');text.textContent=`${item.status==='pending'?'○':item.status==='printed'?'🖨':'✓'} ${EH.OperationCars?.seatLabel?.(item.seat)||item.seat||'—'} — ${item.name||'Passageiro'}${item.floor?` • ${item.floor}`:''}`;
                const cpf=document.createElement('button');cpf.textContent='CPF';cpf.addEventListener('click',()=>this.copyCpf(item));
                const search=document.createElement('button');search.textContent='Buscar';search.addEventListener('click',()=>this.search(item));
                const checked=document.createElement('button');checked.textContent='✓';checked.title='Marcar conferido';checked.addEventListener('click',()=>this.setStatus(item.id,'checked'));
                const printed=document.createElement('button');printed.textContent='🖨';printed.title='Marcar impresso';printed.addEventListener('click',()=>this.setStatus(item.id,'printed'));
                row.append(text,cpf,search,checked,printed);box.append(row);
            });
            const next=document.createElement('button');next.className='eh-modal-btn';next.textContent='Próximo pendente';next.addEventListener('click',()=>this.next());box.append(next);
        },
        onPageUpdate(page) {
            if(page==='passagens'){EH.Runtime.timeout('verification-search',()=>this.runPendingSearch(),350);this.render();}
            else document.querySelector('#eh-ticket-verification-queue')?.remove();
        },
        injectStyles() {
            GM_addStyle(`#eh-ticket-verification-queue{position:fixed;right:18px;bottom:18px;z-index:2147482900;width:min(430px,calc(100vw - 36px));max-height:58vh;overflow:auto;display:grid;gap:6px;padding:10px;border:1px solid #d8e0e8;border-radius:11px;background:#fff;color:#253348;box-shadow:0 14px 36px rgba(24,42,66,.18);font-family:Inter,"Segoe UI",Arial,sans-serif;font-size:10px}.eh-verification-tabs{display:grid;grid-template-columns:1fr 1fr;gap:5px}.eh-verification-tabs button{min-height:28px;border:1px solid #d4dde6;border-radius:7px;background:#f8fafc;font-size:9px;font-weight:800;cursor:pointer}.eh-verification-tabs button.active{border-color:#8fb1cf;background:#edf5fb;color:#245b86}.eh-verification-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto auto;gap:5px;align-items:center;padding:5px 0;border-top:1px solid #eef1f4}.eh-verification-row button{min-height:27px;border:1px solid #d4dde6;border-radius:6px;background:#f8fafc;font-size:8px;cursor:pointer}`);
        },
        init(){this.injectStyles();this.render();}
    };

    // ============================================================
    // PAINEL SECUNDÁRIO OPERAÇÃO / CARROS — v5.56
    // ============================================================
    EH.OperationDock = {
        root:null, body:null, host:null, launcher:null, collapsed:false,
        init(){
            if(this.root || !EH.Config.OPERATION_DOCK_ENABLED || !document.body)return;
            this.collapsed=EH.Utils.parseBoolean(EH.Storage.get('operationDockCollapsed',false), false);
            const root=document.createElement('aside'); root.id='eh-operation-dock'; root.classList.toggle('eh-operation-dock-collapsed',this.collapsed);
            const head=document.createElement('div'); head.className='eh-operation-dock-head';
            const brand=document.createElement('div'); brand.className='eh-operation-dock-brand'; brand.innerHTML='<span>OPERAÇÃO</span><strong>🚌 Carros</strong>';
            const actions=document.createElement('div'); actions.className='eh-operation-dock-actions';
            const more=document.createElement('button'); more.type='button'; more.title='Carros de hoje'; more.textContent='☷'; more.addEventListener('click',e=>{e.stopPropagation();EH.OperationCars.showCars();});
            const collapse=document.createElement('button'); collapse.type='button'; collapse.title='Recolher Operação'; collapse.textContent='—'; collapse.addEventListener('click',e=>{e.stopPropagation();this.setCollapsed(true);}); actions.append(more,collapse); head.append(brand,actions);
            const body=document.createElement('div'); body.className='eh-operation-dock-body';
            const host=document.createElement('div'); host.className='eh-operation-host'; body.appendChild(host); root.append(head,body);
            const launcher=document.createElement('button'); launcher.id='eh-operation-launcher'; launcher.type='button'; launcher.textContent='🚌 CARROS'; launcher.hidden=!this.collapsed; launcher.addEventListener('click',()=>this.setCollapsed(false));
            document.body.append(root,launcher); this.root=root; this.body=body; this.host=host; this.launcher=launcher;
            root.style.setProperty('display', this.collapsed ? 'none' : 'flex', 'important');
            this.injectStyles(); EH.PanelManager?.bind?.('operation'); EH.PanelManager?.apply?.('operation');
        },
        setCollapsed(value){
            this.collapsed=Boolean(value); EH.Storage.set('operationDockCollapsed',this.collapsed);
            if(this.root){ this.root.classList.toggle('eh-operation-dock-collapsed',this.collapsed); this.root.style.setProperty('display', EH.Config.OPERATION_DOCK_ENABLED && !this.collapsed ? 'flex' : 'none', 'important'); }
            if(this.launcher)this.launcher.hidden=!EH.Config.OPERATION_DOCK_ENABLED || !this.collapsed;
        },
        injectStyles(){
            GM_addStyle(`
                #eh-operation-dock{position:fixed!important;z-index:2147482950;width:300px;height:285px;display:flex;flex-direction:column;border:1px solid #d9e1ea;border-radius:14px;background:rgba(248,250,252,.99);box-shadow:0 14px 38px rgba(26,44,72,.16);overflow:hidden;font-family:Inter,"Segoe UI",Arial,sans-serif;color:#26313f}
                #eh-operation-dock.eh-operation-dock-collapsed{display:none!important}.eh-operation-dock-head{min-height:44px;padding:7px 8px 7px 11px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid #dce3eb;background:linear-gradient(180deg,#fff 0%,#f4f7fa 100%)}.eh-operation-dock-brand{display:grid;gap:1px}.eh-operation-dock-brand span{font-size:7px;font-weight:950;letter-spacing:.7px;color:#7a8798}.eh-operation-dock-brand strong{font-size:11px;color:#25364b}.eh-operation-dock-actions{display:flex;gap:3px}.eh-operation-dock-actions button{width:28px;height:28px;border:0;border-radius:7px;background:transparent;color:#5e6d7d;cursor:pointer}.eh-operation-dock-actions button:hover{background:#e8edf3}.eh-operation-dock-body{min-height:0;flex:1;overflow:auto;padding:8px}.eh-operation-dock-body>.eh-operation-host{margin:0!important}
                #eh-operation-launcher{position:fixed;right:0;bottom:110px;z-index:2147482951;min-width:24px;padding:8px 5px;border:1px solid #cbd5e1;border-right:0;border-radius:9px 0 0 9px;background:#fff;color:#315b88;font-size:8px;font-weight:900;writing-mode:vertical-rl;cursor:pointer;box-shadow:-4px 4px 14px rgba(31,48,70,.12)}
            `);
        }
    };

    EH.OperationCars = {
        MAPS_KEY: 'operationCars.maps.v4',
        LAST_KEY: 'operationCars.lastMap.v4',
        SCHEDULE_KEY: 'operationCars.schedule.v2',
        SELECTED_KEY: 'operationCars.selected.v2',
        lastDomSignature: '',
        lastMapKey: '',
        stylesInjected: false,
        started: false,
        visibleScheduleRecords: [],
        rowButtonsBound: new WeakSet(),
        mapButtons: new Map(),
        lastScheduleTable: null,
        lastScheduleFingerprint: '',
        lastMapModal: null,
        lastMapDomFingerprint: '',
        lastMapDomRecords: [],

        normalize(value) {
            return EH.Utils.normalize(value || '');
        },

        todayKey(date = new Date()) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        },

        brDateToKey(value) {
            const match = String(value || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
            return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
        },

        formatUpdatedAt(timestamp) {
            if (!timestamp) return '';
            const date = new Date(Number(timestamp));
            if (Number.isNaN(date.getTime())) return '';
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        },

        parseScheduleDateTime(value) {
            const text = EH.Utils.clean(value || '');
            const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
            if (!match) {
                const time = text.match(/\b(\d{1,2}):(\d{2})\b/);
                return { raw:text, date:'', dateBr:'', time:time ? `${String(Number(time[1])).padStart(2,'0')}:${time[2]}` : '', timestamp:0 };
            }
            const day=Number(match[1]), month=Number(match[2]), year=Number(match[3]);
            const hour=Number(match[4]), minute=Number(match[5]), second=Number(match[6]||0);
            const date = new Date(year, month-1, day, hour, minute, second, 0);
            return {
                raw:text,
                date:`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
                dateBr:`${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`,
                time:`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,
                timestamp:date.getTime()
            };
        },

        timeMinutes(value) {
            const match = String(value || '').match(/\b(\d{1,2}):(\d{2})\b/);
            if (!match) return null;
            const h = Number(match[1]), m = Number(match[2]);
            if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null;
            return h * 60 + m;
        },

        timeDistance(a, b) {
            const am = this.timeMinutes(a), bm = this.timeMinutes(b);
            if (am === null || bm === null) return Infinity;
            return Math.abs(am - bm);
        },

        readFieldText(selectors = []) {
            const el = EH.Utils.first(selectors);
            if (!el) return '';
            if ('value' in el && EH.Utils.clean(el.value || '')) return EH.Utils.clean(el.value);
            const selected = el.querySelector?.('.ng-value-label, .ng-value, option:checked');
            return EH.Utils.clean(selected?.textContent || el.textContent || '');
        },

        searchContext() {
            const origin = this.readFieldText(EH.Selectors.ORIGEM?.length ? EH.Selectors.ORIGEM : EH.Selectors.ORIGEM_SELECT);
            const destination = this.readFieldText(EH.Selectors.DESTINO?.length ? EH.Selectors.DESTINO : EH.Selectors.DESTINO_SELECT);
            const dateEl = EH.Utils.first(EH.Selectors.DATA);
            const rawDate = EH.Utils.clean(dateEl?.value || dateEl?.textContent || '');
            let date = '';
            let dateBr = '';
            if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
                date = rawDate;
                const [y,m,d] = rawDate.split('-');
                dateBr = `${d}/${m}/${y}`;
            } else {
                date = this.brDateToKey(rawDate);
                dateBr = rawDate.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || '';
            }
            return {
                origin: EH.Utils.clean(origin),
                destination: EH.Utils.clean(destination),
                date,
                dateBr
            };
        },

        trailingCode(value) {
            const normalized = this.normalize(EH.Utils.clean(value || ''));
            const match = normalized.match(/(?:^|\s*-\s*)(\d+)\s*$/);
            return match ? String(match[1]) : '';
        },

        parseLocation(value) {
            const raw = EH.Utils.clean(value || '');
            const normalized = this.normalize(raw);
            const code = this.trailingCode(raw);
            const withoutCode = code
                ? normalized.replace(new RegExp(`\\s*-\\s*${code}\\s*$`), '').trim()
                : normalized;
            const match = withoutCode.match(/^(.*?)\s*-\s*([A-Z]{2})$/);
            if (!match) return { raw, city: withoutCode, uf: '', code };
            return { raw, city: EH.Utils.clean(match[1]), uf: match[2], code };
        },

        shortLocation(location) {
            const parsed = typeof location === 'string' ? this.parseLocation(location) : (location || {});
            return [EH.Utils.clean(parsed.city || parsed.raw || ''), EH.Utils.clean(parsed.uf || '')].filter(Boolean).join(' - ');
        },

        parseLine(value) {
            const raw = EH.Utils.clean(value || '');
            const normalized = this.normalize(raw);
            const route = normalized.match(/^(.+?)\s+X\s+(.+)$/i);
            if (!route) return { raw, code: '', origin: this.parseLocation(''), destination: this.parseLocation('') };
            let left = EH.Utils.clean(route[1]);
            const right = EH.Utils.clean(route[2]);
            let code = '';
            const codeMatch = left.match(/^([A-Z0-9-]*\d[A-Z0-9-]*)\s*-\s*(.+)$/i);
            if (codeMatch) {
                code = codeMatch[1];
                left = codeMatch[2];
            }
            return { raw, code, origin: this.parseLocation(left), destination: this.parseLocation(right) };
        },

        agencyCode() {
            return String(EH.Config.OPERATION_AGENCY_CODE || '287').replace(/\D/g, '') || '287';
        },

        routineConfigs() {
            const used = new Set();
            return (Array.isArray(EH.Config.OPERATION_ROUTINES) ? EH.Config.OPERATION_ROUTINES : [])
                .map((item, index) => {
                    const time = EH.Utils.clean(item?.operationalTime || '');
                    const name = EH.Utils.clean(item?.name || '');
                    const baseId = EH.Utils.clean(item?.id || '') || `${time}-${name}-${index}`;
                    let id = this.normalize(baseId).replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || `rotina-${index+1}`;
                    if (used.has(id)) id = `${id}-${index+1}`;
                    used.add(id);
                    return {
                        id,
                        name: name || `Carro ${index+1}`,
                        operationalTime: /^\d{1,2}:\d{2}$/.test(time) ? time.padStart(5, '0') : '',
                        active: item?.active !== undefined ? EH.Utils.parseBoolean(item.active, true) : true,
                        originHint: EH.Utils.clean(item?.originHint || ''),
                        destinationHint: EH.Utils.clean(item?.destinationHint || ''),
                        companyHint: EH.Utils.clean(item?.companyHint || ''),
                        lineHint: EH.Utils.clean(item?.lineHint || ''),
                        order: index
                    };
                })
                .filter(item => item.operationalTime && item.name);
        },

        routeMatchScore(record, routine) {
            const tolerance = Math.max(0, EH.Utils.parseFiniteNumber(EH.Config.OPERATION_TIME_TOLERANCE_MINUTES, 20));
            const diff = this.timeDistance(record?.time || record?.departure || '', routine?.operationalTime || '');
            if (!Number.isFinite(diff) || diff > tolerance) return null;

            let score = Math.max(0, 100 - diff * 2);
            const originHint = this.normalize(routine.originHint || '');
            const destinationHint = this.normalize(routine.destinationHint || '');
            const queryOrigin = this.normalize(record.queryOrigin || '');
            const queryDestination = this.normalize(record.queryDestination || '');
            const line = this.normalize(record.lineRaw || '');
            const company = this.normalize([record.companyCode, record.company].filter(Boolean).join(' '));

            // A origem/destino da PESQUISA é o melhor indicador de sentido.
            if (originHint && queryOrigin) {
                if (!queryOrigin.includes(originHint) && !originHint.includes(queryOrigin)) return null;
                score += 45;
            } else if (originHint && line.includes(originHint)) {
                score += 15;
            }

            if (destinationHint) {
                // O destino consultado pode ser uma parada intermediária do carro.
                // Portanto, destino divergente não elimina sozinho o resultado; ele apenas
                // deixa de receber o bônus. A origem/sentido continua sendo o filtro forte.
                if (queryDestination && (queryDestination.includes(destinationHint) || destinationHint.includes(queryDestination))) score += 45;
                else if (line.includes(destinationHint)) score += 25;
            }

            const companyHint = this.normalize(routine.companyHint || '');
            if (companyHint) {
                if (!company.includes(companyHint)) return null;
                score += 10;
            }
            const lineHint = this.normalize(routine.lineHint || '');
            if (lineHint) {
                if (!line.includes(lineHint) && !this.normalize(record.lineCode || '').includes(lineHint)) return null;
                score += 15;
            }
            return { score, diff };
        },

        routineForSchedule(record) {
            const matches = this.routineConfigs()
                .filter(item => item.active)
                .map(routine => ({ routine, match: this.routeMatchScore(record, routine) }))
                .filter(item => item.match)
                .sort((a,b) => b.match.score - a.match.score || a.match.diff - b.match.diff || a.routine.order - b.routine.order);
            return matches[0]?.routine || null;
        },

        routineStates(date = this.todayKey()) {
            const rows = this.searchScheduleRecords('', date).filter(item => !date || !item.date || item.date === date);
            return this.routineConfigs().filter(item => item.active).map(routine => {
                const matches = rows
                    .map(record => ({ record, match: this.routeMatchScore(record, routine) }))
                    .filter(item => item.match)
                    .sort((a,b) => b.match.score - a.match.score || a.match.diff - b.match.diff || Number(a.record.timestamp||0)-Number(b.record.timestamp||0))
                    .map(item => item.record);
                return { routine, matches, primary: matches[0] || null };
            });
        },

        routineForService(service, date = this.todayKey()) {
            const rows = this.searchScheduleRecords('', date).filter(item =>
                String(item.service || '') === String(service || '') && (!date || !item.date || item.date === date)
            );
            for (const row of rows) {
                const routine = this.routineForSchedule(row);
                if (routine) return routine;
            }
            return null;
        },

        loadScheduleRecords() {
            const records = EH.Storage.get(this.SCHEDULE_KEY, []);
            return Array.isArray(records) ? records : [];
        },

        saveScheduleRecords(records = []) {
            const existing = this.loadScheduleRecords();
            const map = new Map();
            [...existing, ...(Array.isArray(records) ? records : [])].forEach(item => {
                if (!item?.service) return;
                const key = item.resultKey || [
                    item.service, item.date || '', item.departure || '',
                    this.normalize(item.lineRaw || ''), this.normalize(item.floor || ''),
                    this.normalize(item.queryOrigin || ''), this.normalize(item.queryDestination || '')
                ].join('|');
                map.set(key, { ...item, resultKey:key });
            });
            const min = new Date(); min.setDate(min.getDate()-3);
            const minKey = this.todayKey(min);
            const safe = Array.from(map.values())
                .filter(item => !item.date || item.date >= minKey)
                .sort((a,b)=>Number(b.detectedAt||0)-Number(a.detectedAt||0))
                .slice(0, 220);
            EH.Storage.set(this.SCHEDULE_KEY, safe);
            return safe;
        },

        detectFloor(row) {
            const text = this.normalize(row?.textContent || '');
            if (text.includes('1º ANDAR') || text.includes('1° ANDAR') || text.includes('1 ANDAR')) return '1º andar';
            if (text.includes('2º ANDAR') || text.includes('2° ANDAR') || text.includes('2 ANDAR')) return '2º andar';
            return '';
        },

        bindScheduleMapButton(row, record) {
            const button = Array.from(row?.querySelectorAll?.('button') || []).find(btn => this.normalize(btn.getAttribute('title') || btn.textContent || '').includes('MAPA'));
            if (!button) return;
            if (record?.resultKey) this.mapButtons.set(String(record.resultKey), button);
            if (this.rowButtonsBound.has(button)) return;
            this.rowButtonsBound.add(button);
            // pointerdown registra o serviço ANTES do clique original do Angular abrir o mapa.
            // Não duplicar a mesma seleção também no click.
            button.addEventListener('pointerdown', () => this.selectCar(record, { quiet:true }), true);
        },

        openScheduleMap(record) {
            if (!record?.service) return false;
            this.selectCar(record, { quiet:true });
            const button = this.mapButtons.get(String(record.resultKey || ''));
            if (button?.isConnected) {
                button.click();
                return true;
            }
            EH.Toast?.info?.('O carro foi selecionado. Para abrir o mapa, mantenha a pesquisa de horários correspondente visível no E-Pass.');
            return false;
        },

        readScheduleResults() {
            const tables = Array.from(document.querySelectorAll('app-pesquisa-venda table, app-pesquisa table, table.table-hover'));
            const table = tables.find(item => {
                const headers = Array.from(item.querySelectorAll('thead th')).map(th => this.normalize(th.textContent));
                return headers.includes('SERVICO') && headers.some(h => h.includes('HORARIO DE SAIDA')) && headers.includes('LINHA');
            });
            if (!table) {
                this.visibleScheduleRecords = [];
                this.lastScheduleTable = null;
                this.lastScheduleFingerprint = '';
                return [];
            }

            const headers = Array.from(table.querySelectorAll('thead th')).map(th => this.normalize(th.textContent));
            const idx = {
                service: headers.findIndex(h => h === 'SERVICO'),
                departure: headers.findIndex(h => h.includes('HORARIO DE SAIDA')),
                line: headers.findIndex(h => h === 'LINHA'),
                arrival: headers.findIndex(h => h.includes('HORARIO DE CHEGADA'))
            };
            const context = this.searchContext();
            const tableFingerprint = [
                context.origin, context.destination, context.date,
                EH.Utils.clean(table.textContent || '').slice(0, 12000)
            ].join('|');
            if (this.lastScheduleTable === table
                && this.lastScheduleFingerprint === tableFingerprint
                && this.visibleScheduleRecords.length) {
                return this.visibleScheduleRecords;
            }
            this.lastScheduleTable = table;
            this.lastScheduleFingerprint = tableFingerprint;
            const now = Date.now();
            this.mapButtons.clear();

            const rows = Array.from(table.querySelectorAll('tbody tr')).map((row, rowIndex) => {
                const cells = Array.from(row.querySelectorAll(':scope > td'));
                const texts = cells.map(td => EH.Utils.clean(td.textContent || ''));
                const service = String(texts[idx.service >= 0 ? idx.service : 0] || '').replace(/\D/g, '');
                if (!service) return null;
                const departure = EH.Utils.clean(texts[idx.departure >= 0 ? idx.departure : 1] || '');
                const dt = this.parseScheduleDateTime(departure);
                const lineCell = cells[idx.line >= 0 ? idx.line : 2];
                const badge = lineCell?.querySelector?.('.badge');
                const companyCode = EH.Utils.clean(badge?.textContent || '');
                let lineRaw = EH.Utils.clean(lineCell?.textContent || '');
                if (companyCode && this.normalize(lineRaw).startsWith(this.normalize(companyCode))) {
                    lineRaw = EH.Utils.clean(lineRaw.slice(companyCode.length));
                }
                const parsedLine = this.parseLine(lineRaw);
                const company = EH.Utils.clean(EH.Config.LINHAS?.[companyCode] || companyCode || '');
                const floor = this.detectFloor(row);
                const date = dt.date || context.date || '';
                const dateBr = dt.dateBr || context.dateBr || '';
                const record = {
                    rowIndex,
                    service,
                    departure,
                    date,
                    dateBr,
                    time:dt.time,
                    timestamp:dt.timestamp,
                    arrival: EH.Utils.clean(texts[idx.arrival >= 0 ? idx.arrival : 3] || ''),
                    lineRaw,
                    lineCode: parsedLine.code || '',
                    lineOrigin: parsedLine.origin || null,
                    lineDestination: parsedLine.destination || null,
                    companyCode,
                    company,
                    floor,
                    queryOrigin: context.origin,
                    queryDestination: context.destination,
                    detectedAt: now
                };
                record.resultKey = [
                    record.service, record.date, record.departure, this.normalize(record.lineRaw),
                    this.normalize(record.floor), this.normalize(record.queryOrigin), this.normalize(record.queryDestination)
                ].join('|');
                record.routineId = this.routineForSchedule(record)?.id || '';
                this.bindScheduleMapButton(row, record);
                return record;
            }).filter(Boolean);

            const unique = Array.from(new Map(rows.map(item => [item.resultKey, item])).values());
            this.visibleScheduleRecords = unique;
            this.saveScheduleRecords(unique);
            return unique;
        },

        scanScheduleList() {
            return this.readScheduleResults();
        },

        searchScheduleRecords(query = '', date = this.todayKey()) {
            const q = this.normalize(query);
            const visible = this.visibleScheduleRecords?.length ? this.visibleScheduleRecords : [];
            const stored = this.loadScheduleRecords();
            const map = new Map();
            [...visible,...stored].forEach(item => {
                if (!item?.service) return;
                const key = item.resultKey || [item.service,item.date||'',item.departure||'',this.normalize(item.lineRaw||''),this.normalize(item.floor||'')].join('|');
                if (!map.has(key)) map.set(key,item);
            });
            const targetDate = date || this.todayKey();
            let rows = Array.from(map.values()).filter(item => !item.date || item.date === targetDate);
            if (!q) return rows.sort((a,b)=>Number(a.timestamp||0)-Number(b.timestamp||0)||String(a.service).localeCompare(String(b.service)));
            const digits = q.replace(/\D/g,'');
            const exactService = digits ? rows.filter(item => String(item.service) === digits) : [];
            if (exactService.length) return exactService;
            return rows.filter(item => {
                const routine = this.routineForSchedule(item);
                const haystack = this.normalize([
                    item.service,item.time,item.departure,item.lineRaw,item.lineCode,item.company,item.companyCode,
                    item.queryOrigin,item.queryDestination,item.floor,routine?.name,routine?.operationalTime
                ].filter(Boolean).join(' '));
                return haystack.includes(q);
            }).sort((a,b)=>Number(a.timestamp||0)-Number(b.timestamp||0)||String(a.service).localeCompare(String(b.service)));
        },

        selectedCar() {
            const selected = EH.Storage.get(this.SELECTED_KEY, null);
            if (!selected?.service) return null;
            if (selected.date && selected.date !== this.todayKey()) return null;
            return selected;
        },

        selectCar(record, { quiet = false } = {}) {
            if (!record?.service) return;
            const routine = this.routineForSchedule(record);
            const selected = {
                resultKey: String(record.resultKey || ''),
                service:String(record.service),
                departure:EH.Utils.clean(record.departure || ''),
                date:String(record.date || ''),
                dateBr:String(record.dateBr || ''),
                time:String(record.time || ''),
                lineRaw:EH.Utils.clean(record.lineRaw || ''),
                lineCode:EH.Utils.clean(record.lineCode || ''),
                companyCode:EH.Utils.clean(record.companyCode || ''),
                company:EH.Utils.clean(record.company || ''),
                floor:EH.Utils.clean(record.floor || ''),
                queryOrigin:EH.Utils.clean(record.queryOrigin || ''),
                queryDestination:EH.Utils.clean(record.queryDestination || ''),
                routineId:routine?.id || record.routineId || '',
                selectedAt:Date.now()
            };
            EH.Storage.set(this.SELECTED_KEY, selected);
            this.render();
            if (!quiet) EH.Toast?.info?.(`Serviço ${selected.service}${selected.floor ? ` • ${selected.floor}` : ''} selecionado.`);
        },

        clearSelectedCar() {
            EH.Storage.remove(this.SELECTED_KEY);
            this.render();
        },

        metadataFromCard(card) {
            const body = card?.querySelector?.('.body') || card;
            const text = String(body?.innerText || body?.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
            const service = EH.Utils.clean(text.match(/Servi[cç]o:\s*([^\s]+)(?=\s+Data do Servi[cç]o:|$)/i)?.[1] || '');
            const dateMatch = text.match(/Data do Servi[cç]o:\s*(\d{2}\/\d{2}\/\d{4})\s*-\s*Hor[aá]rio:\s*(\d{2}:\d{2}:\d{2})/i);
            const lineRaw = EH.Utils.clean(text.match(/Linha:\s*(.+)$/i)?.[1] || '');
            const agency = EH.Utils.clean(text.match(/Ag[eê]ncia:\s*(.*?)(?=\s+Servi[cç]o:|$)/i)?.[1] || '');
            return {
                service,
                serviceDateBr: dateMatch?.[1] || '',
                serviceDate: this.brDateToKey(dateMatch?.[1] || ''),
                lineDeparture: dateMatch?.[2] ? dateMatch[2].slice(0,5) : '',
                line: this.parseLine(lineRaw),
                agency,
                raw:text
            };
        },

        tableHeaders(table) {
            return Array.from(table?.querySelectorAll?.('thead th') || []).map(th => this.normalize(th.textContent));
        },

        tableType(table) {
            const headers = this.tableHeaders(table);
            if (headers.includes('NOME') && headers.some(v => v.includes('BILHETE')) && headers.includes('POLTRONA') && headers.includes('ORIGEM') && headers.includes('DESTINO')) return 'passengers';
            if (headers.includes('LOCALIDADE') && headers.includes('EMBARQUE') && headers.includes('DESEMBARQUE') && headers.some(v => v.includes('SALDO'))) return 'localities';
            return '';
        },

        parsePassengers(table) {
            const headers = this.tableHeaders(table);
            const indexOf = patterns => headers.findIndex(header => patterns.some(pattern => header.includes(pattern)));
            const idx = {
                name:indexOf(['NOME']), ticket:indexOf(['BILHETE']), cpf:indexOf(['CPF']),
                seat:indexOf(['POLTRONA']), origin:indexOf(['ORIGEM']), destination:indexOf(['DESTINO'])
            };
            return Array.from(table?.querySelectorAll?.('tbody tr') || []).map((row,rowIndex)=>{
                const cells=Array.from(row.querySelectorAll('td')).map(td=>EH.Utils.clean(td.textContent));
                if(!cells.length)return null;
                return {
                    rowIndex,
                    name:idx.name>=0?cells[idx.name]||'':'',
                    ticket:idx.ticket>=0?cells[idx.ticket]||'':'',
                    cpf:idx.cpf>=0?String(cells[idx.cpf]||'').replace(/\D/g,''):'',
                    seat:idx.seat>=0?cells[idx.seat]||'':'',
                    origin:this.parseLocation(idx.origin>=0?cells[idx.origin]||'':''),
                    destination:this.parseLocation(idx.destination>=0?cells[idx.destination]||'':'')
                };
            }).filter(Boolean);
        },

        parseLocalities(table) {
            const headers=this.tableHeaders(table);
            const indexOf=patterns=>headers.findIndex(header=>patterns.some(pattern=>header.includes(pattern)));
            const idx={locality:indexOf(['LOCALIDADE']),board:indexOf(['EMBARQUE']),alight:indexOf(['DESEMBARQUE']),balance:indexOf(['SALDO'])};
            const number=value=>{const parsed=Number(String(value??'').replace(/[^\d-]/g,''));return Number.isFinite(parsed)?parsed:null;};
            return Array.from(table?.querySelectorAll?.('tbody tr')||[]).map((row,order)=>{
                const cells=Array.from(row.querySelectorAll('td')).map(td=>EH.Utils.clean(td.textContent));
                if(!cells.length)return null;
                return {
                    order,
                    location:this.parseLocation(idx.locality>=0?cells[idx.locality]||'':''),
                    board:number(idx.board>=0?cells[idx.board]:null),
                    alight:number(idx.alight>=0?cells[idx.alight]:null),
                    balance:number(idx.balance>=0?cells[idx.balance]:null)
                };
            }).filter(Boolean);
        },

        findMapSections(modal) {
            const body=modal?.querySelector?.('.nsm-body')||modal;
            if(!body)return[];
            const metadataCards=Array.from(body.querySelectorAll('.card')).filter(card=>{
                const n=this.normalize(card.textContent||'');
                return n.includes('SERVICO:')&&n.includes('DATA DO SERVICO:')&&n.includes('LINHA:');
            });
            if(!metadataCards.length)return[];

            const sections=[];
            metadataCards.forEach((card,index)=>{
                const nextCard=metadataCards[index+1]||null;
                const section={metadata:this.metadataFromCard(card),passengerTable:null,localityTable:null,sectionIndex:index};
                let node=card.nextElementSibling;
                while(node&&node!==nextCard){
                    const tables=node.matches?.('table')?[node]:Array.from(node.querySelectorAll?.('table')||[]);
                    tables.forEach(table=>{
                        const type=this.tableType(table);
                        if(type==='passengers'&&!section.passengerTable)section.passengerTable=table;
                        else if(type==='localities'&&!section.localityTable)section.localityTable=table;
                    });
                    node=node.nextElementSibling;
                }
                if(!section.passengerTable||!section.localityTable){
                    const allTables=Array.from(body.querySelectorAll('table'));
                    const cardIndex=Array.from(body.querySelectorAll('*')).indexOf(card);
                    const nextIndex=nextCard?Array.from(body.querySelectorAll('*')).indexOf(nextCard):Infinity;
                    allTables.forEach(table=>{
                        const all=Array.from(body.querySelectorAll('*'));
                        const ti=all.indexOf(table);
                        if(ti<=cardIndex||ti>=nextIndex)return;
                        const type=this.tableType(table);
                        if(type==='passengers'&&!section.passengerTable)section.passengerTable=table;
                        else if(type==='localities'&&!section.localityTable)section.localityTable=table;
                    });
                }
                sections.push(section);
            });
            return sections;
        },

        sortPassengers(items=[]) {
            if(!EH.Config.OPERATION_SORT_BY_SEAT)return items.slice();
            return items.slice().sort((a,b)=>{
                const sa=Number(String(a.seat||'').match(/\d+/)?.[0]||9999);
                const sb=Number(String(b.seat||'').match(/\d+/)?.[0]||9999);
                return sa-sb||String(a.name||'').localeCompare(String(b.name||''),'pt-BR');
            });
        },

        agencySummary(passengers=[],localities=[]) {
            const code=this.agencyCode();
            const rows=localities.filter(item=>String(item?.location?.code||'')===code);
            const boarders=this.sortPassengers(passengers.filter(item=>String(item?.origin?.code||'')===code));
            const alighters=this.sortPassengers(passengers.filter(item=>String(item?.destination?.code||'')===code));
            if(!rows.length)return{exists:false,multiple:false,rows:[],row:null,board:null,alight:null,balance:null,boarders,alighters,warning:'',resolution:'not-found',countsMatchPassengers:null,code};

            const distinct=[];const seen=new Set();
            rows.forEach(item=>{
                const signature=[this.normalize(item.location?.raw),item.board,item.alight,item.balance].join('|');
                if(seen.has(signature))return;seen.add(signature);distinct.push(item);
            });
            let selected=null,resolution='exact-code',warning='';
            if(distinct.length===1){selected=distinct[0];if(rows.length>1)resolution='duplicate-dom';}
            else{
                const matches=distinct.filter(item=>Number(item.board)===boarders.length&&Number(item.alight)===alighters.length);
                if(matches.length===1){selected=matches[0];resolution='code-plus-passenger-counts';}
                else {
                    // Alguns mapas reais repetem o MESMO código de agência em localidades diferentes.
                    // Embarque/desembarque podem ser agregados SOMENTE quando a soma fecha exatamente
                    // com a tabela individual de passageiros do código. Saldo nunca é somado aqui.
                    const movementKnown=distinct.every(item=>Number.isFinite(Number(item.board))&&Number.isFinite(Number(item.alight)));
                    const totalBoard=movementKnown?distinct.reduce((sum,item)=>sum+Number(item.board||0),0):null;
                    const totalAlight=movementKnown?distinct.reduce((sum,item)=>sum+Number(item.alight||0),0):null;
                    if(movementKnown&&totalBoard===boarders.length&&totalAlight===alighters.length){
                        return{
                            exists:true,multiple:false,rows,row:null,board:totalBoard,alight:totalAlight,balance:null,
                            balanceRows:distinct.map(item=>({ locality:EH.Utils.clean(item.location?.raw||''), balance:item.balance })),
                            boarders,alighters,
                            warning:`Código ${code} aparece em ${distinct.length} linhas. Embarques/desembarques foram agregados porque conferem com a tabela de passageiros; os saldos permanecem separados.`,
                            resolution:'aggregate-code-passenger-counts',code,
                            matchedLocality:distinct.map(item=>EH.Utils.clean(item.location?.raw||'')).filter(Boolean).join(' • '),
                            countsMatchPassengers:true
                        };
                    }
                    warning=`Mais de um registro diferente com código ${code} foi encontrado e nenhum pôde ser confirmado com segurança pelos passageiros do código ${code}.`;
                }
            }
            if(!selected)return{exists:true,multiple:true,rows,row:null,board:null,alight:null,balance:null,balanceRows:distinct.map(item=>({locality:EH.Utils.clean(item.location?.raw||''),balance:item.balance})),boarders,alighters,warning,resolution:'ambiguous',countsMatchPassengers:null,code};
            return{
                exists:true,multiple:false,rows,row:selected,board:selected.board,alight:selected.alight,balance:selected.balance,balanceRows:[{locality:EH.Utils.clean(selected.location?.raw||''),balance:selected.balance}],
                boarders,alighters,warning,resolution,code,matchedLocality:EH.Utils.clean(selected.location?.raw||''),
                countsMatchPassengers:Number(selected.board)===boarders.length&&Number(selected.alight)===alighters.length
            };
        },

        scheduleCandidates(meta) {
            const date = meta?.serviceDate || this.todayKey();
            const map = new Map();
            [...(this.visibleScheduleRecords||[]),...this.loadScheduleRecords()].forEach(item => {
                if (String(item?.service||'') !== String(meta?.service||'')) return;
                if (date && item.date && item.date !== date) return;
                const key=String(item.resultKey||[item.service,item.date,item.departure,this.normalize(item.lineRaw),this.normalize(item.floor)].join('|'));
                if(!map.has(key))map.set(key,item);
            });
            return Array.from(map.values()).sort((a,b)=>{
                const lineA=meta?.line?.code&&this.normalize(a.lineCode||'')===this.normalize(meta.line.code)?0:1;
                const lineB=meta?.line?.code&&this.normalize(b.lineCode||'')===this.normalize(meta.line.code)?0:1;
                return lineA-lineB||this.timeDistance(a.time,meta?.lineDeparture)-this.timeDistance(b.time,meta?.lineDeparture)||Number(a.rowIndex||0)-Number(b.rowIndex||0);
            });
        },

        scheduleForMap(meta) {
            const rows=this.scheduleCandidates(meta);
            const selected=this.selectedCar();
            if(selected?.service===meta?.service){
                const exact=rows.find(item=>selected.resultKey&&item.resultKey===selected.resultKey);
                if(exact)return exact;
            }
            if(meta?.line?.code){
                const exactLine=rows.find(item=>this.normalize(item.lineCode||'')===this.normalize(meta.line.code));
                if(exactLine)return exactLine;
            }
            return rows[0]||null;
        },

        assignSchedulesToSections(sections=[]) {
            const assignments=new Array(sections.length).fill(null);
            const used=new Set();
            const selected=this.selectedCar();
            sections.forEach((section,index)=>{
                const meta=section?.metadata||{};
                const candidates=this.scheduleCandidates(meta);
                if(!candidates.length)return;
                const sameServiceSections=sections.filter(other=>String(other?.metadata?.service||'')===String(meta.service||'')&&String(other?.metadata?.serviceDate||'')===String(meta.serviceDate||''));
                // Quando somente um mapa/andar está aberto, respeita exatamente o resultado clicado.
                if(sameServiceSections.length===1&&selected?.service===meta.service){
                    const exact=candidates.find(item=>selected.resultKey&&item.resultKey===selected.resultKey);
                    if(exact){assignments[index]=exact;used.add(String(exact.resultKey||''));return;}
                }
                let pool=candidates;
                if(meta?.line?.code){
                    const sameLine=candidates.filter(item=>this.normalize(item.lineCode||'')===this.normalize(meta.line.code));
                    if(sameLine.length)pool=sameLine;
                }
                const unused=pool.find(item=>!used.has(String(item.resultKey||'')))||pool[0];
                assignments[index]=unused||null;
                if(unused?.resultKey)used.add(String(unused.resultKey));
            });
            return assignments;
        },

        buildRecord(section, scheduleOverride = null) {
            const meta=section.metadata;
            const passengers=section.passengerTable?this.parsePassengers(section.passengerTable):[];
            const localities=section.localityTable?this.parseLocalities(section.localityTable):[];
            const agency=this.agencySummary(passengers,localities);
            const schedule=scheduleOverride||this.scheduleForMap(meta);
            const routine=schedule?this.routineForSchedule(schedule):this.routineForService(meta.service,meta.serviceDate);
            const lineToken=meta.line?.code||this.normalize(meta.line?.raw)||'SEM-LINHA';
            const sectionToken=schedule?.floor?this.normalize(schedule.floor):`secao-${Number(section.sectionIndex||0)+1}`;
            return{
                mapKey:[meta.serviceDate,meta.service,lineToken,meta.lineDeparture,sectionToken].filter(Boolean).join('|'),
                date:meta.serviceDate,dateBr:meta.serviceDateBr,service:meta.service,
                lineCode:meta.line?.code||'',lineRaw:meta.line?.raw||'',lineOrigin:meta.line?.origin||null,lineDestination:meta.line?.destination||null,
                lineDeparture:meta.lineDeparture||'',agencySource:meta.agency||'',agency,
                floor:EH.Utils.clean(schedule?.floor||''),scheduleResultKey:schedule?.resultKey||'',
                operationalTime:routine?.operationalTime||schedule?.time||'',routineId:routine?.id||'',
                operationalName:routine?.name||'',companyCode:schedule?.companyCode||'',company:schedule?.company||'',
                queryOrigin:schedule?.queryOrigin||'',queryDestination:schedule?.queryDestination||'',
                sectionIndex:Number(section.sectionIndex||0),updatedAt:Date.now()
            };
        },

        readVehicleMap() {
            const modal=EH.Utils.first(EH.Selectors.MAPA_VIAGEM_MODAL);
            if(!modal){
                this.lastMapModal=null;
                this.lastMapDomFingerprint='';
                this.lastMapDomRecords=[];
                return[];
            }
            const fingerprint=EH.Utils.clean(modal.textContent||'').slice(0,40000);
            if(this.lastMapModal===modal&&this.lastMapDomFingerprint===fingerprint&&this.lastMapDomRecords.length){
                return this.lastMapDomRecords;
            }
            const sections=this.findMapSections(modal);
            const schedules=this.assignSchedulesToSections(sections);
            const records=sections.map((section,index)=>this.buildRecord(section,schedules[index]||null)).filter(record=>record.date&&record.service);
            this.lastMapModal=modal;
            this.lastMapDomFingerprint=fingerprint;
            this.lastMapDomRecords=records;
            return records;
        },

        parseCurrentMap() {
            return this.readVehicleMap();
        },

        mapSignature(records=[]) {
            return records.map(record=>{
                const agency=record.agency||{};
                const tickets=[...(agency.boarders||[]),...(agency.alighters||[])].map(item=>item.ticket).filter(Boolean).sort().join(',');
                return[record.mapKey,agency.exists,agency.multiple,agency.board,agency.alight,agency.balance,tickets].join('~');
            }).join('||');
        },

        loadMaps() {
            const records=EH.Storage.get(this.MAPS_KEY,[]);
            return Array.isArray(records)?records:[];
        },

        saveMaps(newRecords=[]) {
            const existing=this.loadMaps();
            const map=new Map(existing.map(item=>[String(item.mapKey||''),item]));
            newRecords.forEach(record=>{if(record?.mapKey)map.set(record.mapKey,record);});
            const min=new Date();min.setDate(min.getDate()-7);const minKey=this.todayKey(min);
            const records=Array.from(map.values()).filter(item=>!item.date||item.date>=minKey).sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0)).slice(0,100);
            EH.Storage.set(this.MAPS_KEY,records);return records;
        },

        mapsForService(service,date=this.todayKey()) {
            return this.loadMaps().filter(record=>String(record.service||'')===String(service||'')&&(!date||record.date===date)).sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0));
        },

        selectedMapRecord() {
            const selected=this.selectedCar();
            if(!selected?.service)return null;
            const records=this.mapsForService(selected.service,selected.date||this.todayKey());
            if(selected.floor){
                const exact=records.find(record=>this.normalize(record.floor||'')===this.normalize(selected.floor));
                if(exact)return exact;
            }
            if(selected.resultKey){
                const exact=records.find(record=>record.scheduleResultKey===selected.resultKey);
                if(exact)return exact;
            }
            return records[0]||null;
        },

        rememberLast(record) {
            if(!record?.mapKey)return;
            this.lastMapKey=record.mapKey;EH.Storage.set(this.LAST_KEY,{date:record.date,mapKey:record.mapKey});
        },

        lastRecord() {
            const today=this.todayKey();
            const maps=this.loadMaps().filter(record=>record.date===today);
            const stored=EH.Storage.get(this.LAST_KEY,null);
            const key=this.lastMapKey||(stored?.date===today?stored?.mapKey:'');
            if(key){const found=maps.find(record=>record.mapKey===key);if(found)return found;}
            return maps[0]||null;
        },

        displayName(record) {
            if(record?.operationalName)return record.operationalName;
            const routine=this.routineForService(record?.service,record?.date||this.todayKey());
            if(routine?.name)return routine.name;
            const origin=this.shortLocation(record?.lineOrigin),destination=this.shortLocation(record?.lineDestination);
            return[origin,destination].filter(Boolean).join(' → ')||`Serviço ${record?.service||'—'}`;
        },

        preferredRecord(records=[]) {
            if(!records.length)return null;
            const selected=this.selectedCar();
            if(selected?.service){
                const same=records.filter(r=>String(r.service)===String(selected.service));
                if(selected.floor){
                    const exact=same.find(r=>this.normalize(r.floor||'')===this.normalize(selected.floor));
                    if(exact)return exact;
                }
                if(same[0])return same[0];
            }
            return records[0]||null;
        },

        scanCurrentMap({quiet=false}={}) {
            const records=this.readVehicleMap();
            if(!records.length){
                if(!quiet)EH.Toast.warning('Abra o Mapa de Viagem para atualizar o código 287.');
                return{found:false,updated:false,records:[]};
            }
            const signature=this.mapSignature(records);
            const preferred=this.preferredRecord(records);
            const changed=signature!==this.lastDomSignature;
            if(changed){
                this.lastDomSignature=signature;
                this.saveMaps(records);
            }
            if(preferred){
                this.rememberLast(preferred);
                const schedule=this.scheduleForMap({
                    service:preferred.service,serviceDate:preferred.date,lineDeparture:preferred.lineDeparture,
                    line:{code:preferred.lineCode,raw:preferred.lineRaw}
                });
                if(schedule)this.selectCar(schedule,{quiet:true});
                EH.Reminders?.linkMapRecord?.(preferred);
            }
            this.render();
            if(!quiet&&preferred){
                const agency=preferred.agency||{};
                if(!agency.exists)EH.Toast.info(`Serviço ${preferred.service} • código ${this.agencyCode()} não aparece no resumo do mapa.`);
                else if(agency.multiple)EH.Toast.warning(`Serviço ${preferred.service} • ${agency.warning||`mais de um registro da agência ${this.agencyCode()}.`}`);
                else EH.Toast.success(`Serviço ${preferred.service} • Agência ${this.agencyCode()}: ↑ ${agency.board??'—'} • ↓ ${agency.alight??'—'} • 🚌 ${agency.balance??'—'}`);
            }
            return{found:true,updated:changed,records};
        },

        seatLabel(value) {
            const text=EH.Utils.clean(value||'—');const n=Number(String(text).match(/\d+/)?.[0]);
            return Number.isFinite(n)?String(n).padStart(2,'0'):text;
        },

        passengerSecondary(item,kind) {
            if(kind==='board')return`→ ${this.shortLocation(item?.destination)||'Destino não identificado'}`;
            if(kind==='alight')return`${this.shortLocation(item?.origin)||'Origem não identificada'} → ${this.shortLocation(item?.destination)||'destino'}`;
            return`${this.shortLocation(item?.origin)} → ${this.shortLocation(item?.destination)}`;
        },

        resolveRecord(recordOrService) {
            if(recordOrService?.mapKey)return recordOrService;
            if(typeof recordOrService==='string')return this.mapsForService(recordOrService)[0]||null;
            return this.lastRecord();
        },

        showPassengers(recordOrService,kind='board') {
            const record=this.resolveRecord(recordOrService);
            if(!record){EH.Toast.warning('O mapa deste carro ainda não foi atualizado.');return;}
            const agency=record.agency||{};
            if(!agency.exists){EH.Toast.info(`Código ${this.agencyCode()} não aparece no resumo deste mapa.`);return;}
            if(agency.multiple){EH.Toast.warning(agency.warning||`Mais de um registro da agência ${this.agencyCode()} encontrado.`);return;}
            const items=kind==='alight'?(agency.alighters||[]):(agency.boarders||[]);
            document.querySelector('#eh-operation-passengers-modal')?.remove();
            const overlay=document.createElement('div');overlay.id='eh-operation-passengers-modal';overlay.className='eh-overlay eh-operation-overlay';
            const modal=document.createElement('div');modal.className='eh-modal eh-operation-modal';
            const head=document.createElement('div');head.className='eh-modal-head';
            const headText=document.createElement('div');headText.style.flex='1';
            const title=document.createElement('div');title.className='eh-modal-title';title.textContent=kind==='alight'?`DESEMBARQUES — AGÊNCIA ${this.agencyCode()}`:`EMBARQUES — AGÊNCIA ${this.agencyCode()}`;
            const note=document.createElement('div');note.className='eh-modal-note';
            note.textContent=`${record.operationalTime||record.lineDeparture||'—'} • ${this.displayName(record)} • Serviço ${record.service}${record.floor?` • ${record.floor}`:''}`;
            headText.append(title,note);const close=document.createElement('button');close.type='button';close.className='eh-modal-close';close.textContent='×';head.append(headText,close);
            const content=document.createElement('div');content.className='eh-modal-content eh-operation-passenger-list';
            if(!items.length){
                const empty=document.createElement('div');empty.className='eh-operation-empty';
                empty.textContent=kind==='alight'?`Nenhum passageiro com destino associado ao código ${this.agencyCode()} foi encontrado.`:`Nenhum passageiro com origem associada ao código ${this.agencyCode()} foi encontrado.`;
                content.appendChild(empty);
            }else items.forEach(item=>{
                const row=document.createElement('div');row.className='eh-operation-passenger';
                const seat=document.createElement('strong');seat.className='eh-operation-seat';seat.textContent=this.seatLabel(item.seat);
                const info=document.createElement('div');info.className='eh-operation-passenger-info';
                const name=document.createElement('strong');name.textContent=item.name||'Passageiro sem nome';
                const route=document.createElement('small');route.textContent=this.passengerSecondary(item,kind);info.append(name,route);
                const reminder=EH.Reminders?.matchPassenger?.(item,record);
                if(reminder){const pending=document.createElement('small');pending.className=`eh-operation-reminder-state ${EH.Reminders.isDoneStatus(reminder.status)?'done':'pending'}`;pending.textContent=EH.Reminders.isDoneStatus(reminder.status)?'✓ Bilhete já impresso/concluído':`⚠ Precisa imprimir passagem${reminder.cpf?` • CPF ${EH.Reminders.maskCpf(reminder.cpf)}`:''}`;info.appendChild(pending);}
                const quick=document.createElement('div');quick.className='eh-operation-detail-actions';
                const cpfBtn=document.createElement('button');cpfBtn.className='eh-modal-btn';cpfBtn.textContent='CPF';cpfBtn.addEventListener('click',()=>EH.TicketVerificationQueue.copyCpf(item));
                const ticketBtn=document.createElement('button');ticketBtn.className='eh-modal-btn primary';ticketBtn.textContent='Ver passagem';ticketBtn.addEventListener('click',()=>{const queue=EH.TicketVerificationQueue.fromRecords([record],kind,{date:record.date,operationalTime:record.operationalTime,name:this.displayName(record),routineId:record.routineId});const active=EH.TicketVerificationQueue.activeList(queue);const target=active.find(p=>p.cpf&&p.cpf===String(item.cpf||'').replace(/\D/g,'').slice(0,11))||active.find(p=>p.seat===EH.Utils.clean(item.seat||''));if(target)EH.TicketVerificationQueue.search(target);});quick.append(cpfBtn,ticketBtn);info.appendChild(quick);
                row.append(seat,info);content.appendChild(row);
            });
            const foot=document.createElement('div');foot.className='eh-modal-actions';const close2=document.createElement('button');close2.className='eh-modal-btn';close2.textContent='Fechar';foot.append(close2);
            modal.append(head,content,foot);overlay.append(modal);document.body.append(overlay);
            const dismiss=()=>overlay.remove();close.addEventListener('click',dismiss);close2.addEventListener('click',dismiss);overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss();});
        },

        showDetails(recordOrService) {
            const record=this.resolveRecord(recordOrService);
            if(!record){EH.Toast.warning('Este serviço ainda não teve um mapa lido hoje.');return;}
            document.querySelector('#eh-operation-details-modal')?.remove();
            const agency=record.agency||{};
            const overlay=document.createElement('div');overlay.id='eh-operation-details-modal';overlay.className='eh-overlay eh-operation-overlay';
            const modal=document.createElement('div');modal.className='eh-modal eh-operation-modal';
            const head=document.createElement('div');head.className='eh-modal-head';
            const titleWrap=document.createElement('div');titleWrap.style.flex='1';
            const title=document.createElement('div');title.className='eh-modal-title';title.textContent=`Serviço ${record.service} — ${this.displayName(record)}`;
            const note=document.createElement('div');note.className='eh-modal-note';note.textContent=[record.dateBr||record.date,record.floor,record.lineCode?`Linha ${record.lineCode}`:''].filter(Boolean).join(' • ');
            titleWrap.append(title,note);const close=document.createElement('button');close.className='eh-modal-close';close.textContent='×';head.append(titleWrap,close);
            const content=document.createElement('div');content.className='eh-modal-content';
            const summary=document.createElement('div');summary.className='eh-operation-detail-summary';const h=document.createElement('strong');h.textContent=`AGÊNCIA ${this.agencyCode()}`;summary.append(h);
            if(!agency.exists){const empty=document.createElement('div');empty.className='eh-operation-empty';empty.textContent=`Código ${this.agencyCode()} não aparece no resumo deste mapa.`;summary.append(empty);}
            else if(agency.multiple){const warning=document.createElement('div');warning.className='eh-operation-warning';warning.textContent=`⚠ ${agency.warning}`;summary.append(warning);}
            else{
                const metrics=document.createElement('div');metrics.className='eh-operation-detail-metrics';
                [['↑ Embarques',agency.board],['↓ Desembarques',agency.alight],['🚌 Saldo',agency.balance]].forEach(([label,value])=>{const cell=document.createElement('div');cell.textContent=label;const strong=document.createElement('strong');strong.textContent=value??'—';cell.append(strong);metrics.append(cell);});
                summary.append(metrics);
                const actions=document.createElement('div');actions.className='eh-operation-detail-actions';
                const b=document.createElement('button');b.className='eh-modal-btn';b.textContent='↑ Ver embarques';b.addEventListener('click',()=>this.showPassengers(record,'board'));
                const a=document.createElement('button');a.className='eh-modal-btn';a.textContent='↓ Ver desembarques';a.addEventListener('click',()=>this.showPassengers(record,'alight'));actions.append(b,a);summary.append(actions);
            }
            content.append(summary);
            const foot=document.createElement('div');foot.className='eh-modal-actions';const close2=document.createElement('button');close2.className='eh-modal-btn';close2.textContent='Fechar';foot.append(close2);
            modal.append(head,content,foot);overlay.append(modal);document.body.append(overlay);
            const dismiss=()=>overlay.remove();close.addEventListener('click',dismiss);close2.addEventListener('click',dismiss);overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss();});
        },

        mapForSchedule(item) {
            const maps=this.mapsForService(item?.service,item?.date||this.todayKey());
            if(item?.floor){
                const exact=maps.find(record=>this.normalize(record.floor||'')===this.normalize(item.floor));
                if(exact)return exact;
            }
            if(item?.resultKey){
                const exact=maps.find(record=>record.scheduleResultKey===item.resultKey);
                if(exact)return exact;
            }
            return maps[0]||null;
        },

        vehicleGroups(date=this.todayKey()) {
            return this.routineStates(date).map(state=>{
                const maps=[];state.matches.forEach(schedule=>{this.mapsForService(schedule.service,date).forEach(record=>{if(schedule.resultKey&&record.scheduleResultKey&&record.scheduleResultKey!==schedule.resultKey)return;if(!maps.some(x=>x.mapKey===record.mapKey))maps.push(record);});});
                const valid=maps.filter(record=>record?.agency?.exists&&!record?.agency?.multiple);
                return {routine:state.routine,schedules:state.matches,maps,board:valid.reduce((sum,r)=>sum+Number(r.agency.board||0),0),alight:valid.reduce((sum,r)=>sum+Number(r.agency.alight||0),0),hasMap:maps.length>0,hasAgency:valid.length>0};
            });
        },
        groupForRecord(record){if(!record)return null;const groups=this.vehicleGroups(record.date||this.todayKey());return groups.find(g=>g.maps.some(m=>m.mapKey===record.mapKey)||g.schedules.some(s=>String(s.service)===String(record.service)))||null;},
        showGroupPassengers(group,kind='board') { if(!group?.maps?.length)return EH.Toast.info('Nenhum mapa deste horário foi lido.'); const records=group.maps.filter(r=>r?.agency?.exists&&!r?.agency?.multiple); const q=EH.TicketVerificationQueue.fromRecords(records,kind,{date:records[0]?.date,operationalTime:group.routine?.operationalTime,name:group.routine?.name,routineId:group.routine?.id}); if(!EH.TicketVerificationQueue.activeList(q).length)return EH.Toast.info(`Nenhum ${kind==='alight'?'desembarque':'embarque'} da agência ${this.agencyCode()} encontrado nos mapas lidos.`); this.showPassengersCombined(records,kind,group); },
        showPassengersCombined(records=[],kind='board',group=null){
            document.querySelector('#eh-operation-passengers-modal')?.remove();const overlay=document.createElement('div');overlay.id='eh-operation-passengers-modal';overlay.className='eh-overlay eh-operation-overlay';const modal=document.createElement('div');modal.className='eh-modal eh-operation-modal';const head=document.createElement('div');head.className='eh-modal-head';const title=document.createElement('div');title.className='eh-modal-title';title.textContent=`${kind==='alight'?'DESEMBARQUES':'EMBARQUES'} — ${group?.routine?.operationalTime||'—'} — AGÊNCIA ${this.agencyCode()}`;const close=document.createElement('button');close.className='eh-modal-close';close.textContent='×';head.append(title,close);const content=document.createElement('div');content.className='eh-modal-content eh-operation-passenger-list';
            const items=[];records.forEach(record=>(kind==='alight'?(record.agency.alighters||[]):(record.agency.boarders||[])).forEach(item=>items.push({item,record})));items.sort((a,b)=>Number(a.item.seat||999)-Number(b.item.seat||999));items.forEach(({item,record})=>{const row=document.createElement('div');row.className='eh-operation-passenger';const seat=document.createElement('strong');seat.className='eh-operation-seat';seat.textContent=this.seatLabel(item.seat);const info=document.createElement('div');info.className='eh-operation-passenger-info';const name=document.createElement('strong');name.textContent=item.name||'Passageiro';const route=document.createElement('small');route.textContent=`${this.passengerSecondary(item,kind)}${record.floor?` • ${record.floor}`:''} • Serviço ${record.service}`;const reminder=EH.Reminders?.matchPassenger?.(item,record);if(reminder){const state=document.createElement('small');state.className=`eh-operation-reminder-state ${EH.Reminders.isDoneStatus(reminder.status)?'done':'pending'}`;state.textContent=EH.Reminders.isDoneStatus(reminder.status)?'✓ Bilhete impresso/concluído':'⚠ Impressão pendente';info.append(name,route,state);}else info.append(name,route);const buttons=document.createElement('div');buttons.className='eh-operation-detail-actions';const cpf=document.createElement('button');cpf.className='eh-modal-btn';cpf.textContent='CPF';cpf.addEventListener('click',()=>EH.TicketVerificationQueue.copyCpf(item));const ver=document.createElement('button');ver.className='eh-modal-btn primary';ver.textContent='Ver passagem';ver.addEventListener('click',()=>{const q=EH.TicketVerificationQueue.fromRecords(records,kind,{date:record.date,operationalTime:group?.routine?.operationalTime,name:group?.routine?.name,routineId:group?.routine?.id});const target=EH.TicketVerificationQueue.activeList(q).find(p=>p.cpf&&p.cpf===String(item.cpf||'').replace(/\\D/g,'').slice(0,11));if(target)EH.TicketVerificationQueue.search(target);});buttons.append(cpf,ver);info.append(buttons);row.append(seat,info);content.append(row);});const foot=document.createElement('div');foot.className='eh-modal-actions';const queueBtn=document.createElement('button');queueBtn.className='eh-modal-btn primary';queueBtn.textContent='Abrir fila de conferência';queueBtn.addEventListener('click',()=>{EH.TicketVerificationQueue.fromRecords(records,kind,{date:records[0]?.date,operationalTime:group?.routine?.operationalTime,name:group?.routine?.name,routineId:group?.routine?.id});EH.SaleContext.navigateToPassagens();});const close2=document.createElement('button');close2.className='eh-modal-btn';close2.textContent='Fechar';foot.append(queueBtn,close2);modal.append(head,content,foot);overlay.append(modal);document.body.append(overlay);const dismiss=()=>overlay.remove();close.onclick=dismiss;close2.onclick=dismiss;overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss();});
        },

        showCarSearch() {
            document.querySelector('#eh-operation-car-search')?.remove();
            const overlay=document.createElement('div');overlay.id='eh-operation-car-search';overlay.className='eh-overlay eh-operation-overlay';
            const modal=document.createElement('div');modal.className='eh-modal eh-operation-modal';
            const head=document.createElement('div');head.className='eh-modal-head';const title=document.createElement('div');title.className='eh-modal-title';title.textContent='🔎 Pesquisar carro';const close=document.createElement('button');close.className='eh-modal-close';close.textContent='×';head.append(title,close);
            const content=document.createElement('div');content.className='eh-modal-content';
            const toolbar=document.createElement('div');toolbar.className='eh-operation-car-search-toolbar';
            const input=document.createElement('input');input.type='search';input.placeholder='Serviço, horário, linha, empresa…';input.autocomplete='off';
            const refresh=document.createElement('button');refresh.className='eh-modal-btn';refresh.textContent='Ler resultados da tela';toolbar.append(input,refresh);
            const status=document.createElement('div');status.className='eh-modal-note';status.style.margin='8px 0';const list=document.createElement('div');list.className='eh-operation-day-list';content.append(toolbar,status,list);
            const renderRows=()=>{
                const rows=this.searchScheduleRecords(input.value);
                status.textContent=rows.length?`${rows.length} resultado(s) do dia.`:'Nenhum carro encontrado. Faça uma pesquisa de horários no E-Pass.';
                list.innerHTML='';
                rows.forEach(item=>{
                    const routine=this.routineForSchedule(item),mapRecord=this.mapForSchedule(item);
                    const row=document.createElement('div');row.className='eh-operation-day-row';
                    const marker=document.createElement('div');marker.className='eh-operation-day-status';marker.textContent=mapRecord?'✓':'○';
                    const info=document.createElement('div');info.className='eh-operation-day-info';
                    const top=document.createElement('strong');top.textContent=`${item.time||'—'} • ${routine?.name||item.lineRaw||`Serviço ${item.service}`}`;
                    const sub=document.createElement('small');sub.textContent=[`Serviço ${item.service}`,item.floor,item.lineCode?`Linha ${item.lineCode}`:'',item.company||item.companyCode].filter(Boolean).join(' • ');
                    const map=document.createElement('small');
                    if(!mapRecord)map.textContent=`Mapa ainda não consultado • Agência ${this.agencyCode()} aguardando mapa`;
                    else if(!mapRecord.agency?.exists)map.textContent=`Mapa lido • Agência ${this.agencyCode()} não encontrada`;
                    else if(mapRecord.agency?.multiple)map.textContent=`⚠ ${mapRecord.agency.warning||'Leitura 287 ambígua'}`;
                    else map.textContent=`↑ ${mapRecord.agency.board??'—'} ↓ ${mapRecord.agency.alight??'—'} 🚌 ${mapRecord.agency.balance??'—'} • ${this.formatUpdatedAt(mapRecord.updatedAt)}`;
                    info.append(top,sub,map);
                    const actions=document.createElement('div');actions.className='eh-operation-search-actions';
                    const canOpen=Boolean(this.mapButtons.get(String(item.resultKey||''))?.isConnected);
                    const choose=document.createElement('button');choose.className='eh-modal-btn primary';choose.textContent=canOpen?'Abrir mapa':'Selecionar';choose.addEventListener('click',()=>{if(canOpen)this.openScheduleMap(item);else this.selectCar(item);dismiss();});actions.append(choose);
                    if(mapRecord){const detail=document.createElement('button');detail.className='eh-modal-btn';detail.textContent='Detalhes';detail.addEventListener('click',()=>this.showDetails(mapRecord));actions.append(detail);}
                    row.append(marker,info,actions);list.append(row);
                });
            };
            input.addEventListener('input',renderRows);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderRows();}});
            refresh.addEventListener('click',()=>{this.readScheduleResults();renderRows();EH.Toast.info('Resultados relidos.');});
            const foot=document.createElement('div');foot.className='eh-modal-actions';const clear=document.createElement('button');clear.className='eh-modal-btn';clear.textContent='Limpar selecionado';clear.addEventListener('click',()=>this.clearSelectedCar());const close2=document.createElement('button');close2.className='eh-modal-btn';close2.textContent='Fechar';foot.append(clear,close2);
            modal.append(head,content,foot);overlay.append(modal);document.body.append(overlay);
            const dismiss=()=>overlay.remove();close.addEventListener('click',dismiss);close2.addEventListener('click',dismiss);overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss();});renderRows();input.focus();
        },

        otherMapsWithAgency() {
            const assignedServices=new Set(this.routineStates().flatMap(state=>state.matches.map(item=>String(item.service))));
            return this.loadMaps().filter(record=>{
                if(record.date!==this.todayKey())return false;
                if(assignedServices.has(String(record.service)))return false;
                if(!record.agency?.exists||record.agency?.multiple)return false;
                return Number(record.agency.board||0)>0||Number(record.agency.alight||0)>0;
            });
        },

        showCars() {
            document.querySelector('#eh-operation-cars-modal')?.remove();
            const overlay=document.createElement('div');overlay.id='eh-operation-cars-modal';overlay.className='eh-overlay eh-operation-overlay';
            const modal=document.createElement('div');modal.className='eh-modal eh-operation-modal';
            const head=document.createElement('div');head.className='eh-modal-head';const titleWrap=document.createElement('div');titleWrap.style.flex='1';
            const title=document.createElement('div');title.className='eh-modal-title';title.textContent='CARROS DO DIA';
            const note=document.createElement('div');note.className='eh-modal-note';note.textContent=`Horários configuráveis • Serviço detectado da pesquisa do dia • Agência ${this.agencyCode()}`;titleWrap.append(title,note);
            const close=document.createElement('button');close.className='eh-modal-close';close.textContent='×';head.append(titleWrap,close);
            const content=document.createElement('div');content.className='eh-modal-content eh-operation-day-list';
            const groupTitle=document.createElement('div');groupTitle.className='eh-operation-group-title';groupTitle.textContent='CARROS PRINCIPAIS';content.append(groupTitle);
            this.routineStates().forEach(state=>{
                const row=document.createElement('div');row.className='eh-operation-day-row';
                const status=document.createElement('div');status.className='eh-operation-day-status';status.textContent=state.matches.some(m=>this.mapForSchedule(m))?'✓':state.matches.length?'▶':'○';
                const info=document.createElement('div');info.className='eh-operation-day-info';
                const top=document.createElement('strong');top.textContent=`${state.routine.operationalTime} • ${state.routine.name}`;
                const sub=document.createElement('small');
                if(!state.matches.length)sub.textContent='Serviço hoje: aguardando pesquisa de horários';
                else sub.textContent=`Serviço${state.matches.length>1?'s':''} hoje: ${state.matches.map(m=>`${m.service}${m.floor?` (${m.floor})`:''}`).join(' • ')}`;
                info.append(top,sub);
                state.matches.forEach(item=>{
                    const map=this.mapForSchedule(item);const detail=document.createElement('small');
                    if(!map)detail.textContent=`#${item.service}${item.floor?` • ${item.floor}`:''} • Agência ${this.agencyCode()} aguardando mapa`;
                    else if(!map.agency?.exists)detail.textContent=`#${item.service} • Agência ${this.agencyCode()} não encontrada`;
                    else if(map.agency?.multiple)detail.textContent=`#${item.service} • ⚠ leitura 287 ambígua`;
                    else if(map.agency?.resolution==='aggregate-code-passenger-counts')detail.textContent=`#${item.service}${item.floor?` • ${item.floor}`:''} • ↑ ${map.agency.board??'—'} ↓ ${map.agency.alight??'—'} • 🚌 saldos separados`;
                    else detail.textContent=`#${item.service}${item.floor?` • ${item.floor}`:''} • ↑ ${map.agency.board??'—'} ↓ ${map.agency.alight??'—'} 🚌 ${map.agency.balance??'—'}`;
                    info.append(detail);
                });
                const validMaps=state.matches.map(item=>this.mapForSchedule(item)).filter(map=>map?.agency?.exists&&!map.agency.multiple);
                if(validMaps.length){
                    if(validMaps.length>1){
                        const total=document.createElement('small');total.className='eh-operation-total-movement';
                        const boardTotal=validMaps.reduce((sum,map)=>sum+Number(map.agency.board||0),0);
                        const alightTotal=validMaps.reduce((sum,map)=>sum+Number(map.agency.alight||0),0);
                        total.textContent=`Total de movimento na ${this.agencyCode()}: ↑ ${boardTotal} ↓ ${alightTotal} • saldos preservados por mapa/andar`;
                        info.append(total);
                    }
                    const quick=document.createElement('div');quick.className='eh-operation-detail-actions';
                    const group={routine:state.routine,schedules:state.matches,maps:validMaps};
                    const boardBtn=document.createElement('button');boardBtn.className='eh-modal-btn';boardBtn.textContent=`↑ Embarques (${validMaps.reduce((sum,map)=>sum+Number(map.agency.board||0),0)})`;boardBtn.addEventListener('click',event=>{event.stopPropagation();this.showGroupPassengers(group,'board');});
                    const alightBtn=document.createElement('button');alightBtn.className='eh-modal-btn';alightBtn.textContent=`↓ Desembarques (${validMaps.reduce((sum,map)=>sum+Number(map.agency.alight||0),0)})`;alightBtn.addEventListener('click',event=>{event.stopPropagation();this.showGroupPassengers(group,'alight');});
                    quick.append(boardBtn,alightBtn);info.append(quick);
                }
                const action=document.createElement('button');action.className='eh-modal-btn';
                const canOpen=Boolean(state.primary&&this.mapButtons.get(String(state.primary.resultKey||''))?.isConnected);
                action.textContent=state.primary?(canOpen?'Abrir mapa':'Selecionar'):'Aguardando';
                action.disabled=!state.primary;
                action.addEventListener('click',()=>{if(!state.primary)return;if(canOpen)this.openScheduleMap(state.primary);else this.selectCar(state.primary);});
                row.append(status,info,action);content.append(row);
            });
            const others=this.otherMapsWithAgency();
            if(others.length){
                const gt=document.createElement('div');gt.className='eh-operation-group-title';gt.textContent='OUTROS CARROS COM MOVIMENTO NA 287';content.append(gt);
                others.forEach(record=>{
                    const row=document.createElement('div');row.className='eh-operation-day-row';const status=document.createElement('div');status.className='eh-operation-day-status';status.textContent='•';
                    const info=document.createElement('div');info.className='eh-operation-day-info';const top=document.createElement('strong');top.textContent=`Serviço ${record.service} • ${this.displayName(record)}`;
                    const metrics=document.createElement('small');metrics.textContent=`↑ ${record.agency.board??'—'} ↓ ${record.agency.alight??'—'} 🚌 ${record.agency.balance??'—'}`;info.append(top,metrics);
                    const action=document.createElement('button');action.className='eh-modal-btn';action.textContent='Ver';action.addEventListener('click',()=>this.showDetails(record));row.append(status,info,action);content.append(row);
                });
            }
            const foot=document.createElement('div');foot.className='eh-modal-actions';
            const refresh=document.createElement('button');refresh.className='eh-modal-btn primary';refresh.textContent='↻ Ler pesquisa atual';refresh.addEventListener('click',()=>{this.readScheduleResults();overlay.remove();this.showCars();});
            const settings=document.createElement('button');settings.className='eh-modal-btn';settings.textContent='⚙ Configurar horários';settings.addEventListener('click',()=>{overlay.remove();EH.Storage.set('settingsTab','carros');EH.UI.showSettings();});
            const close2=document.createElement('button');close2.className='eh-modal-btn';close2.textContent='Fechar';foot.append(refresh,settings,close2);
            modal.append(head,content,foot);overlay.append(modal);document.body.append(overlay);
            const dismiss=()=>overlay.remove();close.addEventListener('click',dismiss);close2.addEventListener('click',dismiss);overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss();});
        },

        nextRoutineState() {
            const states=this.routineStates();
            if(!states.length)return null;
            const now=new Date(),current=now.getHours()*60+now.getMinutes();
            const ordered=states.map(state=>({...state,minutes:this.timeMinutes(state.routine.operationalTime)})).filter(s=>s.minutes!==null).sort((a,b)=>a.minutes-b.minutes);
            return ordered.find(state=>state.minutes>=current)||ordered[0]||null;
        },

        render() {
            const host=EH.OperationDock?.host||EH.UI?.operationBox;
            if(EH.UI?.operationBox&&EH.OperationDock?.host)EH.UI.operationBox.hidden=true;
            if(!host||!EH.Config.OPERATION_CARS_ENABLED){if(host)host.hidden=true;return;}
            host.hidden=false;host.innerHTML='';

            const selected=this.selectedCar();
            const selectedMap=selected?this.selectedMapRecord():null;
            const last=!selected?this.lastRecord():null;
            const next=!selected&&!last?this.nextRoutineState():null;
            const schedule=selected||(last?this.scheduleForMap({service:last.service,serviceDate:last.date,lineDeparture:last.lineDeparture,line:{code:last.lineCode,raw:last.lineRaw}}):next?.primary);
            const routine=schedule?this.routineForSchedule(schedule):(last?this.routineForService(last.service,last.date):next?.routine);
            const record=selectedMap||last||(schedule?this.mapForSchedule(schedule):null);
            const agency=record?.agency||null;
            const group=routine?this.vehicleGroups(record?.date||schedule?.serviceDate||this.todayKey()).find(item=>item.routine?.id===routine.id):null;
            const groupMaps=(group?.maps||[]).filter(map=>map?.agency?.exists&&!map?.agency?.multiple);
            const grouped=groupMaps.length>1;
            const agencyView=grouped?{
                exists:true,multiple:false,
                board:groupMaps.reduce((sum,map)=>sum+Number(map.agency.board||0),0),
                alight:groupMaps.reduce((sum,map)=>sum+Number(map.agency.alight||0),0),
                balance:null,
                boarders:groupMaps.flatMap(map=>map.agency.boarders||[]),
                alighters:groupMaps.flatMap(map=>map.agency.alighters||[])
            }:agency;

            const searchRow=document.createElement('div');searchRow.className='eh-operation-search-row';
            const searchButton=document.createElement('button');searchButton.className='eh-context-btn primary';searchButton.textContent='🔎 Pesquisar carro';searchButton.addEventListener('click',()=>this.showCarSearch());
            const detected=document.createElement('span');detected.textContent=`${this.searchScheduleRecords('').length} resultado(s)`;searchRow.append(searchButton,detected);

            const head=document.createElement('div');head.className='eh-operation-head';const eyebrow=document.createElement('span');eyebrow.textContent=selected?'CARRO SELECIONADO':record?'MAPA ATUAL':'PRÓXIMO DA ROTINA';
            const heading=document.createElement('div');heading.className='eh-operation-heading';const service=document.createElement('strong');
            service.textContent=grouped?`${groupMaps.length} serviços`:(schedule?.service?`Serviço ${schedule.service}`:(routine?'Serviço hoje: —':'CARROS'));
            const route=document.createElement('span');route.textContent=routine?.name||record?.operationalName||record?.lineRaw||'Faça uma pesquisa de horários';heading.append(service,route);head.append(eyebrow,heading);

            if(routine){const tag=document.createElement('div');tag.className='eh-operation-service-tag attends';tag.textContent=`${routine.operationalTime} • HORÁRIO OPERACIONAL`;head.append(tag);}

            const agencyTitle=document.createElement('div');agencyTitle.className='eh-operation-agency-title';agencyTitle.textContent=`AGÊNCIA ${this.agencyCode()}`;
            const metrics=document.createElement('div');metrics.className='eh-operation-metrics';
            const metricButton=(kind,label,value,enabled)=>{const button=document.createElement('button');button.className=`eh-operation-metric ${kind}`;button.disabled=!enabled;const s=document.createElement('span');s.textContent=label;const b=document.createElement('strong');b.textContent=value===null||value===undefined?'—':String(value);button.append(s,b);return button;};
            const canUse=Boolean((grouped&&groupMaps.length)||record&&agencyView?.exists&&!agencyView?.multiple);
            const board=metricButton('board','↑ Embarques',canUse?agencyView?.board:null,canUse),alight=metricButton('alight','↓ Desembarques',canUse?agencyView?.alight:null,canUse);
            const balance=document.createElement('div');balance.className='eh-operation-metric balance';const bl=document.createElement('span');bl.textContent=grouped?'🚌 Saldos':'🚌 Sai com';const bv=document.createElement('strong');bv.textContent=grouped?'por andar':(canUse&&agencyView?.balance!==null&&agencyView?.balance!==undefined?String(agencyView.balance):'—');balance.append(bl,bv);metrics.append(board,alight,balance);
            if(canUse){
                board.addEventListener('click',()=>grouped?this.showGroupPassengers(group,'board'):this.showPassengers(record,'board'));
                alight.addEventListener('click',()=>grouped?this.showGroupPassengers(group,'alight'):this.showPassengers(record,'alight'));
            }

            const message=document.createElement('div');message.className='eh-operation-meta';
            if(!schedule&&!record)message.textContent=`Agência ${this.agencyCode()} aguardando pesquisa de horários`;
            else if(!record)message.textContent=`${routine?.operationalTime||schedule?.time||'—'} • ${schedule?.service?`Serviço ${schedule.service} • `:''}Agência ${this.agencyCode()} aguardando mapa`;
            else if(grouped){
                const services=groupMaps.map(map=>`${map.service}${map.floor?` (${map.floor})`:''}`).join(' • ');
                const pending=groupMaps.flatMap(map=>(map.agency.boarders||[]).map(p=>EH.Reminders?.matchPassenger?.(p,map))).filter(r=>r&&!EH.Reminders?.isDoneStatus?.(r.status)).length;
                const parts=[routine?.operationalTime,`${groupMaps.length} mapas/serviços: ${services}`,'saldos preservados por andar'].filter(Boolean);
                if(pending)parts.push(`${pending} precisa(m) imprimir`);
                message.textContent=parts.join(' • ');
            } else if(!agencyView?.exists)message.textContent=`Serviço ${record.service} • Agência ${this.agencyCode()} não encontrada neste mapa.`;
            else if(agencyView.multiple){message.classList.add('warning');message.textContent=`⚠ ${agencyView.warning}`;}
            else{
                const parts=[routine?.operationalTime||record.operationalTime,`Serviço ${record.service}`,record.floor,record.lineCode?`Linha ${record.lineCode}`:'',`Atualizado às ${this.formatUpdatedAt(record.updatedAt)}`].filter(Boolean);
                const pending=(agencyView.boarders||[]).map(p=>EH.Reminders?.matchPassenger?.(p,record)).filter(r=>r&&!EH.Reminders?.isDoneStatus?.(r.status)).length;
                if(agencyView?.resolution==='aggregate-code-passenger-counts')parts.push('movimento 287 conferido • saldos separados');
                if(pending)parts.push(`${pending} precisa(m) imprimir`);
                message.textContent=parts.join(' • ');
            }

            const principal=document.createElement('div');principal.className='eh-operation-found-list';const ft=document.createElement('span');ft.textContent='CARROS PRINCIPAIS';principal.append(ft);
            this.routineStates().forEach(state=>{
                const button=document.createElement('button');const current=state.matches.some(m=>String(m.resultKey)===String(schedule?.resultKey));button.className=current?'selected':'';
                const serviceText=state.matches.length?state.matches.map(m=>`${m.service}${m.floor?`/${m.floor.replace(' andar','')}`:''}`).join(', '):'aguardando';
                button.textContent=`${state.routine.operationalTime} • ${state.routine.name} • ${serviceText}`;
                button.addEventListener('click',()=>state.primary?this.selectCar(state.primary):EH.Toast.info('Faça uma pesquisa de horários para detectar o serviço de hoje.'));principal.append(button);
            });

            const actions=document.createElement('div');actions.className='eh-operation-actions';
            const update=document.createElement('button');update.className='eh-context-btn';update.textContent='↻ Ler mapa';update.addEventListener('click',()=>this.scanCurrentMap({quiet:false}));
            const passengers=document.createElement('button');passengers.className='eh-context-btn';passengers.textContent=grouped?'Embarques':'Passageiros';passengers.disabled=!canUse;passengers.addEventListener('click',()=>grouped?this.showGroupPassengers(group,'board'):this.showDetails(record));
            const all=document.createElement('button');all.className='eh-context-btn';all.textContent='Carros ›';all.addEventListener('click',()=>this.showCars());actions.append(update,passengers,all);
            host.append(searchRow,head,agencyTitle,metrics,message,principal,actions);
        },

        injectStyles() {
            if(this.stylesInjected)return;this.stylesInjected=true;
            GM_addStyle(`
                :is(#eh-root,#eh-operation-dock) .eh-operation-host{display:grid;gap:7px;margin:7px 0 8px;padding:9px;border:1px solid #d9e2e8;border-radius:10px;background:#fbfcfd;color:#26313f;box-shadow:0 2px 8px rgba(28,45,68,.045)}
                :is(#eh-root,#eh-operation-dock) .eh-operation-host[hidden]{display:none!important}
                :is(#eh-root,#eh-operation-dock) .eh-operation-head{display:grid;gap:4px}:is(#eh-root,#eh-operation-dock) .eh-operation-head>span{color:#718092;font-size:7.5px;font-weight:900;letter-spacing:.38px}
                :is(#eh-root,#eh-operation-dock) .eh-operation-heading{display:flex;align-items:baseline;gap:7px;min-width:0}:is(#eh-root,#eh-operation-dock) .eh-operation-heading strong{color:#1f2b39;font-size:15px;line-height:1}:is(#eh-root,#eh-operation-dock) .eh-operation-heading span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#3e4b5c;font-size:9.5px;font-weight:800}
                :is(#eh-root,#eh-operation-dock) .eh-operation-service-tag{width:max-content;padding:2px 6px;border-radius:999px;font-size:7.3px;font-weight:900;letter-spacing:.25px;background:#eaf6f1;color:#236e5c}
                :is(#eh-root,#eh-operation-dock) .eh-operation-agency-title{color:#405064;font-size:8px;font-weight:950;letter-spacing:.35px}
                :is(#eh-root,#eh-operation-dock) .eh-operation-metrics{display:grid;grid-template-columns:1fr 1fr 1.05fr;gap:5px}:is(#eh-root,#eh-operation-dock) .eh-operation-metric{min-width:0;min-height:47px;display:grid;align-content:center;gap:3px;padding:6px;border:1px solid #e1e7ec;border-radius:8px;background:#fff;color:#5c6878;text-align:left}
                :is(#eh-root,#eh-operation-dock) button.eh-operation-metric{cursor:pointer;font:inherit}:is(#eh-root,#eh-operation-dock) button.eh-operation-metric:disabled{cursor:default;opacity:.72}:is(#eh-root,#eh-operation-dock) .eh-operation-metric span{font-size:7.6px;font-weight:800}:is(#eh-root,#eh-operation-dock) .eh-operation-metric strong{font-size:14px;color:#253142}
                :is(#eh-root,#eh-operation-dock) .eh-operation-metric.board strong{color:#24735e}:is(#eh-root,#eh-operation-dock) .eh-operation-metric.alight strong{color:#a35a31}:is(#eh-root,#eh-operation-dock) .eh-operation-metric.balance strong{color:#2868a7}
                :is(#eh-root,#eh-operation-dock) .eh-operation-meta{color:#7a8695;font-size:7.7px;line-height:1.35}:is(#eh-root,#eh-operation-dock) .eh-operation-meta.warning{color:#9a5a23}
                :is(#eh-root,#eh-operation-dock) .eh-operation-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px}:is(#eh-root,#eh-operation-dock) .eh-operation-actions .eh-context-btn{min-width:0;padding:6px 4px;font-size:7.8px}
                :is(#eh-root,#eh-operation-dock) .eh-operation-search-row{display:flex;align-items:center;gap:7px}:is(#eh-root,#eh-operation-dock) .eh-operation-search-row .eh-context-btn{flex:1}:is(#eh-root,#eh-operation-dock) .eh-operation-search-row span{color:#7b8794;font-size:7.5px;white-space:nowrap}
                :is(#eh-root,#eh-operation-dock) .eh-operation-found-list{display:grid;gap:3px;padding-top:2px}:is(#eh-root,#eh-operation-dock) .eh-operation-found-list>span{color:#7b8794;font-size:7px;font-weight:900;letter-spacing:.35px}:is(#eh-root,#eh-operation-dock) .eh-operation-found-list button{width:100%;min-height:24px;padding:4px 6px;border:1px solid #e2e7ec;border-radius:6px;background:#fff;color:#526073;text-align:left;font-size:7.3px;font-weight:750;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}:is(#eh-root,#eh-operation-dock) .eh-operation-found-list button.selected{border-color:#9db8d2;background:#eef5fb;color:#315d86}
                .eh-operation-car-search-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.eh-operation-car-search-toolbar input{min-height:38px;padding:8px 10px;border:1px solid #ccd5df;border-radius:8px;font:inherit;font-size:12px}.eh-operation-search-actions{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end}
                .eh-operation-modal{width:min(800px,94vw)}.eh-operation-passenger-list,.eh-operation-day-list{display:grid;gap:7px}.eh-operation-passenger{display:grid;grid-template-columns:48px minmax(0,1fr);gap:10px;align-items:start;padding:10px;border:1px solid #e2e7ed;border-radius:9px;background:#fafbfd}.eh-operation-seat{display:flex;align-items:center;justify-content:center;min-height:38px;border-radius:8px;background:#edf3f7;color:#1e3448;font-size:17px}.eh-operation-passenger-info{display:grid;gap:3px}.eh-operation-passenger-info>strong{font-size:12px}.eh-operation-passenger-info small{font-size:10px;color:#697687}
                .eh-operation-empty{padding:18px;border:1px dashed #d9e0e7;border-radius:9px;color:#718092;text-align:center;font-size:11px}.eh-operation-warning{padding:9px 10px;border:1px solid #f0cfaa;border-radius:8px;background:#fff8ee;color:#8b561f;font-size:10px}.eh-operation-detail-summary{display:grid;gap:8px}.eh-operation-detail-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.eh-operation-detail-metrics>div{display:grid;gap:3px;padding:9px;border:1px solid #e2e8ee;border-radius:8px;font-size:9px}.eh-operation-detail-metrics strong{font-size:16px}.eh-operation-detail-actions{display:flex;flex-wrap:wrap;gap:7px}
                .eh-operation-group-title{margin:8px 0 2px;color:#536175;font-size:9px;font-weight:950;letter-spacing:.4px}.eh-operation-day-row{display:grid;grid-template-columns:22px minmax(0,1fr) auto;align-items:center;gap:8px;padding:9px;border:1px solid #e2e7ed;border-radius:9px;background:#fbfcfd}.eh-operation-day-status{font-size:15px;font-weight:900;color:#517064}.eh-operation-day-info{min-width:0;display:grid;gap:3px}.eh-operation-day-info strong{font-size:11px}.eh-operation-day-info small{font-size:9.5px;color:#748091}
                .eh-operation-reminder-state.pending{color:#a35d24!important}.eh-operation-reminder-state.done{color:#2d785f!important}
                .eh-operation-settings-list{display:grid;gap:8px;margin-top:8px}.eh-operation-settings-service{display:grid;grid-template-columns:100px minmax(180px,1.5fr) minmax(125px,1fr) minmax(125px,1fr);gap:7px;padding:9px;border:1px solid #e1e6ec;border-radius:9px;background:#fff}.eh-operation-settings-service .eh-check{align-self:end;min-height:36px}.eh-operation-settings-service .eh-remove-routine{align-self:end}.eh-operation-settings-service-note{grid-column:1/-1}
                @media(max-width:760px){:is(#eh-root,#eh-operation-dock) .eh-operation-metrics{grid-template-columns:1fr 1fr}:is(#eh-root,#eh-operation-dock) .eh-operation-metric.balance{grid-column:1/-1}:is(#eh-root,#eh-operation-dock) .eh-operation-actions{grid-template-columns:1fr}.eh-operation-day-row{grid-template-columns:22px minmax(0,1fr)}.eh-operation-day-row>button,.eh-operation-search-actions{grid-column:1/-1}.eh-operation-detail-metrics{grid-template-columns:1fr}.eh-operation-settings-service{grid-template-columns:1fr}.eh-operation-settings-service-note{grid-column:auto}}
            `);
        },

        onPageUpdate(page) {
            if(page==='pesquisa')this.readScheduleResults();
            else if(!EH.Utils.first(EH.Selectors.MAPA_VIAGEM_MODAL))this.visibleScheduleRecords=[];
            if(EH.Utils.first(EH.Selectors.MAPA_VIAGEM_MODAL))this.scanCurrentMap({quiet:true});
            this.render();
        },

        init() {
            if(this.started||EH.WhatsAppBridge.isWhatsAppHost())return;
            this.started=true;this.injectStyles();this.render();
        }
    };

    // ============================================================
    // INTERFACE
    // ============================================================
    EH.UI = {
        root: null,
        body: null,
        statusText: null,
        statusDot: null,
        reminderBox: null,
        buttons: {},
        busy: false,
        pixSendPendingId: '',

        init() {
            if (document.querySelector('#eh-root')) return;

            const firstOverlayUse = !EH.Storage.get('overlay546Initialized', false);
            if (firstOverlayUse) {
                EH.Storage.set('collapsed', false);
                EH.Storage.set('waDockCollapsed', false);
                EH.Storage.set('overlay546Initialized', true);
            }
            // O estado persistente é lido uma única vez e passa a ser a fonte de verdade.
            EH.State.loaded = false;
            const collapsed = !EH.State.isOpen('left');

            const root = document.createElement('div');
            root.id = 'eh-root';
            root.classList.toggle('eh-collapsed', collapsed);

            const panel = document.createElement('div');
            panel.className = 'eh-panel';

            const header = document.createElement('div');
            header.className = 'eh-header';
            header.title = 'Atendimento rápido';

            const panelBrand = document.createElement('div');
            panelBrand.className = 'eh-panel-brand';
            panelBrand.innerHTML = '<span>E-PASS HELPER</span><strong>Atendimento</strong>';

            const headerActions = document.createElement('div');
            headerActions.className = 'eh-header-actions';

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'eh-icon-btn';
            toggle.title = 'Recolher painel';
            toggle.setAttribute('aria-label', toggle.title);
            toggle.textContent = '›';

            const settings = document.createElement('button');
            settings.type = 'button';
            settings.className = 'eh-icon-btn';
            settings.title = 'Configurações';
            settings.setAttribute('aria-label', settings.title);
            settings.textContent = '⚙';
            settings.addEventListener('click', event => {
                event.stopPropagation();
                this.showSettings();
            });

            headerActions.append(settings, toggle);
            header.append(panelBrand, headerActions);

            const body = document.createElement('div');
            body.className = 'eh-body';
            body.hidden = collapsed;

            const steps = document.createElement('div');
            steps.className = 'eh-steps';

            // O WhatsApp agora fica integrado na lateral direita. Não há botão de abrir.
            // Mantemos o telefone em memória apenas para fluxos que já o informaram anteriormente.
            const phone = document.createElement('input');
            phone.type = 'hidden';
            phone.value = String(EH.Storage.get('currentPhone', '') || '');

            const quickTitle = document.createElement('div');
            quickTitle.className = 'eh-dock-title';
            quickTitle.textContent = 'Rotas rápidas';
            const quickRoutes = document.createElement('div');
            quickRoutes.className = 'eh-quick-routes';

            const saleBox = document.createElement('div');
            saleBox.className = 'eh-sale-host';
            saleBox.hidden = true;

            const context = document.createElement('div');
            context.className = 'eh-context-card';

            const reminderBox = document.createElement('div');
            reminderBox.className = 'eh-reminder-host';
            reminderBox.hidden = true;

            const operationBox = document.createElement('div');
            operationBox.className = 'eh-operation-host';
            operationBox.hidden = true;

            const divider = document.createElement('div');
            divider.className = 'eh-tools-divider';
            const toolsTitle = document.createElement('div');
            toolsTitle.className = 'eh-dock-title';
            toolsTitle.textContent = 'Ferramentas';

            const actions = document.createElement('div');
            actions.className = 'eh-actions eh-actions-primary';

            const horarios = this.createButton('🗓️', 'HORÁRIOS', 'eh-primary', () => this.captureAction('pesquisa'));
            const reserva = this.createButton('💺', 'POLTRONAS', 'eh-success', () => this.captureAction('reserva'));
            const bilhete = this.createButton('🎫', 'BILHETE', 'eh-primary', () => EH.Tickets.activateSelection());
            const rotas = this.createButton('🧭', 'ROTAS', '', () => this.showRoutes());
            const historico = this.createButton('🕘', 'HISTÓRICO', '', () => this.showHistory());
            const enviar = this.createButton('📤', 'ENVIAR', 'eh-success', () => this.showSend());
            const resumo = this.createButton('📋', 'RESUMO', 'eh-primary', () => this.copyCurrentSummary());
            const detalhes = this.createButton('📄', 'DETALHES', '', () => this.copyCurrentDetails());

            horarios.id = 'eh-btn-horarios';
            reserva.id = 'eh-btn-reserva';
            bilhete.id = 'eh-btn-bilhete';
            rotas.id = 'eh-btn-rotas';
            historico.id = 'eh-btn-historico';
            enviar.id = 'eh-btn-enviar';
            resumo.id = 'eh-btn-resumo';
            detalhes.id = 'eh-btn-detalhes';
            // Ações mais usadas ficam visíveis. As demais continuam disponíveis,
            // porém agrupadas em “Mais opções” para reduzir ruído visual.
            actions.append(horarios, reserva, bilhete);
            const more = document.createElement('details');
            more.className = 'eh-more-tools';
            const moreSummary = document.createElement('summary');
            moreSummary.textContent = '⋯ Mais';
            const secondaryActions = document.createElement('div');
            secondaryActions.className = 'eh-actions eh-actions-secondary';
            secondaryActions.append(resumo, detalhes, rotas, historico);
            more.append(moreSummary, secondaryActions);

            const status = document.createElement('div');
            status.className = 'eh-status';
            const dot = document.createElement('span');
            dot.className = 'eh-dot';
            const statusText = document.createElement('span');
            statusText.textContent = 'Aguardando tela';
            status.append(dot, statusText);

            const footer = document.createElement('div');
            footer.className = 'eh-panel-footer';
            footer.appendChild(status);

            const flowSection = document.createElement('details');
            flowSection.className = 'eh-flow-section';
            const flowSummary = document.createElement('summary');
            flowSummary.textContent = 'Fluxo do atendimento';
            flowSection.append(flowSummary, steps);

            body.append(flowSection, context, reminderBox, operationBox, saleBox, quickTitle, quickRoutes, divider, toolsTitle, actions, more);
            panel.append(header, body, footer);
            root.appendChild(panel);

            const launcher = document.createElement('button');
            launcher.type = 'button';
            launcher.id = 'eh-launcher';
            launcher.textContent = '‹';
            launcher.title = 'Abrir atendimento rápido (Alt+A)';
            launcher.setAttribute('aria-label', launcher.title);
            launcher.hidden = !collapsed;

            document.body.append(root, launcher);

            this.root = root;
            this.launcher = launcher;
            EH.Layout?.sync?.();
            this.body = body;
            this.statusText = statusText;
            this.statusDot = dot;
            this.buttons = { horarios, reserva, bilhete, rotas, historico, enviar, resumo, detalhes };
            this.steps = steps;
            this.phoneInput = phone;
            this.quickTitle = quickTitle;
            this.quickRoutes = quickRoutes;
            this.saleBox = saleBox;
            this.contextBox = context;
            this.reminderBox = reminderBox;
            this.operationBox = operationBox;
            this.flowSection = flowSection;
            this.toolsDivider = divider;
            this.toolsTitle = toolsTitle;
            this.primaryActions = actions;
            this.moreTools = more;
            this.renderQuickRoutes();
            this.renderSaleSummary(EH.Pages?.detect?.() || 'desconhecida');

            toggle.addEventListener('click', event => {
                event.stopPropagation();
                this.setPanelOpen(false);
            });
            launcher.addEventListener('click', event => {
                event.stopPropagation();
                this.setPanelOpen(true);
            });

            this.applyDockLayout(!collapsed);
            this.refreshWhatsAppConnection();
            if (typeof GM_addValueChangeListener === 'function' && !this.waAckListener) {
                this.waAckListener = GM_addValueChangeListener(EH.Storage.key('waAck'), (_name, _oldValue, newValue) => {
                    const ack = EH.WhatsAppBridge.parseStored(newValue);
                    if (!ack?.id || ack.id !== this.lastWaCommandId) return;
                    if (this.lastWaCommandPurpose === 'qr') {
                        if (ack.imageSent && ack.ok) EH.Toast.success('✅ QR Code enviado');
                        else EH.Toast.error('Não foi possível enviar o QR Code pelo WhatsApp integrado.');
                    } else if (this.lastWaCommandHasImage) {
                        if (ack.imageAttached) EH.Toast.success('Imagem preparada na conversa do WhatsApp integrado. Confira e envie.');
                        else EH.Toast.warning('A conversa está selecionada, mas o WhatsApp Web não aceitou o anexo automático da imagem.');
                    } else if (this.lastWaCommandPurpose === 'pix') {
                        if (ack.ok) EH.Toast.success('✅ PIX enviado em duas mensagens.');
                        else EH.Toast.error('Não foi possível enviar o PIX pelo WhatsApp integrado.');
                        if (this.pixSendPendingId === ack.id) this.pixSendPendingId = '';
                        EH.Runtime.clearTimeout('pix-send-guard');
                    }
                    this.lastWaCommandPurpose = '';
                    this.refreshWhatsAppConnection();
                });
            }
        },

        setPanelOpen(open) {
            if (!this.root || !this.body) return;
            EH.State.setPanel('left', Boolean(open));
        },

        togglePanel() {
            this.setPanelOpen(!EH.State.isOpen('left'));
        },

        applyDockLayout() {
            EH.Layout?.sync?.();
        },

        refreshWhatsAppConnection() {
            EH.WhatsAppDock?.refreshConnection?.();
        },

        renderQuickRoutes() {
            if (!this.quickRoutes) return;
            this.quickRoutes.innerHTML = '';
            EH.Routes.getAll().slice(0, 6).forEach(route => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'eh-route-quick';
                btn.textContent = `${route.origem.replace(/\s*-\s*[A-Z]{2}$/i, '')} → ${route.destino.replace(/\s*-\s*[A-Z]{2}$/i, '')}`;
                btn.title = route.observacao || `${route.origem} → ${route.destino}`;
                btn.addEventListener('click', async () => {
                    if (this.busy) return;
                    try {
                        btn.classList.add('eh-route-running');
                        this.setBusy(true, 'Rota automática…');
                        await EH.Routes.apply(route, { autoSearch: true, autoCapture: EH.Config.AUTO_ROUTE_CAPTURE });
                    } catch (error) {
                        EH.Logger.error(error);
                        EH.Toast.error(error.message || 'Falha na automação da rota.');
                    } finally {
                        btn.classList.remove('eh-route-running');
                        if (EH.Routes.isSearchPage()) this.setBusy(false);
                    }
                });
                this.quickRoutes.appendChild(btn);
            });
        },

        getPhone() {
            return String(this.phoneInput?.value || EH.Storage.get('currentPhone', '') || '').replace(/\D/g, '');
        },

        // Mantido por compatibilidade interna. O WhatsApp não abre mais popup.
        openWhatsAppCompactWindow() {
            EH.Toast.info('O WhatsApp agora fica integrado na lateral do E-Pass.');
            return null;
        },

        async openWhatsApp(message = '', options = {}) {
            const imageDataUrl = String(options.imageDataUrl || '');
            const filename = String(options.filename || 'epass-atendimento.png');

            if (!EH.WhatsAppBridge.isOnline()) {
                EH.Toast.warning('WhatsApp Web desconectado. Mantenha a aba do WhatsApp Web que você já usa aberta.');
                return { mode: 'web', connected: false };
            }

            const state = EH.WhatsAppBridge.getUiState();
            const activeTitle = String(state?.active?.title || '').trim();
            if (!activeTitle) {
                EH.Toast.warning('Selecione primeiro a conversa do cliente no WhatsApp integrado à direita.');
                return { mode: 'web', connected: false, missingChat: true };
            }

            const command = EH.WhatsAppBridge.makeCommand({
                action: 'prepare',
                chatTitle: activeTitle,
                message,
                imageDataUrl,
                filename,
                target: 'web'
            });
            EH.WhatsAppBridge.send(command);
            this.lastWaCommandId = command.id;
            this.lastWaCommandHasImage = Boolean(imageDataUrl);
            this.lastWaCommandPurpose = '';
            return { mode: 'web', connected: true, commandId: command.id };
        },

        sendPixPairToWhatsApp() {
            if (this.pixSendPendingId) {
                EH.Toast.info('O PIX atual já está sendo enviado. Aguarde a confirmação antes de clicar novamente.');
                return null;
            }
            // Captura novamente no EXATO momento do clique para nunca reutilizar PIX de uma venda anterior.
            const pix = EH.Payment.parsePix();
            const payload = EH.Payment.payload(pix);
            if (!pix || !payload) {
                EH.Toast.warning('⚠️ Código PIX atual não encontrado no E-Pass.');
                return null;
            }
            const validation = pix.validation || EH.Payment.validatePix(payload);
            if (!validation.valid) {
                EH.Toast.warning(`⚠️ O código PIX parece incompleto ou inválido. ${validation.reason || ''}`.trim());
                return null;
            }
            if (EH.Config.WHATSAPP_MODE !== 'web' || !EH.WhatsAppBridge.isOnline()) {
                EH.Toast.warning('WhatsApp Web integrado não está conectado.');
                return null;
            }
            const activeTitle = String(EH.WhatsAppBridge.getUiState()?.active?.title || '').trim();
            if (!activeTitle) {
                EH.Toast.warning('Selecione primeiro a conversa do cliente no WhatsApp à direita.');
                return null;
            }
            const command = EH.WhatsAppBridge.makeCommand({
                action: 'send_pix_pair',
                chatTitle: activeTitle,
                message: EH.Payment.formatPixInstruction(pix),
                // Mensagem 2 contém SOMENTE o payload original, sem prefixos/sufixos.
                message2: payload,
                target: 'web'
            });
            EH.WhatsAppBridge.send(command);
            this.lastWaCommandId = command.id;
            this.lastWaCommandHasImage = false;
            this.lastWaCommandPurpose = 'pix';
            this.pixSendPendingId = command.id;
            EH.Runtime.timeout('pix-send-guard', () => {
                if (this.pixSendPendingId === command.id) {
                    this.pixSendPendingId = '';
                    EH.Logger.trace('PIX', 'Proteção contra clique duplo liberada por timeout de segurança.');
                }
            }, 25000);
            EH.Toast.info('Enviando instrução e PIX em duas mensagens…');
            return command;
        },

        async sendPixQrToWhatsApp(pix) {
            const payload = EH.Payment.payload(pix);
            const validation = pix?.validation || EH.Payment.validatePix(payload);
            if (!payload || !validation.valid) {
                EH.Toast.warning('O PIX precisa estar válido antes de enviar o QR Code.');
                return null;
            }
            if (EH.Config.WHATSAPP_MODE !== 'web' || !EH.WhatsAppBridge.isOnline()) {
                EH.Toast.warning('WhatsApp Web integrado não está conectado.');
                return null;
            }
            const activeTitle = String(EH.WhatsAppBridge.getUiState()?.active?.title || '').trim();
            if (!activeTitle) {
                EH.Toast.warning('Selecione primeiro a conversa do cliente no WhatsApp à direita.');
                return null;
            }
            let imageDataUrl = '';
            try {
                imageDataUrl = await EH.Payment.getOriginalQrDataUrl(pix);
            } catch (error) {
                EH.Toast.error(`Não foi possível obter o QR Code. ${error.message || ''}`.trim());
                return null;
            }
            const command = EH.WhatsAppBridge.makeCommand({
                action: 'send_image',
                chatTitle: activeTitle,
                imageDataUrl,
                filename: 'PIX-QR-CODE.png',
                message: '',
                target: 'web'
            });
            EH.WhatsAppBridge.send(command);
            this.lastWaCommandId = command.id;
            this.lastWaCommandHasImage = true;
            this.lastWaCommandPurpose = 'qr';
            EH.Toast.info('Enviando QR Code original…');
            return command;
        },

        sendPixMonospaceToWhatsApp(pix) {
            const payload = EH.Payment.payload(pix);
            const validation = pix?.validation || EH.Payment.validatePix(payload);
            if (!payload || !validation.valid) {
                EH.Toast.warning('O PIX precisa estar válido antes do envio.');
                return null;
            }
            if (EH.Config.WHATSAPP_MODE !== 'web' || !EH.WhatsAppBridge.isOnline()) {
                EH.Toast.warning('WhatsApp Web integrado não está conectado.');
                return null;
            }
            const activeTitle = String(EH.WhatsAppBridge.getUiState()?.active?.title || '').trim();
            if (!activeTitle) {
                EH.Toast.warning('Selecione primeiro a conversa do cliente no WhatsApp à direita.');
                return null;
            }
            const command = EH.WhatsAppBridge.makeCommand({
                action: 'send_text',
                chatTitle: activeTitle,
                message: EH.Payment.formatPixMonospace(pix),
                target: 'web'
            });
            EH.WhatsAppBridge.send(command);
            EH.Toast.info('Enviando PIX em formato monoespaçado…');
            return command;
        },

        financeMiniSummary() {
            const wrap = document.createElement('div');
            wrap.className = 'eh-finance-mini';
            const today = EH.FinanceLedger.todaySummary();
            const stats = EH.FinanceLedger.monthStats();
            const month = stats?.summary || EH.FinanceLedger.monthSummary();
            const kpis = document.createElement('div');
            kpis.className = 'eh-finance-kpis';
            const item = (label, value) => {
                const box = document.createElement('div'); box.className = 'eh-finance-kpi';
                const s = document.createElement('small'); s.textContent = label;
                const b = document.createElement('strong'); b.textContent = EH.Utils.formatMoney(value);
                box.append(s,b); return box;
            };
            kpis.append(
                item('Hoje • movimentado', today.movement),
                item('Mês • realizado', month.movement),
                item('Média/dia', stats?.average?.movement || 0),
                item(stats?.isCurrentMonth ? 'Projeção do mês' : 'Mês • comissão', stats?.isCurrentMonth ? (stats?.projection?.movement || 0) : month.commission),
                item('Comissão atual', month.commission),
                item(stats?.isCurrentMonth ? 'Comissão projetada' : 'Média comissão/dia', stats?.isCurrentMonth ? (stats?.projection?.commission || 0) : (stats?.average?.commission || 0))
            );
            wrap.appendChild(kpis);
            if (stats) {
                const info=document.createElement('div');
                info.className='eh-finance-company-line';
                const label=document.createElement('span');
                label.textContent=stats.isCurrentMonth
                    ? `${stats.elapsedDays} dias transcorridos • ${stats.daysInMonth} dias no mês`
                    : `${stats.daysInMonth} dias no mês • mês encerrado`;
                const value=document.createElement('b');
                value.textContent=stats.isCurrentMonth?`até ${stats.projectionDate}`:'final';
                info.append(label,value);wrap.appendChild(info);
            }
            const top = Object.values(month.byCompany || {}).sort((a,b)=>b.commission-a.commission).slice(0,4);
            top.forEach(company => {
                const line = document.createElement('div'); line.className = 'eh-finance-company-line';
                const name = document.createElement('span'); name.textContent = company.company;
                const value = document.createElement('b'); value.textContent = EH.Utils.formatMoney(company.commission);
                line.append(name,value); wrap.appendChild(line);
            });
            return wrap;
        },

        showMerchandiseModal(existing = null) {
            document.querySelector('#eh-finance-merch-overlay')?.remove();
            const overlay = document.createElement('div'); overlay.className = 'eh-overlay'; overlay.id = 'eh-finance-merch-overlay';
            const modal = document.createElement('div'); modal.className = 'eh-modal'; modal.style.width = 'min(520px, 94vw)';
            const head = document.createElement('div'); head.className = 'eh-modal-head';
            const title = document.createElement('div'); title.className = 'eh-modal-title'; title.textContent = existing ? 'Editar mercadoria' : 'Nova mercadoria';
            const closeTop = document.createElement('button'); closeTop.type='button'; closeTop.className='eh-modal-close'; closeTop.textContent='✕'; head.append(title, closeTop);
            const content = document.createElement('div'); content.className = 'eh-modal-content';
            const grid = document.createElement('div'); grid.className='eh-settings-grid';
            const makeField=(labelText,input)=>{ const f=document.createElement('div');f.className='eh-field';const l=document.createElement('label');l.textContent=labelText;f.append(l,input);return f; };
            const type=document.createElement('select'); type.innerHTML='<option value="MERCADORIA_RECEBIDA">Recebida</option><option value="MERCADORIA_ENVIADA">Enviada</option>'; type.value=existing?.category||'MERCADORIA_RECEBIDA';
            const company=document.createElement('select'); EH.FinanceLedger.companies().forEach(name=>{const o=document.createElement('option');o.value=name;o.textContent=name;company.appendChild(o);}); const other=document.createElement('option');other.value='OUTRA';other.textContent='Outra empresa';company.appendChild(other); company.value=existing?.company && Array.from(company.options).some(o=>o.value===existing.company) ? existing.company : (EH.FinanceLedger.companies()[0]||'EXPRESSO MAIA');
            const customCompany=document.createElement('input'); customCompany.type='text'; customCompany.placeholder='Nome da empresa'; customCompany.hidden=company.value!=='OUTRA';
            company.addEventListener('change',()=>{customCompany.hidden=company.value!=='OUTRA';});
            const value=document.createElement('input');value.type='number';value.min='0';value.step='0.01';value.placeholder='0,00';value.value=existing?.originalValue||'';
            const nature=document.createElement('select');nature.innerHTML='<option value="neutro">Não definir</option><option value="entrada">Entrada</option><option value="saida">Saída</option>';nature.value=existing?.nature||'neutro';
            const date=document.createElement('input');date.type='date'; const baseDate=existing?.timestamp?new Date(existing.timestamp):new Date(); date.value=`${baseDate.getFullYear()}-${String(baseDate.getMonth()+1).padStart(2,'0')}-${String(baseDate.getDate()).padStart(2,'0')}`;
            const percent=document.createElement('input');percent.type='number';percent.min='0';percent.max='100';percent.step='0.1';percent.value=existing?.commissionPercent ?? EH.Config.FINANCE_COMMISSION_PERCENT;
            const description=document.createElement('input');description.type='text';description.placeholder='Opcional';description.value=existing?.description||'';
            grid.append(makeField('Tipo',type),makeField('Empresa',company),makeField('Outra empresa',customCompany),makeField('Valor',value),makeField('Natureza financeira',nature),makeField('Data',date),makeField('Comissão (%)',percent),makeField('Descrição',description));
            content.appendChild(grid);
            const actions=document.createElement('div');actions.className='eh-modal-actions';
            const save=document.createElement('button');save.type='button';save.className='eh-modal-btn primary';save.textContent='Salvar';
            const cancel=document.createElement('button');cancel.type='button';cancel.className='eh-modal-btn';cancel.textContent='Cancelar';
            const close=()=>overlay.remove(); closeTop.addEventListener('click',close);cancel.addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
            save.addEventListener('click',()=>{
                try {
                    const selectedCompany=company.value==='OUTRA'?EH.Utils.clean(customCompany.value):company.value;
                    if (EH.Config.FINANCE_ASK_COMPANY_MERCH && !selectedCompany) throw new Error('Informe a empresa.');
                    const now=new Date(); const d=EH.FinanceLedger.parseDateTime(`${date.value} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`)||now;
                    EH.FinanceLedger.addMerchandise({ id:existing?.id, category:type.value, company:selectedCompany||'NÃO INFORMADA', originalValue:Number(value.value), nature:nature.value, dateTime:EH.FinanceLedger.formatDateTime(d), commissionPercent:Number(percent.value), description:description.value });
                    EH.Toast.success(existing?'Mercadoria atualizada.':'Mercadoria registrada.'); close(); this.showFinanceModal?.('mercadorias');
                } catch(error){EH.Toast.error(error.message||'Não foi possível salvar.');}
            });
            actions.append(save,cancel);modal.append(head,content,actions);overlay.appendChild(modal);document.body.appendChild(overlay);
        },

        showFinanceModal(initialTab='resumo') {
            document.querySelector('#eh-finance-overlay')?.remove();
            const overlay=document.createElement('div');overlay.className='eh-overlay';overlay.id='eh-finance-overlay';
            const modal=document.createElement('div');modal.className='eh-modal';modal.style.width='min(980px,96vw)';
            const head=document.createElement('div');head.className='eh-modal-head';const title=document.createElement('div');title.className='eh-modal-title';title.textContent='Caixa / Comissões — Controle do Helper';const closeTop=document.createElement('button');closeTop.type='button';closeTop.className='eh-modal-close';closeTop.textContent='✕';head.append(title,closeTop);
            const content=document.createElement('div');content.className='eh-modal-content';
            const shell=document.createElement('div');shell.className='eh-settings-shell';const tabs=document.createElement('div');tabs.className='eh-settings-tabs';const panes=document.createElement('div');panes.className='eh-settings-panes';shell.append(tabs,panes);content.appendChild(shell);
            const paneMap={};
            const makePane=(id,label)=>{const tab=document.createElement('button');tab.type='button';tab.className='eh-settings-tab';tab.textContent=label;const pane=document.createElement('section');pane.className='eh-settings-pane';paneMap[id]={tab,pane};tabs.appendChild(tab);panes.appendChild(pane);tab.addEventListener('click',()=>activate(id));return pane;};
            const activate=id=>Object.entries(paneMap).forEach(([key,obj])=>{obj.tab.classList.toggle('active',key===id);obj.pane.classList.toggle('active',key===id);});
            const monthState={key:EH.FinanceLedger.monthKey(new Date())};
            const monthLabel=key=>{const [y,m]=key.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());};
            const shiftMonth=delta=>{const [y,m]=monthState.key.split('-').map(Number);const d=new Date(y,m-1+delta,1);monthState.key=EH.FinanceLedger.monthKey(d);renderSummary();renderCompanies();};

            const summaryPane=makePane('resumo','Resumo');
            const historyPane=makePane('historico','Histórico');
            const companiesPane=makePane('empresas','Empresas');
            const merchPane=makePane('mercadorias','Mercadorias');

            const renderSummary=()=>{
                summaryPane.innerHTML='';
                const today=EH.FinanceLedger.todaySummary();
                const stats=EH.FinanceLedger.monthStats(monthState.key);
                const month=stats?.summary||EH.FinanceLedger.monthSummary(monthState.key);
                const nav=document.createElement('div');nav.className='eh-finance-month-nav';
                const prev=document.createElement('button');prev.className='eh-modal-btn';prev.textContent='‹';
                const lbl=document.createElement('strong');lbl.textContent=monthLabel(monthState.key);
                const next=document.createElement('button');next.className='eh-modal-btn';next.textContent='›';
                prev.addEventListener('click',()=>shiftMonth(-1));next.addEventListener('click',()=>shiftMonth(1));nav.append(prev,lbl,next);

                const grid=document.createElement('div');grid.className='eh-finance-summary-grid';
                const stat=(label,value,sub)=>{const el=document.createElement('div');el.className='eh-finance-stat';const s=document.createElement('small');s.textContent=label;const b=document.createElement('strong');b.textContent=EH.Utils.formatMoney(value);const sp=document.createElement('span');sp.textContent=sub||'';el.append(s,b,sp);return el;};
                grid.append(
                    stat('Hoje • Movimentação',today.movement,`Comissão ${EH.Utils.formatMoney(today.commission)}`),
                    stat(stats?.isCurrentMonth?'Realizado até hoje':'Total final',month.movement,monthLabel(monthState.key)),
                    stat(stats?.isCurrentMonth?'Média diária':'Média diária final',stats?.average?.movement||0,stats?`${stats.elapsedDays} dia(s) considerado(s)`:'' ),
                    stat('Comissão realizada',month.commission,'Comissão efetiva/estimada registrada')
                );
                if(stats?.isCurrentMonth&&stats.projection){
                    grid.append(
                        stat(`Projeção para ${stats.projectionDate}`,stats.projection.movement,`${stats.daysInMonth} dias no mês`),
                        stat('Comissão projetada',stats.projection.commission,`Projeção do movimento × ${Number(stats.projection.commissionPercent||0).toFixed(2).replace('.',',')}%`),
                        stat('Passagens • média/dia',stats.average.passage,`Projeção ${EH.Utils.formatMoney(stats.projection.passage)}`),
                        stat('Mercadorias • média/dia',stats.average.merchandise,`Projeção ${EH.Utils.formatMoney(stats.projection.merchandise)}`)
                    );
                } else if(stats){
                    grid.append(
                        stat('Passagens • total',month.passageValue,`${month.passageCount} operação(ões)`),
                        stat('Mercadorias • total',stats.merchandiseValue,`${month.merchandiseReceivedCount+month.merchandiseSentCount} operação(ões)`),
                        stat('Passagens • média/dia',stats.average.passage,`${stats.daysInMonth} dias no mês`),
                        stat('Comissão • média/dia',stats.average.commission,'Mês encerrado')
                    );
                }

                const explanation=document.createElement('div');explanation.className='eh-help-box';
                if(stats?.isCurrentMonth){
                    explanation.textContent=`${stats.elapsedDays} dias corridos transcorridos • ${stats.daysInMonth} dias no mês. Projeção = média diária acumulada × dias do mês. A projeção é somente estatística e não entra no Caixa, histórico ou comissão realizada.`;
                }else if(stats){
                    explanation.textContent=`Mês encerrado: ${stats.daysInMonth} dias. Não é gerada projeção para meses anteriores.`;
                }
                summaryPane.append(nav,grid,explanation);

                const official=EH.FinanceLedger.officialCommissionByCompany();const companyWrap=document.createElement('div');companyWrap.style.marginTop='12px';
                Object.values(month.byCompany||{}).sort((a,b)=>b.commission-a.commission).forEach(company=>{
                    const card=document.createElement('div');card.className='eh-finance-company-card';const h=document.createElement('h4');h.textContent=company.company;
                    const row=document.createElement('div');row.className='eh-finance-company-grid';
                    const c=(l,v)=>{const d=document.createElement('div');d.textContent=l;const b=document.createElement('b');b.textContent=v;d.appendChild(b);return d;};
                    row.append(c('Operações',String(company.operations)),c('Movimentado',EH.Utils.formatMoney(company.movement)),c('Comissão',EH.Utils.formatMoney(company.commission)),c('Percentual médio',`${company.averagePercent.toFixed(2).replace('.',',')}%`));
                    card.append(h,row);
                    if(Object.prototype.hasOwnProperty.call(official,company.company)){const diff=Math.abs(company.commission-official[company.company]);const note=document.createElement('div');note.className='eh-settings-note';note.textContent=`Helper: ${EH.Utils.formatMoney(company.commission)} • E-Pass: ${EH.Utils.formatMoney(official[company.company])} ${diff<=0.02?'✓ Conferido':'⚠ Conferir'}`;card.appendChild(note);}
                    companyWrap.appendChild(card);
                });
                summaryPane.appendChild(companyWrap);
            };

            const renderHistory=()=>{
                historyPane.innerHTML=''; const toolbar=document.createElement('div');toolbar.className='eh-finance-toolbar';
                const period=document.createElement('select');period.innerHTML='<option value="today">Hoje</option><option value="yesterday">Ontem</option><option value="month" selected>Este mês</option><option value="previous">Mês anterior</option><option value="custom">Período personalizado</option><option value="all">Tudo</option>';
                const type=document.createElement('select');type.innerHTML='<option value="all">Todas</option><option value="PASSAGEM">Passagens</option><option value="MERCH">Mercadorias</option><option value="MERCADORIA_RECEBIDA">Recebidas</option><option value="MERCADORIA_ENVIADA">Enviadas</option>';
                const company=document.createElement('select');company.innerHTML='<option value="all">Todas as empresas</option>';EH.FinanceLedger.companies().forEach(name=>{const o=document.createElement('option');o.value=name;o.textContent=name;company.appendChild(o);});
                const startDate=document.createElement('input');startDate.type='date';startDate.hidden=true;const endDate=document.createElement('input');endDate.type='date';endDate.hidden=true;
                const search=document.createElement('input');search.type='search';search.placeholder='Pesquisar empresa, passageiro, ID, valor…';
                const toggleCustom=()=>{const custom=period.value==='custom';startDate.hidden=!custom;endDate.hidden=!custom;};
                toolbar.append(period,type,company,startDate,endDate,search);const list=document.createElement('div');list.className='eh-finance-list';historyPane.append(toolbar,list);
                const refresh=()=>{let records=EH.FinanceLedger.visibleRecords();const now=new Date();let wantedMonth=EH.FinanceLedger.monthKey(now);let wantedDay='';if(period.value==='today')wantedDay=EH.FinanceLedger.dayKey(now);else if(period.value==='yesterday'){const d=new Date(now);d.setDate(d.getDate()-1);wantedDay=EH.FinanceLedger.dayKey(d);}else if(period.value==='previous'){const d=new Date(now.getFullYear(),now.getMonth()-1,1);wantedMonth=EH.FinanceLedger.monthKey(d);}if(period.value==='today'||period.value==='yesterday')records=records.filter(r=>r.dayKey===wantedDay);else if(period.value==='month'||period.value==='previous')records=records.filter(r=>r.monthKey===wantedMonth);else if(period.value==='custom'&&startDate.value&&endDate.value){const start=EH.FinanceLedger.parseDateTime(`${startDate.value} 00:00:00`);const end=EH.FinanceLedger.parseDateTime(`${endDate.value} 23:59:59`);if(start&&end)records=records.filter(r=>Number(r.timestamp||0)>=start.getTime()&&Number(r.timestamp||0)<=end.getTime());}if(type.value==='PASSAGEM')records=records.filter(r=>r.category==='PASSAGEM');else if(type.value==='MERCH')records=records.filter(r=>r.category==='MERCADORIA_RECEBIDA'||r.category==='MERCADORIA_ENVIADA');else if(type.value!=='all')records=records.filter(r=>r.category===type.value);if(company.value!=='all')records=records.filter(r=>r.company===company.value);const q=EH.Utils.normalize(search.value||'');if(q)records=records.filter(r=>EH.Utils.normalize([r.company,r.passenger,r.identifier,r.dateTime,r.originalValue,r.status,r.description].join(' ')).includes(q));records.sort((a,b)=>Number(b.timestamp||0)-Number(a.timestamp||0));list.innerHTML='';records.forEach(record=>{const op=document.createElement('div');op.className='eh-finance-op';const hd=document.createElement('div');hd.className='eh-finance-op-head';const strong=document.createElement('strong');strong.textContent=`${record.category.replace(/_/g,' ')} • ${record.company}`;const time=document.createElement('time');time.textContent=record.dateTime;hd.append(strong,time);const vals=document.createElement('div');vals.className='eh-finance-op-values';const v=document.createElement('span');v.textContent=EH.Utils.formatMoney(record.originalValue);const c=document.createElement('b');c.textContent=`Comissão ${EH.Utils.formatMoney(EH.FinanceLedger.effectiveCommission(record))}`;const st=document.createElement('span');st.textContent=record.status||'';vals.append(v,c,st);const details=document.createElement('details');const sum=document.createElement('summary');sum.textContent='Detalhes';const body=document.createElement('div');body.textContent=[record.identifier?`ID: ${record.identifier}`:'',record.passenger?`Passageiro: ${record.passenger}`:'',`Origem: ${record.sourceOrigin}`,record.nature?`Natureza: ${record.nature}`:'',record.description].filter(Boolean).join(' • ');details.append(sum,body);if(record.sourceOrigin==='manual'){const actions=document.createElement('div');actions.className='eh-settings-inline-actions';const edit=document.createElement('button');edit.className='eh-modal-btn';edit.textContent='Editar';edit.addEventListener('click',()=>this.showMerchandiseModal(record));const del=document.createElement('button');del.className='eh-modal-btn';del.textContent='Excluir';del.addEventListener('click',()=>{if(EH.Config.FINANCE_CONFIRM_DELETE&&!confirm('Excluir este lançamento manual?'))return;EH.FinanceLedger.deleteManual(record.id);refresh();});actions.append(edit,del);details.appendChild(actions);}op.append(hd,vals,details);list.appendChild(op);});if(!records.length){const empty=document.createElement('div');empty.className='eh-help-box';empty.textContent='Nenhuma operação encontrada para este filtro.';list.appendChild(empty);}};
                period.addEventListener('change',()=>{toggleCustom();refresh();});[type,company,startDate,endDate].forEach(el=>el.addEventListener('change',refresh));search.addEventListener('input',EH.Utils.debounce(refresh,150));toggleCustom();refresh();
            };

            const renderCompanies=()=>{companiesPane.innerHTML='';const nav=document.createElement('div');nav.className='eh-finance-month-nav';const prev=document.createElement('button');prev.className='eh-modal-btn';prev.textContent='‹';const lbl=document.createElement('strong');lbl.textContent=monthLabel(monthState.key);const next=document.createElement('button');next.className='eh-modal-btn';next.textContent='›';prev.addEventListener('click',()=>shiftMonth(-1));next.addEventListener('click',()=>shiftMonth(1));nav.append(prev,lbl,next);companiesPane.appendChild(nav);const summary=EH.FinanceLedger.monthSummary(monthState.key);Object.values(summary.byCompany||{}).sort((a,b)=>b.movement-a.movement).forEach(company=>{const card=document.createElement('div');card.className='eh-finance-company-card';const h=document.createElement('h4');h.textContent=company.company;const row=document.createElement('div');row.className='eh-finance-company-grid';const cell=(l,v)=>{const d=document.createElement('div');d.textContent=l;const b=document.createElement('b');b.textContent=v;d.appendChild(b);return d;};row.append(cell('Operações',String(company.operations)),cell('Passagens',EH.Utils.formatMoney(company.passageValue)),cell('Mercadorias',EH.Utils.formatMoney(company.merchandiseValue)),cell('Total movimentado',EH.Utils.formatMoney(company.movement)),cell('Comissão',EH.Utils.formatMoney(company.commission)),cell('Percentual médio',`${company.averagePercent.toFixed(2).replace('.',',')}%`));card.append(h,row);companiesPane.appendChild(card);});};

            const renderMerch=()=>{merchPane.innerHTML='';const actions=document.createElement('div');actions.className='eh-finance-toolbar';const add=document.createElement('button');add.className='eh-modal-btn primary';add.textContent='+ Nova mercadoria';add.addEventListener('click',()=>this.showMerchandiseModal());const filter=document.createElement('select');filter.innerHTML='<option value="all">Todas</option><option value="MERCADORIA_RECEBIDA">Recebidas</option><option value="MERCADORIA_ENVIADA">Enviadas</option>';actions.append(add,filter);merchPane.appendChild(actions);const list=document.createElement('div');list.className='eh-finance-list';merchPane.appendChild(list);const refresh=()=>{let records=EH.FinanceLedger.visibleRecords().filter(r=>r.category==='MERCADORIA_RECEBIDA'||r.category==='MERCADORIA_ENVIADA');if(filter.value!=='all')records=records.filter(r=>r.category===filter.value);records.sort((a,b)=>Number(b.timestamp||0)-Number(a.timestamp||0));const sum=EH.FinanceLedger.summary(records);const info=document.createElement('div');info.className='eh-help-box';info.textContent=`${records.length} operação(ões) • ${EH.Utils.formatMoney(sum.movement)} • Comissão ${EH.Utils.formatMoney(sum.commission)}`;list.innerHTML='';list.appendChild(info);records.forEach(record=>{const op=document.createElement('div');op.className='eh-finance-op';const hd=document.createElement('div');hd.className='eh-finance-op-head';const s=document.createElement('strong');s.textContent=`${record.category==='MERCADORIA_RECEBIDA'?'RECEBIDA':'ENVIADA'} • ${record.company}`;const t=document.createElement('time');t.textContent=record.dateTime;hd.append(s,t);const vals=document.createElement('div');vals.className='eh-finance-op-values';vals.innerHTML=`<span>${EH.Utils.formatMoney(record.originalValue)}</span><b>Comissão ${EH.Utils.formatMoney(EH.FinanceLedger.effectiveCommission(record))}</b>`;const details=document.createElement('details');const sm=document.createElement('summary');sm.textContent='Detalhes / editar';const body=document.createElement('div');body.textContent=`Natureza: ${record.nature}${record.description?` • ${record.description}`:''}`;const btns=document.createElement('div');btns.className='eh-settings-inline-actions';const edit=document.createElement('button');edit.className='eh-modal-btn';edit.textContent='Editar';edit.addEventListener('click',()=>this.showMerchandiseModal(record));const del=document.createElement('button');del.className='eh-modal-btn';del.textContent='Excluir';del.addEventListener('click',()=>{if(EH.Config.FINANCE_CONFIRM_DELETE&&!confirm('Excluir este lançamento manual?'))return;EH.FinanceLedger.deleteManual(record.id);refresh();});btns.append(edit,del);details.append(sm,body,btns);op.append(hd,vals,details);list.appendChild(op);});};filter.addEventListener('change',refresh);refresh();};

            renderSummary();renderHistory();renderCompanies();renderMerch();activate(paneMap[initialTab]?initialTab:'resumo');
            const actions=document.createElement('div');actions.className='eh-modal-actions';const sync=document.createElement('button');sync.className='eh-modal-btn primary';sync.textContent='Atualizar dados';sync.addEventListener('click',()=>{EH.FinanceLedger.syncFromCurrentPage();renderSummary();renderHistory();renderCompanies();renderMerch();});const csv=document.createElement('button');csv.className='eh-modal-btn';csv.textContent='Exportar CSV';csv.addEventListener('click',()=>EH.FinanceLedger.exportCsv());const backup=document.createElement('button');backup.className='eh-modal-btn';backup.textContent='Backup JSON';backup.addEventListener('click',()=>EH.FinanceLedger.exportBackup());const closeBottom=document.createElement('button');closeBottom.className='eh-modal-btn';closeBottom.textContent='Fechar';const close=()=>overlay.remove();closeTop.addEventListener('click',close);closeBottom.addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});actions.append(sync,csv,backup,closeBottom);modal.append(head,content,actions);overlay.appendChild(modal);document.body.appendChild(overlay);
        },

        contextButton(label, cls, handler) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `eh-context-btn ${cls || ''}`.trim();
            btn.textContent = label;
            btn.addEventListener('click', handler);
            return btn;
        },

        renderSaleSummary(page) {
            if (!this.saleBox) return;
            this.saleBox.innerHTML = '';

            const showSale = page === 'passagens' || page === 'confirmacao' || page === 'pagamento';
            const showRequisition = page === 'requisicao' || page === 'confirmacao' || page === 'pagamento';
            const saleCard = showSale ? EH.SaleContext?.renderSaleCard?.() : null;
            const currentSaleId = showSale ? String(EH.SaleContext?.loadSale?.()?.id || '') : '';
            const persistentSaleCard = showSale ? EH.EmissionMemory?.renderPendingCard?.({ excludeSaleId: saleCard ? currentSaleId : '' }) : null;
            const requisitionCard = showRequisition ? EH.RequisitionManager?.renderCard?.() : null;

            if (!saleCard && !persistentSaleCard && !requisitionCard) {
                this.saleBox.hidden = true;
                return;
            }
            this.saleBox.hidden = false;
            if (saleCard) this.saleBox.appendChild(saleCard);
            if (persistentSaleCard) this.saleBox.appendChild(persistentSaleCard);
            if (requisitionCard) this.saleBox.appendChild(requisitionCard);
        },

        renderAutomation(page) {
            if (!this.steps || !this.contextBox) return;
            const active = EH.Workflow.infer(page);
            this.steps.innerHTML = '';
            EH.Workflow.stages.forEach(([key, num, label]) => {
                const item = document.createElement('div');
                item.className = `eh-step ${key === active ? 'active' : ''}`;
                item.innerHTML = `<strong>${num}</strong>${label}`;
                this.steps.appendChild(item);
            });

            this.contextBox.innerHTML = '';
            const title = document.createElement('strong');
            const info = document.createElement('div');
            const actions = document.createElement('div');
            actions.className = 'eh-context-actions';

            if (page === 'pesquisa') {
                title.textContent = 'Horários';
                const recent = this.lastCaptureState?.type === 'pesquisa' && (Date.now() - this.lastCaptureState.createdAt) < 90000;
                info.textContent = recent
                    ? 'Horários prontos. Prepare na conversa selecionada do WhatsApp.'
                    : 'Pesquise a rota e gere os horários.';
                actions.append(this.contextButton('🗓️ Gerar horários', 'primary', () => this.captureAction('pesquisa')));
            } else if (page === 'reserva') {
                title.textContent = 'Poltronas';
                info.textContent = 'Gere a imagem das poltronas e prepare na conversa selecionada.';
                actions.append(this.contextButton('💺 Gerar poltronas', 'primary', () => this.captureAction('reserva')));
            } else if (page === 'confirmacao' || page === 'pagamento') {
                const summary = EH.Payment.parseSummary();
                const pix = page === 'pagamento' ? EH.Payment.parsePix() : null;
                if (pix) {
                    const validation = pix.validation || EH.Payment.validatePix(EH.Payment.payload(pix));
                    title.textContent = 'PIX';
                    info.style.whiteSpace = 'pre-line';
                    const statusLines = [];
                    if (pix.value) statusLines.push(`💰 Valor: ${pix.value}`);
                    if (pix.expires) statusLines.push(`⏳ Expira: ${pix.expires}`);
                    statusLines.push(validation.valid ? '🟢 Código válido' : '🔴 PIX aparentemente incompleto ou inválido');
                    if (!validation.valid && validation.reason) statusLines.push(validation.reason);
                    info.textContent = statusLines.join('\n');

                    const sendPix = this.contextButton('💬 Enviar PIX', 'primary', () => this.sendPixPairToWhatsApp());
                    const copyPix = this.contextButton('📋 Copiar PIX', 'success', () => EH.Payment.copyPixCode(pix));
                    [sendPix, copyPix].forEach(btn => { btn.disabled = !validation.valid; });
                    actions.append(sendPix, copyPix);
                } else {
                    title.textContent = 'Confirmação';
                    info.textContent = summary?.cards?.length
                        ? `${summary.cards[0].passenger || 'Passageiro'} • ${summary.cards[0].seat ? `poltrona ${summary.cards[0].seat}` : 'confira os dados'}`
                        : 'Preencha os dados do passageiro para preparar a confirmação.';
                    const msg = EH.Payment.formatSummary(summary);
                    actions.append(
                        this.contextButton('💬 WhatsApp', 'primary', async () => {
                            if (!msg) return EH.Toast.warning('Resumo não encontrado.');
                            const result = await this.openWhatsApp(msg, { allowCurrentChat: true, bridgeOnly: true });
                            if (result?.connected) EH.Toast.success('Confirmação preparada no WhatsApp.');
                        }),
                        this.contextButton('📋 Copiar confirmação', '', async () => {
                            if (!msg) return EH.Toast.warning('Resumo não encontrado.');
                            await EH.Clipboard.copyText(msg);
                            EH.Toast.success('✓ Confirmação copiada');
                        })
                    );
                    if (page === 'pagamento') {
                        actions.append(this.contextButton('✅ Cliente confirmou → Gerar PIX', 'success', () => EH.Payment.clientConfirmed()));
                    }
                }
            } else if (page === 'passagens') {
                title.textContent = 'Bilhetes';
                const passengers = EH.SaleContext.load();
                const currentSale = EH.SaleContext.loadSale();
                const persistentPending = EH.EmissionMemory?.pending?.({ excludeSaleId: currentSale?.id || '' }) || [];
                const capturedEntries = EH.Tickets.listStoredCaptures();
                info.textContent = passengers.length
                    ? 'Busque um passageiro por vez. A venda atual é temporária, mas as emissões também ficam na memória persistente/sincronizada.'
                    : persistentPending.length
                        ? `${persistentPending.length} emissão(ões) pendente(s) recuperada(s) da memória operacional. Busque pelo CPF e capture o bilhete quando necessário.`
                        : 'Pesquise um CPF, capture o bilhete e ele ficará guardado para ser unido com os próximos.';
                const cpfBlock = EH.SaleContext.renderBlock();
                const persistentBlock = EH.EmissionMemory?.renderPendingBlock?.({ excludeSaleId: currentSale?.id || '' });
                const capturedBlock = EH.Tickets.renderCapturedBlock();
                actions.append(this.contextButton('🎫 Capturar bilhete', 'primary', () => EH.Tickets.activateSelection()));
                if (capturedEntries.length) {
                    actions.append(this.contextButton('🧩 Usar bilhetes capturados', '', () => {
                        const block = document.querySelector('#eh-root .eh-ticket-captured-row');
                        block?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                    }));
                }
                this.contextBox.append(title, info);
                if (cpfBlock) this.contextBox.appendChild(cpfBlock);
                if (persistentBlock) this.contextBox.appendChild(persistentBlock);
                if (capturedBlock) this.contextBox.appendChild(capturedBlock);
                this.contextBox.append(actions);
                return;
            } else if (page === 'caixa' || page === 'comissoes') {
                title.textContent = page === 'caixa' ? 'Caixa' : 'Comissões';
                info.textContent = 'Controle local do Helper. Os valores oficiais do E-Pass permanecem intactos.';
                if (EH.Config.FINANCE_SHOW_CAIXA_SUMMARY) this.contextBox.append(title, info, this.financeMiniSummary());
                else this.contextBox.append(title, info);
                actions.append(
                    this.contextButton('🔄 Atualizar dados', 'primary', () => EH.FinanceLedger.syncFromCurrentPage()),
                    this.contextButton('📦 + Mercadoria', 'success', () => this.showMerchandiseModal()),
                    this.contextButton('📊 Mais', '', () => this.showFinanceModal('resumo'))
                );
                this.contextBox.append(actions);
                return;
            } else if (page === 'requisicao') {
                title.textContent = 'Requisição';
                info.textContent = 'Passageiros, mercados e códigos ficam disponíveis abaixo conforme a solicitação.';
            } else {
                title.textContent = 'Atendimento';
                info.textContent = EH.WhatsAppBridge.isOnline()
                    ? 'Escolha a etapa do E-Pass para mostrar somente as ações necessárias.'
                    : 'Mantenha a aba do WhatsApp Web já autenticada aberta em segundo plano.';
            }

            this.contextBox.append(title, info);
            if (actions.children.length) this.contextBox.append(actions);
        },

        createButton(icon, label, extraClass, action) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `eh-btn ${extraClass}`.trim();
            button.innerHTML = `<span class="eh-btn-icon">${icon}</span><span>${label}</span>`;
            button.addEventListener('click', event => {
                event.stopPropagation();
                if (!button.disabled && !this.busy) action();
            });
            return button;
        },

        updateState(page) {
            if (!this.root) return;
            const isPesquisa = page === 'pesquisa';
            const isReserva = page === 'reserva';
            const isConfirmacao = page === 'confirmacao';
            const isPassagens = page === 'passagens';
            const isPagamento = page === 'pagamento';
            const isRequisicao = page === 'requisicao';
            const isFinanceiro = page === 'caixa' || page === 'comissoes';

            // O painel é contextual: a ação principal fica no cartão da etapa atual.
            // Os botões genéricos antigos permanecem no código apenas para compatibilidade,
            // mas não disputam espaço com a ação principal.
            if (this.primaryActions) this.primaryActions.hidden = true;
            if (this.toolsTitle) this.toolsTitle.hidden = true;
            if (this.toolsDivider) this.toolsDivider.hidden = true;

            if (this.quickTitle) this.quickTitle.hidden = !isPesquisa;
            if (this.quickRoutes) this.quickRoutes.hidden = !isPesquisa;
            if (this.flowSection) this.flowSection.hidden = isRequisicao || isFinanceiro;

            this.buttons.horarios.hidden = true;
            this.buttons.reserva.hidden = true;
            this.buttons.bilhete.hidden = true;
            this.buttons.enviar.hidden = true;

            const hasHistory = EH.History.list().length > 0;
            this.buttons.resumo.hidden = !(isPesquisa || isReserva);
            this.buttons.detalhes.hidden = !(isPesquisa || isReserva);
            this.buttons.rotas.hidden = !isPesquisa;
            this.buttons.historico.hidden = !(hasHistory && (isPesquisa || isReserva));

            this.buttons.resumo.disabled = this.busy;
            this.buttons.detalhes.disabled = this.busy;
            this.buttons.rotas.disabled = this.busy;
            this.buttons.historico.disabled = this.busy;

            const secondary = [this.buttons.resumo, this.buttons.detalhes, this.buttons.rotas, this.buttons.historico];
            if (this.moreTools) this.moreTools.hidden = !secondary.some(button => button && !button.hidden);

            const activeContext = isPesquisa || isReserva || isConfirmacao || isPassagens || isPagamento || isRequisicao || isFinanceiro;
            this.statusDot.classList.toggle('active', activeContext);
            this.statusText.textContent = isPesquisa
                ? 'Horários'
                : isReserva
                    ? 'Poltronas'
                    : isConfirmacao
                        ? 'Confirmação'
                        : isPagamento
                            ? (EH.Payment.parsePix() ? 'PIX pronto' : 'Pagamento')
                            : isPassagens
                                ? 'Bilhetes'
                                : isRequisicao
                                    ? 'Requisição'
                                    : isFinanceiro
                                        ? (page === 'caixa' ? 'Caixa' : 'Comissões')
                                        : 'Aguardando etapa';

            this.renderSaleSummary(page);
            this.renderAutomation(page);
            if (isPagamento) EH.Payment.handlePixReady().catch(() => {});
        },

        setBusy(value, message) {
            this.busy = Boolean(value);
            Object.values(this.buttons).forEach(button => {
                if (button) button.disabled = this.busy;
            });
            if (message) this.statusText.textContent = message;
            if (!value) EH.Pages.update();
        },

        getCurrentData(page) {
            return page === 'reserva' ? EH.Parser.parseReserva() : EH.Parser.parsePesquisa();
        },

        async copyCurrentSummary() {
            const page = EH.Pages.detect();
            if (page === 'desconhecida') {
                EH.Toast.warning('Abra a pesquisa de horários ou o mapa de poltronas.');
                return;
            }
            try {
                this.setBusy(true, 'Copiando resumo…');
                const data = this.getCurrentData(page);
                const text = EH.Parser.formatForWhatsApp(data, page, 'summary');
                await EH.Clipboard.copyText(text);
                EH.Toast.success('✓ Resumo copiado');
            } catch (error) {
                EH.Logger.error(error);
                EH.Toast.error(error.message || 'Não foi possível copiar o resumo.');
            } finally {
                this.setBusy(false);
            }
        },

        async copyCurrentDetails() {
            const page = EH.Pages.detect();
            if (page === 'desconhecida') {
                EH.Toast.warning('Abra a pesquisa de horários ou o mapa de poltronas.');
                return;
            }
            try {
                this.setBusy(true, 'Copiando detalhes…');
                const data = this.getCurrentData(page);
                const text = EH.Parser.formatForWhatsApp(data, page, 'details');
                await EH.Clipboard.copyText(text);
                EH.Toast.success('✓ Detalhes copiados');
            } catch (error) {
                EH.Logger.error(error);
                EH.Toast.error(error.message || 'Não foi possível copiar os detalhes.');
            } finally {
                this.setBusy(false);
            }
        },

        async copyCurrentText() {
            return this.copyCurrentSummary();
        },

        async captureTicketCard(card) {
            let prepared;
            try {
                this.setBusy(true, 'Capturando passagem…');
                prepared = EH.Tickets.prepareCapture(card);
                const activePassenger = EH.SaleContext?.getActivePassenger?.() || null;
                const searchedCpf = EH.SaleContext?.normalizeCpf?.(EH.Utils.first(EH.Selectors.PASSAGENS_CPF_INPUT)?.value || '') || '';
                const fallbackPassenger = activePassenger || (searchedCpf ? EH.SaleContext?.findPassengerByCpf?.(searchedCpf) : null);
                const reminderCaptureItems = [{
                    passengerId: fallbackPassenger?.id || null,
                    cpf: fallbackPassenger?.cpf || searchedCpf || '',
                    name: fallbackPassenger?.name || '',
                    data: prepared.data,
                    tickets: prepared.data?.tickets?.slice?.() || [],
                    ticket: prepared.data?.tickets?.[0] || null
                }];
                EH.Tickets.rememberCapturedItems(reminderCaptureItems);
                EH.Reminders?.captureItems?.(reminderCaptureItems);
                EH.Tickets.clearSelection();

                const canvasPromise = EH.Capture.renderTicket(prepared);
                const blobPromise = canvasPromise.then(canvas => EH.Clipboard.canvasToBlob(canvas));
                const earlyCopyPromise = EH.Config.AUTO_COPY_IMAGES
                    ? EH.Clipboard.tryAutoCopyImage(blobPromise)
                    : Promise.resolve({ copied: false, reason: 'Cópia automática desativada.' });
                const canvas = await canvasPromise;
                const blob = await blobPromise;
                const dataUrl = canvas.toDataURL('image/png', 1);
                EH.Clipboard.rememberImage(dataUrl, prepared.filename || 'bilhete-epass.png');
                let autoCopy = await earlyCopyPromise;
                if (!autoCopy.copied && EH.Config.AUTO_COPY_IMAGES) autoCopy = await EH.Clipboard.finishAutoCopy(autoCopy);
                const message = EH.Messages.get('bilhete');
                const ticketNumber = prepared.data?.tickets?.[0]?.number || prepared.data?.summary?.ticket || '';
                const summary = `Bilhete${ticketNumber ? ` ${ticketNumber}` : ''}${prepared.data?.status ? ` • ${prepared.data.status}` : ''}`;
                const history = EH.History.add({
                    type: 'bilhete', dataUrl, message, text: prepared.text, filename: prepared.filename, summary
                });
                this.lastCaptureState = {
                    type: 'bilhete',
                    copied: Boolean(autoCopy.copied),
                    dataUrl,
                    historyId: history?.id || '',
                    message,
                    summary,
                    createdAt: Date.now()
                };

                const waPrepared = false;

                this.showPreview({
                    blob,
                    dataUrl,
                    text: prepared.text,
                    summaryText: prepared.text,
                    detailsText: prepared.text,
                    message,
                    filename: prepared.filename,
                    captureType: 'bilhete',
                    historyId: history?.id || '',
                    copied: autoCopy.copied,
                    reason: autoCopy.reason || ''
                });

                if (autoCopy.copied) EH.Toast.success('✓ Bilhete copiado');
                else EH.Toast.warning('Bilhete capturado. Use “WhatsApp” para preparar o envio ou “Baixar PNG”.', 5200);
            } catch (error) {
                if (prepared?.shell) EH.Capture.destroyShell(prepared.shell);
                EH.Logger.error('Falha na captura da passagem:', error);
                EH.Toast.error(error.message || 'Não foi possível capturar a passagem.', 5200);
            } finally {
                this.setBusy(false);
            }
        },

        async captureTicketSelection(items = []) {
            const selectedItems = Array.isArray(items) ? items.slice(0, 2) : [];
            if (!selectedItems.length) {
                EH.Toast.warning('Selecione pelo menos um bilhete.');
                return;
            }

            try {
                this.setBusy(true, selectedItems.length > 1 ? `Juntando ${selectedItems.length} bilhetes…` : 'Capturando bilhete…');
                EH.Tickets.rememberCapturedItems(selectedItems);
                EH.Reminders?.captureItems?.(selectedItems);
                const width = Math.min(520, Math.max(360, Number(EH.Config.TICKET_CAPTURE_WIDTH) || 430));
                const canvases = selectedItems.map(item => EH.Capture.renderTicketCanvas(item.data, width));
                const canvas = EH.Capture.combineTicketCanvases(canvases);
                const blob = await EH.Clipboard.canvasToBlob(canvas);
                const dataUrl = canvas.toDataURL('image/png', 1);
                const ticketNumbers = selectedItems
                    .flatMap(item => (item.data?.tickets || []).map(ticket => EH.Utils.clean(ticket?.number || '')))
                    .filter(Boolean);
                const filenameParts = selectedItems
                    .map(item => EH.Utils.clean(item.data?.tickets?.[0]?.number || ''))
                    .filter(Boolean);
                const filename = filenameParts.length
                    ? `bilhetes-${filenameParts.join('-')}.png`
                    : `bilhetes-${Date.now()}.png`;
                EH.Clipboard.rememberImage(dataUrl, filename);

                let autoCopy = EH.Config.AUTO_COPY_IMAGES
                    ? await EH.Clipboard.tryAutoCopyImage(Promise.resolve(blob))
                    : { copied: false, reason: 'Cópia automática desativada.' };
                if (!autoCopy.copied && EH.Config.AUTO_COPY_IMAGES) {
                    autoCopy = await EH.Clipboard.finishAutoCopy(autoCopy);
                }

                const message = EH.Messages.get('bilhete');
                const activePassenger = EH.SaleContext?.getActivePassenger?.() || null;
                const passengerName = activePassenger?.name || '';
                const summary = selectedItems.length === 2
                    ? `2 bilhetes${passengerName ? ` • ${passengerName}` : ''}`
                    : `Bilhete${ticketNumbers[0] ? ` ${ticketNumbers[0]}` : ''}${passengerName ? ` • ${passengerName}` : ''}`;
                const details = selectedItems
                    .map(item => EH.Utils.clean(item.data?.text || ''))
                    .filter(Boolean)
                    .join('\n\n');

                const history = EH.History.add({
                    type: 'bilhete',
                    dataUrl,
                    message,
                    text: details,
                    filename,
                    summary
                });
                this.lastCaptureState = {
                    type: 'bilhete',
                    copied: Boolean(autoCopy.copied),
                    dataUrl,
                    historyId: history?.id || '',
                    message,
                    summary,
                    createdAt: Date.now()
                };

                const byPassenger = new Map();
                selectedItems.forEach(item => {
                    if (!item.passengerId) return;
                    if (!byPassenger.has(item.passengerId)) byPassenger.set(item.passengerId, []);
                    byPassenger.get(item.passengerId).push(...(item.data?.tickets || []));
                });
                byPassenger.forEach((tickets, passengerId) => {
                    EH.SaleContext?.markTicketCaptured?.(passengerId, tickets);
                });

                this.showPreview({
                    blob,
                    dataUrl,
                    text: details,
                    summaryText: details,
                    detailsText: details,
                    message,
                    filename,
                    captureType: 'bilhete',
                    historyId: history?.id || '',
                    copied: Boolean(autoCopy.copied),
                    reason: autoCopy.reason || ''
                });

                EH.Tickets.clearSelection();
                if (autoCopy.copied) {
                    EH.Toast.success(selectedItems.length > 1 ? `✓ ${selectedItems.length} bilhetes unidos e copiados` : '✓ Bilhete copiado');
                } else {
                    EH.Toast.success(selectedItems.length > 1 ? `✓ ${selectedItems.length} bilhetes unidos em uma imagem` : '✓ Bilhete capturado');
                }
            } catch (error) {
                EH.Logger.error('Falha ao montar os bilhetes selecionados:', error);
                EH.Toast.error(error.message || 'Não foi possível capturar os bilhetes.');
            } finally {
                this.setBusy(false);
            }
        },

        async captureStoredTicketEntries(entries = []) {
            const selectedItems = (Array.isArray(entries) ? entries : []).filter(item => item?.data);
            if (!selectedItems.length) {
                EH.Toast.warning('Nenhum bilhete capturado foi selecionado.');
                return;
            }

            try {
                EH.Reminders?.captureItems?.(selectedItems);
                this.setBusy(true, selectedItems.length > 1 ? `Gerando imagem com ${selectedItems.length} bilhetes…` : 'Preparando bilhete…');
                const width = Math.min(520, Math.max(360, Number(EH.Config.TICKET_CAPTURE_WIDTH) || 430));
                const canvases = selectedItems.map(item => EH.Capture.renderTicketCanvas(item.data, width));
                const canvas = EH.Capture.combineTicketCanvases(canvases);
                const blob = await EH.Clipboard.canvasToBlob(canvas);
                const dataUrl = canvas.toDataURL('image/png', 1);
                const ticketNumbers = selectedItems
                    .flatMap(item => (item.data?.tickets || []).map(ticket => EH.Utils.clean(ticket?.number || '')))
                    .filter(Boolean);
                const filename = ticketNumbers.length
                    ? `bilhetes-${ticketNumbers.join('-')}.png`
                    : `bilhetes-${Date.now()}.png`;
                EH.Clipboard.rememberImage(dataUrl, filename);

                let autoCopy = EH.Config.AUTO_COPY_IMAGES
                    ? await EH.Clipboard.tryAutoCopyImage(Promise.resolve(blob))
                    : { copied: false, reason: 'Cópia automática desativada.' };
                if (!autoCopy.copied && EH.Config.AUTO_COPY_IMAGES) {
                    autoCopy = await EH.Clipboard.finishAutoCopy(autoCopy);
                }

                const message = EH.Messages.get('bilhete');
                const summary = selectedItems.length > 1
                    ? `${selectedItems.length} bilhetes unidos`
                    : `Bilhete${ticketNumbers[0] ? ` ${ticketNumbers[0]}` : ''}${selectedItems[0]?.name ? ` • ${selectedItems[0].name}` : ''}`;
                const details = selectedItems
                    .map(item => {
                        const header = [EH.Utils.clean(item.name || ''), item.cpf ? EH.SaleContext.maskCpfPublic(item.cpf) : '']
                            .filter(Boolean)
                            .join(' • ');
                        const text = EH.Utils.clean(item.data?.text || item.text || '');
                        return [header, text].filter(Boolean).join('\n');
                    })
                    .filter(Boolean)
                    .join('\n\n');

                const history = EH.History.add({
                    type: 'bilhete',
                    dataUrl,
                    message,
                    text: details,
                    filename,
                    summary
                });
                this.lastCaptureState = {
                    type: 'bilhete',
                    copied: Boolean(autoCopy.copied),
                    dataUrl,
                    historyId: history?.id || '',
                    message,
                    summary,
                    createdAt: Date.now()
                };

                this.showPreview({
                    blob,
                    dataUrl,
                    text: details,
                    summaryText: details,
                    detailsText: details,
                    message,
                    filename,
                    captureType: 'bilhete',
                    historyId: history?.id || '',
                    copied: Boolean(autoCopy.copied),
                    reason: autoCopy.reason || ''
                });

                if (autoCopy.copied) EH.Toast.success(selectedItems.length > 1 ? `✓ ${selectedItems.length} bilhetes unidos e copiados` : '✓ Bilhete copiado');
                else EH.Toast.success(selectedItems.length > 1 ? `✓ ${selectedItems.length} bilhetes unidos em uma imagem` : '✓ Bilhete preparado');
            } catch (error) {
                EH.Logger.error('Falha ao preparar os bilhetes capturados:', error);
                EH.Toast.error(error.message || 'Não foi possível preparar os bilhetes capturados.');
            } finally {
                this.setBusy(false);
            }
        },

        async captureAction(expectedPage, options = {}) {
            const opts = { automatic: false, showPreview: true, ...options };
            const page = EH.Pages.detect();
            if (page !== expectedPage) {
                EH.Toast.warning(expectedPage === 'pesquisa'
                    ? 'Abra primeiro a tela com a tabela de horários.'
                    : 'Abra primeiro o mapa de poltronas.');
                return;
            }

            try {
                this.setBusy(true, 'Gerando imagem…');
                const data = this.getCurrentData(page);
                const summaryText = EH.Parser.formatForWhatsApp(data, page, 'summary');
                const detailsText = EH.Parser.formatForWhatsApp(data, page, 'details');

                if (page === 'pesquisa' && !data.horarios.length) {
                    throw new Error('Nenhum horário foi encontrado na tabela.');
                }

                const capture = EH.Capture.start(page, data);
                const blobPromise = capture.canvasPromise.then(canvas => EH.Clipboard.canvasToBlob(canvas));
                const earlyCopyPromise = EH.Config.AUTO_COPY_IMAGES
                    ? EH.Clipboard.tryAutoCopyImage(blobPromise)
                    : Promise.resolve({ copied: false, reason: 'Cópia automática desativada.' });

                const canvas = await capture.canvasPromise;
                const blob = await blobPromise;
                const dataUrl = canvas.toDataURL('image/png', 1);
                EH.Clipboard.rememberImage(dataUrl, capture.prepared?.filename || `${page}-epass.png`);
                let autoCopy = await earlyCopyPromise;
                if (!autoCopy.copied && EH.Config.AUTO_COPY_IMAGES) {
                    autoCopy = await EH.Clipboard.finishAutoCopy(autoCopy);
                }
                const message = EH.Messages.get(page);
                const summary = page === 'pesquisa'
                    ? `Horários • ${[data.origem, data.destino].filter(Boolean).join(' → ')}${data.data ? ` • ${data.data}` : ''}`
                    : `Reserva • ${data.origemDestino || 'Mapa de poltronas'}${data.horaSaida ? ` • ${data.horaSaida}` : ''}`;
                const history = EH.History.add({
                    type: page, dataUrl, message, text: detailsText, summaryText, filename: capture.prepared.filename, summary
                });

                this.lastCaptureState = {
                    type: page,
                    copied: Boolean(autoCopy.copied),
                    dataUrl,
                    historyId: history?.id || '',
                    message,
                    summary,
                    createdAt: Date.now()
                };

                // A captura apenas gera a imagem; o envio é preparado somente quando o usuário clicar em “WhatsApp”.
                const waPrepared = false;

                const shouldShowPreview = opts.showPreview === true || (opts.showPreview === 'ifFailed' && !autoCopy.copied && !waPrepared);
                if (shouldShowPreview) {
                    this.showPreview({
                        blob,
                        dataUrl,
                        summaryText,
                        detailsText,
                        text: detailsText,
                        message,
                        filename: capture.prepared.filename,
                        captureType: page,
                        historyId: history?.id || '',
                        copied: autoCopy.copied,
                        reason: autoCopy.reason || ''
                    });
                }

                if (autoCopy.copied) {
                    EH.Toast.success('✓ Imagem pronta');
                } else {
                    EH.Toast.warning('Imagem criada. Use “WhatsApp” para preparar o envio ou “Baixar PNG”.', 5600);
                    if (!shouldShowPreview) {
                        this.showPreview({ blob, dataUrl, summaryText, detailsText, text: detailsText, message, filename: capture.prepared.filename, captureType: page, historyId: history?.id || '', copied: false, reason: autoCopy.reason || '' });
                    }
                }
                this.renderAutomation(page);
                return { canvas, blob, dataUrl, autoCopy, history };
            } catch (error) {
                EH.Logger.error('Falha na captura:', error);
                EH.Toast.error(error.message || 'Não foi possível gerar a imagem.', 5200);
            } finally {
                this.setBusy(false);
            }
        },

        showRoutes() {
            document.querySelector('#eh-routes-overlay')?.remove();
            const overlay = document.createElement('div');
            overlay.className = 'eh-overlay';
            overlay.id = 'eh-routes-overlay';

            const modal = document.createElement('div');
            modal.className = 'eh-modal';
            modal.style.width = 'min(720px, 96vw)';

            const head = document.createElement('div');
            head.className = 'eh-modal-head';
            const title = document.createElement('div');
            title.className = 'eh-modal-title';
            title.textContent = 'Rotas favoritas';
            const closeTop = document.createElement('button');
            closeTop.type = 'button';
            closeTop.className = 'eh-modal-close';
            closeTop.textContent = '✕';
            head.append(title, closeTop);

            const content = document.createElement('div');
            content.className = 'eh-modal-content';
            const list = document.createElement('div');
            list.className = 'eh-route-list';

            const refresh = () => {
                list.innerHTML = '';
                const routes = EH.Routes.getAll();
                routes.forEach(route => {
                    const card = document.createElement('div');
                    card.className = 'eh-route-card';
                    const titleEl = document.createElement('div');
                    titleEl.className = 'eh-route-title';
                    titleEl.textContent = `${route.origem} → ${route.destino}`;
                    card.appendChild(titleEl);
                    if (route.observacao) {
                        const note = document.createElement('div');
                        note.className = 'eh-route-note';
                        note.textContent = route.observacao;
                        card.appendChild(note);
                    }
                    const actions = document.createElement('div');
                    actions.className = 'eh-inline-actions';
                    const use = document.createElement('button');
                    use.type = 'button';
                    use.className = 'eh-mini-btn primary';
                    use.textContent = 'Usar rota';
                    use.addEventListener('click', async () => {
                        close();
                        try {
                            this.setBusy(true, 'Preenchendo rota…');
                            await EH.Routes.apply(route, { autoSearch: true, autoCapture: true });
                        } catch (error) {
                            EH.Toast.error(error.message || 'Não foi possível preencher a rota.', 5200);
                        } finally {
                            this.setBusy(false);
                        }
                    });
                    actions.appendChild(use);

                    if (route.observacao) {
                        const copyObs = document.createElement('button');
                        copyObs.type = 'button';
                        copyObs.className = 'eh-mini-btn';
                        copyObs.textContent = 'Copiar observação';
                        copyObs.addEventListener('click', async () => {
                            try {
                                await EH.Clipboard.copyText(route.observacao);
                                EH.Toast.success('Observação copiada.');
                            } catch (error) {
                                EH.Toast.error(error.message || 'Não foi possível copiar.');
                            }
                        });
                        actions.appendChild(copyObs);
                    }

                    const remove = document.createElement('button');
                    remove.type = 'button';
                    remove.className = 'eh-mini-btn danger';
                    remove.textContent = 'Excluir';
                    remove.addEventListener('click', () => {
                        EH.Routes.saveAll(EH.Routes.getAll().filter(item => item.id !== route.id));
                        refresh();
                    });
                    actions.appendChild(remove);
                    card.appendChild(actions);
                    list.appendChild(card);
                });
            };
            refresh();

            const section = document.createElement('div');
            section.className = 'eh-section-label';
            section.textContent = 'Adicionar outra rota';

            const formGrid = document.createElement('div');
            formGrid.className = 'eh-settings-grid';
            const makeField = (labelText, placeholder = '') => {
                const field = document.createElement('div');
                field.className = 'eh-field';
                const label = document.createElement('label');
                label.textContent = labelText;
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = placeholder;
                field.append(label, input);
                return { field, input };
            };
            const origin = makeField('Origem', 'Ex.: ARENOPOLIS - GO');
            const destination = makeField('Destino', 'Ex.: GOIANIA - GO');
            formGrid.append(origin.field, destination.field);

            const obsField = document.createElement('div');
            obsField.className = 'eh-field';
            obsField.style.marginTop = '10px';
            const obsLabel = document.createElement('label');
            obsLabel.textContent = 'Observação da rota (opcional)';
            const obsInput = document.createElement('textarea');
            obsInput.rows = 3;
            obsInput.placeholder = 'Ex.: compra antecipada, cidades por onde passa...';
            obsField.append(obsLabel, obsInput);

            const addActions = document.createElement('div');
            addActions.className = 'eh-inline-actions';
            const add = document.createElement('button');
            add.type = 'button';
            add.className = 'eh-mini-btn primary';
            add.textContent = 'Adicionar rota';
            add.addEventListener('click', () => {
                const origem = origin.input.value.trim();
                const destino = destination.input.value.trim();
                if (!origem || !destino) {
                    EH.Toast.warning('Informe origem e destino.');
                    return;
                }
                const routes = EH.Routes.getAll();
                routes.push({
                    id: `rota-${Date.now()}`,
                    origem,
                    destino,
                    observacao: obsInput.value.trim()
                });
                EH.Routes.saveAll(routes);
                origin.input.value = '';
                destination.input.value = '';
                obsInput.value = '';
                refresh();
                EH.Toast.success('Rota adicionada.');
            });
            const restore = document.createElement('button');
            restore.type = 'button';
            restore.className = 'eh-mini-btn';
            restore.textContent = 'Restaurar rotas padrão';
            restore.addEventListener('click', () => {
                EH.Routes.saveAll(EH.Routes.defaults.map(item => ({ ...item })));
                refresh();
                EH.Toast.success('Rotas padrão restauradas.');
            });
            addActions.append(add, restore);

            content.append(list, section, formGrid, obsField, addActions);

            const actions = document.createElement('div');
            actions.className = 'eh-modal-actions';
            const closeBottom = document.createElement('button');
            closeBottom.type = 'button';
            closeBottom.className = 'eh-modal-btn';
            closeBottom.textContent = 'Fechar';
            actions.appendChild(closeBottom);

            const close = () => overlay.remove();
            closeTop.addEventListener('click', close);
            closeBottom.addEventListener('click', close);
            overlay.addEventListener('click', event => { if (event.target === overlay) close(); });

            modal.append(head, content, actions);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        },

        showHistory() {
            document.querySelector('#eh-history-overlay')?.remove();
            const entries = EH.History.list();
            if (!entries.length) {
                EH.Toast.info('Ainda não há capturas no histórico.');
                return;
            }

            const overlay = document.createElement('div');
            overlay.className = 'eh-overlay';
            overlay.id = 'eh-history-overlay';
            const modal = document.createElement('div');
            modal.className = 'eh-modal';
            modal.style.width = 'min(760px, 96vw)';
            const head = document.createElement('div');
            head.className = 'eh-modal-head';
            const title = document.createElement('div');
            title.className = 'eh-modal-title';
            title.textContent = `Histórico das últimas capturas (${entries.length})`;
            const closeTop = document.createElement('button');
            closeTop.type = 'button';
            closeTop.className = 'eh-modal-close';
            closeTop.textContent = '✕';
            head.append(title, closeTop);
            const content = document.createElement('div');
            content.className = 'eh-modal-content';
            const list = document.createElement('div');
            list.className = 'eh-history-list';

            entries.forEach(meta => {
                const card = document.createElement('div');
                card.className = 'eh-history-card';
                const titleEl = document.createElement('div');
                titleEl.className = 'eh-history-title';
                titleEl.textContent = meta.summary || meta.filename;
                const note = document.createElement('div');
                note.className = 'eh-history-note';
                const date = new Date(meta.createdAt);
                note.textContent = `${Number.isNaN(date.getTime()) ? '' : date.toLocaleString('pt-BR')} • ${meta.filename || ''}`;
                card.append(titleEl, note);
                const row = document.createElement('div');
                row.className = 'eh-inline-actions';
                const open = document.createElement('button');
                open.type = 'button';
                open.className = 'eh-mini-btn primary';
                open.textContent = 'Abrir';
                open.addEventListener('click', () => {
                    const entry = EH.History.get(meta.id);
                    if (!entry) return EH.Toast.error('A imagem não está mais disponível no histórico.');
                    close();
                    const blob = EH.Clipboard.dataUrlToBlob(entry.dataUrl);
                    this.showPreview({
                        blob,
                        dataUrl: entry.dataUrl,
                        text: entry.text || '',
                        message: entry.message || EH.Messages.get(entry.type),
                        filename: entry.filename,
                        captureType: entry.type,
                        historyId: entry.id,
                        copied: false,
                        reason: 'Use “Copiar imagem”; o script tentará o modo compatível do navegador.'
                    });
                });
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'eh-mini-btn danger';
                remove.textContent = 'Excluir';
                remove.addEventListener('click', () => {
                    EH.History.remove(meta.id);
                    card.remove();
                    EH.Pages.update();
                    if (!EH.History.list().length) close();
                });
                row.append(open, remove);
                card.appendChild(row);
                list.appendChild(card);
            });
            content.appendChild(list);

            const actions = document.createElement('div');
            actions.className = 'eh-modal-actions';
            const clear = document.createElement('button');
            clear.type = 'button';
            clear.className = 'eh-modal-btn danger';
            clear.textContent = 'Limpar histórico';
            clear.addEventListener('click', () => {
                EH.History.clear();
                EH.Pages.update();
                close();
                EH.Toast.success('Histórico limpo.');
            });
            const closeBottom = document.createElement('button');
            closeBottom.type = 'button';
            closeBottom.className = 'eh-modal-btn';
            closeBottom.textContent = 'Fechar';
            actions.append(clear, closeBottom);
            const close = () => overlay.remove();
            closeTop.addEventListener('click', close);
            closeBottom.addEventListener('click', close);
            overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
            modal.append(head, content, actions);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        },

        showSend(historyId = '') {
            document.querySelector('#eh-send-overlay')?.remove();
            const entry = historyId ? EH.History.get(historyId) : EH.History.latest();
            if (!entry) {
                EH.Toast.info('Gere uma imagem antes de usar “Enviar”.');
                return;
            }

            const overlay = document.createElement('div');
            overlay.className = 'eh-overlay';
            overlay.id = 'eh-send-overlay';
            const modal = document.createElement('div');
            modal.className = 'eh-modal';
            modal.style.width = 'min(620px, 96vw)';
            const head = document.createElement('div');
            head.className = 'eh-modal-head';
            const title = document.createElement('div');
            title.className = 'eh-modal-title';
            title.textContent = 'Enviar atendimento';
            const closeTop = document.createElement('button');
            closeTop.type = 'button';
            closeTop.className = 'eh-modal-close';
            closeTop.textContent = '✕';
            head.append(title, closeTop);

            const content = document.createElement('div');
            content.className = 'eh-modal-content';
            const summary = document.createElement('div');
            summary.className = 'eh-help-box';
            summary.style.marginTop = '0';
            summary.innerHTML = `<strong>Resumo:</strong> ${entry.summary || entry.filename}`;

            const phoneField = document.createElement('div');
            phoneField.className = 'eh-field';
            phoneField.style.marginTop = '12px';
            const phoneLabel = document.createElement('label');
            phoneLabel.textContent = 'Telefone/WhatsApp do cliente';
            const phone = document.createElement('input');
            phone.type = 'tel';
            phone.placeholder = 'Ex.: (64) 99999-9999';
            phoneField.append(phoneLabel, phone);

            const msgField = document.createElement('div');
            msgField.className = 'eh-field';
            msgField.style.marginTop = '12px';
            const msgLabel = document.createElement('label');
            msgLabel.textContent = 'Mensagem';
            const msg = document.createElement('textarea');
            msg.rows = 4;
            msg.value = entry.message || EH.Messages.get(entry.type);
            msgField.append(msgLabel, msg);

            const includeSummary = document.createElement('label');
            includeSummary.className = 'eh-check';
            includeSummary.style.marginTop = '10px';
            const includeCheck = document.createElement('input');
            includeCheck.type = 'checkbox';
            const includeText = document.createElement('span');
            includeText.textContent = 'Incluir o resumo do atendimento na mensagem';
            includeSummary.append(includeCheck, includeText);

            const clipboardInfo = document.createElement('div');
            clipboardInfo.className = 'eh-help-box';
            clipboardInfo.textContent = `Modo deste computador: ${EH.Config.WHATSAPP_MODE === 'app' ? 'WhatsApp do Windows' : 'WhatsApp Web'}. No modo Web, as conversas aparecem integradas na lateral direita do E-Pass e usam a aba já aberta do WhatsApp Web como conexão; nenhuma nova aba ou popup é aberto.`;

            content.append(summary, phoneField, msgField, includeSummary, clipboardInfo);

            const finalMessage = () => {
                const base = msg.value.trim();
                return includeCheck.checked && entry.summary
                    ? `${base}${base ? '\n\n' : ''}${entry.summary}`
                    : base;
            };

            const actions = document.createElement('div');
            actions.className = 'eh-modal-actions';
            const openWhats = document.createElement('button');
            openWhats.type = 'button';
            openWhats.className = 'eh-modal-btn success';
            openWhats.textContent = '📤 Preparar no WhatsApp';
            openWhats.addEventListener('click', async () => {
                let digits = phone.value.replace(/\D/g, '');
                if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
                if (digits.length < 12) {
                    EH.Toast.warning('Informe o telefone com DDD.');
                    phone.focus();
                    return;
                }
                this.phoneInput.value = digits.startsWith('55') ? digits.slice(2) : digits;
                EH.Storage.set('currentPhone', this.phoneInput.value);
                const message = finalMessage();
                await this.openWhatsApp(message, {
                    imageDataUrl: entry.dataUrl,
                    filename: entry.filename || 'epass-atendimento.png'
                });
            });

            const imageButton = document.createElement('button');
            imageButton.type = 'button';
            imageButton.className = 'eh-modal-btn primary';
            imageButton.textContent = '📋 Copiar imagem';
            imageButton.addEventListener('click', async () => {
                const blob = EH.Clipboard.dataUrlToBlob(entry.dataUrl);
                const result = await EH.Clipboard.copyImageAnyContext(blob);
                if (result.copied) EH.Toast.success('✓ Imagem copiada');
                else EH.Toast.error(result.reason || 'O navegador bloqueou a cópia do PNG. Use o envio ao WhatsApp ou baixe a imagem.', 5200);
            });

            const copyMessage = document.createElement('button');
            copyMessage.type = 'button';
            copyMessage.className = 'eh-modal-btn';
            copyMessage.textContent = '💬 Copiar mensagem';
            copyMessage.addEventListener('click', async () => {
                try {
                    await EH.Clipboard.copyText(finalMessage());
                    EH.Toast.success('Mensagem copiada.');
                } catch (error) {
                    EH.Toast.error(error.message || 'Não foi possível copiar a mensagem.');
                }
            });

            const closeBottom = document.createElement('button');
            closeBottom.type = 'button';
            closeBottom.className = 'eh-modal-btn';
            closeBottom.textContent = 'Fechar';
            actions.append(openWhats, imageButton, copyMessage, closeBottom);
            const close = () => overlay.remove();
            closeTop.addEventListener('click', close);
            closeBottom.addEventListener('click', close);
            overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
            modal.append(head, content, actions);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        },

        showPreview({ blob, dataUrl, text, summaryText = '', detailsText = '', message, filename, captureType, historyId, copied, reason }) {
            document.querySelector('#eh-preview-overlay')?.remove();

            const overlay = document.createElement('div');
            overlay.className = 'eh-overlay';
            overlay.id = 'eh-preview-overlay';

            const modal = document.createElement('div');
            modal.className = 'eh-modal';

            const head = document.createElement('div');
            head.className = 'eh-modal-head';
            const headText = document.createElement('div');
            headText.style.flex = '1';
            const title = document.createElement('div');
            title.className = 'eh-modal-title';
            title.textContent = copied ? 'Imagem copiada com sucesso' : 'Prévia da imagem';
            const note = document.createElement('div');
            note.className = 'eh-modal-note';
            if (copied) {
                note.textContent = 'Cole no WhatsApp com Ctrl + V.';
            } else {
                note.textContent = reason || 'Clique em “Copiar imagem”. O script tentará o modo compatível do navegador.';
            }
            headText.append(title, note);

            const closeTop = document.createElement('button');
            closeTop.type = 'button';
            closeTop.className = 'eh-modal-close';
            closeTop.textContent = '✕';
            head.append(headText, closeTop);

            const content = document.createElement('div');
            content.className = 'eh-modal-content';
            const image = document.createElement('img');
            image.className = 'eh-preview-image';
            image.alt = 'Captura do E-Pass';
            image.src = dataUrl;
            content.appendChild(image);

            const automaticMessage = String(message || EH.Messages.get(captureType) || '').trim();
            if (automaticMessage) {
                const messageTitle = document.createElement('div');
                messageTitle.className = 'eh-section-label';
                messageTitle.textContent = 'Mensagem para o cliente';
                const messageBox = document.createElement('div');
                messageBox.className = 'eh-message-box';
                messageBox.textContent = automaticMessage;
                content.append(messageTitle, messageBox);
            }

            const actions = document.createElement('div');
            actions.className = 'eh-modal-actions';

            const copyImage = document.createElement('button');
            copyImage.type = 'button';
            copyImage.className = 'eh-modal-btn primary';
            copyImage.textContent = '📋 Copiar imagem';
            copyImage.addEventListener('click', async () => {
                const result = await EH.Clipboard.copyImageAnyContext(blob);
                if (result.copied) {
                    title.textContent = 'Imagem copiada com sucesso';
                    note.textContent = 'Cole no WhatsApp com Ctrl + V.';
                    EH.Toast.success('✓ Imagem copiada');
                } else {
                    note.textContent = result.reason || 'O navegador bloqueou a cópia binária. Use “Enviar ao WhatsApp” ou “Baixar PNG”.';
                    EH.Toast.error('Não foi possível copiar o PNG. Use “Enviar ao WhatsApp” ou “Baixar PNG”.', 5200);
                }
            });

            const download = document.createElement('a');
            download.className = 'eh-modal-btn success';
            download.href = dataUrl;
            download.download = filename || 'epass.png';
            download.textContent = '⬇ Baixar PNG';
            download.style.textDecoration = 'none';
            download.style.display = 'inline-flex';
            download.style.alignItems = 'center';

            const copySummary = document.createElement('button');
            copySummary.type = 'button';
            copySummary.className = 'eh-modal-btn primary';
            copySummary.textContent = '📋 Copiar resumo';
            const effectiveSummary = String(summaryText || automaticMessage || '').trim();
            copySummary.disabled = !effectiveSummary;
            copySummary.addEventListener('click', async () => {
                try {
                    await EH.Clipboard.copyText(effectiveSummary);
                    EH.Toast.success('✓ Resumo copiado');
                } catch (error) {
                    EH.Toast.error(error.message || 'Não foi possível copiar o resumo.');
                }
            });

            const sendWhatsApp = document.createElement('button');
            sendWhatsApp.type = 'button';
            sendWhatsApp.className = 'eh-modal-btn success';
            sendWhatsApp.textContent = '💬 WhatsApp';
            sendWhatsApp.disabled = !(EH.Config.WHATSAPP_MODE === 'web' && EH.WhatsAppBridge.isOnline() && EH.WhatsAppBridge.getUiState()?.active?.title);
            sendWhatsApp.addEventListener('click', async () => {
                const result = await this.openWhatsApp(automaticMessage, { imageDataUrl: dataUrl, filename, allowCurrentChat: true, bridgeOnly: true });
                if (result?.connected) EH.Toast.success('Imagem preparada no WhatsApp integrado.');
            });

            const send = document.createElement('button');
            send.type = 'button';
            send.className = 'eh-modal-btn success';
            send.textContent = '📤 Enviar atendimento';
            send.disabled = !historyId;
            send.addEventListener('click', () => {
                close();
                this.showSend(historyId);
            });

            const copyText = document.createElement('button');
            copyText.type = 'button';
            copyText.className = 'eh-modal-btn';
            copyText.textContent = '📄 Copiar detalhes';
            const effectiveDetails = String(detailsText || text || '').trim();
            copyText.disabled = !effectiveDetails;
            copyText.addEventListener('click', async () => {
                try {
                    await EH.Clipboard.copyText(effectiveDetails);
                    EH.Toast.success('✓ Detalhes copiados');
                } catch (error) {
                    EH.Toast.error(error.message || 'Não foi possível copiar o texto.');
                }
            });

            const closeBottom = document.createElement('button');
            closeBottom.type = 'button';
            closeBottom.className = 'eh-modal-btn';
            closeBottom.textContent = 'Fechar';

            const close = () => overlay.remove();
            closeTop.addEventListener('click', close);
            closeBottom.addEventListener('click', close);
            overlay.addEventListener('click', event => {
                if (event.target === overlay) close();
            });

            const more = document.createElement('details');
            more.className = 'eh-more-tools';
            const moreLabel = document.createElement('summary');
            moreLabel.textContent = '⋯ Mais';
            const moreActions = document.createElement('div');
            moreActions.className = 'eh-modal-actions';
            moreActions.append(copyImage, download, copyText);
            more.append(moreLabel, moreActions);

            actions.append(sendWhatsApp, copySummary, more, closeBottom);
            modal.append(head, content, actions);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        },

        showSettings() {
            document.querySelector('#eh-settings-overlay')?.remove();

            const overlay = document.createElement('div');
            overlay.className = 'eh-overlay';
            overlay.id = 'eh-settings-overlay';

            const modal = document.createElement('div');
            modal.className = 'eh-modal';
            modal.style.width = 'min(900px, 96vw)';

            const head = document.createElement('div');
            head.className = 'eh-modal-head';
            const title = document.createElement('div');
            title.className = 'eh-modal-title';
            title.textContent = 'Configurações';
            const closeTop = document.createElement('button');
            closeTop.type = 'button';
            closeTop.className = 'eh-modal-close';
            closeTop.textContent = '✕';
            head.append(title, closeTop);

            const content = document.createElement('div');
            content.className = 'eh-modal-content';

            const shell = document.createElement('div');
            shell.className = 'eh-settings-shell';
            const tabs = document.createElement('div');
            tabs.className = 'eh-settings-tabs';
            const panes = document.createElement('div');
            panes.className = 'eh-settings-panes';
            shell.append(tabs, panes);
            content.appendChild(shell);

            const fields = {};
            const clamp = (value, min, max, fallback) => {
                const n = Number(value);
                if (!Number.isFinite(n)) return fallback;
                return Math.min(max, Math.max(min, n));
            };
            const makePane = (id, label, description) => {
                const tab = document.createElement('button');
                tab.type = 'button';
                tab.className = 'eh-settings-tab';
                tab.textContent = label;
                tab.dataset.tab = id;
                const pane = document.createElement('section');
                pane.className = 'eh-settings-pane';
                pane.dataset.pane = id;
                const h = document.createElement('h3');
                h.textContent = label;
                const p = document.createElement('p');
                p.textContent = description;
                pane.append(h, p);
                tabs.appendChild(tab);
                panes.appendChild(pane);
                return { tab, pane };
            };
            const card = (titleText) => {
                const box = document.createElement('div');
                box.className = 'eh-settings-card';
                const t = document.createElement('div');
                t.className = 'eh-settings-card-title';
                t.textContent = titleText;
                box.appendChild(t);
                return box;
            };
            const grid = () => {
                const el = document.createElement('div');
                el.className = 'eh-settings-grid-compact';
                return el;
            };
            const numberField = (key, labelText, value, { min = 0, max = 9999, step = 1, hint = '' } = {}) => {
                const field = document.createElement('div');
                field.className = 'eh-field';
                const label = document.createElement('label');
                label.textContent = labelText;
                const input = document.createElement('input');
                input.type = 'number';
                input.min = String(min);
                input.max = String(max);
                input.step = String(step);
                input.value = String(value);
                field.append(label, input);
                if (hint) {
                    const small = document.createElement('div');
                    small.className = 'eh-settings-note';
                    small.textContent = hint;
                    field.appendChild(small);
                }
                fields[key] = input;
                return field;
            };
            const moneyField = (key, labelText, value, hint = '') => {
                const field = document.createElement('div');
                field.className = 'eh-field';
                const label = document.createElement('label');
                label.textContent = labelText;
                const input = document.createElement('input');
                input.type = 'text';
                input.inputMode = 'decimal';
                input.autocomplete = 'off';
                input.placeholder = '0,00';
                const parsed = EH.Utils.parseMoneyStrict(value);
                input.value = parsed === null ? '' : EH.Fares.round(Math.max(0, parsed)).toFixed(2).replace('.', ',');
                field.append(label, input);
                if (hint) {
                    const small = document.createElement('div');
                    small.className = 'eh-settings-note';
                    small.textContent = hint;
                    field.appendChild(small);
                }
                fields[key] = input;
                return field;
            };
            const selectField = (key, labelText, value, options, hint = '') => {
                const field = document.createElement('div');
                field.className = 'eh-field';
                const label = document.createElement('label');
                label.textContent = labelText;
                const select = document.createElement('select');
                options.forEach(([v, text]) => {
                    const option = document.createElement('option');
                    option.value = v;
                    option.textContent = text;
                    select.appendChild(option);
                });
                select.value = value;
                field.append(label, select);
                if (hint) {
                    const small = document.createElement('div');
                    small.className = 'eh-settings-note';
                    small.textContent = hint;
                    field.appendChild(small);
                }
                fields[key] = select;
                return field;
            };
            const checkField = (key, textLabel, checked, hint = '') => {
                const wrap = document.createElement('div');
                const label = document.createElement('label');
                label.className = 'eh-check';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = Boolean(checked);
                const span = document.createElement('span');
                span.textContent = textLabel;
                label.append(input, span);
                wrap.appendChild(label);
                if (hint) {
                    const small = document.createElement('div');
                    small.className = 'eh-settings-note';
                    small.textContent = hint;
                    wrap.appendChild(small);
                }
                fields[key] = input;
                return wrap;
            };
            const textareaField = (key, labelText, value) => {
                const field = document.createElement('div');
                field.className = 'eh-field';
                const label = document.createElement('label');
                label.textContent = labelText;
                const textarea = document.createElement('textarea');
                textarea.rows = 3;
                textarea.value = String(value || '');
                field.append(label, textarea);
                fields[key] = textarea;
                return field;
            };
            const textField = (key, labelText, value, hint = '') => {
                const field = document.createElement('div');
                field.className = 'eh-field';
                const label = document.createElement('label');
                label.textContent = labelText;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = String(value || '');
                field.append(label, input);
                if (hint) {
                    const small = document.createElement('div');
                    small.className = 'eh-settings-note';
                    small.textContent = hint;
                    field.appendChild(small);
                }
                fields[key] = input;
                return field;
            };
            const note = textValue => {
                const el = document.createElement('div');
                el.className = 'eh-settings-note';
                el.textContent = textValue;
                return el;
            };

            const sections = {
                geral: makePane('geral', 'Geral', 'Preferências do atendimento e automações simples do Helper.'),
                aparencia: makePane('aparencia', 'Aparência', 'Ajustes visuais seguros aplicados somente aos painéis do Helper.'),
                paineis: makePane('paineis', 'Painéis', 'Posição e dimensões dos overlays. O E-Pass original permanece intacto.'),
                whatsapp: makePane('whatsapp', 'WhatsApp', 'Visualização do painel integrado e mensagens automáticas do atendimento.'),
                zoom: makePane('zoom', 'Tela e Zoom', 'Escala dos overlays e posição vertical. Nenhum zoom é aplicado ao E-Pass.'),
                valores: makePane('valores', 'Atendimento', 'Taxas de embarque por origem e qualidade das capturas usadas no atendimento.'),
                financeiro: makePane('financeiro', 'Financeiro', 'Comissão e comportamento do controle local de Caixa e Comissões.'),
                carros: makePane('carros', 'Carros / Operação', 'Agência 287 e serviços usados na consulta rápida do Mapa de Viagem.'),
                lembretes: makePane('lembretes', 'Lembretes', 'Passagens emitidas/capturadas que precisam ser localizadas e impressas posteriormente.'),
                sincronizacao: makePane('sincronizacao', 'Sincronização', 'Dados operacionais compartilhados entre os computadores autorizados.'),
                avancado: makePane('avancado', 'Avançado', 'Diagnóstico e opções técnicas que normalmente não precisam ser alteradas.')
            };

            // GERAL
            const generalAutomation = card('Automação');
            generalAutomation.append(
                checkField('autoRoute', 'Rota rápida: pesquisar e gerar horários automaticamente', EH.Config.AUTO_ROUTE_CAPTURE),
                checkField('autoCopy', 'Tentar copiar automaticamente o PNG quando o navegador permitir', EH.Config.AUTO_COPY_IMAGES)
            );
            sections.geral.pane.appendChild(generalAutomation);

            // APARÊNCIA
            const presetCard = card('Presets');
            const presetRow = document.createElement('div');
            presetRow.className = 'eh-preset-row';
            let selectedPreset = EH.Config.SETTINGS_PRESET || 'padrao';
            const presetButtons = {};
            [
                ['compacto', 'Compacto'],
                ['padrao', 'Padrão'],
                ['confortavel', 'Confortável']
            ].forEach(([key, label]) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'eh-preset-btn';
                button.textContent = label;
                button.classList.toggle('active', selectedPreset === key);
                presetButtons[key] = button;
                presetRow.appendChild(button);
            });
            presetCard.append(presetRow, note('Os presets alteram somente densidade e escala dos painéis. Ajustes manuais continuam disponíveis.'));
            sections.aparencia.pane.appendChild(presetCard);

            const visualCard = card('Visual');
            const visualGrid = grid();
            visualGrid.append(
                selectField('density', 'Densidade', EH.Config.UI_DENSITY, [
                    ['compacto', 'Compacta'],
                    ['padrao', 'Padrão'],
                    ['confortavel', 'Confortável']
                ]),
                numberField('opacity', 'Opacidade (%)', Math.round(EH.Config.PANEL_OPACITY * 100), { min: 86, max: 100, step: 1 }),
                numberField('radius', 'Cantos (px)', EH.Config.PANEL_RADIUS, { min: 8, max: 22, step: 1 }),
                selectField('shadow', 'Sombra', EH.Config.SHADOW_LEVEL, [
                    ['none', 'Sem sombra'],
                    ['suave', 'Suave'],
                    ['normal', 'Padrão']
                ])
            );
            visualCard.appendChild(visualGrid);
            sections.aparencia.pane.appendChild(visualCard);

            // PAINÉIS
            const positionCard = card('Posição');
            const positionGrid = grid();
            positionGrid.append(
                selectField('side', 'Lado da tela', EH.Config.OVERLAY_SIDE, [
                    ['right', 'Direita (padrão)'],
                    ['left', 'Esquerda']
                ], 'Os dois painéis permanecem agrupados como overlays.'),
                numberField('topOffset', 'Distância do topo (px)', EH.Config.OVERLAY_TOP_OFFSET, { min: 0, max: 240, step: 2, hint: '0 = automático conforme o tamanho da tela.' })
            );
            positionCard.append(
                checkField('mainOpen', 'Manter o painel Atendimento aberto', EH.State.isOpen('left'), 'O estado é salvo localmente e pode ser alterado pelo botão recolher.'),
                positionGrid
            );
            sections.paineis.pane.appendChild(positionCard);

            const dimensionsCard = card('Dimensões');
            const dimensionsGrid = grid();
            dimensionsGrid.append(
                numberField('panelWidth', 'Atendimento — largura (px)', EH.Config.PANEL_CUSTOM_WIDTH, { min: 0, max: 440, step: 5, hint: '0 = largura automática atual.' }),
                numberField('panelHeight', 'Atendimento — altura (%)', EH.Config.PANEL_HEIGHT_PERCENT, { min: 0, max: 90, step: 5, hint: '0 = altura automática atual.' }),
                numberField('waWidth', 'Conversa atual — largura (px)', EH.Config.WHATSAPP_CUSTOM_WIDTH, { min: 0, max: 420, step: 5, hint: '0 = largura automática atual.' }),
                numberField('waHeight', 'Conversa atual — altura (%)', EH.Config.WHATSAPP_HEIGHT_PERCENT, { min: 0, max: 80, step: 5, hint: '0 = altura automática atual.' })
            );
            dimensionsCard.appendChild(dimensionsGrid);
            sections.paineis.pane.appendChild(dimensionsCard);

            const managedPanels = EH.PanelManager.load();
            const panelDrafts = JSON.parse(JSON.stringify(managedPanels));
            const controlCard = card('Mover, fixar e dimensionar');
            const controlGrid = grid();
            controlGrid.append(
                selectField('managedPanel', 'Painel', 'main', [
                    ['main','Atendimento'], ['whatsapp','WhatsApp'], ['operation','Operação / Carros']
                ]),
                selectField('managedMode', 'Posição', panelDrafts.main.mode, [
                    ['automatic','Automático atual'], ['free','Livre / arrastar'], ['left','Esquerda'], ['right','Direita'],
                    ['top','Superior'], ['bottom','Inferior'], ['top-left','Superior esquerdo'], ['top-right','Superior direito'],
                    ['bottom-left','Inferior esquerdo'], ['bottom-right','Inferior direito']
                ]),
                numberField('managedWidth', 'Largura (px)', panelDrafts.main.width, { min:220, max:700, step:5 }),
                numberField('managedHeight', 'Altura (px)', panelDrafts.main.height, { min:200, max:900, step:5 }),
                numberField('managedZoom', 'Zoom do conteúdo (%)', panelDrafts.main.zoom, { min:75, max:150, step:5 }),
                numberField('managedHandleY', 'Posição vertical da seta (%)', panelDrafts.main.handleY, { min:10, max:90, step:1 })
            );
            controlCard.append(
                controlGrid,
                checkField('managedDynamic','Tamanho dinâmico',panelDrafts.main.dynamic,'Quando ativo, largura/altura/zoom são ajustados dentro de limites seguros sem alterar o E-Pass.'),
                checkField('managedAllowDrag','Permitir arrastar pelo cabeçalho',panelDrafts.main.allowDrag),
                checkField('managedAllowResize','Permitir redimensionar pela alça inferior',panelDrafts.main.allowResize)
            );
            const panelControlActions=document.createElement('div'); panelControlActions.className='eh-settings-action-row';
            const fitPanel=document.createElement('button'); fitPanel.type='button'; fitPanel.className='eh-modal-btn'; fitPanel.textContent='Ajustar à tela';
            const restorePanel=document.createElement('button'); restorePanel.type='button'; restorePanel.className='eh-modal-btn'; restorePanel.textContent='Restaurar este painel';
            const restoreAllPanels=document.createElement('button'); restoreAllPanels.type='button'; restoreAllPanels.className='eh-modal-btn'; restoreAllPanels.textContent='Restaurar todos';
            panelControlActions.append(fitPanel,restorePanel,restoreAllPanels); controlCard.append(panelControlActions,note('Arraste somente pelo cabeçalho. Botões e campos não iniciam movimento. O modo Livre é salvo após soltar.'));
            sections.paineis.pane.appendChild(controlCard);
            const capturePanelDraft=()=>{ const key=fields.managedPanel.value; const rawHandleY=Number(fields.managedHandleY.value); panelDrafts[key]={...panelDrafts[key],mode:fields.managedMode.value,width:Number(fields.managedWidth.value)||300,height:Number(fields.managedHeight.value)||400,zoom:Number(fields.managedZoom.value)||100,handleY:Number.isFinite(rawHandleY)?Math.max(0,Math.min(100,rawHandleY)):50,dynamic:fields.managedDynamic.checked,allowDrag:fields.managedAllowDrag.checked,allowResize:fields.managedAllowResize.checked}; };
            const loadPanelDraft=key=>{ const cfg=panelDrafts[key]||EH.PanelManager.defaults()[key]; fields.managedMode.value=cfg.mode; fields.managedWidth.value=String(cfg.width); fields.managedHeight.value=String(cfg.height); fields.managedZoom.value=String(cfg.zoom); fields.managedHandleY.value=String(cfg.handleY); fields.managedDynamic.checked=Boolean(cfg.dynamic); fields.managedAllowDrag.checked=Boolean(cfg.allowDrag); fields.managedAllowResize.checked=Boolean(cfg.allowResize); };
            let previousManagedPanel='main'; fields.managedPanel.addEventListener('change',()=>{ const next=fields.managedPanel.value; fields.managedPanel.value=previousManagedPanel; capturePanelDraft(); fields.managedPanel.value=next; previousManagedPanel=next; loadPanelDraft(next); });
            ['managedMode','managedWidth','managedHeight','managedZoom','managedHandleY','managedDynamic','managedAllowDrag','managedAllowResize'].forEach(k=>fields[k].addEventListener('change',capturePanelDraft));
            fitPanel.addEventListener('click',()=>{ const key=fields.managedPanel.value; const rec=EH.PanelManager.recommended(key); fields.managedWidth.value=String(rec.width); fields.managedHeight.value=String(rec.height); fields.managedZoom.value=String(rec.zoom); fields.managedDynamic.checked=false; capturePanelDraft(); });
            restorePanel.addEventListener('click',()=>{ const key=fields.managedPanel.value; panelDrafts[key]={...EH.PanelManager.defaults()[key]}; loadPanelDraft(key); });
            restoreAllPanels.addEventListener('click',()=>{ const defs=EH.PanelManager.defaults(); Object.keys(defs).forEach(k=>panelDrafts[k]={...defs[k]}); loadPanelDraft(fields.managedPanel.value); });

            // WHATSAPP
            const waStateCard = card('Painel integrado');
            waStateCard.append(
                checkField('waVisible', 'Exibir Conversa atual / WhatsApp integrado', EH.State.isOpen('right')),
                note('A conexão continua sendo feita pelo WhatsApp Bridge já existente. Estas opções não alteram a Bridge.')
            );
            sections.whatsapp.pane.appendChild(waStateCard);

            const messagesCard = card('Mensagens automáticas');
            const protectedPixField = document.createElement('div');
            protectedPixField.className = 'eh-field';
            const protectedPixLabel = document.createElement('label');
            protectedPixLabel.textContent = 'PIX — orientação protegida';
            const protectedPixText = document.createElement('textarea');
            protectedPixText.rows = 3;
            protectedPixText.readOnly = true;
            protectedPixText.value = EH.Payment?.formatPixInstruction?.() || EH.Messages.get('pix');
            protectedPixField.append(protectedPixLabel, protectedPixText, note('O botão “Enviar PIX” mantém a mensagem protegida para não quebrar o fluxo sequencial já corrigido.'));
            messagesCard.append(
                textareaField('msgPesquisa', 'Horários', EH.Messages.get('pesquisa')),
                textareaField('msgReserva', 'Poltronas', EH.Messages.get('reserva')),
                textareaField('msgResumo', 'Confirmação', EH.Messages.get('resumo')),
                protectedPixField,
                textareaField('msgBilhete', 'Bilhete', EH.Messages.get('bilhete'))
            );
            sections.whatsapp.pane.appendChild(messagesCard);

            // TELA E ZOOM
            const zoomCard = card('Escala dos overlays');
            const zoomGrid = grid();
            zoomGrid.append(
                numberField('panelZoom', 'Atendimento (%)', Math.round(EH.Config.PANEL_ZOOM * 100), { min: 75, max: 200, step: 5, hint: 'Em modo automático, influencia principalmente a largura útil do painel.' }),
                numberField('waZoom', 'Conversa atual (%)', Math.round(EH.Config.WHATSAPP_DOCK_ZOOM * 100), { min: 75, max: 200, step: 5 })
            );
            zoomCard.appendChild(zoomGrid);
            const zoomWarning = document.createElement('div');
            zoomWarning.className = 'eh-settings-danger-note';
            zoomWarning.textContent = 'O Helper não aplica zoom, largura ou deslocamento ao app-root do E-Pass. Os controles desta aba afetam somente os overlays.';
            zoomCard.appendChild(zoomWarning);
            sections.zoom.pane.appendChild(zoomCard);

            // VALORES E CAPTURA — taxas por cidade/UF, editáveis e expansíveis.
            const feeRows = [];
            const feesCard = card('Taxas de embarque por origem');
            const feesList = document.createElement('div'); feesList.className='eh-settings-list';
            const addFeeRow = (item={}) => {
                const normalized = EH.BoardingFeeManager.normalizeEntry(item);
                const row=document.createElement('div');row.className='eh-operation-settings-service';row.style.gridTemplateColumns='minmax(150px,1.4fr) 70px 110px auto';
                const cityWrap=textField(`feeCity_${feeRows.length}`,'Cidade / Localidade',normalized.city||'');
                const ufWrap=textField(`feeUf_${feeRows.length}`,'UF',normalized.uf||'');
                const valueWrap=moneyField(`feeValue_${feeRows.length}`,'Taxa',normalized.value||0,'Aceita 6,69 ou 6.69.');
                const remove=document.createElement('button');remove.type='button';remove.className='eh-modal-btn danger';remove.textContent='Excluir';
                const rec={row,city:cityWrap.querySelector('input'),uf:ufWrap.querySelector('input'),value:valueWrap.querySelector('input'),remove,removed:false};
                remove.addEventListener('click',()=>{rec.removed=true;row.remove();});row.append(cityWrap,ufWrap,valueWrap,remove);feesList.append(row);feeRows.push(rec);return rec;
            };
            EH.BoardingFeeManager.load().forEach(addFeeRow);
            const addFee=document.createElement('button');addFee.type='button';addFee.className='eh-modal-btn';addFee.textContent='+ Adicionar cidade';addFee.addEventListener('click',()=>addFeeRow({}));
            feesCard.append(checkField('autoFees','Adicionar automaticamente a taxa conforme a origem configurada',EH.Config.APLICAR_TAXAS_ORIGEM),feesList,addFee,note('A taxa é vinculada à ORIGEM (cidade + UF). Se não houver taxa cadastrada, o valor-base do E-Pass é preservado.'));
            sections.valores.pane.appendChild(feesCard);

            const captureCard = card('Captura');
            const captureGrid = grid();
            captureGrid.append(
                numberField('captureScale', 'Qualidade da captura', EH.Config.CAPTURE_SCALE, { min: 1, max: 3, step: 0.25, hint: '1 a 3. O padrão atual é 2.' }),
                numberField('ticketWidth', 'Largura do print da passagem (px)', EH.Config.TICKET_CAPTURE_WIDTH, { min: 360, max: 520, step: 10 })
            );
            captureCard.appendChild(captureGrid);
            sections.valores.pane.appendChild(captureCard);

            // FINANCEIRO
            const financeCard = card('Caixa e Comissões');
            const financeGrid = grid();
            financeGrid.append(
                numberField('financePercent', 'Comissão padrão (%)', EH.Config.FINANCE_COMMISSION_PERCENT, { min: 0, max: 100, step: 0.1, hint: 'Usada somente quando o E-Pass não informar uma comissão real.' })
            );
            financeCard.append(
                financeGrid,
                checkField('financeAutoRegister', 'Registrar vendas automaticamente ao abrir Caixa/Comissões', EH.Config.FINANCE_AUTO_REGISTER),
                checkField('financeShowSummary', 'Mostrar resumo financeiro no contexto do Caixa', EH.Config.FINANCE_SHOW_CAIXA_SUMMARY),
                checkField('financeAskCompany', 'Perguntar empresa ao cadastrar mercadoria', EH.Config.FINANCE_ASK_COMPANY_MERCH),
                checkField('financeConfirmDelete', 'Confirmar antes de excluir lançamento manual', EH.Config.FINANCE_CONFIRM_DELETE),
                note('O controle financeiro é local e auxiliar. Nada nesta aba altera Entradas, Saídas, Saldo, Sangria, Fechamento ou Comissão oficial do E-Pass.')
            );
            sections.financeiro.pane.appendChild(financeCard);

            // CARROS / OPERAÇÃO
            const operationRoutineFields = [];
            const operationGeneralCard = card('Agência e leitura');
            const operationGeneralGrid = grid();
            operationGeneralGrid.append(
                textField('operationAgencyCode', 'Código da minha agência', EH.Config.OPERATION_AGENCY_CODE, 'A leitura principal do mapa procura exatamente este código no resumo por localidade.'),
                numberField('operationTolerance', 'Tolerância do horário (min)', EH.Config.OPERATION_TIME_TOLERANCE_MINUTES, { min:0, max:90, step:5, hint:'Ex.: 12:00 operacional pode aparecer como 11:50 no E-Pass.' })
            );
            operationGeneralCard.append(
                checkField('operationCarsEnabled', 'Exibir módulo Carros', EH.Config.OPERATION_CARS_ENABLED),
                checkField('operationDockEnabled', 'Usar painel secundário Operação / Carros', EH.Config.OPERATION_DOCK_ENABLED),
                checkField('operationSortBySeat', 'Ordenar passageiros por poltrona', EH.Config.OPERATION_SORT_BY_SEAT),
                operationGeneralGrid,
                note('O número do Serviço NÃO é configuração fixa. O Helper detecta Serviço + Linha + Empresa na pesquisa real daquele dia e usa o código 287 no mapa.')
            );
            sections.carros.pane.appendChild(operationGeneralCard);

            const operationServicesCard = card('Carros principais / horários');
            operationServicesCard.appendChild(note('Configure somente a rotina. O “Serviço de hoje” é detectado automaticamente. Origem/Destino ajudam a diferenciar sentidos com horários próximos.'));
            const operationServicesList = document.createElement('div');
            operationServicesList.className = 'eh-operation-settings-list';

            const makeRoutineInput = (labelText, value, type='text') => {
                const wrap=document.createElement('div');wrap.className='eh-field';
                const label=document.createElement('label');label.textContent=labelText;
                const input=document.createElement('input');input.type=type;input.value=String(value||'');
                wrap.append(label,input);
                return {wrap,input};
            };
            const addRoutineRow = (item = {}) => {
                const index = operationRoutineFields.length;
                const row=document.createElement('div');row.className='eh-operation-settings-service';
                const time=makeRoutineInput('Horário operacional',item.operationalTime||'');
                const name=makeRoutineInput('Nome operacional',item.name||'');
                const origin=makeRoutineInput('Origem referência',item.originHint||'');
                const destination=makeRoutineInput('Destino referência',item.destinationHint||'');
                const line=makeRoutineInput('Linha (opcional)',item.lineHint||'');
                const company=makeRoutineInput('Empresa (opcional)',item.companyHint||'');
                const activeWrap=document.createElement('label');activeWrap.className='eh-check';
                const active=document.createElement('input');active.type='checkbox';active.checked=item.active!==undefined?EH.Utils.parseBoolean(item.active,true):true;
                const activeText=document.createElement('span');activeText.textContent='Ativo';activeWrap.append(active,activeText);
                const remove=document.createElement('button');remove.type='button';remove.className='eh-modal-btn eh-remove-routine';remove.textContent='Excluir';
                const entry={row,time:time.input,name:name.input,origin:origin.input,destination:destination.input,line:line.input,company:company.input,active,id:String(item.id||`rotina-${Date.now()}-${index}`)};
                remove.addEventListener('click',()=>{entry.removed=true;row.remove();});
                row.append(time.wrap,name.wrap,origin.wrap,destination.wrap,line.wrap,company.wrap,activeWrap,remove);
                operationServicesList.appendChild(row);
                operationRoutineFields.push(entry);
                return entry;
            };
            const rebuildRoutineRows = (items=[]) => {
                operationServicesList.innerHTML='';
                operationRoutineFields.splice(0,operationRoutineFields.length);
                (Array.isArray(items)?items:[]).forEach(item=>addRoutineRow(item));
            };
            rebuildRoutineRows(EH.Config.OPERATION_ROUTINES || []);
            const addRoutine=document.createElement('button');addRoutine.type='button';addRoutine.className='eh-modal-btn';addRoutine.textContent='+ Adicionar horário';
            addRoutine.addEventListener('click',()=>addRoutineRow({active:true}));
            operationServicesCard.append(operationServicesList,addRoutine);
            sections.carros.pane.appendChild(operationServicesCard);

            // LEMBRETES
            const reminderCard = card('Impressão / embarque');
            reminderCard.append(
                checkField('reminderCreate','Criar lembrete após capturar bilhete emitido',EH.Config.REMINDER_CREATE_AFTER_TICKET),
                checkField('reminderAsk','Perguntar antes de criar o lembrete',EH.Config.REMINDER_ASK_AFTER_TICKET),
                checkField('reminderMaskCpf','Mostrar CPF mascarado no painel',EH.Config.REMINDER_MASK_CPF),
                checkField('reminderHighlightToday','Destacar lembretes de hoje',EH.Config.REMINDER_HIGHLIGHT_TODAY),
                note('O CPF completo é usado para copiar/buscar a passagem e, quando a sincronização de dados de emissão estiver ativa, integra o registro operacional sincronizado.')
            );
            sections.lembretes.pane.appendChild(reminderCard);

            const syncCard = card('Sincronização entre computadores');
            const syncGrid = grid();
            const syncEnabledWrap = checkField('syncEnabled','Sincronização geral entre computadores',EH.Config.SYNC_ENABLED,'Usa Supabase quando configurado. Sem configuração externa, os dados continuam somente neste computador.');
            const syncUrlWrap = textField('syncUrl','URL do projeto Supabase',EH.Config.SYNC_SUPABASE_URL,'Ex.: https://xxxxx.supabase.co');
            const syncKeyWrap = textField('syncKey','Publishable / anon key',EH.Config.SYNC_SUPABASE_KEY,'Nunca use service_role ou secret key no UserScript.');
            const syncEmailWrap = textField('syncEmail','E-mail da conta de sincronização',EH.Config.SYNC_SUPABASE_EMAIL,'Use a mesma conta autorizada no PC de casa e no guichê.');
            const syncPasswordWrap = textField('syncPassword','Senha (não será salva)','');
            fields.syncPassword.type='password'; fields.syncPassword.autocomplete='current-password';
            syncGrid.append(syncUrlWrap,syncKeyWrap,syncEmailWrap,syncPasswordWrap);
            const syncStatusLine=document.createElement('div'); syncStatusLine.className='eh-help-box';
            const updateSyncStatus=()=>{const s=EH.Sync?.status?.()||{};syncStatusLine.textContent=`Status: ${s.message||s.state||'somente local'}${s.pending?` • ${s.pending} pendente(s)`:''}`;};
            updateSyncStatus();
            const syncActions=document.createElement('div'); syncActions.className='eh-settings-inline-actions';
            const syncLogin=document.createElement('button'); syncLogin.type='button'; syncLogin.className='eh-modal-btn primary'; syncLogin.textContent='Entrar / testar';
            const syncNow=document.createElement('button'); syncNow.type='button'; syncNow.className='eh-modal-btn'; syncNow.textContent='Sincronizar agora';
            const syncLogout=document.createElement('button'); syncLogout.type='button'; syncLogout.className='eh-modal-btn'; syncLogout.textContent='Sair da sincronização';
            syncActions.append(syncLogin,syncNow,syncLogout);
            syncCard.append(
                syncEnabledWrap,
                checkField('syncReminders','Sincronizar lembretes / impressão',EH.Config.SYNC_REMINDERS),
                checkField('syncRequisitions','Sincronizar requisições e códigos',EH.Config.SYNC_REQUISITIONS),
                checkField('syncEmissionData','Sincronizar memória de passageiros/emissão',EH.Config.SYNC_EMISSION_DATA),
                checkField('syncSettings','Sincronizar taxas e horários operacionais',EH.Config.SYNC_SETTINGS,'Posições/tamanhos dos painéis continuam locais para não misturar monitores diferentes.'),
                syncGrid,
                note('A sincronização real usa o mesmo projeto Supabase. O Helper salva primeiro localmente; se a internet cair, a alteração fica pendente e é enviada depois.'),
                syncStatusLine,
                syncActions
            );
            sections.sincronizacao.pane.appendChild(syncCard);

            const applySyncFields=()=>{
                EH.Config.SYNC_PROVIDER=fields.syncEnabled.checked?'supabase':'none';
                EH.Config.SYNC_ENABLED=fields.syncEnabled.checked;
                EH.Config.SYNC_SUPABASE_URL=String(fields.syncUrl.value||'').trim();
                EH.Config.SYNC_SUPABASE_KEY=String(fields.syncKey.value||'').trim();
                EH.Config.SYNC_SUPABASE_EMAIL=String(fields.syncEmail.value||'').trim();
                EH.Config.SYNC_REMINDERS=Boolean(fields.syncReminders?.checked);
                EH.Config.SYNC_REQUISITIONS=Boolean(fields.syncRequisitions?.checked);
                EH.Config.SYNC_EMISSION_DATA=Boolean(fields.syncEmissionData?.checked);
                EH.Config.SYNC_SETTINGS=Boolean(fields.syncSettings?.checked);
                EH.Storage.set('syncProvider',EH.Config.SYNC_PROVIDER);
                EH.Storage.set('syncEnabled',EH.Config.SYNC_ENABLED);
                EH.Storage.set('syncSupabaseUrl',EH.Config.SYNC_SUPABASE_URL);
                EH.Storage.set('syncSupabaseKey',EH.Config.SYNC_SUPABASE_KEY);
                EH.Storage.set('syncSupabaseEmail',EH.Config.SYNC_SUPABASE_EMAIL);
                EH.Storage.set('syncReminders',EH.Config.SYNC_REMINDERS);
                EH.Storage.set('syncRequisitions',EH.Config.SYNC_REQUISITIONS);
                EH.Storage.set('syncEmissionData',EH.Config.SYNC_EMISSION_DATA);
                EH.Storage.set('syncSettings',EH.Config.SYNC_SETTINGS);
            };
            syncLogin.addEventListener('click',async()=>{
                try{
                    applySyncFields();
                    if(!EH.Config.SYNC_ENABLED) { fields.syncEnabled.checked=true; applySyncFields(); }
                    await EH.Sync.login(fields.syncEmail.value,fields.syncPassword.value);
                    fields.syncPassword.value='';
                    EH.Sync.start(); updateSyncStatus();
                    EH.Toast.success('Conta de sincronização conectada.');
                }catch(error){EH.Toast.error(error.message||'Não foi possível entrar na sincronização.');updateSyncStatus();}
            });
            syncNow.addEventListener('click',async()=>{try{applySyncFields();await EH.Sync.syncAll({quiet:false});updateSyncStatus();}catch(error){EH.Toast.error(error.message||'Falha ao sincronizar.');updateSyncStatus();}});
            syncLogout.addEventListener('click',()=>{EH.Sync.logout();updateSyncStatus();});

            // AVANÇADO
            const advancedCard = card('Diagnóstico');
            const debugWrap = checkField('debug', 'Ativar logs de depuração no console', EH.Config.DEBUG, 'Use apenas quando precisar investigar algum problema.');
            const advancedActions = document.createElement('div');
            advancedActions.className = 'eh-settings-inline-actions';
            const diagnostic = document.createElement('button');
            diagnostic.type = 'button';
            diagnostic.className = 'eh-modal-btn';
            diagnostic.textContent = 'Copiar diagnóstico';
            diagnostic.addEventListener('click', async () => {
                try {
                    await EH.Clipboard.copyText(JSON.stringify(EH.Diagnostics.report(), null, 2));
                    EH.Toast.success('Diagnóstico copiado. Cole na conversa quando precisar de ajuda.');
                } catch (error) {
                    EH.Toast.error(error.message || 'Não foi possível copiar o diagnóstico.');
                }
            });
            const copyHtml = document.createElement('button');
            copyHtml.type = 'button';
            copyHtml.className = 'eh-modal-btn';
            copyHtml.textContent = 'Copiar HTML da tela';
            copyHtml.addEventListener('click', async () => {
                try {
                    await EH.Clipboard.copyText(EH.Diagnostics.relevantHtml());
                    EH.Toast.success('HTML copiado. Não envie dados pessoais de passageiros.');
                } catch (error) {
                    EH.Toast.error(error.message || 'Não foi possível copiar o HTML.');
                }
            });
            const exportSettings=document.createElement('button');
            exportSettings.type='button'; exportSettings.className='eh-modal-btn'; exportSettings.textContent='Exportar configurações';
            exportSettings.addEventListener('click',()=>{
                const stamp=new Date().toISOString().slice(0,10);
                EH.StorageSchema.downloadJson(`epass-helper-config-${stamp}.json`,EH.StorageSchema.exportConfiguration());
                EH.Toast.success('Configurações exportadas.');
            });
            const importSettings=document.createElement('button');
            importSettings.type='button'; importSettings.className='eh-modal-btn'; importSettings.textContent='Importar configurações';
            const importInput=document.createElement('input'); importInput.type='file'; importInput.accept='application/json,.json'; importInput.hidden=true;
            importSettings.addEventListener('click',()=>importInput.click());
            importInput.addEventListener('change',async()=>{
                const file=importInput.files?.[0]; if(!file)return;
                try{
                    const payload=JSON.parse(await file.text());
                    EH.StorageSchema.importConfiguration(payload);
                    EH.Toast.success('Configurações importadas. Recarregue a página para aplicar tudo.');
                }catch(error){EH.Toast.error(error.message||'Não foi possível importar as configurações.');}
                finally{importInput.value='';}
            });
            advancedActions.append(diagnostic, copyHtml, exportSettings, importSettings, importInput);
            advancedCard.append(debugWrap, note(`Armazenamento de dados: versão ${EH.Config.STORAGE_SCHEMA_VERSION}. Atualizações do script usam migração não destrutiva.`), advancedActions);
            sections.avancado.pane.appendChild(advancedCard);

            const setActiveTab = id => {
                Object.values(sections).forEach(section => {
                    const active = section.tab.dataset.tab === id;
                    section.tab.classList.toggle('active', active);
                    section.pane.classList.toggle('active', active);
                });
                EH.Storage.set('settingsTab', id);
            };
            Object.values(sections).forEach(section => {
                section.tab.addEventListener('click', () => setActiveTab(section.tab.dataset.tab));
            });
            const initialTab = String(EH.Storage.get('settingsTab', 'geral') || 'geral');
            setActiveTab(sections[initialTab] ? initialTab : 'geral');

            const markCustomPreset = () => {
                selectedPreset = 'personalizado';
                Object.values(presetButtons).forEach(button => button.classList.remove('active'));
            };
            const applyPreset = key => {
                selectedPreset = key;
                const presets = {
                    compacto: { density: 'compacto', panelZoom: 125, waZoom: 95, opacity: 98 },
                    padrao: { density: 'padrao', panelZoom: 150, waZoom: 110, opacity: 100 },
                    confortavel: { density: 'confortavel', panelZoom: 170, waZoom: 120, opacity: 100 }
                };
                const preset = presets[key];
                if (!preset) return;
                fields.density.value = preset.density;
                fields.panelZoom.value = String(preset.panelZoom);
                fields.waZoom.value = String(preset.waZoom);
                fields.opacity.value = String(preset.opacity);
                Object.entries(presetButtons).forEach(([name, button]) => button.classList.toggle('active', name === key));
            };
            Object.entries(presetButtons).forEach(([key, button]) => button.addEventListener('click', () => applyPreset(key)));
            ['density', 'panelZoom', 'waZoom', 'opacity'].forEach(key => fields[key]?.addEventListener('change', markCustomPreset));

            const actions = document.createElement('div');
            actions.className = 'eh-modal-actions';

            const save = document.createElement('button');
            save.type = 'button';
            save.className = 'eh-modal-btn primary';
            save.textContent = 'Salvar configurações';

            const restoreDefaults = document.createElement('button');
            restoreDefaults.type = 'button';
            restoreDefaults.className = 'eh-modal-btn';
            restoreDefaults.textContent = 'Restaurar padrão';
            restoreDefaults.title = 'Restaura somente preferências. Não apaga requisições, passageiros, histórico ou outros dados.';
            restoreDefaults.addEventListener('click', () => {
                const d = EH.ConfigDefaults;
                selectedPreset = 'padrao';
                fields.autoRoute.checked = Boolean(d.AUTO_ROUTE_CAPTURE);
                fields.autoCopy.checked = Boolean(d.AUTO_COPY_IMAGES);
                fields.mainOpen.checked = false;
                fields.waVisible.checked = true;
                fields.density.value = d.UI_DENSITY;
                fields.opacity.value = String(Math.round(d.PANEL_OPACITY * 100));
                fields.radius.value = String(d.PANEL_RADIUS);
                fields.shadow.value = d.SHADOW_LEVEL;
                fields.side.value = d.OVERLAY_SIDE;
                fields.topOffset.value = String(d.OVERLAY_TOP_OFFSET);
                fields.panelWidth.value = String(d.PANEL_CUSTOM_WIDTH);
                fields.panelHeight.value = String(d.PANEL_HEIGHT_PERCENT);
                fields.waWidth.value = String(d.WHATSAPP_CUSTOM_WIDTH);
                fields.waHeight.value = String(d.WHATSAPP_HEIGHT_PERCENT);
                fields.panelZoom.value = String(Math.round(d.PANEL_ZOOM * 100));
                fields.waZoom.value = String(Math.round(d.WHATSAPP_DOCK_ZOOM * 100));
                fields.captureScale.value = String(d.CAPTURE_SCALE);
                fields.ticketWidth.value = String(d.TICKET_CAPTURE_WIDTH);
                fields.autoFees.checked = Boolean(d.APLICAR_TAXAS_ORIGEM);
                feeRows.forEach(row => row.row.remove()); feeRows.splice(0, feeRows.length);
                Object.entries(d.TAXAS_ORIGEM || {}).forEach(([city,value]) => addFeeRow({city,uf:EH.BoardingFeeManager.knownUfs[EH.Utils.normalize(city)]||'',value}));
                fields.msgPesquisa.value = d.MESSAGES.pesquisa;
                fields.msgReserva.value = d.MESSAGES.reserva;
                fields.msgResumo.value = d.MESSAGES.resumo;
                fields.msgBilhete.value = d.MESSAGES.bilhete;
                fields.financePercent.value = String(d.FINANCE_COMMISSION_PERCENT);
                fields.financeAutoRegister.checked = Boolean(d.FINANCE_AUTO_REGISTER);
                fields.financeShowSummary.checked = Boolean(d.FINANCE_SHOW_CAIXA_SUMMARY);
                fields.financeAskCompany.checked = Boolean(d.FINANCE_ASK_COMPANY_MERCH);
                fields.financeConfirmDelete.checked = Boolean(d.FINANCE_CONFIRM_DELETE);
                fields.operationCarsEnabled.checked = Boolean(d.OPERATION_CARS_ENABLED);
                fields.operationDockEnabled.checked = Boolean(d.OPERATION_DOCK_ENABLED);
                fields.operationAgencyCode.value = String(d.OPERATION_AGENCY_CODE || '287');
                fields.operationSortBySeat.checked = Boolean(d.OPERATION_SORT_BY_SEAT);
                fields.reminderCreate.checked = Boolean(d.REMINDER_CREATE_AFTER_TICKET);
                fields.reminderAsk.checked = Boolean(d.REMINDER_ASK_AFTER_TICKET);
                fields.reminderMaskCpf.checked = Boolean(d.REMINDER_MASK_CPF);
                fields.reminderHighlightToday.checked = Boolean(d.REMINDER_HIGHLIGHT_TODAY);
                fields.syncEnabled.checked = false;
                fields.syncUrl.value = '';
                fields.syncKey.value = '';
                fields.syncEmail.value = '';
                fields.syncPassword.value = '';
                fields.syncReminders.checked = Boolean(d.SYNC_REMINDERS);
                fields.syncRequisitions.checked = Boolean(d.SYNC_REQUISITIONS);
                fields.syncEmissionData.checked = Boolean(d.SYNC_EMISSION_DATA);
                fields.syncSettings.checked = Boolean(d.SYNC_SETTINGS);
                const defaultPanels = EH.PanelManager.defaults();
                Object.keys(defaultPanels).forEach(key => panelDrafts[key] = { ...defaultPanels[key] });
                loadPanelDraft(fields.managedPanel.value);
                fields.operationTolerance.value = String(EH.Utils.parseFiniteNumber(d.OPERATION_TIME_TOLERANCE_MINUTES, 20));
                rebuildRoutineRows(d.OPERATION_ROUTINES || []);
                fields.debug.checked = Boolean(d.DEBUG);
                Object.entries(presetButtons).forEach(([name, button]) => button.classList.toggle('active', name === 'padrao'));
                EH.Toast.info('Padrões carregados. Clique em “Salvar configurações” para aplicar.');
            });

            const closeBottom = document.createElement('button');
            closeBottom.type = 'button';
            closeBottom.className = 'eh-modal-btn';
            closeBottom.textContent = 'Fechar';

            const close = () => overlay.remove();
            closeTop.addEventListener('click', close);
            closeBottom.addEventListener('click', close);
            overlay.addEventListener('click', event => {
                if (event.target === overlay) close();
            });

            save.addEventListener('click', () => {
                const safeManual = (value, min, max) => {
                    const n = Number(value) || 0;
                    if (!n) return 0;
                    return Math.min(max, Math.max(min, n));
                };
                const parseFeeField = (input, label) => {
                    const raw = String(input?.value ?? '').trim();
                    if (!raw) return 0;
                    const parsed = EH.Utils.parseMoneyStrict(raw);
                    if (parsed === null || parsed < 0) throw new Error(`Taxa inválida em ${label}.`);
                    return EH.Fares.round(parsed);
                };
                let feeEntries;
                try {
                    const seen=new Set();
                    feeEntries=feeRows.filter(row=>!row.removed&&row.row.isConnected).map(row=>{
                        const city=EH.Utils.clean(row.city.value||''); const uf=EH.Utils.normalize(row.uf.value||'').replace(/[^A-Z]/g,'').slice(0,2);
                        const raw=String(row.value.value??'').trim(); const parsed=raw?EH.Utils.parseMoneyStrict(raw):0;
                        if(!city) throw new Error('Informe a cidade em todas as taxas cadastradas.');
                        if(uf.length!==2) throw new Error(`Informe a UF de ${city}.`);
                        if(parsed===null||parsed<0) throw new Error(`Taxa inválida em ${city} - ${uf}.`);
                        const entry=EH.BoardingFeeManager.normalizeEntry({city,uf,value:parsed});
                        if(seen.has(entry.id)) throw new Error(`${city} - ${uf} já está cadastrada.`);
                        seen.add(entry.id); return entry;
                    });
                } catch (error) { EH.Toast.error(error.message || 'Confira as taxas de embarque.'); return; }

                const values = {
                    preset: selectedPreset,
                    density: ['compacto', 'padrao', 'confortavel'].includes(fields.density.value) ? fields.density.value : 'padrao',
                    opacity: clamp(Number(fields.opacity.value) / 100, 0.86, 1, 1),
                    radius: clamp(fields.radius.value, 8, 22, 15),
                    shadow: ['none', 'suave', 'normal'].includes(fields.shadow.value) ? fields.shadow.value : 'normal',
                    side: fields.side.value === 'left' ? 'left' : 'right',
                    topOffset: safeManual(fields.topOffset.value, 40, 240),
                    panelWidth: safeManual(fields.panelWidth.value, 260, 440),
                    panelHeight: safeManual(fields.panelHeight.value, 40, 90),
                    waWidth: safeManual(fields.waWidth.value, 230, 420),
                    waHeight: safeManual(fields.waHeight.value, 25, 80),
                    panelZoom: clamp(Number(fields.panelZoom.value) / 100, 0.75, 2, 1.5),
                    waZoom: clamp(Number(fields.waZoom.value) / 100, 0.75, 2, 1.1),
                    captureScale: clamp(fields.captureScale.value, 1, 3, 2),
                    ticketWidth: clamp(fields.ticketWidth.value, 360, 520, 430)
                };

                EH.Config.SETTINGS_PRESET = values.preset;
                EH.Config.UI_DENSITY = values.density;
                EH.Config.PANEL_OPACITY = values.opacity;
                EH.Config.PANEL_RADIUS = values.radius;
                EH.Config.SHADOW_LEVEL = values.shadow;
                EH.Config.OVERLAY_SIDE = values.side;
                EH.Config.OVERLAY_TOP_OFFSET = values.topOffset;
                EH.Config.PANEL_CUSTOM_WIDTH = values.panelWidth;
                EH.Config.PANEL_HEIGHT_PERCENT = values.panelHeight;
                EH.Config.WHATSAPP_CUSTOM_WIDTH = values.waWidth;
                EH.Config.WHATSAPP_HEIGHT_PERCENT = values.waHeight;
                EH.Config.PANEL_ZOOM = values.panelZoom;
                EH.Config.WHATSAPP_DOCK_ZOOM = values.waZoom;
                EH.Config.CAPTURE_SCALE = values.captureScale;
                EH.Config.TICKET_CAPTURE_WIDTH = values.ticketWidth;
                EH.Config.AUTO_ROUTE_CAPTURE = fields.autoRoute.checked;
                EH.Config.AUTO_COPY_IMAGES = fields.autoCopy.checked;
                EH.Config.APLICAR_TAXAS_ORIGEM = fields.autoFees.checked;
                EH.BoardingFeeManager.save(feeEntries);
                const taxas = EH.Config.TAXAS_ORIGEM;
                EH.Config.FINANCE_COMMISSION_PERCENT = clamp(fields.financePercent.value, 0, 100, 10);
                EH.Config.FINANCE_AUTO_REGISTER = fields.financeAutoRegister.checked;
                EH.Config.FINANCE_SHOW_CAIXA_SUMMARY = fields.financeShowSummary.checked;
                EH.Config.FINANCE_ASK_COMPANY_MERCH = fields.financeAskCompany.checked;
                EH.Config.FINANCE_CONFIRM_DELETE = fields.financeConfirmDelete.checked;

                capturePanelDraft();
                EH.Config.REMINDER_CREATE_AFTER_TICKET = fields.reminderCreate.checked;
                EH.Config.REMINDER_ASK_AFTER_TICKET = fields.reminderAsk.checked;
                EH.Config.REMINDER_MASK_CPF = fields.reminderMaskCpf.checked;
                EH.Config.REMINDER_HIGHLIGHT_TODAY = fields.reminderHighlightToday.checked;
                EH.Config.SYNC_PROVIDER = fields.syncEnabled.checked ? 'supabase' : 'none';
                EH.Config.SYNC_ENABLED = fields.syncEnabled.checked;
                EH.Config.SYNC_SUPABASE_URL = String(fields.syncUrl.value || '').trim();
                EH.Config.SYNC_SUPABASE_KEY = String(fields.syncKey.value || '').trim();
                EH.Config.SYNC_SUPABASE_EMAIL = String(fields.syncEmail.value || '').trim();
                EH.Config.SYNC_REMINDERS = Boolean(fields.syncReminders?.checked);
                EH.Config.SYNC_REQUISITIONS = Boolean(fields.syncRequisitions?.checked);
                EH.Config.SYNC_EMISSION_DATA = Boolean(fields.syncEmissionData?.checked);
                EH.Config.SYNC_SETTINGS = Boolean(fields.syncSettings?.checked);
                const operationRoutines = operationRoutineFields
                    .filter(row => !row.removed && row.row.isConnected)
                    .map((row,index) => {
                        const time=EH.Utils.clean(row.time.value||'');
                        const name=EH.Utils.clean(row.name.value||'');
                        const rawId=EH.Utils.clean(row.id||'')||`${time}-${name}-${index}`;
                        return {
                            id: EH.Utils.normalize(rawId).replace(/[^A-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase() || `rotina-${index+1}`,
                            name,
                            operationalTime:time,
                            active:Boolean(row.active.checked),
                            originHint:EH.Utils.clean(row.origin.value||''),
                            destinationHint:EH.Utils.clean(row.destination.value||''),
                            companyHint:EH.Utils.clean(row.company.value||''),
                            lineHint:EH.Utils.clean(row.line.value||'')
                        };
                    })
                    .filter(item => item.name || item.operationalTime);
                const invalidRoutine=operationRoutines.find(item=>!item.name||!/^\d{1,2}:\d{2}$/.test(item.operationalTime));
                if(!operationRoutines.length||invalidRoutine){
                    EH.Toast.error(!operationRoutines.length?'Cadastre pelo menos um horário operacional.':'Confira nome e horário dos carros principais (HH:MM).');
                    return;
                }
                EH.Config.OPERATION_CARS_ENABLED = fields.operationCarsEnabled.checked;
                EH.Config.OPERATION_DOCK_ENABLED = fields.operationDockEnabled.checked;
                EH.Config.OPERATION_AGENCY_CODE = String(fields.operationAgencyCode.value || '').replace(/\D/g, '') || '287';
                EH.Config.OPERATION_SORT_BY_SEAT = fields.operationSortBySeat.checked;
                EH.Config.OPERATION_TIME_TOLERANCE_MINUTES = clamp(fields.operationTolerance.value, 0, 90, 20);
                EH.Config.OPERATION_ROUTINES = operationRoutines;
                EH.Storage.set('operationConfig.updatedAt', Date.now());
                EH.Sync?.markPendingRecord?.('config','operation');
                EH.Config.DEBUG = fields.debug.checked;
                EH.Config.WHATSAPP_MODE = 'web';

                EH.Messages.setAll({
                    pesquisa: fields.msgPesquisa.value.trim(),
                    reserva: fields.msgReserva.value.trim(),
                    resumo: fields.msgResumo.value.trim(),
                    bilhete: fields.msgBilhete.value.trim()
                });

                const settingsToSave = {
                    settingsPreset: values.preset,
                    uiDensity: values.density,
                    panelOpacity: values.opacity,
                    panelRadius: values.radius,
                    shadowLevel: values.shadow,
                    overlaySide: values.side,
                    overlayTopOffset: values.topOffset,
                    panelCustomWidth: values.panelWidth,
                    panelHeightPercent: values.panelHeight,
                    whatsappCustomWidth: values.waWidth,
                    whatsappHeightPercent: values.waHeight,
                    panelZoom: values.panelZoom,
                    whatsappDockZoom: values.waZoom,
                    captureScale: values.captureScale,
                    ticketCaptureWidth: values.ticketWidth,
                    autoRouteCapture: fields.autoRoute.checked,
                    autoCopyImages: fields.autoCopy.checked,
                    aplicarTaxasOrigem: fields.autoFees.checked,
                    taxasOrigem: taxas,
                    taxaIpora: taxas.IPORA || 0,
                    boardingFeesV2: feeEntries,
                    aplicarTaxaIpora: fields.autoFees.checked,
                    whatsappMode: 'web',
                    financeCommissionPercent: EH.Config.FINANCE_COMMISSION_PERCENT,
                    financeAutoRegister: EH.Config.FINANCE_AUTO_REGISTER,
                    financeShowCaixaSummary: EH.Config.FINANCE_SHOW_CAIXA_SUMMARY,
                    financeAskCompanyMerch: EH.Config.FINANCE_ASK_COMPANY_MERCH,
                    financeConfirmDelete: EH.Config.FINANCE_CONFIRM_DELETE,
                    operationCarsEnabled: EH.Config.OPERATION_CARS_ENABLED,
                    operationAgencyCode: EH.Config.OPERATION_AGENCY_CODE,
                    operationSortBySeat: EH.Config.OPERATION_SORT_BY_SEAT,
                    operationDockEnabled: EH.Config.OPERATION_DOCK_ENABLED,
                    operationTimeToleranceMinutes: EH.Config.OPERATION_TIME_TOLERANCE_MINUTES,
                    operationRoutines: EH.Config.OPERATION_ROUTINES,
                    reminderCreateAfterTicket: EH.Config.REMINDER_CREATE_AFTER_TICKET,
                    reminderAskAfterTicket: EH.Config.REMINDER_ASK_AFTER_TICKET,
                    reminderMaskCpf: EH.Config.REMINDER_MASK_CPF,
                    reminderHighlightToday: EH.Config.REMINDER_HIGHLIGHT_TODAY,
                    syncProvider: EH.Config.SYNC_PROVIDER,
                    syncEnabled: EH.Config.SYNC_ENABLED,
                    syncSupabaseUrl: EH.Config.SYNC_SUPABASE_URL,
                    syncSupabaseKey: EH.Config.SYNC_SUPABASE_KEY,
                    syncSupabaseEmail: EH.Config.SYNC_SUPABASE_EMAIL,
                    syncReminders: EH.Config.SYNC_REMINDERS,
                    syncRequisitions: EH.Config.SYNC_REQUISITIONS,
                    syncEmissionData: EH.Config.SYNC_EMISSION_DATA,
                    syncSettings: EH.Config.SYNC_SETTINGS,
                    debug: fields.debug.checked
                };
                Object.entries(settingsToSave).forEach(([key, value]) => EH.Storage.set(key, value));
                EH.PanelManager.save(panelDrafts);
                EH.Sync?.start?.();

                // Estado dos overlays usa a mesma memória já existente do projeto.
                EH.State.setPanel('left', fields.mainOpen.checked);
                EH.State.setPanel('right', fields.waVisible.checked);

                EH.Layout.sync();
                if (EH.Config.OPERATION_DOCK_ENABLED) EH.OperationDock?.init?.();
                if (EH.OperationDock?.root) {
                    EH.OperationDock.root.style.setProperty('display', EH.Config.OPERATION_DOCK_ENABLED && !EH.OperationDock.collapsed ? 'flex' : 'none', 'important');
                    if (EH.OperationDock.launcher) EH.OperationDock.launcher.hidden = !EH.Config.OPERATION_DOCK_ENABLED || !EH.OperationDock.collapsed;
                }
                EH.PanelManager?.bindAll?.();
                EH.Reminders?.render?.();
                EH.OperationCars?.render?.();

                const verification = {
                    preset: EH.Storage.get('settingsPreset', ''),
                    density: EH.Storage.get('uiDensity', ''),
                    side: EH.Storage.get('overlaySide', ''),
                    panelZoom: Number(EH.Storage.get('panelZoom', 0)),
                    waZoom: Number(EH.Storage.get('whatsappDockZoom', 0))
                };
                const ok = verification.preset === values.preset
                    && verification.density === values.density
                    && verification.side === values.side
                    && Math.abs(verification.panelZoom - values.panelZoom) < 0.001
                    && Math.abs(verification.waZoom - values.waZoom) < 0.001;

                if (!ok) {
                    EH.Toast.error('Não foi possível confirmar o salvamento. Tente novamente.');
                    return;
                }
                EH.Toast.success('Configurações salvas neste navegador.');
                close();
            });

            actions.append(save, restoreDefaults, closeBottom);
            modal.append(head, content, actions);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        }
    };

    // ============================================================
    // OBSERVADOR COM DEBOUNCE
    // ============================================================
    EH.Observer = {
        observer: null,
        start() {
            if (this.observer || !document.body) return;
            const update = EH.Utils.debounce(() => {
                const page = EH.Pages.update();
                if (page !== 'passagens' && EH.Tickets.active) EH.Tickets.clearSelection();
            }, EH.Config.APP_OBSERVER_DEBOUNCE_MS);

            const isOwnMutation = mutation => {
                const target = mutation?.target instanceof Element ? mutation.target : mutation?.target?.parentElement;
                return Boolean(target?.closest?.('#eh-root, #eh-wa-dock, #eh-operation-dock, #eh-operation-launcher, #eh-toast-area, .eh-overlay, .eh-capture-overlay'));
            };

            this.observer = new MutationObserver(mutations => {
                if (mutations?.length && mutations.every(isOwnMutation)) return;
                update();
            });
            const target = document.querySelector('app-root') || document.body;
            this.observer.observe(target, { childList: true, subtree: true });
            EH.Runtime.on('app-popstate', window, 'popstate', update);
            EH.Runtime.on('app-hashchange', window, 'hashchange', update);
            EH.Runtime.on('app-routechange', window, EH.Navigation.EVENT, update);
        }
    };

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    EH.Init = {
        started: false,
        start() {
            if (this.started) return;
            this.started = true;

            EH.StorageSchema?.migrate?.();
            EH.Storage.loadSettings();
            EH.BoardingFeeManager?.migrateLegacy?.();

            // Na aba do WhatsApp Web o script funciona apenas como uma ponte silenciosa.
            // Nenhum painel do E-Pass é desenhado dentro do WhatsApp.
            if (EH.WhatsAppBridge.isWhatsAppHost()) {
                EH.WhatsAppBridge.initReceiver();
                EH.Logger.info(`EPass Helper ${EH.Config.VERSION}: ponte do WhatsApp Web ativa.`);
                return;
            }

            const safeInit = (scope, callback) => {
                try {
                    return callback();
                } catch (error) {
                    EH.Logger.error(`[${scope}] Falha isolada de inicialização:`, error);
                    try { EH.Toast?.error?.(`${scope} indisponível. O restante do Helper continuará funcionando.`); }
                    catch (_toastError) { EH.Logger.debug('Aviso visual de falha também ficou indisponível:', _toastError); }
                    return null;
                }
            };

            safeInit('Estilo', () => EH.Style.inject());
            safeInit('Avisos', () => EH.Toast.init());
            safeInit('Atendimento', () => EH.UI.init());
            safeInit('Lembretes', () => EH.Reminders.init());
            safeInit('Memória persistente de emissões', () => EH.EmissionMemory?.init?.());
            safeInit('Conferência de bilhetes', () => EH.TicketVerificationQueue?.init?.());
            safeInit('Sincronização', () => EH.Sync?.start?.());
            safeInit('Operação', () => EH.OperationDock.init());
            safeInit('Mapa dos carros', () => EH.OperationCars.init());
            safeInit('Contexto de vendas', () => EH.SaleCpfs.init());
            safeInit('Requisições', () => EH.RequisitionManager.init());
            safeInit('WhatsApp', () => EH.WhatsAppDock.init());
            safeInit('Layout', () => EH.Layout.sync());
            safeInit('Painéis', () => EH.PanelManager.bindAll());
            EH.Runtime.on('app-resize', window, 'resize', EH.Utils.debounce(() => { EH.Layout.sync(); EH.PanelManager.applyAll(); }, 140));
            safeInit('Navegação', () => EH.Navigation.start());
            safeInit('Observer', () => EH.Observer.start());
            safeInit('Página atual', () => EH.Pages.update());
            EH.Runtime.timeout('pending-route', () => EH.Routes.applyPending(), 800);
            EH.Runtime.on('app-shortcuts', document, 'keydown', event => {
                if (event.altKey && !event.ctrlKey && !event.shiftKey && String(event.key || '').toLowerCase() === 'a') {
                    event.preventDefault();
                    EH.UI.togglePanel();
                    return;
                }
                if (event.key === 'Escape' && EH.Tickets.active) {
                    EH.Tickets.clearSelection();
                    EH.Toast.info('Seleção de passagem cancelada.');
                }
            });
            EH.Runtime.on('app-pagehide', window, 'pagehide', () => EH.Layout.reset());

            if (EH.Config.DEBUG) {
                window.EPassHelper = EH;
                EH.Logger.trace('SelfCheck', EH.Diagnostics.runSelfCheck());
            }
            EH.Logger.info(`EPass Helper ${EH.Config.VERSION} iniciado.`);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => EH.Init.start(), { once: true });
    } else {
        EH.Init.start();
    }
})();
