// ==UserScript==
// @name         EPass Atendimento
// @namespace    https://github.com/epass-helper
// @version      5.33.0
// @description  Atendimento integrado E-Pass + WhatsApp, composer interno, previsão operacional e lembretes
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
        VERSION: '5.33.0',
        DEBUG: false,
        STORAGE_PREFIX: 'epassHelperV5.',
        TOAST_DURATION: 3400,
        CAPTURE_SCALE: 2,
        TICKET_CAPTURE_WIDTH: 430,
        MAX_CAPTURE_PIXELS: 26000000,
        HISTORY_LIMIT: 10,
        HISTORY_MAX_CHARS: 45000000,
        AUTO_COPY_IMAGES: true,
        AUTO_ROUTE_CAPTURE: true,
        PANEL_WIDTH: 228,
        PANEL_ZOOM: 1.5,
        PANEL_MIN_BASE: 112,
        WHATSAPP_DOCK_WIDTH: 360,
        WHATSAPP_DOCK_ZOOM: 1.1,
        WHATSAPP_MIN_BASE: 160,
        LAYOUT_TRANSITION_MS: 180,
        INTERFACE_PROFILE: 'auto',
        PANEL_SIZE: 'medium',
        PANEL_TOP_FALLBACK: 86,
        PANEL_BOTTOM_GAP: 0,
        APP_OBSERVER_DEBOUNCE_MS: 420,
        WA_OBSERVER_DEBOUNCE_MS: 650,
        WA_UI_FALLBACK_MS: 12000,
        WA_HEARTBEAT_MS: 15000,
        WA_STATUS_REFRESH_MS: 4000,
        WA_HEARTBEAT_TTL_MS: 150000,
        WA_UI_CACHE_TTL_MS: 10 * 60 * 1000,
        WA_VERIFY_TIMEOUT_MS: 3600,
        WA_HISTORY_LIMIT: 260,
        WA_HISTORY_SCROLLS: 10,
        TRAVEL_HISTORY_LIMIT: 2400,
        TRAVEL_MAX_DURATION_MIN: 18 * 60,
        TRAVEL_TRIP_GAP_MIN: 8 * 60,
        BOARDING_DEFAULT_REMIND_MINUTES: 120,
        BOARDING_DEFAULT_ALERTS: [120],
        BOARDING_CHECK_MS: 30000,
        BOARDING_BROWSER_NOTIFICATIONS: false,
        MESSAGES: {
            pesquisa: 'Escolha o horário desejado. Após isso, vou encaminhar as poltronas disponíveis.',
            reserva: 'Estas são as poltronas disponíveis. Informe o número da poltrona desejada.',
            bilhete: 'Passagem emitida com sucesso. Confira os dados da viagem no comprovante.',
            resumo: 'Confira os dados da sua viagem abaixo. Se estiver tudo correto, responda *SIM* para eu gerar o pagamento via PIX.',
            pix: 'Copie o código completo acima e cole no aplicativo do seu banco.'
        },
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
        PIX_CODIGO: ['#pixCopiaEColaContent']
    };

    // ============================================================
    // LOGGER
    // ============================================================
    EH.Logger = {
        debug(...args) {
            if (EH.Config.DEBUG) console.debug('[EPass Helper]', ...args);
        },
        info(...args) {
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
            const taxaIporaLegada = Number(this.get('taxaIpora', taxasPadrao.IPORA)) || 0;
            if (taxasSalvas && typeof taxasSalvas === 'object') {
                EH.Config.TAXAS_ORIGEM = { ...taxasPadrao, ...taxasSalvas };
            } else {
                EH.Config.TAXAS_ORIGEM = { ...taxasPadrao, IPORA: taxaIporaLegada };
            }
            EH.Config.APLICAR_TAXAS_ORIGEM = Boolean(
                this.get('aplicarTaxasOrigem', this.get('aplicarTaxaIpora', EH.Config.APLICAR_TAXAS_ORIGEM))
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
            EH.Config.AUTO_COPY_IMAGES = Boolean(this.get('autoCopyImages', EH.Config.AUTO_COPY_IMAGES));
            EH.Config.AUTO_ROUTE_CAPTURE = Boolean(this.get('autoRouteCapture', EH.Config.AUTO_ROUTE_CAPTURE));
            EH.Config.PANEL_ZOOM = Math.min(2, Math.max(0.75, Number(this.get('panelZoom', EH.Config.PANEL_ZOOM)) || 1.5));
            EH.Config.WHATSAPP_DOCK_ZOOM = Math.min(2, Math.max(0.75, Number(this.get('whatsappDockZoom', EH.Config.WHATSAPP_DOCK_ZOOM)) || 1.1));
            const interfaceProfile = String(this.get('interfaceProfile', EH.Config.INTERFACE_PROFILE) || 'auto').toLowerCase();
            EH.Config.INTERFACE_PROFILE = ['auto', 'home', 'station'].includes(interfaceProfile) ? interfaceProfile : 'auto';
            const panelSize = String(this.get('panelSize', EH.Config.PANEL_SIZE) || 'medium').toLowerCase();
            EH.Config.PANEL_SIZE = ['small', 'medium', 'large'].includes(panelSize) ? panelSize : 'medium';
            EH.Config.BOARDING_DEFAULT_REMIND_MINUTES = Math.min(1440, Math.max(5, Number(
                this.get('boardingDefaultRemindMinutes', EH.Config.BOARDING_DEFAULT_REMIND_MINUTES)
            ) || 120));
            const savedBoardingAlerts = this.get('boardingDefaultAlerts', EH.Config.BOARDING_DEFAULT_ALERTS);
            EH.Config.BOARDING_DEFAULT_ALERTS = Array.isArray(savedBoardingAlerts)
                ? savedBoardingAlerts.map(Number).filter(value => Number.isFinite(value) && value >= 5 && value <= 1440).sort((a, b) => b - a)
                : [EH.Config.BOARDING_DEFAULT_REMIND_MINUTES];
            if (!EH.Config.BOARDING_DEFAULT_ALERTS.length) EH.Config.BOARDING_DEFAULT_ALERTS = [EH.Config.BOARDING_DEFAULT_REMIND_MINUTES];
            EH.Config.BOARDING_BROWSER_NOTIFICATIONS = Boolean(
                this.get('boardingBrowserNotifications', EH.Config.BOARDING_BROWSER_NOTIFICATIONS)
            );
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
            try { item.target.removeEventListener(item.type, item.handler, item.options); } catch (error) { EH.Logger.debug('Listener já removido:', key, error); }
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
            this.panels.leftOpen = !Boolean(EH.Storage.get('collapsed', true));
            this.panels.rightOpen = !Boolean(EH.Storage.get('waDockCollapsed', false));
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
            try { localObserver.observe(observerTarget, { childList: true, subtree: true, characterData: true }); } catch (error) { EH.Logger.debug('Observer local indisponível:', error); }

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
            localObserver.disconnect();
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
                    return { nome, valor: Number(valor) || 0 };
                }
            }
            return { nome: '', valor: 0 };
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
        parseMoney(text) {
            let raw = String(text || '')
                .replace(/\s/g, '')
                .replace(/R\$/gi, '')
                .replace(/[^\d,.-]/g, '');

            if (!raw) return 0;

            const negative = raw.startsWith('-');
            raw = raw.replace(/-/g, '');

            let normalized;
            if (raw.includes(',')) {
                normalized = raw.replace(/\./g, '').replace(',', '.');
            } else {
                const parts = raw.split('.');
                if (parts.length > 2) {
                    const decimal = parts.pop();
                    normalized = parts.join('') + '.' + decimal;
                } else {
                    normalized = raw;
                }
            }

            const number = Number.parseFloat(normalized);
            if (!Number.isFinite(number)) return 0;
            return negative ? -number : number;
        },
        formatMoney(value) {
            const number = Number(value) || 0;
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
                    const finish = () => resolve();
                    image.addEventListener('load', finish, { once: true });
                    image.addEventListener('error', finish, { once: true });
                    setTimeout(finish, 4000);
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
    // PONTE COM WHATSAPP WEB
    // O mesmo userscript roda no E-Pass e no WhatsApp Web. A comunicação
    // entre as abas usa o armazenamento compartilhado do Tampermonkey.
    // ============================================================
    EH.WhatsAppBridge = {
        COMMAND_TTL: 2 * 60 * 1000,
        HEARTBEAT_TTL: EH.Config.WA_HEARTBEAT_TTL_MS,
        UI_CACHE_TTL: EH.Config.WA_UI_CACHE_TTL_MS,
        VERIFY_TIMEOUT: EH.Config.WA_VERIFY_TIMEOUT_MS,
        statusBootAt: Date.now(),
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
                at: Date.now(),
                href: online ? location.href : '',
                phase: probe.state,
                ready: Boolean(probe.ready),
                probe
            });
        },

        getState() {
            const now = Date.now();
            const hb = EH.Storage.get('waHeartbeat', null);
            const ui = this.getUiState();
            const uiProbe = ui?.connection && typeof ui.connection === 'object' ? ui.connection : null;
            const hbAt = Number(hb?.at || 0);
            const uiAt = Number(ui?.at || 0);
            const hbAge = hbAt ? Math.max(0, now - hbAt) : Number.POSITIVE_INFINITY;
            const uiAge = uiAt ? Math.max(0, now - uiAt) : Number.POSITIVE_INFINITY;
            const hbPhase = String(hb?.phase || (hb?.ready ? 'connected' : 'loading'));
            const uiPhase = String(uiProbe?.state || '');
            const explicitOffline = Boolean(hb && hb.online === false);
            const heartbeatFresh = Boolean(hb?.online && hbAt && hbAge <= this.HEARTBEAT_TTL);
            const uiFresh = Boolean(uiAt && uiAge <= this.HEARTBEAT_TTL);
            const cachedPositive = Boolean(
                !explicitOffline &&
                (
                    (hb?.online && hbPhase === 'connected' && hbAge <= this.UI_CACHE_TTL) ||
                    (uiPhase === 'connected' && uiAge <= this.UI_CACHE_TTL)
                )
            );

            let state = 'loading';
            let connected = false;
            let loaded = false;
            let source = 'initializing';

            if (explicitOffline) {
                state = 'disconnected';
                loaded = true;
                source = 'explicit-offline';
            } else if (heartbeatFresh) {
                loaded = hbPhase !== 'loading';
                if (hbPhase === 'connected') {
                    connected = true;
                    state = 'connected';
                    loaded = true;
                    source = 'heartbeat';
                } else if (hbPhase === 'loading') {
                    state = 'loading';
                    source = 'heartbeat-loading';
                } else {
                    state = 'disconnected';
                    loaded = true;
                    source = 'heartbeat-disconnected';
                }
            } else if (uiFresh && uiPhase === 'connected') {
                connected = true;
                loaded = true;
                state = 'connected';
                source = 'ui-state';
            } else if (cachedPositive) {
                // Abas em segundo plano podem ter timers fortemente desacelerados pelo
                // navegador. Um último estado positivo permanece utilizável até prova
                // contrária; antes de ações sensíveis fazemos um ping/ACK real.
                connected = true;
                loaded = true;
                state = 'connected';
                source = 'cached-positive';
            } else if ((uiFresh && uiPhase === 'loading') || (hb?.online && hbPhase === 'loading' && hbAge <= this.UI_CACHE_TTL)) {
                state = 'loading';
                source = 'loading';
            } else if (!hb && !uiAt && (now - this.statusBootAt) < 8000) {
                state = 'loading';
                source = 'startup-grace';
            } else {
                state = 'disconnected';
                loaded = Boolean(hb || uiAt);
                source = 'no-live-signal';
            }

            const activeTitle = String(ui?.active?.title || '').trim();
            const conversationSelected = Boolean(connected && activeTitle);
            const readyToSend = Boolean(connected && conversationSelected);
            const stale = Boolean(connected && !heartbeatFresh && !(uiFresh && uiPhase === 'connected'));

            if (connected) state = readyToSend ? 'ready' : 'no-chat';

            const label = state === 'ready'
                ? 'Conectado'
                : state === 'no-chat'
                    ? 'Selecione uma conversa'
                    : state === 'loading'
                        ? 'Conectando…'
                        : 'Desconectado';

            return {
                state,
                loaded,
                connected,
                conversationSelected,
                readyToSend,
                activeTitle,
                stale,
                source,
                heartbeatAge: Number.isFinite(hbAge) ? hbAge : null,
                uiAge: Number.isFinite(uiAge) ? uiAge : null,
                label
            };
        },

        getConnectionStatus() {
            return this.getState();
        },


        logState(context = '') {
            if (!EH.Config.DEBUG) return this.getState();
            const state = this.getState();
            console.debug('[EPass][WhatsApp]', context || 'state', {
                loaded: state.loaded,
                connected: state.connected,
                conversationSelected: state.conversationSelected,
                readyToSend: state.readyToSend,
                state: state.state,
                source: state.source,
                stale: state.stale,
                activeTitle: state.activeTitle,
                heartbeatAge: state.heartbeatAge,
                uiAge: state.uiAge
            });
            return state;
        },

        async verifyConnection(timeout = this.VERIFY_TIMEOUT) {
            const command = this.makeCommand({ action: 'sync', target: 'web' });
            this.send(command);
            const started = Date.now();

            while ((Date.now() - started) < Math.max(600, Number(timeout) || this.VERIFY_TIMEOUT)) {
                const ack = EH.Storage.get('waAck', null);
                if (ack?.id === command.id) {
                    const state = this.getState();
                    this.logState('sync-ack');
                    return { ...state, verified: Boolean(ack.ok), ack };
                }
                await EH.Utils.sleep(120);
            }

            const state = this.getState();
            this.logState('sync-timeout');
            return { ...state, verified: false, verifyTimedOut: true };
        },

        async ensureReady({ requireConversation = true, verifyStale = true, context = 'envio' } = {}) {
            let state = this.getState();
            this.logState(`${context}:before`);

            const alreadyUsable = state.connected && (!requireConversation || state.conversationSelected);
            if (alreadyUsable && (!verifyStale || !state.stale)) return state;

            // Uma tentativa de sincronização é a autoridade final. Isso também permite
            // recuperar a conexão após reconexão do WhatsApp sem recarregar o E-Pass.
            if (state.stale || state.state === 'loading' || !state.connected) {
                const verified = await this.verifyConnection();
                if (!verified.verified) {
                    state = verified.state === 'loading'
                        ? verified
                        : {
                            ...verified,
                            state: 'disconnected',
                            connected: false,
                            conversationSelected: false,
                            readyToSend: false,
                            source: 'verification-timeout',
                            label: 'Desconectado'
                        };
                } else {
                    state = verified;
                }
            } else {
                // conectado, mas sem conversa: não há motivo para esperar um ping.
                state = this.getState();
            }

            this.logState(`${context}:after`);
            return state;
        },

        notifyUnavailable(state) {
            const current = state || this.getState();
            if (current.state === 'loading') {
                EH.Toast.info('🟡 Verificando WhatsApp…');
            } else if (!current.connected) {
                EH.Toast.error('🔴 WhatsApp desconectado.');
            } else if (!current.conversationSelected) {
                EH.Toast.warning('⚠️ Selecione uma conversa.');
            } else {
                EH.Toast.warning('⚠️ WhatsApp ainda não está pronto para envio.');
            }
            return false;
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

        collectActiveConversation(limit = 45) {
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
            const safeLimit = Math.min(500, Math.max(1, Number(limit) || 45));
            for (const node of nodes.slice(-Math.max(70, safeLimit + 12))) {
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
                    time: tm ? this.cleanText(tm[1]) : '',
                    meta: this.cleanText(pre),
                    dataId: id
                });
            }
            return {
                active: title ? { title } : null,
                messages: messages.slice(-safeLimit)
            };
        },

        findMessageScroller() {
            const main = this.findConversationMain();
            if (!main) return null;
            const sample = main.querySelector('div.message-in, div.message-out, [data-id]');
            let node = sample;
            for (let i = 0; i < 9 && node; i += 1, node = node.parentElement) {
                if (!(node instanceof HTMLElement)) continue;
                const style = getComputedStyle(node);
                if (node.scrollHeight > node.clientHeight + 120 && /(auto|scroll)/i.test(style.overflowY || '')) return node;
            }
            return Array.from(main.querySelectorAll('div')).find(el => {
                if (!(el instanceof HTMLElement)) return false;
                const rect = el.getBoundingClientRect?.();
                if (!rect || rect.height < 180) return false;
                const style = getComputedStyle(el);
                return el.scrollHeight > el.clientHeight + 240 && /(auto|scroll)/i.test(style.overflowY || '');
            }) || null;
        },

        async readChatHistory(title, { limit = EH.Config.WA_HISTORY_LIMIT, scrolls = EH.Config.WA_HISTORY_SCROLLS } = {}) {
            const wanted = this.cleanText(title);
            if (!wanted) return { ok: false, chatTitle: '', messages: [], reason: 'Grupo não informado.' };
            const previousTitle = this.collectActiveConversation(1)?.active?.title || '';
            const selected = await this.selectChatByTitle(wanted);
            if (!selected) return { ok: false, chatTitle: wanted, messages: [], reason: 'Conversa não encontrada na lista atual.' };
            await EH.Utils.sleep(500);

            const scroller = this.findMessageScroller();
            if (scroller) {
                let stagnant = 0;
                let previousHeight = scroller.scrollHeight;
                const maxScrolls = Math.min(18, Math.max(0, Number(scrolls) || 0));
                for (let i = 0; i < maxScrolls; i += 1) {
                    scroller.scrollTop = 0;
                    scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
                    await EH.Utils.sleep(420);
                    const nextHeight = scroller.scrollHeight;
                    if (nextHeight <= previousHeight + 4) stagnant += 1;
                    else stagnant = 0;
                    previousHeight = nextHeight;
                    if (stagnant >= 2) break;
                }
            }

            const convo = this.collectActiveConversation(Math.min(500, Math.max(30, Number(limit) || EH.Config.WA_HISTORY_LIMIT)));
            if (scroller) {
                try { scroller.scrollTop = scroller.scrollHeight; } catch (error) { EH.Logger.debug('Não foi possível restaurar a rolagem do WhatsApp:', error); }
            }

            // A leitura operacional de um grupo não deve roubar a conversa do cliente
            // que estava sendo atendido no painel integrado.
            if (
                previousTitle &&
                this.cleanText(previousTitle).toLocaleLowerCase('pt-BR') !== wanted.toLocaleLowerCase('pt-BR')
            ) {
                await this.selectChatByTitle(previousTitle);
            } else {
                this.publishUiState(true);
            }

            return {
                ok: Boolean(convo.active?.title && convo.messages.length),
                chatTitle: convo.active?.title || wanted,
                messages: convo.messages,
                count: convo.messages.length,
                at: Date.now()
            };
        },

        async requestChatHistory(chatTitle, { timeout = 18000 } = {}) {
            const title = this.cleanText(chatTitle);
            if (!title) return { ok: false, messages: [], reason: 'Selecione o grupo de referência.' };
            const state = await this.ensureReady({ requireConversation: false, verifyStale: true, context: 'historico-grupo' });
            if (!state.connected) return { ok: false, messages: [], reason: 'WhatsApp desconectado.', state };
            const command = this.makeCommand({
                action: 'read_history',
                target: 'web',
                chatTitle: title,
                historyLimit: EH.Config.WA_HISTORY_LIMIT,
                historyScrolls: EH.Config.WA_HISTORY_SCROLLS
            });
            this.send(command);
            const started = Date.now();
            while (Date.now() - started < Math.max(4000, Number(timeout) || 18000)) {
                const result = EH.Storage.get('waHistoryResult', null);
                if (result?.id === command.id) return result;
                await EH.Utils.sleep(160);
            }
            return { ok: false, messages: [], reason: 'O WhatsApp não respondeu a tempo.' };
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
            const wanted = this.cleanText(title);
            if (!wanted) return false;

            // Se a conversa já é a ativa, não clique novamente na lista e não
            // provoque mudanças visuais desnecessárias na aba-motor.
            const current = this.collectActiveConversation(1)?.active?.title || '';
            if (current && this.cleanText(current).toLocaleLowerCase('pt-BR') === wanted.toLocaleLowerCase('pt-BR')) {
                return true;
            }

            const row = this.findChatRowByTitle(wanted);
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

        async insertTextIntoCurrentChat(message, replace = false) {
            if (!message) return true;
            const composer = await this.waitForComposer(12000);
            if (!composer) return false;
            try {
                composer.focus();
                const selection = window.getSelection?.();
                if (selection) {
                    const range = document.createRange();
                    range.selectNodeContents(composer);
                    range.collapse(!replace);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    if (replace && document.execCommand) document.execCommand('delete', false, null);
                }
                if (document.execCommand) {
                    document.execCommand('insertText', false, message);
                } else {
                    if (replace) composer.textContent = '';
                    composer.textContent = `${composer.textContent || ''}${message}`;
                    composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: message }));
                }
                composer.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            } catch (error) {
                EH.Logger.warn('Falha ao preencher mensagem no WhatsApp Web:', error);
                return false;
            }
        },

        async sendTextNow(message) {
            const inserted = await this.insertTextIntoCurrentChat(message, true);
            if (!inserted) return false;
            await EH.Utils.sleep(120);
            const sendIcon = document.querySelector('[data-icon="send"], [data-testid="send"]');
            const button = sendIcon?.closest('button') || document.querySelector('button[aria-label="Enviar" i], button[aria-label="Send" i], [data-testid="compose-btn-send"]');
            if (button) {
                button.click();
                await EH.Utils.sleep(250);
                this.publishUiState(true);
                return true;
            }
            const composer = await this.waitForComposer(2500);
            if (!composer) return false;
            composer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
            composer.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
            await EH.Utils.sleep(250);
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
                try { (attach?.closest('button') || attach)?.click(); } catch (error) { EH.Logger.debug('Botão de anexo indisponível:', error); }
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

        findMediaDialog() {
            return Array.from(document.querySelectorAll('[role="dialog"], [data-animate-modal-popup="true"]')).find(el => {
                const rect = el.getBoundingClientRect?.();
                return rect && rect.width > 80 && rect.height > 80;
            }) || null;
        },

        findMediaCaptionComposer() {
            const modal = this.findMediaDialog();
            if (!modal) return null;
            const candidates = Array.from(modal.querySelectorAll(
                '[contenteditable="true"][role="textbox"], [contenteditable="true"][data-tab], div[contenteditable="true"]'
            ));
            return candidates.find(el => {
                const rect = el.getBoundingClientRect?.();
                return rect && rect.width > 80 && rect.height > 15;
            }) || null;
        },

        async insertTextIntoElement(element, message, replace = true) {
            const value = String(message || '');
            if (!element || !value) return false;
            try {
                element.focus();
                const selection = window.getSelection?.();
                if (selection) {
                    const range = document.createRange();
                    range.selectNodeContents(element);
                    range.collapse(!replace);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    if (replace && document.execCommand) document.execCommand('delete', false, null);
                }
                if (document.execCommand) {
                    document.execCommand('insertText', false, value);
                } else {
                    if (replace) element.textContent = '';
                    element.textContent = `${element.textContent || ''}${value}`;
                    element.dispatchEvent(new InputEvent('input', {
                        bubbles: true,
                        inputType: 'insertText',
                        data: value
                    }));
                }
                element.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            } catch (error) {
                EH.Logger.warn('Falha ao preencher legenda da mídia no WhatsApp:', error);
                return false;
            }
        },

        findMediaSendButton() {
            const modal = this.findMediaDialog() || document;
            const icon = modal.querySelector?.('[data-icon="send"], [data-testid="send"], [data-testid="compose-btn-send"]');
            return icon?.closest?.('button') || Array.from(modal.querySelectorAll?.('button') || []).find(button => {
                const label = `${button.getAttribute('aria-label') || ''} ${button.title || ''} ${button.textContent || ''}`;
                return /enviar|send/i.test(label) && button.getBoundingClientRect?.().width > 0;
            }) || null;
        },

        async sendAttachedImage(dataUrl, filename = 'epass-atendimento.png', followupMessage = '') {
            const attached = await this.attachImage(dataUrl, filename);
            if (!attached) return { attached: false, sent: false, textSent: false, captionAttached: false };

            const message = String(followupMessage || '').trim();
            let captionAttached = false;

            // Primeiro tenta colocar o texto COMO LEGENDA da própria imagem.
            // Assim imagem + mensagem saem em uma única ação pelo composer integrado.
            if (message) {
                const caption = await EH.Utils.waitFor(() => this.findMediaCaptionComposer(), 5000, 160);
                if (caption) captionAttached = await this.insertTextIntoElement(caption, message, true);
            }

            const sendButton = await EH.Utils.waitFor(() => this.findMediaSendButton(), 10000, 200);
            if (!sendButton) {
                return { attached: true, sent: false, textSent: false, captionAttached };
            }

            try {
                sendButton.click();
                await EH.Utils.sleep(650);

                // Em versões do WhatsApp sem editor de legenda detectável, conserva o
                // comportamento compatível: envia a imagem e depois o texto.
                let textSent = true;
                if (message && !captionAttached) {
                    textSent = await this.sendTextNow(message);
                }

                this.publishUiState(true);
                return { attached: true, sent: true, textSent, captionAttached };
            } catch (error) {
                EH.Logger.warn('Não foi possível concluir o envio da imagem:', error);
                return { attached: true, sent: false, textSent: false, captionAttached };
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
            const phone = String(command.phone || '').replace(/\D/g, '');
            const pending = sessionStorage.getItem(pendingKey) === command.id;

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

            if (action === 'read_history') {
                const result = await this.readChatHistory(command.chatTitle || '', {
                    limit: command.historyLimit,
                    scrolls: command.historyScrolls
                });
                const stored = { ...result, id: command.id, action, at: Date.now() };
                EH.Storage.set('waHistoryResult', stored);
                sessionStorage.setItem(doneKey, command.id);
                EH.Storage.set('waAck', { id: command.id, at: Date.now(), action, ok: Boolean(result.ok), count: result.count || 0 });
                return;
            }

            // O fluxo integrado não navega por número e não muda de URL.
            // Comandos antigos que tragam telefone são ignorados como destino;
            // a conversa selecionada no painel é a única fonte de verdade.
            if (phone && !command.chatTitle) {
                sessionStorage.setItem(doneKey, command.id);
                sessionStorage.removeItem(pendingKey);
                EH.Storage.set('waAck', {
                    id: command.id,
                    at: Date.now(),
                    action,
                    ok: false,
                    reason: 'conversation-required'
                });
                return;
            }

            if (command.chatTitle) {
                const selected = await this.selectChatByTitle(command.chatTitle);
                if (!selected) {
                    sessionStorage.setItem(doneKey, command.id);
                    EH.Storage.set('waAck', {
                        id: command.id,
                        at: Date.now(),
                        action,
                        ok: false,
                        reason: 'chat-not-found'
                    });
                    return;
                }
            }

            let ok = true;
            let imageAttached = false;
            let imageSent = false;
            if (action === 'send_text') {
                ok = await this.sendTextNow(command.message || '');
            } else if (action === 'send_pair') {
                ok = await this.sendTextNow(command.message || '');
                if (ok && command.message2) {
                    await EH.Utils.sleep(260);
                    ok = await this.sendTextNow(command.message2 || '');
                }
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
    // OPERAÇÃO DE VIAGEM — HISTÓRICO, PREVISÃO E EMBARQUES
    // Módulos isolados para permitir evolução sem acoplar a venda/PIX.

    // ============================================================
    // CIDADES / ALIASES OPERACIONAIS
    // Normaliza abreviações usadas em grupos e nomes de agências sem
    // obrigar o parser a depender de uma grafia exata.
    // ============================================================
    EH.CityAliases = {
        entries: [
            ['SÃO LUÍS DE MONTES BELOS', ['SLMB', 'SAO LUIS', 'SÃO LUÍS', 'SAO LUIS DE MONTES BELOS', 'SÃO LUÍS DE MONTES BELOS', 'EXPRESSO MAIA SLMB', 'EXP MAIA SLMB']],
            ['IPORÁ', ['IPORA', 'IPORÁ', 'AG IPORA', 'AG IPORÁ', 'EXP MAIA AG IPORA GO', 'EXP MAIA AG - IPORA GO']],
            ['ARENÓPOLIS', ['ARENOPOLIS', 'ARENÓPOLIS']],
            ['PIRANHAS', ['PIRANHAS', 'EXPRESSO MAIA PIRANHAS']],
            ['BOM JARDIM', ['BJ', 'BOM JARDIM', 'AG BOM JARDIM', 'TAIS AG BOM JARDIM', 'TAÍS AG BOM JARDIM']],
            ['GOIÂNIA', ['GOIANIA', 'GOIÂNIA', 'GOIANIA CENTRAL', 'GOIÂNIA CENTRAL', 'CENTRAL GOIANIA', 'CENTRAL GOIÂNIA']],
            ['CAMPINAS', ['CAMPINAS', 'RODOVIARIA DE CAMPINAS', 'RODOVIÁRIA DE CAMPINAS']],
            ['TRINDADE', ['TRINDADE']],
            ['BARRA DO GARÇAS', ['BARRA', 'BARRA DO GARCAS', 'BARRA DO GARÇAS']],
            ['ARAGARÇAS', ['ARAGARCAS', 'ARAGARÇAS']],
            ['CUIABÁ', ['CUIABA', 'CUIABÁ']],
            ['PALMEIRAS DO TOCANTINS', ['PALMEIRAS DO TOCANTINS']]
        ],

        norm(value) {
            return EH.Utils.normalize(value)
                .replace(/[.,;:()[\]{}]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        },

        aliasMap() {
            if (this._map) return this._map;
            this._map = new Map();
            for (const [canonical, aliases] of this.entries) {
                [canonical, ...aliases].forEach(alias => this._map.set(this.norm(alias), canonical));
            }
            return this._map;
        },

        canonicalize(value) {
            const raw = EH.Utils.clean(value);
            if (!raw) return '';
            const normalized = this.norm(raw)
                .replace(/^(?:AG|AGENCIA|AGÊNCIA|EXPRESSO MAIA|EXP MAIA|MAIA)\s*[-:]?\s*/i, '')
                .replace(/\s+-\s+(?:GO|MT|TO|DF|BA|SP|RJ|MG|MA|PI|SE|AL|PE)$/i, '')
                .trim();
            const map = this.aliasMap();
            if (map.has(normalized)) return map.get(normalized);
            for (const [alias, canonical] of map.entries()) {
                if (alias.length < 4) continue;
                const re = new RegExp(`(?:^|\\b)${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\b|$)`, 'i');
                if (re.test(this.norm(raw))) return canonical;
            }
            return EH.Utils.prettifyWords(raw)
                .replace(/\s+-\s+(?:GO|MT|TO|DF|BA|SP|RJ|MG|MA|PI|SE|AL|PE)$/i, '')
                .trim();
        },

        findInText(value) {
            const normalized = this.norm(value);
            if (!normalized) return '';
            const candidates = [];
            for (const [alias, canonical] of this.aliasMap().entries()) {
                const shortAlias = alias.length <= 3;
                const pattern = shortAlias
                    ? new RegExp(`(?:^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'i')
                    : new RegExp(`(?:^|\\b)${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\b|$)`, 'i');
                if (pattern.test(normalized)) candidates.push({ alias, canonical });
            }
            candidates.sort((a, b) => b.alias.length - a.alias.length);
            return candidates[0]?.canonical || '';
        },

        canonicalFromCandidate(candidate, fallbackText = '') {
            const direct = this.findInText(candidate);
            if (direct) return direct;
            const cleaned = EH.Utils.clean(candidate)
                .replace(/^(?:da|do|de)\s+/i, '')
                .replace(/^rodovi[aá]ria\s+(?:de|da|do)\s+/i, '')
                .replace(/\s+(?:as|às)\s*$/i, '')
                .replace(/[,.!?;:]+$/g, '')
                .trim();
            if (cleaned && cleaned.length <= 70) {
                const canonical = this.canonicalize(cleaned);
                if (canonical) return canonical;
            }
            return this.findInText(fallbackText);
        }
    };

    // ============================================================
    EH.TravelHistory = {
        KEY: 'travelHistoryV1',
        DELETED_KEY: 'travelHistoryDeletedV1',

        normalizePlace(value) {
            const canonical = EH.CityAliases?.canonicalize?.(value) || value;
            return EH.Utils.normalize(canonical).replace(/\s+-\s+[A-Z]{2}$/i, '').trim();
        },

        displayPlace(value) {
            const canonical = EH.CityAliases?.canonicalize?.(value) || value;
            return EH.Utils.prettifyWords(EH.Utils.clean(canonical)).replace(/\s+-\s+[A-Z]{2}$/i, '').trim();
        },

        load() {
            const rows = EH.Storage.get(this.KEY, []);
            return Array.isArray(rows) ? rows.filter(row => row && Number(row.durationMinutes) > 0) : [];
        },

        save(rows) {
            const safe = (Array.isArray(rows) ? rows : []).slice(-EH.Config.TRAVEL_HISTORY_LIMIT);
            EH.Storage.set(this.KEY, safe);
            return safe;
        },

        idFor(record) {
            const raw = [
                record.source || 'manual',
                record.whatsappGroup || '',
                record.routeId || '',
                record.serviceKey || '',
                record.originKey || '',
                record.destinationKey || '',
                record.departureDateTime || '',
                record.arrivalDateTime || '',
                Math.round(Number(record.durationMinutes) || 0)
            ].join('|');
            let hash = 2166136261;
            for (let i = 0; i < raw.length; i += 1) {
                hash ^= raw.charCodeAt(i);
                hash = Math.imul(hash, 16777619);
            }
            return `tr-${(hash >>> 0).toString(36)}`;
        },

        addRecords(records) {
            const current = this.load();
            const byId = new Map(current.map(row => [row.id, row]));
            const deleted = new Set(EH.Storage.get(this.DELETED_KEY, []));
            let added = 0;
            for (const input of Array.isArray(records) ? records : []) {
                const duration = Math.round(Number(input.durationMinutes) || 0);
                const origin = this.displayPlace(input.origin);
                const destination = this.displayPlace(input.destination);
                if (!origin || !destination || origin === destination || duration < 3 || duration > EH.Config.TRAVEL_MAX_DURATION_MIN) continue;
                const record = {
                    ...input,
                    origin,
                    destination,
                    originKey: this.normalizePlace(origin),
                    destinationKey: this.normalizePlace(destination),
                    durationMinutes: duration,
                    source: input.source === 'whatsapp' ? 'whatsapp' : 'manual',
                    whatsappGroup: EH.Utils.clean(input.whatsappGroup || ''),
                    createdAt: Number(input.createdAt) || Date.now()
                };
                record.id = input.id || this.idFor(record);
                if (deleted.has(record.id)) continue;
                const existing = byId.get(record.id);
                if (!existing) added += 1;
                if (existing?.editedAt) {
                    byId.set(record.id, { ...record, durationMinutes: existing.durationMinutes, editedAt: existing.editedAt });
                } else {
                    byId.set(record.id, record);
                }
            }
            this.save(Array.from(byId.values()).sort((a, b) => Number(a.departureDateTime || 0) - Number(b.departureDateTime || 0)));
            return added;
        },

        addTrip(points, meta = {}) {
            const ordered = (Array.isArray(points) ? points : [])
                .map(point => ({
                    city: this.displayPlace(point.city),
                    at: point.at instanceof Date ? point.at.getTime() : Number(point.at)
                }))
                .filter(point => point.city && Number.isFinite(point.at))
                .sort((a, b) => a.at - b.at);
            const records = [];
            for (let i = 0; i < ordered.length - 1; i += 1) {
                for (let j = i + 1; j < ordered.length; j += 1) {
                    const minutes = Math.round((ordered[j].at - ordered[i].at) / 60000);
                    if (minutes < 3 || minutes > EH.Config.TRAVEL_MAX_DURATION_MIN) continue;
                    records.push({
                        routeId: meta.routeId || meta.whatsappGroup || '',
                        serviceKey: meta.serviceKey || '',
                        serviceTime: meta.serviceTime || '',
                        routeOrigin: meta.routeOrigin || '',
                        routeDestination: meta.routeDestination || '',
                        direction: `${this.normalizePlace(ordered[i].city)}>${this.normalizePlace(ordered[j].city)}`,
                        origin: ordered[i].city,
                        destination: ordered[j].city,
                        departureDateTime: ordered[i].at,
                        arrivalDateTime: ordered[j].at,
                        durationMinutes: minutes,
                        source: meta.source || 'manual',
                        whatsappGroup: meta.whatsappGroup || ''
                    });
                }
            }
            return { records, added: this.addRecords(records) };
        },

        median(values) {
            const sorted = [...values].sort((a, b) => a - b);
            if (!sorted.length) return 0;
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        },

        percentile(values, q) {
            const sorted = [...values].sort((a, b) => a - b);
            if (!sorted.length) return 0;
            const pos = (sorted.length - 1) * Math.min(1, Math.max(0, q));
            const lo = Math.floor(pos), hi = Math.ceil(pos);
            if (lo === hi) return sorted[lo];
            return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
        },

        stats(origin, destination, whatsappGroup = '', serviceKey = '') {
            const o = this.normalizePlace(origin);
            const d = this.normalizePlace(destination);
            const group = EH.Utils.clean(whatsappGroup);
            const service = EH.Utils.clean(serviceKey);
            if (!o || !d) return null;
            let rows = this.load().filter(row => row.originKey === o && row.destinationKey === d);
            if (group) {
                const exactOrGeneric = rows.filter(row => !row.whatsappGroup || row.whatsappGroup === group);
                if (exactOrGeneric.length) rows = exactOrGeneric;
            }
            if (service) {
                const exactService = rows.filter(row => EH.Utils.clean(row.serviceKey || '') === service);
                // Só restringe ao carro/linha quando já existe base mínima; caso
                // contrário mantém a média do mesmo trecho/grupo como fallback.
                if (exactService.length >= 2) rows = exactService;
            }
            if (!rows.length) return null;

            const raw = rows.map(row => Number(row.durationMinutes)).filter(v => v > 0 && v <= EH.Config.TRAVEL_MAX_DURATION_MIN);
            if (!raw.length) return null;
            const median = this.median(raw);
            const deviations = raw.map(value => Math.abs(value - median));
            const mad = this.median(deviations);
            const threshold = raw.length >= 5 ? Math.max(20, mad * 3.5) : Number.POSITIVE_INFINITY;
            let filteredRows = rows.filter(row => Math.abs(Number(row.durationMinutes) - median) <= threshold);
            if (filteredRows.length < Math.min(3, rows.length)) filteredRows = rows;
            let filtered = filteredRows.map(row => Number(row.durationMinutes)).sort((a, b) => a - b);
            if (filtered.length >= 10) {
                const trim = Math.max(1, Math.floor(filtered.length * 0.1));
                filtered = filtered.slice(trim, filtered.length - trim);
            }
            const mean = filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
            const low = filtered.length >= 4 ? Math.min(this.percentile(filtered, .2), mean - 10) : Math.max(1, mean - 20);
            const high = filtered.length >= 4 ? Math.max(this.percentile(filtered, .8), mean + 10) : mean + 20;
            const confidence = raw.length >= 10 ? 'good' : raw.length >= 4 ? 'medium' : 'low';
            return {
                origin: this.displayPlace(origin),
                destination: this.displayPlace(destination),
                averageMinutes: Math.round(mean),
                medianMinutes: Math.round(median),
                lowMinutes: Math.round(low),
                highMinutes: Math.round(high),
                count: raw.length,
                usedCount: filtered.length,
                ignoredCount: raw.length - filtered.length,
                confidence,
                records: filteredRows.sort((a, b) => Number(b.departureDateTime || 0) - Number(a.departureDateTime || 0))
            };
        },

        routeSummaries() {
            const map = new Map();
            for (const row of this.load()) {
                const key = `${row.originKey}>${row.destinationKey}`;
                if (!map.has(key)) map.set(key, { origin: row.origin, destination: row.destination });
            }
            return Array.from(map.values()).map(item => this.stats(item.origin, item.destination)).filter(Boolean)
                .sort((a, b) => b.count - a.count || a.origin.localeCompare(b.origin));
        },

        updateDuration(id, minutes) {
            const value = Math.round(Number(minutes) || 0);
            if (value < 3 || value > EH.Config.TRAVEL_MAX_DURATION_MIN) return false;
            const rows = this.load();
            const row = rows.find(item => item.id === id);
            if (!row) return false;
            row.durationMinutes = value;
            row.editedAt = Date.now();
            this.save(rows);
            return true;
        },

        remove(id) {
            const rows = this.load();
            const next = rows.filter(row => row.id !== id);
            if (next.length === rows.length) return false;
            this.save(next);
            const deleted = new Set(EH.Storage.get(this.DELETED_KEY, []));
            deleted.add(id);
            EH.Storage.set(this.DELETED_KEY, Array.from(deleted).slice(-2000));
            return true;
        },

        clear() {
            this.save([]);
            EH.Storage.set(this.DELETED_KEY, []);
        },

        knownPlaces() {
            const values = [];
            for (const row of this.load()) values.push(row.origin, row.destination);
            for (const route of EH.Routes.getAll()) values.push(route.origem, route.destino);
            const map = new Map();
            values.filter(Boolean).forEach(value => {
                const display = this.displayPlace(value);
                const key = this.normalizePlace(display);
                if (key && !map.has(key)) map.set(key, display);
            });
            return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
        }
    };

    EH.WhatsAppRouteParser = {
        normalizeClock(hour, minute = '00') {
            const h = Number(hour), m = Number(minute);
            if (!Number.isFinite(h) || h < 0 || h > 23 || !Number.isFinite(m) || m < 0 || m > 59) return '';
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        },

        extractAnyTime(text) {
            const match = String(text || '').match(/\b([01]?\d|2[0-3])\s*(?::|h)\s*([0-5]\d)\s*h?\b/i);
            return match ? this.normalizeClock(match[1], match[2]) : '';
        },

        extractRouteSchedule(text) {
            const raw = String(text || '').trim();
            let match = raw.match(/^\s*([01]?\d|2[0-3])\s*(?::\s*([0-5]\d))?\s*(?:h|hs|hrs|horas)\b/i);
            if (!match) {
                match = raw.match(/^\s*([01]?\d|2[0-3])\s*:\s*([0-5]\d)\s*h?\b/i);
            }
            if (!match) return '';

            // Um horário no início só é "horário do carro/linha" quando vem
            // acompanhado da identificação da rota. "13:50 saiu de Piranhas"
            // continua sendo tratado como horário operacional, não serviceTime.
            const after = raw.slice(match[0].length, match.index + match[0].length + 170);
            const hasRouteIdentity = /[\p{L}]{2,}[\s\S]{0,70}\s(?:x|×|→|a)\s[\p{L}]{2,}/iu.test(after);
            return hasRouteIdentity ? this.normalizeClock(match[1], match[2] || '00') : '';
        },

        extractExplicitDepartureTime(text) {
            const raw = String(text || '');
            const action = '(?:saiu|saindo|partiu|sa[ií]da)';
            const patterns = [
                new RegExp(`${action}[\\s\\S]{0,90}?(?:\\b(?:as|às)\\b\\s*)?([01]?\\d|2[0-3])\\s*(?::|h)\\s*([0-5]\\d)\\s*h?\\b`, 'i'),
                new RegExp(`^\\s*([01]?\\d|2[0-3])\\s*(?::|h)\\s*([0-5]\\d)\\s*h?\\s*(?:[-–—]\\s*)?${action}\\b`, 'i'),
                new RegExp(`\\b(?:as|às)\\b\\s*([01]?\\d|2[0-3])\\s*(?::|h)\\s*([0-5]\\d)\\s*h?\\b`, 'i')
            ];
            for (const pattern of patterns) {
                const match = raw.match(pattern);
                if (match) return this.normalizeClock(match[1], match[2]);
            }
            return '';
        },

        extractMessageTimestamp(message) {
            const sources = [message?.time || '', message?.meta || ''];
            for (const source of sources) {
                const time = this.extractAnyTime(source);
                if (time) return time;
            }
            return '';
        },

        extractDepartureCandidate(text) {
            const raw = EH.Utils.clean(String(text || '').replace(/[–—|]+/g, ' '));
            if (!raw) return '';
            const patterns = [
                /\b(?:saiu|saindo|partiu)\s+agora\s+(?:de|da|do)\s+(.+?)(?=\s+(?:as|às)\s*\d|\s+\d{1,2}\s*(?::|h)\s*\d{2}|$)/i,
                /\b(?:saiu|saindo|partiu|sa[ií]da)\s+(?:de|da|do)\s+(.+?)(?=\s+(?:as|às)\s*\d|\s+\d{1,2}\s*(?::|h)\s*\d{2}|$)/i,
                /\b(?:saiu|saindo|partiu)\s+(.+?)(?=\s+(?:as|às)\s*\d|\s+\d{1,2}\s*(?::|h)\s*\d{2}|$)/i
            ];
            for (const pattern of patterns) {
                const match = raw.match(pattern);
                if (!match?.[1]) continue;
                const candidate = EH.Utils.clean(match[1])
                    .replace(/\b(?:carro|motorista|sistema|seguindo|passageiros?)\b.*$/i, '')
                    .trim();
                // "saindo agora" sem cidade explícita não pode transformar
                // "agora" em nome de cidade. Nesse caso o remetente pode ser
                // usado como evidência operacional mais abaixo.
                if (/^(?:agora|neste momento|já|ja)$/i.test(candidate)) continue;
                if (candidate) return candidate;
            }
            return '';
        },

        isOperationalUpdate(text) {
            return /\b(?:saiu|saindo|saindo agora|partiu|sa[ií]da|seguindo|passou|passando)\b/i.test(String(text || ''));
        },

        extractDirection(text, routeSchedule = '') {
            let raw = EH.Utils.clean(text);
            if (!raw) return { origin: '', destination: '', label: '' };
            if (routeSchedule) {
                raw = raw.replace(/^\s*([01]?\d|2[0-3])\s*(?::\s*[0-5]\d)?\s*(?:h|hs|hrs|horas)?\b\s*/i, '');
            }
            const stopWords = '(?=\\s+(?:carro|motorista|sistema|seguindo|saindo|saiu|partiu|sa[ií]da|passageiros?)\\b|$)';
            const match = raw.match(new RegExp(`^(.{2,70}?)\\s+(?:x|×|→|a)\\s+(.{2,70}?)${stopWords}`, 'i'));
            if (!match) return { origin: '', destination: '', label: '' };
            const cleanPart = value => EH.Utils.clean(value)
                .replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, '')
                .replace(/\s+/g, ' ')
                .trim();
            const originRaw = cleanPart(match[1]);
            const destinationRaw = cleanPart(match[2]);
            const origin = EH.CityAliases.canonicalFromCandidate(originRaw, originRaw);
            const destination = EH.CityAliases.canonicalFromCandidate(destinationRaw, destinationRaw);
            return {
                origin,
                destination,
                label: origin && destination ? `${origin} → ${destination}` : ''
            };
        },

        extractVehicle(text) {
            const match = String(text || '').match(/\bcarro\s*(?:n[º°o.]?\s*)?(\d{2,6})\b/i);
            return match?.[1] || '';
        },

        extractDriver(text) {
            const match = String(text || '').match(/\bmotorista\s+([\p{L}'-]+(?:\s+[\p{L}'-]+){0,2})(?=\s+(?:sistema|seguindo|saindo|saiu|carro|passageiros?)\b|$)/iu);
            return EH.Utils.clean(match?.[1] || '');
        },

        dateFromMeta(message, eventTime) {
            const meta = `${message?.meta || ''} ${message?.time || ''}`;
            const dateMatch = meta.match(/\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})\b/);
            const now = new Date();
            let year = now.getFullYear(), month = now.getMonth(), day = now.getDate();
            if (dateMatch) {
                day = Number(dateMatch[1]);
                month = Number(dateMatch[2]) - 1;
                year = Number(dateMatch[3]);
                if (year < 100) year += 2000;
            }
            const time = eventTime || this.extractMessageTimestamp(message);
            if (!time) return null;
            const [hour, minute] = time.split(':').map(Number);
            const date = new Date(year, month, day, hour, minute, 0, 0);
            return Number.isNaN(date.getTime()) ? null : date;
        },

        parseMessage(message) {
            const text = EH.Utils.clean(message?.text || '');
            if (!text || !this.isOperationalUpdate(text)) return null;

            // Há dois relógios diferentes na operação:
            // 1) serviceTime = horário que identifica o carro/linha (ex.: 11:00 Goiânia → Cuiabá)
            // 2) cityDepartureTime = horário REAL em que saiu da cidade atual.
            // O primeiro jamais é usado como passagem pela cidade.
            const serviceTime = this.extractRouteSchedule(text);
            const direction = this.extractDirection(text, serviceTime);
            const explicitCityDeparture = this.extractExplicitDepartureTime(text);
            const messageTimestamp = this.extractMessageTimestamp(message);
            const departureCandidate = this.extractDepartureCandidate(text);

            let currentCity = EH.CityAliases.canonicalFromCandidate(departureCandidate, text);
            let citySource = currentCity ? 'message' : '';
            if (!currentCity) {
                currentCity = EH.CityAliases.findInText(message?.sender || '');
                if (currentCity) citySource = 'sender';
            }
            if (!currentCity) return null;

            let cityDepartureTime = explicitCityDeparture;
            let timeSource = explicitCityDeparture ? 'explicit' : '';

            // "saindo agora" usa o timestamp REAL da mensagem, nunca serviceTime.
            if (!cityDepartureTime && messageTimestamp && /\b(?:saiu|saindo|partiu)\s+agora\b/i.test(text)) {
                cityDepartureTime = messageTimestamp;
                timeSource = 'whatsapp_timestamp';
            } else if (!cityDepartureTime && messageTimestamp && this.isOperationalUpdate(text)) {
                // Atualização operacional sem horário explícito: o timestamp da mensagem
                // é uma aproximação identificada como inferida.
                cityDepartureTime = messageTimestamp;
                timeSource = 'whatsapp_timestamp_inferred';
            }
            if (!cityDepartureTime) return null;

            const date = this.dateFromMeta(message, cityDepartureTime);
            if (!date) return null;

            const routeOrigin = direction.origin || '';
            const routeDestination = direction.destination || '';
            const serviceKey = serviceTime && (routeOrigin || routeDestination)
                ? [
                    serviceTime,
                    EH.Utils.normalize(routeOrigin || '?'),
                    EH.Utils.normalize(routeDestination || '?')
                ].join('|')
                : '';

            const confidence = explicitCityDeparture && citySource === 'message'
                ? 'high'
                : citySource === 'message'
                    ? 'medium'
                    : 'low';

            return {
                city: currentCity,
                cityKey: EH.TravelHistory.normalizePlace(currentCity),
                currentCity,

                // Campos novos e semanticamente explícitos.
                serviceTime,
                routeOrigin,
                routeDestination,
                serviceKey,
                cityDepartureTime,

                direction: direction.label,
                timeSource,
                citySource,
                at: date.getTime(),
                text,
                messageTime: message?.time || '',
                sender: message?.sender || '',
                vehicle: this.extractVehicle(text),
                driver: this.extractDriver(text),
                confidence,

                // Aliases legados mantidos para compatibilidade com histórico/UI antigos.
                routeSchedule: serviceTime,
                directionOrigin: routeOrigin,
                directionDestination: routeDestination,
                actualDepartureTime: cityDepartureTime,
                time: cityDepartureTime
            };
        },

        enrichServiceContext(events) {
            const sorted = [...(Array.isArray(events) ? events : [])]
                .map(event => ({ ...event }))
                .sort((a, b) => a.at - b.at);

            // Mensagens curtas como "Saiu de Piranhas às 13:50" podem não repetir
            // o identificador do carro. Só herdamos contexto quando há UMA única
            // viagem identificável por perto; em caso ambíguo, não adivinhamos.
            for (const event of sorted) {
                if (event.serviceKey) continue;
                const candidates = sorted
                    .filter(other => other !== event && other.serviceKey && Math.abs(other.at - event.at) <= 150 * 60000)
                    .sort((a, b) => Math.abs(a.at - event.at) - Math.abs(b.at - event.at));
                const uniqueKeys = [...new Set(candidates.map(item => item.serviceKey))];
                if (uniqueKeys.length !== 1 || !candidates[0]) continue;
                const source = candidates[0];
                event.serviceTime = source.serviceTime || '';
                event.routeSchedule = event.serviceTime;
                event.routeOrigin = source.routeOrigin || '';
                event.routeDestination = source.routeDestination || '';
                event.directionOrigin = event.routeOrigin;
                event.directionDestination = event.routeDestination;
                event.direction = source.direction || '';
                event.serviceKey = source.serviceKey;
                event.serviceSource = 'conversation_context';
            }
            return sorted;
        },

        clusterTrips(events) {
            const sorted = [...(Array.isArray(events) ? events : [])].sort((a, b) => a.at - b.at);
            const buckets = new Map();

            for (const event of sorted) {
                const bucketKey = event.serviceKey
                    || (event.direction ? `direction:${EH.Utils.normalize(event.direction)}` : 'unidentified');
                if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
                buckets.get(bucketKey).push(event);
            }

            const trips = [];
            for (const bucket of buckets.values()) {
                let current = [];
                const flush = () => {
                    if (current.length >= 2) trips.push(current);
                    current = [];
                };

                for (const event of bucket) {
                    const prev = current[current.length - 1];
                    if (prev) {
                        const gap = (event.at - prev.at) / 60000;
                        const totalSpan = (event.at - current[0].at) / 60000;
                        const repeatedEarlier = current.slice(0, -1).some(item => item.cityKey === event.cityKey);
                        const routeRestart = current.length >= 2 && event.cityKey === current[0].cityKey && gap > 60;
                        if (
                            gap > EH.Config.TRAVEL_TRIP_GAP_MIN ||
                            gap < -5 ||
                            totalSpan > EH.Config.TRAVEL_MAX_DURATION_MIN ||
                            routeRestart ||
                            (repeatedEarlier && gap > 90)
                        ) {
                            flush();
                        }
                    }

                    const last = current[current.length - 1];
                    if (last && last.cityKey === event.cityKey && (event.at - last.at) <= 45 * 60000) {
                        // Para uma mesma cidade, conserva a atualização operacional mais recente.
                        current[current.length - 1] = event;
                    } else {
                        current.push(event);
                    }
                }
                flush();
            }

            return trips.sort((a, b) => Number(a[0]?.at || 0) - Number(b[0]?.at || 0));
        },

        ingest(whatsappGroup, messages) {
            const parsedEvents = (Array.isArray(messages) ? messages : [])
                .map(message => this.parseMessage(message))
                .filter(Boolean);
            const events = this.enrichServiceContext(parsedEvents);
            const trips = this.clusterTrips(events);
            let added = 0;

            for (const trip of trips) {
                const service = trip.find(event => event.serviceKey) || null;
                const routeLabel = service?.direction || trip.find(event => event.direction)?.direction || whatsappGroup;
                const serviceIdentity = service?.serviceKey || routeLabel || whatsappGroup;
                added += EH.TravelHistory.addTrip(
                    trip.map(event => ({
                        city: event.city,
                        // event.at foi construído exclusivamente com cityDepartureTime.
                        at: event.at
                    })),
                    {
                        source: 'whatsapp',
                        whatsappGroup,
                        routeId: [whatsappGroup, serviceIdentity].filter(Boolean).join('|'),
                        serviceKey: service?.serviceKey || '',
                        serviceTime: service?.serviceTime || '',
                        routeOrigin: service?.routeOrigin || '',
                        routeDestination: service?.routeDestination || ''
                    }
                ).added;
            }
            return { events, trips, added };
        }
    };

    EH.TravelEstimator = {
        formatDuration(minutes) {
            const total = Math.max(0, Math.round(Number(minutes) || 0));
            const h = Math.floor(total / 60), m = total % 60;
            if (!h) return `${m} min`;
            if (!m) return `${h}h`;
            return `${h}h${String(m).padStart(2, '0')}`;
        },

        formatClock(timestamp) {
            const date = new Date(Number(timestamp));
            if (Number.isNaN(date.getTime())) return '';
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        },

        formatDateTime(timestamp) {
            const date = new Date(Number(timestamp));
            if (Number.isNaN(date.getTime())) return '';
            return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        },

        localDateInput(timestamp = Date.now()) {
            const date = new Date(Number(timestamp));
            if (Number.isNaN(date.getTime())) return '';
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        },

        confidenceLabel(stats) {
            if (!stats) return '⚠️ Sem histórico suficiente';
            if (stats.confidence === 'good') return `🟢 Boa estimativa • ${stats.count} viagens`;
            if (stats.confidence === 'medium') return `🟡 Estimativa aproximada • ${stats.count} viagens`;
            return `⚠️ Pouco histórico • ${stats.count} ${stats.count === 1 ? 'viagem' : 'viagens'}`;
        },

        predict({ origin, destination, whatsappGroup = '', departureAt, serviceKey = '' }) {
            const start = departureAt instanceof Date ? departureAt.getTime() : Number(departureAt);
            if (!Number.isFinite(start)) return { ok: false, reason: 'Informe uma saída real para calcular a previsão.' };
            const stats = EH.TravelHistory.stats(origin, destination, whatsappGroup, serviceKey);
            if (!stats) return { ok: false, reason: `Ainda não há histórico de ${origin} para ${destination}.` };
            const eta = start + stats.averageMinutes * 60000;
            const low = start + stats.lowMinutes * 60000;
            const high = start + stats.highMinutes * 60000;
            return { ok: true, origin, destination, whatsappGroup, departureAt: start, eta, low, high, stats };
        },

        formatPrediction(result) {
            if (!result?.ok) return '';
            return `Previsão de chegada em ${EH.TravelHistory.displayPlace(result.destination)}: aproximadamente *${this.formatClock(result.eta)}*.\n\nO ônibus saiu de ${EH.TravelHistory.displayPlace(result.origin)} às ${this.formatClock(result.departureAt)}.\n\nPode haver pequena variação no horário.`;
        },

        manualPoints(baseDate, rows) {
            const dateMatch = String(baseDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!dateMatch) throw new Error('Informe a data da viagem.');
            const points = [];
            let dayOffset = 0;
            let previousMinutes = null;
            for (const row of rows) {
                const city = EH.TravelHistory.displayPlace(row.city);
                const tm = String(row.time || '').match(/^(\d{1,2}):(\d{2})$/);
                if (!city || !tm) continue;
                const minutes = Number(tm[1]) * 60 + Number(tm[2]);
                if (previousMinutes !== null && minutes < previousMinutes - 240) dayOffset += 1;
                previousMinutes = minutes;
                const at = new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]) + dayOffset, Number(tm[1]), Number(tm[2]), 0, 0).getTime();
                points.push({ city, at, time: `${String(Number(tm[1])).padStart(2, '0')}:${tm[2]}` });
            }
            if (points.length < 2) throw new Error('Informe pelo menos duas cidades com horário.');
            return points;
        }
    };

    EH.BoardingStorage = {
        KEY: 'boardingRemindersV1',
        load() {
            const rows = EH.Storage.get(this.KEY, []);
            return Array.isArray(rows) ? rows : [];
        },
        save(rows) {
            EH.Storage.set(this.KEY, Array.isArray(rows) ? rows : []);
            return rows;
        }
    };

    EH.NotificationManager = {
        supported() {
            return typeof Notification !== 'undefined';
        },
        async request() {
            if (!this.supported()) return { ok: false, reason: 'Notificações não estão disponíveis neste navegador.' };
            try {
                const permission = await Notification.requestPermission();
                const enabled = permission === 'granted';
                EH.Config.BOARDING_BROWSER_NOTIFICATIONS = enabled;
                EH.Storage.set('boardingBrowserNotifications', enabled);
                return { ok: enabled, permission };
            } catch (error) {
                EH.Logger.warn('Permissão de notificação:', error);
                return { ok: false, reason: 'O navegador não permitiu ativar notificações.' };
            }
        },
        notify(title, body) {
            if (!EH.Config.BOARDING_BROWSER_NOTIFICATIONS || !this.supported() || Notification.permission !== 'granted') return false;
            try {
                new Notification(title, { body, tag: `epass-boarding-${title}`, renotify: false });
                return true;
            } catch (error) {
                EH.Logger.debug('Notificação de embarque não disponível:', error);
                return false;
            }
        }
    };

    EH.BoardingReminders = {
        lastTicketCandidate: null,
        started: false,

        parseOffsets(value) {
            const source = Array.isArray(value) ? value : String(value || '').split(/[,;\s]+/);
            const values = [...new Set(source.map(Number).filter(item => Number.isFinite(item) && item >= 5 && item <= 1440).map(item => Math.round(item)))];
            return values.sort((a, b) => b - a);
        },

        parseDateTime(dateValue, timeValue) {
            const dateText = EH.Utils.clean(dateValue);
            const time = String(timeValue || '').match(/(\d{1,2}):(\d{2})/);
            if (!time) return null;
            let match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!match) {
                const br = dateText.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
                if (br) match = [br[0], br[3].length === 2 ? `20${br[3]}` : br[3], br[2], br[1]];
            }
            if (!match) return null;
            const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(time[1]), Number(time[2]), 0, 0);
            return Number.isNaN(date.getTime()) ? null : date;
        },

        splitTicketDate(value) {
            const text = EH.Utils.clean(value);
            const d = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
            const t = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
            let date = '';
            if (d) {
                const [day, month, yearRaw] = d[1].split('/');
                const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
                date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            const time = t ? `${String(Number(t[1])).padStart(2, '0')}:${t[2]}` : '';
            return { date, time };
        },

        reminderKey(item) {
            const ticket = EH.Utils.clean(item.ticketNumber || '');
            if (ticket) return `ticket:${ticket}:${item.departureAt}`;
            return [EH.Utils.normalize(item.passenger), EH.TravelHistory.normalizePlace(item.origin), EH.TravelHistory.normalizePlace(item.destination), item.departureAt].join('|');
        },

        list({ includeCompleted = true } = {}) {
            return EH.BoardingStorage.load()
                .filter(item => includeCompleted || item.status !== 'completed')
                .sort((a, b) => Number(a.departureAt || 0) - Number(b.departureAt || 0));
        },

        upsert(input) {
            const departureAt = input.departureAt instanceof Date ? input.departureAt.getTime() : Number(input.departureAt);
            if (!Number.isFinite(departureAt)) return { ok: false, reason: 'Informe data e horário do embarque.' };
            const item = {
                id: input.id || `brd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                passenger: EH.Utils.clean(input.passenger || ''),
                chatTitle: EH.Utils.clean(input.chatTitle || ''),
                phone: String(input.phone || '').replace(/\D/g, ''),
                origin: EH.TravelHistory.displayPlace(input.origin),
                destination: EH.TravelHistory.displayPlace(input.destination),
                departureAt,
                company: EH.Utils.clean(input.company || ''),
                ticketNumber: EH.Utils.clean(input.ticketNumber || ''),
                status: ['pending', 'notified', 'completed'].includes(input.status) ? input.status : 'pending',
                remindMinutes: Math.min(1440, Math.max(5, Number(input.remindMinutes) || EH.Config.BOARDING_DEFAULT_REMIND_MINUTES)),
                alertOffsets: this.parseOffsets(input.alertOffsets || input.remindOffsets || input.remindMinutes || EH.Config.BOARDING_DEFAULT_ALERTS),
                firedOffsets: Array.isArray(input.firedOffsets) ? input.firedOffsets.map(Number).filter(Number.isFinite) : [],
                snoozeUntil: Number(input.snoozeUntil) || 0,
                snoozeAlertedAt: Number(input.snoozeAlertedAt) || 0,
                alertedAt: Number(input.alertedAt) || 0,
                overdueAlertedAt: Number(input.overdueAlertedAt) || 0,
                createdAt: Number(input.createdAt) || Date.now(),
                updatedAt: Date.now()
            };
            if (!item.alertOffsets.length) item.alertOffsets = [item.remindMinutes];
            item.remindMinutes = Math.max(...item.alertOffsets);
            if (!item.passenger) item.passenger = item.chatTitle || 'Passageiro';
            if (!item.origin || !item.destination) return { ok: false, reason: 'Informe origem e destino.' };
            const rows = EH.BoardingStorage.load();
            const key = this.reminderKey(item);
            const duplicate = rows.find(row => row.id !== item.id && this.reminderKey(row) === key && row.status !== 'completed');
            if (duplicate) return { ok: false, duplicate: true, existing: duplicate, reason: 'Este embarque já está na lista.' };
            const index = rows.findIndex(row => row.id === item.id);
            if (index >= 0) rows[index] = { ...rows[index], ...item };
            else rows.push(item);
            EH.BoardingStorage.save(rows);
            EH.OperationPanel?.refreshBadge?.();
            return { ok: true, item };
        },

        setStatus(id, status) {
            const rows = EH.BoardingStorage.load();
            const item = rows.find(row => row.id === id);
            if (!item) return false;
            item.status = status;
            item.updatedAt = Date.now();
            EH.BoardingStorage.save(rows);
            EH.OperationPanel?.refreshBadge?.();
            return true;
        },

        snooze(id, minutes = 30) {
            const rows = EH.BoardingStorage.load();
            const item = rows.find(row => row.id === id);
            if (!item) return false;
            item.snoozeUntil = Date.now() + Math.max(5, Number(minutes) || 30) * 60000;
            item.snoozeAlertedAt = 0;
            item.alertedAt = 0;
            item.updatedAt = Date.now();
            EH.BoardingStorage.save(rows);
            EH.OperationPanel?.refreshBadge?.();
            return true;
        },

        remove(id) {
            const rows = EH.BoardingStorage.load();
            const next = rows.filter(row => row.id !== id);
            EH.BoardingStorage.save(next);
            EH.OperationPanel?.refreshBadge?.();
        },

        setTicketCandidate(data) {
            if (!data?.tickets?.length) return;
            this.lastTicketCandidate = {
                passenger: data.passenger || data.header || '',
                seat: data.seat || '',
                service: data.service || '',
                tickets: data.tickets.map(ticket => ({ ...ticket })),
                chatTitle: EH.WhatsAppBridge.getState().activeTitle || EH.WhatsAppDock?.currentState?.active?.title || '',
                phone: ''
            };
            EH.OperationPanel?.refreshBadge?.();
        },

        ticketPrefill(ticketIndex = 0) {
            const candidate = this.lastTicketCandidate;
            if (!candidate?.tickets?.length) return null;
            const ticket = candidate.tickets[Math.max(0, Math.min(candidate.tickets.length - 1, ticketIndex))];
            const dt = this.splitTicketDate(ticket.date || '');
            return {
                passenger: candidate.passenger,
                chatTitle: candidate.chatTitle,
                phone: candidate.phone || '',
                origin: ticket.origin,
                destination: ticket.destination,
                date: dt.date,
                time: dt.time,
                company: candidate.service,
                ticketNumber: ticket.number,
                ticketOptions: candidate.tickets
            };
        },

        dueItems(now = Date.now()) {
            return this.list({ includeCompleted: false }).filter(item => {
                if (item.departureAt <= now) return true;
                if (item.snoozeUntil && now >= item.snoozeUntil) return true;
                const offsets = this.parseOffsets(item.alertOffsets || item.remindMinutes || EH.Config.BOARDING_DEFAULT_ALERTS);
                const earliest = offsets.length ? item.departureAt - Math.max(...offsets) * 60000 : item.departureAt - EH.Config.BOARDING_DEFAULT_REMIND_MINUTES * 60000;
                return now >= earliest;
            });
        },

        checkDue() {
            const now = Date.now();
            const rows = EH.BoardingStorage.load();
            let changed = false;
            for (const item of rows) {
                if (item.status === 'completed') continue;
                const time = EH.TravelEstimator.formatClock(item.departureAt);
                const body = `${time} — ${item.passenger}\n${item.origin} → ${item.destination}`;

                if (now > item.departureAt) {
                    if (!item.overdueAlertedAt) {
                        item.overdueAlertedAt = now;
                        changed = true;
                        EH.Toast.warning(`⚠️ Embarque vencido — verificar: ${time} — ${item.passenger}`, 7000);
                        EH.NotificationManager.notify('⚠️ Embarque vencido — verificar', body);
                    }
                    continue;
                }

                if (item.snoozeUntil && now >= item.snoozeUntil && !item.snoozeAlertedAt) {
                    item.snoozeAlertedAt = now;
                    item.snoozeUntil = 0;
                    changed = true;
                    EH.Toast.warning(`⏰ Embarque próximo: ${time} — ${item.passenger}`, 5200);
                    EH.NotificationManager.notify('⏰ Embarque próximo', body);
                    continue;
                }

                const offsets = this.parseOffsets(item.alertOffsets || item.remindMinutes || EH.Config.BOARDING_DEFAULT_ALERTS);
                const fired = new Set((item.firedOffsets || []).map(Number));
                const eligible = offsets.filter(offset => now >= item.departureAt - offset * 60000 && !fired.has(offset));
                if (!eligible.length) continue;
                // Se o navegador ficou fechado e vários alertas venceram, registra todos,
                // mas mostra uma única notificação (a mais próxima do embarque) para não gerar spam.
                eligible.forEach(offset => fired.add(offset));
                item.firedOffsets = Array.from(fired);
                item.alertedAt = now;
                changed = true;
                const nearest = Math.min(...eligible);
                EH.Toast.warning(`⏰ Embarque em ~${nearest} min: ${time} — ${item.passenger}`, 5200);
                EH.NotificationManager.notify(`⏰ Embarque às ${time}`, `${item.passenger} — ${item.origin} → ${item.destination}`);
            }
            if (changed) EH.BoardingStorage.save(rows);
            EH.OperationPanel?.refreshBadge?.();
        },

        scheduleNext() {
            if (!this.started) return;
            EH.Runtime.timeout('boarding-check', () => {
                this.checkDue();
                this.scheduleNext();
            }, EH.Config.BOARDING_CHECK_MS);
        },

        init() {
            if (this.started || EH.WhatsAppBridge.isWhatsAppHost()) return;
            this.started = true;
            this.checkDue();
            this.scheduleNext();
            EH.Runtime.on('boarding-focus', window, 'focus', () => this.checkDue());
            EH.Runtime.on('boarding-visibility', document, 'visibilitychange', () => { if (!document.hidden) this.checkDue(); });
        }
    };

    EH.OperationPanel = {
        overlay: null,
        launcher: null,
        badge: null,
        activeTab: 'travel',
        lastAnalysis: null,
        lastPrediction: null,

        attachLauncher(button) {
            this.launcher = button;
            this.refreshBadge();
        },

        refreshBadge() {
            if (!this.launcher) return;
            const active = EH.BoardingReminders.list({ includeCompleted: false });
            const due = EH.BoardingReminders.dueItems();
            let badge = this.badge;
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'eh-operation-badge';
                this.badge = badge;
                this.launcher.appendChild(badge);
            }
            badge.textContent = String(due.length || active.length || '');
            badge.hidden = !active.length;
            badge.classList.toggle('due', Boolean(due.length));
            this.launcher.title = due.length
                ? `${due.length} embarque(s) precisam de atenção`
                : active.length ? `${active.length} embarque(s) pendente(s)` : 'Previsão de viagem e embarques';
        },

        chatOptions() {
            const state = EH.WhatsAppDock?.currentState || EH.WhatsAppBridge.getUiState();
            return Array.isArray(state?.chats) ? state.chats : [];
        },

        open(tab = 'travel', prefill = null) {
            document.querySelector('#eh-operation-overlay')?.remove();
            this.activeTab = tab === 'boarding' ? 'boarding' : 'travel';
            const overlay = document.createElement('div');
            overlay.className = 'eh-overlay';
            overlay.id = 'eh-operation-overlay';
            const modal = document.createElement('div');
            modal.className = 'eh-modal eh-operation-modal';

            const head = document.createElement('div');
            head.className = 'eh-modal-head';
            const title = document.createElement('div');
            title.className = 'eh-modal-title';
            title.textContent = 'Viagem / Embarques';
            const close = document.createElement('button');
            close.type = 'button'; close.className = 'eh-modal-close'; close.textContent = '✕';
            head.append(title, close);

            const tabs = document.createElement('div');
            tabs.className = 'eh-operation-tabs';
            const travelTab = document.createElement('button');
            travelTab.type = 'button'; travelTab.textContent = 'Previsão';
            const boardingTab = document.createElement('button');
            boardingTab.type = 'button'; boardingTab.textContent = 'Embarques';
            tabs.append(travelTab, boardingTab);

            const content = document.createElement('div');
            content.className = 'eh-modal-content eh-operation-content';
            const travelPane = document.createElement('section');
            travelPane.className = 'eh-operation-pane';
            const boardingPane = document.createElement('section');
            boardingPane.className = 'eh-operation-pane';
            content.append(travelPane, boardingPane);

            const switchTab = tabName => {
                this.activeTab = tabName;
                travelTab.classList.toggle('active', tabName === 'travel');
                boardingTab.classList.toggle('active', tabName === 'boarding');
                travelPane.hidden = tabName !== 'travel';
                boardingPane.hidden = tabName !== 'boarding';
            };
            travelTab.addEventListener('click', () => switchTab('travel'));
            boardingTab.addEventListener('click', () => switchTab('boarding'));
            close.addEventListener('click', () => overlay.remove());
            overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove(); });

            this.renderTravel(travelPane);
            this.renderBoarding(boardingPane, prefill);
            switchTab(this.activeTab);
            modal.append(head, tabs, content);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            this.overlay = overlay;
        },

        createField(labelText, type = 'text', value = '') {
            const wrap = document.createElement('label');
            wrap.className = 'eh-op-field';
            const label = document.createElement('span');
            label.textContent = labelText;
            const input = document.createElement('input');
            input.type = type;
            input.value = value || '';
            wrap.append(label, input);
            return { wrap, input };
        },

        fillSelect(select, values, placeholder = 'Selecione…') {
            select.innerHTML = '';
            const empty = document.createElement('option');
            empty.value = ''; empty.textContent = placeholder;
            select.appendChild(empty);
            values.forEach(value => {
                const option = document.createElement('option');
                option.value = value; option.textContent = value;
                select.appendChild(option);
            });
        },

        renderTravel(container) {
            container.innerHTML = '';
            const form = document.createElement('div');
            form.className = 'eh-op-grid';
            const groupWrap = document.createElement('label');
            groupWrap.className = 'eh-op-field eh-op-span-2';
            const groupLabel = document.createElement('span');
            groupLabel.textContent = 'Grupo de referência';
            const group = document.createElement('select');
            this.fillSelect(group, this.chatOptions().map(chat => chat.title), 'Selecione o grupo…');
            const activeTitle = EH.WhatsAppDock?.currentState?.active?.title || '';
            if (activeTitle && Array.from(group.options).some(option => option.value === activeTitle)) group.value = activeTitle;
            groupWrap.append(groupLabel, group);

            const origin = this.createField('Origem');
            const destination = this.createField('Destino');
            const departure = this.createField('Saída manual (opcional)', 'datetime-local');
            departure.wrap.classList.add('eh-op-span-2');
            form.append(groupWrap, origin.wrap, destination.wrap, departure.wrap);

            const listId = `eh-op-places-${Date.now()}`;
            const datalist = document.createElement('datalist');
            datalist.id = listId;
            EH.TravelHistory.knownPlaces().forEach(place => {
                const option = document.createElement('option'); option.value = place; datalist.appendChild(option);
            });
            origin.input.setAttribute('list', listId);
            destination.input.setAttribute('list', listId);

            const calculate = document.createElement('button');
            calculate.type = 'button'; calculate.className = 'eh-op-primary'; calculate.textContent = 'Calcular previsão';
            const result = document.createElement('div');
            result.className = 'eh-op-result'; result.hidden = true;
            const status = document.createElement('div');
            status.className = 'eh-op-status';

            calculate.addEventListener('click', async () => {
                const from = EH.TravelHistory.displayPlace(origin.input.value);
                const to = EH.TravelHistory.displayPlace(destination.input.value);
                if (!from || !to) return EH.Toast.warning('Informe origem e destino.');
                calculate.disabled = true;
                status.textContent = '';
                let departureAt = departure.input.value ? new Date(departure.input.value).getTime() : NaN;
                let latest = null;
                try {
                    if (group.value) {
                        status.textContent = 'Lendo somente o grupo selecionado…';
                        const history = await EH.WhatsAppBridge.requestChatHistory(group.value);
                        if (!history.ok) throw new Error(history.reason || 'Não foi possível ler o grupo.');
                        const parsed = EH.WhatsAppRouteParser.ingest(group.value, history.messages || []);
                        this.lastAnalysis = { group: group.value, ...parsed, at: Date.now() };
                        const originKey = EH.TravelHistory.normalizePlace(from);
                        latest = [...parsed.events].reverse().find(event => event.cityKey === originKey) || null;
                        if (!Number.isFinite(departureAt) && latest) departureAt = latest.at;
                        status.textContent = `${parsed.events.length} saída(s) reconhecida(s) • ${parsed.added} novo(s) tempo(s) aprendido(s)`;
                    }
                    if (!Number.isFinite(departureAt)) throw new Error(`Não encontrei uma saída recente de ${from}. Informe a saída manual.`);
                    const prediction = EH.TravelEstimator.predict({
                        origin: from,
                        destination: to,
                        whatsappGroup: group.value,
                        departureAt,
                        serviceKey: latest?.serviceKey || ''
                    });
                    if (!prediction.ok) throw new Error(prediction.reason);
                    this.lastPrediction = prediction;
                    result.hidden = false;
                    result.innerHTML = '';
                    const heading = document.createElement('strong');
                    heading.textContent = `${EH.TravelHistory.displayPlace(to)} • ${EH.TravelEstimator.formatClock(prediction.eta)}`;
                    const detail = document.createElement('div');
                    const serviceLabel = latest?.serviceTime
                        ? `Carro ${latest.serviceTime}${latest.direction ? ` ${latest.direction}` : ''} • `
                        : '';
                    detail.textContent = `${serviceLabel}Última saída: ${from} ${EH.TravelEstimator.formatClock(prediction.departureAt)} • médio ${EH.TravelEstimator.formatDuration(prediction.stats.averageMinutes)}`;
                    const range = document.createElement('div');
                    range.textContent = `Faixa provável: ${EH.TravelEstimator.formatClock(prediction.low)} às ${EH.TravelEstimator.formatClock(prediction.high)}`;
                    const confidence = document.createElement('small');
                    confidence.textContent = EH.TravelEstimator.confidenceLabel(prediction.stats);
                    const copy = document.createElement('button');
                    copy.type = 'button'; copy.className = 'eh-op-secondary'; copy.textContent = 'Copiar previsão';
                    copy.addEventListener('click', async () => {
                        await EH.Clipboard.copyText(EH.TravelEstimator.formatPrediction(prediction));
                        EH.Toast.success('✓ Previsão copiada');
                    });
                    result.append(heading, detail, range, confidence, copy);
                } catch (error) {
                    result.hidden = false;
                    result.textContent = error.message || 'Não foi possível calcular a previsão.';
                } finally {
                    calculate.disabled = false;
                }
            });

            const manual = document.createElement('details');
            manual.className = 'eh-op-details';
            const manualSummary = document.createElement('summary');
            manualSummary.textContent = 'Calculadora manual';
            const manualBody = document.createElement('div');
            manualBody.className = 'eh-op-details-body';
            const dateField = this.createField('Data da viagem', 'date', EH.TravelEstimator.localDateInput());
            const manualGroup = document.createElement('select');
            this.fillSelect(manualGroup, this.chatOptions().map(chat => chat.title), 'Sem grupo / manual');
            manualGroup.value = group.value || '';
            const rowsWrap = document.createElement('div'); rowsWrap.className = 'eh-manual-rows';
            const addRow = (city = '', time = '') => {
                const row = document.createElement('div'); row.className = 'eh-manual-row';
                const cityInput = document.createElement('input'); cityInput.placeholder = 'Cidade'; cityInput.value = city;
                cityInput.setAttribute('list', listId);
                const timeInput = document.createElement('input'); timeInput.type = 'time'; timeInput.value = time;
                const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.title = 'Remover';
                remove.addEventListener('click', () => row.remove());
                row.append(cityInput, timeInput, remove); rowsWrap.appendChild(row);
            };
            addRow(); addRow(); addRow();
            const manualActions = document.createElement('div'); manualActions.className = 'eh-op-inline';
            const add = document.createElement('button'); add.type = 'button'; add.className = 'eh-op-secondary'; add.textContent = '+ Cidade';
            add.addEventListener('click', () => addRow());
            const save = document.createElement('button'); save.type = 'button'; save.className = 'eh-op-primary'; save.textContent = 'Salvar viagem';
            const manualResult = document.createElement('div'); manualResult.className = 'eh-op-status';
            save.addEventListener('click', () => {
                try {
                    const rows = Array.from(rowsWrap.querySelectorAll('.eh-manual-row')).map(row => ({
                        city: row.querySelector('input:not([type="time"])')?.value || '',
                        time: row.querySelector('input[type="time"]')?.value || ''
                    }));
                    const points = EH.TravelEstimator.manualPoints(dateField.input.value, rows);
                    const stored = EH.TravelHistory.addTrip(points, { source: 'manual', whatsappGroup: manualGroup.value || '', routeId: manualGroup.value || 'manual' });
                    const intervals = [];
                    for (let i = 0; i < points.length - 1; i += 1) {
                        intervals.push(`${points[i].city} → ${points[i + 1].city}: ${EH.TravelEstimator.formatDuration((points[i + 1].at - points[i].at) / 60000)}`);
                    }
                    const total = (points[points.length - 1].at - points[0].at) / 60000;
                    manualResult.textContent = `${intervals.join(' • ')} • Total ${EH.TravelEstimator.formatDuration(total)} • ${stored.added} tempo(s) salvo(s)`;
                    EH.Toast.success('✓ Tempos da viagem salvos');
                } catch (error) {
                    manualResult.textContent = error.message || 'Não foi possível salvar a viagem.';
                }
            });
            manualActions.append(add, save);
            manualBody.append(dateField.wrap, manualGroup, rowsWrap, manualActions, manualResult);
            manual.append(manualSummary, manualBody);

            const history = document.createElement('details');
            history.className = 'eh-op-details';
            const historySummary = document.createElement('summary'); historySummary.textContent = 'Histórico de tempos';
            const historyBody = document.createElement('div'); historyBody.className = 'eh-op-details-body';
            const renderHistory = () => {
                historyBody.innerHTML = '';
                const summaries = EH.TravelHistory.routeSummaries().slice(0, 40);
                if (!summaries.length) { historyBody.textContent = 'Nenhum tempo histórico salvo ainda.'; return; }
                summaries.forEach(summaryItem => {
                    const details = document.createElement('details'); details.className = 'eh-history-route';
                    const s = document.createElement('summary');
                    s.textContent = `${summaryItem.origin} → ${summaryItem.destination} • ${EH.TravelEstimator.formatDuration(summaryItem.averageMinutes)} • ${summaryItem.count}`;
                    const records = document.createElement('div'); records.className = 'eh-history-records';
                    summaryItem.records.slice(0, 25).forEach(record => {
                        const row = document.createElement('div'); row.className = 'eh-history-record';
                        const label = document.createElement('span');
                        label.textContent = `${EH.TravelEstimator.formatDateTime(record.departureDateTime)} • ${record.source === 'whatsapp' ? 'WhatsApp' : 'manual'}${record.whatsappGroup ? ` • ${record.whatsappGroup}` : ''}`;
                        const minutes = document.createElement('input'); minutes.type = 'number'; minutes.min = '3'; minutes.max = String(EH.Config.TRAVEL_MAX_DURATION_MIN); minutes.value = String(record.durationMinutes); minutes.title = 'Minutos';
                        const saveBtn = document.createElement('button'); saveBtn.type = 'button'; saveBtn.textContent = '✓'; saveBtn.title = 'Corrigir tempo';
                        saveBtn.addEventListener('click', () => { if (EH.TravelHistory.updateDuration(record.id, minutes.value)) { EH.Toast.success('Tempo corrigido.'); renderHistory(); } });
                        const del = document.createElement('button'); del.type = 'button'; del.textContent = '×'; del.title = 'Excluir registro';
                        del.addEventListener('click', () => { EH.TravelHistory.remove(record.id); renderHistory(); });
                        row.append(label, minutes, saveBtn, del); records.appendChild(row);
                    });
                    details.append(s, records); historyBody.appendChild(details);
                });
            };
            history.addEventListener('toggle', () => { if (history.open) renderHistory(); });
            history.append(historySummary, historyBody);

            container.append(form, calculate, status, result, manual, history, datalist);
        },

        renderBoarding(container, prefill = null) {
            container.innerHTML = '';
            const top = document.createElement('div'); top.className = 'eh-op-inline';
            const add = document.createElement('button'); add.type = 'button'; add.className = 'eh-op-primary'; add.textContent = 'Novo lembrete';
            const ticketPrefill = prefill || EH.BoardingReminders.ticketPrefill();
            const useTicket = document.createElement('button'); useTicket.type = 'button'; useTicket.className = 'eh-op-secondary'; useTicket.textContent = 'Usar último bilhete'; useTicket.disabled = !ticketPrefill;
            top.append(add, useTicket);
            const editor = document.createElement('div'); editor.className = 'eh-boarding-editor'; editor.hidden = true;
            const list = document.createElement('div'); list.className = 'eh-boarding-list';
            const completed = document.createElement('details'); completed.className = 'eh-op-details';
            const completedSummary = document.createElement('summary'); completedSummary.textContent = 'Concluídos';
            const completedBody = document.createElement('div'); completedBody.className = 'eh-op-details-body'; completed.append(completedSummary, completedBody);

            const openEditor = data => this.renderReminderEditor(editor, data || {} , () => { editor.hidden = true; renderLists(); });
            add.addEventListener('click', () => openEditor({ chatTitle: EH.WhatsAppBridge.getState().activeTitle || '' }));
            useTicket.addEventListener('click', () => openEditor(ticketPrefill));

            const renderCard = (item, target) => {
                const card = document.createElement('div'); card.className = `eh-boarding-card ${item.status}`;
                const now = Date.now();
                if (item.departureAt < now && item.status !== 'completed') card.classList.add('overdue');
                const head = document.createElement('div'); head.className = 'eh-boarding-head';
                const title = document.createElement('strong');
                const critical = new Date(item.departureAt).getHours() < 5;
                title.textContent = `${critical ? '🌙 ' : ''}${EH.TravelEstimator.formatClock(item.departureAt)} — ${item.passenger}`;
                const state = document.createElement('span'); state.textContent = item.status === 'notified' ? 'Avisado' : item.status === 'completed' ? 'Concluído' : (item.departureAt < now ? 'Vencido' : 'Pendente');
                head.append(title, state);
                const route = document.createElement('div'); route.textContent = `${item.origin} → ${item.destination} • ${EH.TravelEstimator.formatDateTime(item.departureAt)}`;
                const actions = document.createElement('div'); actions.className = 'eh-op-inline compact';
                const wa = document.createElement('button'); wa.type = 'button'; wa.textContent = 'WhatsApp'; wa.disabled = !item.chatTitle;
                wa.addEventListener('click', async () => {
                    if (!item.chatTitle) return;
                    const stateNow = await EH.WhatsAppBridge.ensureReady({ requireConversation: false, verifyStale: true, context: 'embarque-conversa' });
                    if (!stateNow.connected) return EH.WhatsAppBridge.notifyUnavailable(stateNow);
                    EH.WhatsAppBridge.send(EH.WhatsAppBridge.makeCommand({ action: 'select_chat', chatTitle: item.chatTitle }));
                    EH.Toast.info('Abrindo conversa do passageiro…');
                });
                const notified = document.createElement('button'); notified.type = 'button'; notified.textContent = 'Avisado'; notified.disabled = item.status === 'completed';
                notified.addEventListener('click', () => { EH.BoardingReminders.setStatus(item.id, 'notified'); renderLists(); });
                const done = document.createElement('button'); done.type = 'button'; done.textContent = 'Concluir'; done.disabled = item.status === 'completed';
                done.addEventListener('click', () => { EH.BoardingReminders.setStatus(item.id, 'completed'); renderLists(); });
                const more = document.createElement('button'); more.type = 'button'; more.textContent = '⋯'; more.title = 'Mais ações';
                more.addEventListener('click', () => {
                    const action = prompt('Digite: adiar 30, editar ou excluir', 'adiar 30');
                    if (!action) return;
                    const delay = action.match(/adiar\s+(\d+)/i);
                    if (delay) EH.BoardingReminders.snooze(item.id, Number(delay[1]));
                    else if (/editar/i.test(action)) openEditor(item);
                    else if (/excluir/i.test(action)) EH.BoardingReminders.remove(item.id);
                    renderLists();
                });
                actions.append(wa, notified, done, more);
                card.append(head, route, actions); target.appendChild(card);
            };

            const renderLists = () => {
                list.innerHTML = ''; completedBody.innerHTML = '';
                const rows = EH.BoardingReminders.list();
                const active = rows.filter(item => item.status !== 'completed');
                const doneRows = rows.filter(item => item.status === 'completed').slice(-20).reverse();
                if (!active.length) {
                    const empty = document.createElement('div'); empty.className = 'eh-op-empty'; empty.textContent = 'Nenhum embarque pendente.'; list.appendChild(empty);
                } else active.forEach(item => renderCard(item, list));
                if (!doneRows.length) completedBody.textContent = 'Nenhum embarque concluído.';
                else doneRows.forEach(item => renderCard(item, completedBody));
                this.refreshBadge();
            };

            const settings = document.createElement('details'); settings.className = 'eh-op-details';
            const settingsSummary = document.createElement('summary'); settingsSummary.textContent = 'Configurações dos alertas';
            const settingsBody = document.createElement('div'); settingsBody.className = 'eh-op-details-body';
            const remind = this.createField('Alertas padrão em minutos (ex.: 180,120,60)', 'text', EH.Config.BOARDING_DEFAULT_ALERTS.join(','));
            const notifications = document.createElement('button'); notifications.type = 'button'; notifications.className = 'eh-op-secondary'; notifications.textContent = 'Ativar notificações do navegador';
            notifications.addEventListener('click', async () => {
                const result = await EH.NotificationManager.request();
                if (result.ok) EH.Toast.success('Notificações de embarque ativadas.');
                else EH.Toast.warning(result.reason || 'Permissão de notificação não concedida.');
            });
            remind.input.addEventListener('change', () => {
                const offsets = EH.BoardingReminders.parseOffsets(remind.input.value);
                EH.Config.BOARDING_DEFAULT_ALERTS = offsets.length ? offsets : [120];
                EH.Config.BOARDING_DEFAULT_REMIND_MINUTES = Math.max(...EH.Config.BOARDING_DEFAULT_ALERTS);
                remind.input.value = EH.Config.BOARDING_DEFAULT_ALERTS.join(',');
                EH.Storage.set('boardingDefaultAlerts', EH.Config.BOARDING_DEFAULT_ALERTS);
                EH.Storage.set('boardingDefaultRemindMinutes', EH.Config.BOARDING_DEFAULT_REMIND_MINUTES);
            });
            settingsBody.append(remind.wrap, notifications); settings.append(settingsSummary, settingsBody);

            container.append(top, editor, list, completed, settings);
            renderLists();
            if (prefill) openEditor(prefill);
        },

        renderReminderEditor(container, prefill, onSaved) {
            container.innerHTML = ''; container.hidden = false;
            const title = document.createElement('strong'); title.textContent = prefill?.id ? 'Editar embarque' : 'Novo embarque';
            let data = { ...prefill };
            if (Array.isArray(prefill?.ticketOptions) && prefill.ticketOptions.length > 1) {
                const select = document.createElement('select');
                prefill.ticketOptions.forEach((ticket, index) => {
                    const option = document.createElement('option'); option.value = String(index); option.textContent = `${ticket.number || index + 1} • ${ticket.origin} → ${ticket.destination} • ${ticket.date}`; select.appendChild(option);
                });
                select.addEventListener('change', () => {
                    const selected = EH.BoardingReminders.ticketPrefill(Number(select.value));
                    if (selected) this.renderReminderEditor(container, selected, onSaved);
                });
                container.append(title, select);
            } else container.appendChild(title);

            const grid = document.createElement('div'); grid.className = 'eh-op-grid';
            const passenger = this.createField('Passageiro', 'text', data.passenger || '');
            const chat = this.createField('Conversa', 'text', data.chatTitle || EH.WhatsAppBridge.getState().activeTitle || '');
            const origin = this.createField('Origem', 'text', data.origin || '');
            const destination = this.createField('Destino', 'text', data.destination || '');
            let dateValue = data.date || '', timeValue = data.time || '';
            if (data.departureAt) {
                const dt = new Date(data.departureAt);
                dateValue = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
                timeValue = `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
            }
            const date = this.createField('Data', 'date', dateValue);
            const time = this.createField('Horário', 'time', timeValue);
            const remind = this.createField('Alertas antes (min; ex. 180,120,60)', 'text', EH.BoardingReminders.parseOffsets(data.alertOffsets || data.remindMinutes || EH.Config.BOARDING_DEFAULT_ALERTS).join(','));
            const ticket = this.createField('Bilhete / reserva', 'text', data.ticketNumber || '');
            grid.append(passenger.wrap, chat.wrap, origin.wrap, destination.wrap, date.wrap, time.wrap, remind.wrap, ticket.wrap);
            const actions = document.createElement('div'); actions.className = 'eh-op-inline';
            const save = document.createElement('button'); save.type = 'button'; save.className = 'eh-op-primary'; save.textContent = 'Salvar lembrete';
            const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'eh-op-secondary'; cancel.textContent = 'Cancelar';
            save.addEventListener('click', () => {
                const departure = EH.BoardingReminders.parseDateTime(date.input.value, time.input.value);
                const result = EH.BoardingReminders.upsert({
                    ...data,
                    passenger: passenger.input.value,
                    chatTitle: chat.input.value,
                    origin: origin.input.value,
                    destination: destination.input.value,
                    departureAt: departure?.getTime(),
                    remindMinutes: Math.max(...(EH.BoardingReminders.parseOffsets(remind.input.value).length ? EH.BoardingReminders.parseOffsets(remind.input.value) : [EH.Config.BOARDING_DEFAULT_REMIND_MINUTES])),
                    alertOffsets: EH.BoardingReminders.parseOffsets(remind.input.value),
                    ticketNumber: ticket.input.value
                });
                if (!result.ok) return EH.Toast.warning(result.reason || 'Não foi possível criar o lembrete.');
                EH.Toast.success('✓ Lembrete de embarque salvo');
                onSaved?.(result.item);
            });
            cancel.addEventListener('click', () => { container.hidden = true; });
            actions.append(save, cancel); container.append(grid, actions);
        }
    };

    // ============================================================
    // WHATSAPP INTEGRADO AO E-PASS
    // A aba já aberta do WhatsApp Web funciona como motor. Esta interface
    // lateral reproduz as conversas e envia comandos sem abrir nova aba/janela.
    // ============================================================
    // ============================================================
    // COMPOSER DE ATENDIMENTO
    // Conteúdo gerado pelo E-Pass fica visível no painel integrado e só
    // é enviado após confirmação explícita por Enter/botão Enviar.
    // ============================================================
    EH.WhatsAppComposer = {
        current: null,

        typeLabel(type) {
            const labels = {
                schedules: 'Horários',
                seats: 'Poltronas',
                reservation: 'Confirmação',
                pix: 'PIX',
                ticket: 'Bilhete',
                qr: 'QR Code'
            };
            return labels[type] || 'Atendimento';
        },

        hasContent() {
            const item = this.current;
            return Boolean(item && (item.text || item.message2 || item.attachment?.dataUrl));
        },

        fingerprint(input) {
            return [
                input?.type || '',
                input?.chatTitle || '',
                input?.text || '',
                input?.message2 || '',
                input?.attachment?.filename || '',
                String(input?.attachment?.dataUrl || '').slice(0, 80)
            ].join('|');
        },

        prepare(input = {}, { replace = false, silent = false } = {}) {
            const attachment = input.attachment?.dataUrl
                ? {
                    dataUrl: String(input.attachment.dataUrl),
                    filename: String(input.attachment.filename || 'epass-atendimento.png'),
                    mime: String(input.attachment.mime || 'image/png')
                }
                : null;
            const next = {
                id: `wa-compose-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                type: String(input.type || 'message'),
                chatTitle: String(input.chatTitle || EH.WhatsAppBridge.getState().activeTitle || '').trim(),
                text: String(input.text || ''),
                message2: String(input.message2 || ''),
                attachment,
                createdAt: Date.now()
            };
            next.fingerprint = this.fingerprint(next);

            if (this.hasContent() && !replace) {
                if (this.current?.fingerprint === next.fingerprint) {
                    return { ok: true, duplicate: true, item: this.current };
                }
                EH.Toast.warning('Já existe conteúdo preparado. Envie ou remova antes de preparar outro.');
                return { ok: false, blocked: true, item: this.current };
            }

            this.current = next;
            if (!silent) EH.Toast.success(`✓ ${this.typeLabel(next.type)} preparado no WhatsApp`);
            return { ok: true, item: next };
        },

        clear({ keepInput = false } = {}) {
            this.current = null;
            if (!keepInput && EH.WhatsAppDock?.composer) EH.WhatsAppDock.composer.value = '';
            EH.WhatsAppDock?.renderPrepared?.();
            EH.WhatsAppDock?.refreshConnection?.();
        },

        get() {
            return this.current ? { ...this.current, attachment: this.current.attachment ? { ...this.current.attachment } : null } : null;
        }
    };

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
        preparedWrap: null,
        preparedTarget: null,
        preparedImage: null,
        preparedText: null,
        preparedRemove: null,
        pendingPreparedId: '',

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
            brand.innerHTML = '<span class="eh-wa-status-dot"></span><strong>WhatsApp</strong>';
            const status = document.createElement('span');
            status.className = 'eh-wa-status-text';
            status.textContent = 'conectando…';
            const collapse = document.createElement('button');
            collapse.type = 'button';
            collapse.className = 'eh-wa-collapse';
            collapse.title = 'Recolher WhatsApp';
            collapse.textContent = '›';
            collapse.addEventListener('click', () => this.setCollapsed(true));
            head.append(brand, status, collapse);

            const chats = document.createElement('section');
            chats.className = 'eh-wa-chats';
            const operation = document.createElement('button');
            operation.type = 'button';
            operation.className = 'eh-wa-operation';
            operation.innerHTML = '<span>⏱</span><strong>Viagem / Embarques</strong>';
            operation.addEventListener('click', () => EH.OperationPanel.open('travel'));
            EH.OperationPanel.attachLauncher(operation);
            const search = document.createElement('input');
            search.type = 'search';
            search.className = 'eh-wa-search';
            search.placeholder = 'Buscar conversa…';
            search.autocomplete = 'off';
            search.addEventListener('input', () => this.renderChats());
            const list = document.createElement('div');
            list.className = 'eh-wa-chat-list';
            chats.append(operation, search, list);

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

            const prepared = document.createElement('section');
            prepared.className = 'eh-wa-prepared';
            prepared.hidden = true;
            const preparedHead = document.createElement('div');
            preparedHead.className = 'eh-wa-prepared-head';
            const preparedLabel = document.createElement('strong');
            preparedLabel.textContent = 'Preparado para envio';
            const preparedTarget = document.createElement('span');
            preparedTarget.textContent = 'Para: selecione uma conversa';
            const preparedRemove = document.createElement('button');
            preparedRemove.type = 'button';
            preparedRemove.className = 'eh-wa-prepared-remove';
            preparedRemove.title = 'Remover conteúdo preparado';
            preparedRemove.setAttribute('aria-label', preparedRemove.title);
            preparedRemove.textContent = '×';
            preparedRemove.addEventListener('click', () => EH.WhatsAppComposer.clear());
            preparedHead.append(preparedLabel, preparedTarget, preparedRemove);
            const preparedBody = document.createElement('div');
            preparedBody.className = 'eh-wa-prepared-body';
            const preparedImage = document.createElement('img');
            preparedImage.className = 'eh-wa-prepared-image';
            preparedImage.alt = 'Imagem preparada';
            preparedImage.hidden = true;
            const preparedText = document.createElement('div');
            preparedText.className = 'eh-wa-prepared-text';
            preparedBody.append(preparedImage, preparedText);
            prepared.append(preparedHead, preparedBody);

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
            handle.title = 'Expandir WhatsApp';
            handle.textContent = '‹';
            handle.hidden = !this.collapsed;
            handle.addEventListener('click', () => this.setCollapsed(false));

            root.append(head, chats, conversation, prepared, pastePreview, composerWrap);
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
            this.preparedWrap = prepared;
            this.preparedTarget = preparedTarget;
            this.preparedImage = preparedImage;
            this.preparedText = preparedText;
            this.preparedRemove = preparedRemove;
            this.applyLayout();
            this.render(EH.WhatsAppBridge.getUiState());
            this.renderPrepared();

            if (typeof GM_addValueChangeListener === 'function') {
                this.listenerId = GM_addValueChangeListener(EH.Storage.key('waUiState'), (_name, _oldValue, newValue) => {
                    const state = EH.WhatsAppBridge.parseStored(newValue);
                    if (state) this.render(state);
                });
                this.ackListenerId = GM_addValueChangeListener(EH.Storage.key('waAck'), (_name, _oldValue, newValue) => {
                    const ack = EH.WhatsAppBridge.parseStored(newValue);
                    if (ack?.id && ack.id === this.pendingCommandId) {
                        if (ack.ok) {
                            if (this.pendingPreparedId && EH.WhatsAppComposer.current?.id === this.pendingPreparedId) {
                                EH.WhatsAppComposer.clear();
                            } else {
                                if (this.pendingImage) this.clearPendingImage();
                                if (this.composer) this.composer.value = '';
                            }
                            EH.Toast.success('✓ Enviado pelo WhatsApp');
                        } else if (ack.imageAttached && !ack.imageSent) {
                            EH.Toast.warning('A imagem foi anexada, mas o WhatsApp não confirmou o envio.');
                        } else {
                            EH.Toast.error('Não foi possível concluir o envio pelo WhatsApp.');
                        }
                        this.pendingPreparedId = '';
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
            const connection = EH.WhatsAppBridge.getState();
            const state = connection.state;
            this.root?.classList.remove('eh-wa-online', 'eh-wa-loading', 'eh-wa-disconnected', 'eh-wa-no-chat', 'eh-wa-ready');
            if (state === 'ready') this.root?.classList.add('eh-wa-online', 'eh-wa-ready');
            else if (state === 'no-chat') this.root?.classList.add('eh-wa-online', 'eh-wa-no-chat');
            else if (state === 'loading') this.root?.classList.add('eh-wa-loading');
            else this.root?.classList.add('eh-wa-disconnected');

            if (this.statusEl) this.statusEl.textContent = connection.label;

            // O campo pode receber texto/imagem assim que a sessão Web estiver conectada.
            // O botão de envio só libera quando existe uma conversa selecionada.
            if (this.composer) this.composer.disabled = !connection.connected;
            if (this.sendButton) {
                const prepared = EH.WhatsAppComposer.get();
                const activeTitle = String(connection.activeTitle || this.currentState?.active?.title || '').trim();
                const targetTitle = String(prepared?.chatTitle || '').trim();
                const targetMismatch = Boolean(
                    prepared &&
                    targetTitle &&
                    activeTitle &&
                    EH.Utils.normalize(targetTitle) !== EH.Utils.normalize(activeTitle)
                );
                this.sendButton.disabled = !connection.readyToSend || targetMismatch;
                this.sendButton.title = targetMismatch
                    ? `Conteúdo preparado para ${targetTitle}. Volte para essa conversa ou remova.`
                    : EH.WhatsAppComposer.hasContent()
                        ? 'Enviar conteúdo preparado'
                        : (this.pendingImage ? 'Enviar imagem' : 'Enviar mensagem');
            }
            return connection;
        },

        requestSync() {
            // Não bloqueie a própria tentativa de sincronização com base em um estado
            // possivelmente antigo. O ACK do WhatsApp é que confirma a conexão real.
            EH.WhatsAppBridge.send(EH.WhatsAppBridge.makeCommand({ action: 'sync', target: 'web' }));
        },

        render(state) {
            this.currentState = state || { chats: [], active: null, messages: [] };
            this.refreshConnection();
            if (this.titleEl) this.titleEl.textContent = this.currentState.active?.title || 'Selecione uma conversa';
            this.renderChats();
            this.renderMessages();
            this.renderPrepared();
        },

        renderPrepared() {
            if (!this.preparedWrap) return;
            const item = EH.WhatsAppComposer.get();
            const has = Boolean(item && (item.text || item.message2 || item.attachment?.dataUrl));
            this.preparedWrap.hidden = !has;
            this.root?.classList.toggle('eh-wa-has-prepared', has);
            if (!has) {
                if (this.preparedImage) {
                    this.preparedImage.hidden = true;
                    this.preparedImage.removeAttribute('src');
                }
                if (this.preparedText) this.preparedText.textContent = '';
                if (this.preparedTarget) {
                    this.preparedTarget.textContent = 'Para: selecione uma conversa';
                    this.preparedTarget.classList.remove('mismatch');
                }
                this.refreshConnection();
                return;
            }
            const activeTitle = String(this.currentState?.active?.title || EH.WhatsAppBridge.getState().activeTitle || '').trim();
            const target = String(item.chatTitle || activeTitle || '').trim();
            const mismatch = Boolean(target && activeTitle && EH.Utils.normalize(target) !== EH.Utils.normalize(activeTitle));
            if (this.preparedTarget) {
                this.preparedTarget.textContent = target
                    ? (mismatch ? `Para: ${target} • conversa atual: ${activeTitle}` : `Para: ${target}`)
                    : 'Para: selecione uma conversa';
                this.preparedTarget.classList.toggle('mismatch', mismatch);
            }
            if (this.preparedImage) {
                if (item.attachment?.dataUrl) {
                    this.preparedImage.src = item.attachment.dataUrl;
                    this.preparedImage.hidden = false;
                } else {
                    this.preparedImage.hidden = true;
                    this.preparedImage.removeAttribute('src');
                }
            }
            if (this.preparedText) {
                const typeLabel = EH.WhatsAppComposer.typeLabel(item.type);
                const preview = String(item.text || item.message2 || '').trim();
                const second = item.message2 ? ' • 2 mensagens' : '';
                this.preparedText.textContent = `${typeLabel}${second}${preview ? `\n${preview}` : ''}`;
            }
            this.refreshConnection();
        },

        applyPreparedToInput() {
            const item = EH.WhatsAppComposer.get();
            if (!item || !this.composer) return;
            this.composer.value = String(item.text || '');
            this.renderPrepared();
        },

        prepareContent(input, options = {}) {
            const currentTitle = String(
                this.currentState?.active?.title ||
                EH.WhatsAppBridge.getState().activeTitle ||
                ''
            ).trim();
            const requestedTitle = String(input?.chatTitle || '').trim();
            const targetTitle = requestedTitle || currentTitle;

            // Conteúdo operacional sempre pertence a uma conversa explícita.
            // Não pedimos telefone e não tentamos abrir outra conversa/aba.
            if (!targetTitle && options.allowUnassigned !== true) {
                if (!options.silent) EH.Toast.warning('⚠️ Selecione uma conversa no WhatsApp.');
                return { ok: false, reason: 'no-chat' };
            }

            const result = EH.WhatsAppComposer.prepare({
                ...input,
                chatTitle: targetTitle
            }, options);
            if (result.ok) {
                EH.State.setPanel('right', true);
                this.applyPreparedToInput();
            }
            return result;
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

        async selectChat(title) {
            const state = await EH.WhatsAppBridge.ensureReady({
                requireConversation: false,
                verifyStale: true,
                context: 'selecionar-conversa'
            });
            if (!state.connected) {
                EH.WhatsAppBridge.notifyUnavailable(state);
                return;
            }
            EH.WhatsAppBridge.send(EH.WhatsAppBridge.makeCommand({ action: 'select_chat', chatTitle: title }));
            if (this.titleEl) this.titleEl.textContent = title;
            if (EH.WhatsAppComposer.current && !EH.WhatsAppComposer.current.chatTitle) {
                EH.WhatsAppComposer.current.chatTitle = title;
                EH.WhatsAppComposer.current.fingerprint = EH.WhatsAppComposer.fingerprint(EH.WhatsAppComposer.current);
                this.renderPrepared();
            }
        },

        async sendPrepared() {
            const item = EH.WhatsAppComposer.get();
            if (!item) return false;
            const state = await EH.WhatsAppBridge.ensureReady({
                requireConversation: true,
                verifyStale: true,
                context: `composer-${item.type || 'atendimento'}`
            });
            const activeTitle = String(state.activeTitle || this.currentState?.active?.title || '').trim();
            if (!state.connected || !activeTitle) {
                EH.WhatsAppBridge.notifyUnavailable({ ...state, conversationSelected: Boolean(activeTitle), activeTitle });
                return false;
            }

            const target = String(item.chatTitle || activeTitle).trim();
            if (target && activeTitle && EH.Utils.normalize(target) !== EH.Utils.normalize(activeTitle)) {
                EH.Toast.warning(`⚠️ Conteúdo preparado para ${target}. Volte para essa conversa ou remova o conteúdo preparado.`);
                this.renderPrepared();
                return false;
            }

            const editedText = String(this.composer?.value ?? item.text ?? '').trim();
            let command;
            if (item.attachment?.dataUrl) {
                command = EH.WhatsAppBridge.makeCommand({
                    action: 'send_image',
                    chatTitle: target,
                    message: editedText,
                    imageDataUrl: item.attachment.dataUrl,
                    filename: item.attachment.filename || 'epass-atendimento.png'
                });
            } else if (item.message2) {
                command = EH.WhatsAppBridge.makeCommand({
                    action: 'send_pair',
                    chatTitle: target,
                    message: editedText,
                    message2: item.message2
                });
            } else if (editedText) {
                command = EH.WhatsAppBridge.makeCommand({
                    action: 'send_text',
                    chatTitle: target,
                    message: editedText
                });
            } else {
                return false;
            }

            this.pendingCommandId = command.id;
            this.pendingPreparedId = item.id;
            EH.WhatsAppBridge.send(command);
            EH.Toast.info(`Enviando ${EH.WhatsAppComposer.typeLabel(item.type).toLowerCase()}…`);
            return true;
        },

        async sendCurrentMessage() {
            if (EH.WhatsAppComposer.hasContent()) {
                await this.sendPrepared();
                return;
            }
            const message = String(this.composer?.value || '').trim();
            const state = await EH.WhatsAppBridge.ensureReady({
                requireConversation: true,
                verifyStale: true,
                context: this.pendingImage ? 'enviar-imagem' : 'enviar-texto'
            });
            const title = String(state.activeTitle || this.currentState?.active?.title || '').trim();

            if (!state.connected || !title) {
                EH.WhatsAppBridge.notifyUnavailable({
                    ...state,
                    conversationSelected: Boolean(title),
                    activeTitle: title
                });
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
            const command = EH.WhatsAppBridge.makeCommand({ action: 'send_text', chatTitle: title, message });
            this.pendingCommandId = command.id;
            EH.WhatsAppBridge.send(command);
            this.composer.value = '';
            EH.Toast.info('Enviando mensagem…');
        }
    };

    // ============================================================
    // LAYOUT / ZOOM DOS PAINÉIS
    // Estado -> classes/CSS variables. Nenhum ajuste cumulativo no E-Pass.
    // ============================================================
    EH.Layout = {
        lastMetrics: null,
        lastTopOffset: 0,

        resolveProfile(viewportWidth, viewportHeight) {
            const configured = String(EH.Config.INTERFACE_PROFILE || 'auto').toLowerCase();
            if (configured === 'home' || configured === 'station') return configured;
            const vw = Math.max(320, Number(viewportWidth) || window.innerWidth || 1366);
            const vh = Math.max(400, Number(viewportHeight) || window.innerHeight || 768);
            if (vw <= 1280 || vh <= 760) return 'station';
            return 'home';
        },

        sizeMultiplier() {
            const size = String(EH.Config.PANEL_SIZE || 'medium').toLowerCase();
            if (size === 'small') return 0.9;
            if (size === 'large') return 1.12;
            return 1;
        },

        responsiveBases(viewportWidth, viewportHeight) {
            const vw = Math.max(320, Number(viewportWidth) || 1366);
            const profile = this.resolveProfile(vw, viewportHeight);
            const sizeMultiplier = this.sizeMultiplier();

            let leftBase;
            let rightBase;
            if (profile === 'station') {
                leftBase = vw <= 900 ? 176 : vw <= 1180 ? 188 : 198;
                rightBase = vw <= 900 ? 238 : vw <= 1180 ? 255 : 274;
            } else {
                leftBase = vw >= 1700 ? 244 : vw >= 1440 ? 232 : EH.Config.PANEL_WIDTH;
                rightBase = vw >= 1700 ? 390 : vw >= 1440 ? 372 : EH.Config.WHATSAPP_DOCK_WIDTH;
            }

            leftBase = Math.max(EH.Config.PANEL_MIN_BASE, Math.round(leftBase * sizeMultiplier));
            rightBase = Math.max(EH.Config.WHATSAPP_MIN_BASE, Math.round(rightBase * sizeMultiplier));

            // Em janela muito estreita, reduzir apenas os nossos painéis.
            // A plataforma original nunca é redimensionada nem deslocada.
            const maxVisualPanel = Math.max(170, Math.floor(vw * 0.46));
            const leftZoom = Math.min(2, Math.max(0.75, Number(EH.Config.PANEL_ZOOM) || 1.5));
            const rightZoom = Math.min(2, Math.max(0.75, Number(EH.Config.WHATSAPP_DOCK_ZOOM) || 1.1));
            if (leftBase * leftZoom > maxVisualPanel) leftBase = Math.max(EH.Config.PANEL_MIN_BASE, Math.floor(maxVisualPanel / leftZoom));
            if (rightBase * rightZoom > maxVisualPanel) rightBase = Math.max(EH.Config.WHATSAPP_MIN_BASE, Math.floor(maxVisualPanel / rightZoom));

            return { leftBase, rightBase, profile, sizeMultiplier };
        },

        detectTopOffset() {
            if (EH.WhatsAppBridge?.isWhatsAppHost?.()) return 0;
            const candidates = [
                document.querySelector('app-agente .block-header'),
                document.querySelector('.container-agente .block-header'),
                document.querySelector('.block-header')
            ].filter(Boolean);
            for (const element of candidates) {
                const rect = element.getBoundingClientRect?.();
                if (!rect) continue;
                const top = Math.round(rect.top);
                if (top >= 36 && top <= Math.min(260, window.innerHeight * 0.4)) {
                    this.lastTopOffset = top;
                    return top;
                }
            }
            if (this.lastTopOffset >= 36) return this.lastTopOffset;
            return Math.max(0, Number(EH.Config.PANEL_TOP_FALLBACK) || 86);
        },

        sync() {
            EH.State?.load?.();
            const viewportWidth = Math.max(320, document.documentElement.clientWidth || window.innerWidth || 1366);
            const viewportHeight = Math.max(400, document.documentElement.clientHeight || window.innerHeight || 768);
            const leftZoom = Math.min(2, Math.max(0.75, Number(EH.Config.PANEL_ZOOM) || 1.5));
            const rightZoom = Math.min(2, Math.max(0.75, Number(EH.Config.WHATSAPP_DOCK_ZOOM) || 1.1));
            const leftOpen = Boolean(EH.State?.isOpen?.('left') && EH.UI?.root);
            const rightOpen = Boolean(EH.State?.isOpen?.('right') && EH.WhatsAppDock?.root);
            const { leftBase, rightBase, profile, sizeMultiplier } = this.responsiveBases(viewportWidth, viewportHeight);
            const topOffset = this.detectTopOffset();
            const bottomGap = Math.max(0, Number(EH.Config.PANEL_BOTTOM_GAP) || 0);
            const usableHeight = Math.max(160, viewportHeight - topOffset - bottomGap);
            const root = document.documentElement;

            // Classes existem somente para estilizar os componentes do próprio helper.
            // Nenhuma delas modifica app-root, navbar, sidebar, formulários ou modais do E-Pass.
            root.classList.toggle('eh-app-left-open', leftOpen);
            root.classList.toggle('eh-app-right-open', rightOpen);
            root.classList.toggle('eh-app-both-open', leftOpen && rightOpen);
            root.classList.toggle('eh-app-panels-closed', !leftOpen && !rightOpen);
            root.dataset.ehProfile = profile;
            root.dataset.ehPanelSize = String(EH.Config.PANEL_SIZE || 'medium');

            root.style.setProperty('--eh-panel-base', `${leftBase}px`);
            root.style.setProperty('--eh-wa-base', `${rightBase}px`);
            root.style.setProperty('--eh-panel-zoom', String(leftZoom));
            root.style.setProperty('--eh-wa-zoom', String(rightZoom));
            root.style.setProperty('--eh-left-top', `${topOffset / leftZoom}px`);
            root.style.setProperty('--eh-right-top', `${topOffset / rightZoom}px`);
            root.style.setProperty('--eh-left-logical-height', `${usableHeight / leftZoom}px`);
            root.style.setProperty('--eh-right-logical-height', `${usableHeight / rightZoom}px`);
            root.style.setProperty('--eh-layout-transition', `${Math.max(0, Number(EH.Config.LAYOUT_TRANSITION_MS) || 180)}ms`);

            if (EH.UI?.root) {
                EH.UI.root.classList.toggle('eh-collapsed', !leftOpen);
                EH.UI.root.classList.toggle('eh-profile-station', profile === 'station');
                EH.UI.root.classList.toggle('eh-profile-home', profile === 'home');
                if (EH.UI.body) EH.UI.body.hidden = !leftOpen;
                if (EH.UI.launcher) EH.UI.launcher.hidden = leftOpen;
            }
            if (EH.WhatsAppDock?.root) {
                EH.WhatsAppDock.collapsed = !rightOpen;
                EH.WhatsAppDock.root.classList.toggle('eh-wa-collapsed', !rightOpen);
                EH.WhatsAppDock.root.classList.toggle('eh-profile-station', profile === 'station');
                EH.WhatsAppDock.root.classList.toggle('eh-profile-home', profile === 'home');
                if (EH.WhatsAppDock.handle) EH.WhatsAppDock.handle.hidden = rightOpen;
            }

            this.lastMetrics = {
                viewportWidth,
                viewportHeight,
                leftOpen,
                rightOpen,
                leftZoom,
                rightZoom,
                leftBase,
                rightBase,
                profile,
                panelSize: EH.Config.PANEL_SIZE,
                sizeMultiplier,
                topOffset,
                usableHeight,
                overlay: true
            };
            return this.lastMetrics;
        },

        reset() {
            const root = document.documentElement;
            ['eh-app-left-open', 'eh-app-right-open', 'eh-app-both-open', 'eh-app-panels-closed']
                .forEach(name => root.classList.remove(name));
            ['--eh-panel-base', '--eh-wa-base', '--eh-panel-zoom', '--eh-wa-zoom', '--eh-left-top', '--eh-right-top', '--eh-left-logical-height', '--eh-right-logical-height', '--eh-layout-transition']
                .forEach(name => root.style.removeProperty(name));
            delete root.dataset.ehProfile;
            delete root.dataset.ehPanelSize;
            this.lastMetrics = null;
        }
    };

    // ============================================================
    // ESTILO
    // ============================================================
    EH.Style = {
        inject() {
            GM_addStyle(`
                :root {
                    --eh-bg: #f6f7f9;
                    --eh-bg-2: #ffffff;
                    --eh-border: #d9dee7;
                    --eh-text: #1f2937;
                    --eh-muted: #6b7280;
                    --eh-primary: #2f6fed;
                    --eh-success: #2f9e69;
                    --eh-warning: #d9941f;
                    --eh-danger: #d94b55;
                    --eh-wa-base: 360px;
                    --eh-panel-base: 228px;
                    --eh-panel-zoom: 1.5;
                    --eh-wa-zoom: 1.1;
                    --eh-left-logical-height: 66.6667vh;
                    --eh-right-logical-height: 90.9091vh;
                    --eh-layout-transition: 180ms;
                }

                #eh-root, #eh-root * { box-sizing: border-box; }

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
                #eh-root .eh-btn.eh-primary { border-color: #2f6fed; background:#2f6fed; color:#fff; }
                #eh-root .eh-btn.eh-success { border-color: #d9dee7; }
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
                    top: 12px;
                    right: 12px;
                    width: min(300px, calc(100vw - 24px));
                    display: grid;
                    gap: 8px;
                    pointer-events: none;
                    font-family: Inter, "Segoe UI", Arial, sans-serif;
                }

                .eh-toast {
                    display: flex;
                    align-items: flex-start;
                    gap: 9px;
                    padding: 8px 10px;
                    border: 1px solid #d9dee7;
                    border-radius: 7px;
                    background: #ffffff;
                    color: #273142;
                    box-shadow: 0 6px 20px rgba(16, 24, 40, .12);
                    pointer-events: auto;
                    font-size: 10px;
                    line-height: 1.4;
                    animation: eh-in .18s ease-out;
                }

                .eh-toast.success { border-left: 4px solid var(--eh-success); }
                .eh-toast.error { border-left: 4px solid var(--eh-danger); }
                .eh-toast.warning { border-left: 4px solid var(--eh-warning); }
                .eh-toast.info { border-left: 4px solid var(--eh-primary); }
                .eh-toast-text { flex: 1; user-select: text; }
                .eh-toast-close { border: 0; background: transparent; color: #8b95a5; cursor: pointer; }

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

                .eh-modal-more {
                    flex: 1 1 100%;
                    border-top: 1px solid #edf0f4;
                    padding-top: 6px;
                }
                .eh-modal-more > summary {
                    cursor: pointer;
                    list-style: none;
                    color: #667085;
                    font-size: 11px;
                    font-weight: 700;
                }
                .eh-modal-more > summary::-webkit-details-marker { display: none; }
                .eh-modal-more-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 7px;
                    margin-top: 7px;
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
                    top: var(--eh-left-top, 0px) !important;
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
                    border-right: 1px solid #d9dee7;
                    border-radius: 0;
                    display: flex;
                    flex-direction: column;
                    background: #f7f8fa;
                    box-shadow: none;
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
                    background: #ffffff;
                    border-bottom: 1px solid #e2e6ec;
                }
                #eh-root .eh-panel-heading {
                    flex: 1 1 auto;
                    min-width: 0;
                    padding-left: 4px;
                    color: #273142;
                    font-size: 10.5px;
                    font-weight: 750;
                    letter-spacing: .1px;
                }
                #eh-root .eh-body {
                    flex: 1 1 auto;
                    overflow-y: auto;
                    min-height: 0;
                    padding: 7px;
                    background: #f7f8fa;
                    scrollbar-width: thin;
                }
                #eh-root .eh-panel-footer {
                    flex: 0 0 auto;
                    padding: 6px 8px;
                    border-top: 1px solid #e2e6ec;
                    background: #ffffff;
                }
                #eh-root .eh-flow-section {
                    margin: 0 0 7px;
                    border: 1px solid #e0e4ea;
                    border-radius: 7px;
                    background: #ffffff;
                    overflow: hidden;
                }
                #eh-root .eh-flow-section > summary {
                    padding: 6px 8px;
                    cursor: pointer;
                    list-style: none;
                    color: #667085;
                    font-size: 8.5px;
                    font-weight: 850;
                    letter-spacing: .3px;
                    text-transform: uppercase;
                }
                #eh-root .eh-flow-section > summary::-webkit-details-marker { display:none; }
                #eh-root .eh-flow-section > summary::after { content:'＋'; float:right; color:#778396; }
                #eh-root .eh-flow-section[open] > summary::after { content:'−'; }
                #eh-root .eh-flow-section .eh-steps { margin: 0; padding: 0 6px 6px; }
                /* Os painéis são overlays independentes. Nenhuma regra desta seção
                   redimensiona app-root, navbar, sidebar, formulários ou modais do E-Pass. */

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

                .eh-dock-title { margin: 8px 2px 5px; font-size: 8px; font-weight: 800; color: #667085; letter-spacing:.35px; text-transform:uppercase; }
                .eh-steps { display:grid; grid-template-columns:repeat(5,1fr); gap:3px; margin-bottom:8px; }
                .eh-step { padding:4px 1px; border:1px solid #e2e6ec; border-radius:6px; text-align:center; color:#7b8494; font-size:7px; line-height:1.15; background:#f7f8fa; }
                .eh-step strong { display:block; font-size:10px; line-height:1.05; }
                .eh-step.active { color:#245ab8; border-color:#9dbcf2; background:#eef4ff; }
                .eh-whatsapp-row { display:grid; grid-template-columns:minmax(0,1fr) 48px 34px; gap:5px; margin-bottom:8px; }
                .eh-dock-phone { width:100%; min-width:0; height:34px; padding:6px 8px; border:1px solid #343c48; border-radius:7px; background:#0e1116; color:#fff; font:inherit; font-size:10px; margin:0; }
                .eh-wa-mode, .eh-wa-open { height:34px; border:1px solid #3b4655; border-radius:7px; background:#202630; color:#eef3fa; cursor:pointer; font:800 9px Arial,sans-serif; }
                .eh-wa-mode.connected { border-color:#2f9e69; background:#183229; color:#dff8ea; }
                .eh-wa-mode:hover, .eh-wa-open:hover { border-color:#35b879; background:#25352e; }
                .eh-wa-open { font-size:15px; }
                .eh-quick-routes { display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:8px; }
                .eh-route-quick { width:100%; min-height:33px; padding:6px 7px; border:1px solid #dce1e8; border-radius:7px; background:#fff; color:#273142; cursor:pointer; font-size:9px; font-weight:700; line-height:1.25; text-align:left; }
                .eh-route-quick:hover { border-color:#9dbcf2; background:#f5f8ff; }
                .eh-route-quick.eh-route-running { border-color:#9bd4b7; background:#f0faf5; }
                .eh-context-card { padding:8px; margin-bottom:8px; border:1px solid #dfe4ea; border-radius:8px; background:#fff; color:#5f6978; font-size:9.5px; line-height:1.42; }
                .eh-context-card strong { display:block; margin-bottom:3px; color:#273142; font-size:10.5px; }
                .eh-context-actions { display:grid; gap:5px; margin-top:7px; }
                .eh-context-btn { width:100%; min-height:31px; padding:6px 8px; border:1px solid #dce1e8; border-radius:7px; background:#fff; color:#273142; cursor:pointer; font-size:9.5px; font-weight:750; text-align:left; }
                .eh-context-more { margin-top:7px; border-top:1px solid #2c323c; padding-top:6px; }
                .eh-context-more > summary { list-style:none; cursor:pointer; color:#98a3b3; font-size:8.5px; font-weight:800; }
                .eh-context-more > summary::-webkit-details-marker { display:none; }
                .eh-context-more > summary::after { content:'＋'; float:right; color:#738093; }
                .eh-context-more[open] > summary::after { content:'−'; }
                .eh-context-actions-secondary { margin-top:6px; }
                .eh-context-btn.primary { border-color:#2f6fed; background:#2f6fed; color:#fff; }
                .eh-context-btn.success { border-color:#cfd6df; background:#fff; color:#273142; }
                .eh-context-btn:disabled { opacity:.38; cursor:not-allowed; filter:grayscale(.25); }
                .eh-pix-mini { display:block; width:128px; max-width:100%; margin:7px auto; border:4px solid #fff; border-radius:7px; background:#fff; }
                .eh-tools-divider { height:1px; background:#e2e6ec; margin:8px 0 6px; }
                #eh-root .eh-actions-primary { grid-template-columns:1fr 1fr; }
                #eh-root .eh-actions-secondary { grid-template-columns:1fr 1fr; }
                @media (max-width: 720px) {
                    .eh-quick-routes { grid-template-columns:1fr; }
                    #eh-launcher { top:auto; bottom:22%; }
                }

                .eh-more-tools { margin-top:6px; border:1px solid #e0e4ea; border-radius:7px; overflow:hidden; background:#fff; }
                .eh-more-tools > summary { padding:7px 8px; cursor:pointer; color:#667085; font-size:9px; font-weight:800; list-style:none; }
                .eh-more-tools > summary::-webkit-details-marker { display:none; }
                .eh-more-tools > summary::after { content:'＋'; float:right; color:#778396; }
                .eh-more-tools[open] > summary::after { content:'−'; }
                .eh-actions-secondary { padding:0 6px 6px; }

                /* WhatsApp Web integrado à direita do E-Pass */
                #eh-wa-dock, #eh-wa-dock * { box-sizing: border-box; }
                #eh-wa-dock {
                    position: fixed;
                    z-index: 2147482500;
                    top: var(--eh-right-top, 0px);
                    right: 0;
                    width: var(--eh-wa-base, 360px);
                    height: var(--eh-right-logical-height, 100vh);
                    zoom: var(--eh-wa-zoom, 1);
                    display: grid;
                    grid-template-rows: 42px minmax(118px, 30%) minmax(0, 1fr) auto auto auto;
                    border-left: 1px solid #d9dee2;
                    background: #efeae2;
                    color: #111b21;
                    font-family: "Segoe UI", Arial, sans-serif;
                    box-shadow: none;
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
                .eh-wa-chats { min-height:0; display:grid; grid-template-rows:34px 42px minmax(0,1fr); border-bottom:1px solid #d8dedf; background:#fff; }
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
                .eh-wa-prepared { max-height:132px; overflow:auto; border-top:1px solid #d8dedf; background:#fff; }
                .eh-wa-prepared[hidden] { display:none !important; }
                .eh-wa-prepared-head { min-height:27px; display:grid; grid-template-columns:auto minmax(0,1fr) 24px; align-items:center; gap:6px; padding:4px 7px; border-bottom:1px solid #edf0f1; color:#54656f; }
                .eh-wa-prepared-head strong { font-size:8.5px; color:#111b21; }
                .eh-wa-prepared-head span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:8px; text-align:right; }
                .eh-wa-prepared-head span.mismatch { color:#b54708; font-weight:700; }
                .eh-wa-prepared-remove { width:22px; height:22px; border:0; border-radius:50%; background:#eef1f2; color:#54656f; cursor:pointer; font-size:15px; line-height:1; }
                .eh-wa-prepared-body { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:7px; padding:6px 8px; }
                .eh-wa-prepared-image { width:46px; height:46px; object-fit:cover; border-radius:5px; border:1px solid #d8dedf; background:#fff; }
                .eh-wa-prepared-image[hidden] { display:none !important; }
                .eh-wa-prepared-text { max-height:62px; overflow:hidden; color:#334047; font-size:8.5px; line-height:1.35; white-space:pre-wrap; overflow-wrap:anywhere; }
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
                .eh-wa-operation { position:relative; width:calc(100% - 16px); height:28px; margin:4px 8px 2px; display:flex; align-items:center; justify-content:center; gap:6px; border:1px solid #d8dedf; border-radius:7px; background:#fff; color:#34444d; cursor:pointer; font:600 10px "Segoe UI",Arial,sans-serif; }
                .eh-wa-operation:hover { background:#f5f7f8; border-color:#b8c3c8; }
                .eh-operation-badge { min-width:16px; height:16px; display:grid; place-items:center; padding:0 4px; border-radius:9px; background:#d9a321; color:#fff; font-size:8px; font-weight:800; }
                .eh-operation-badge[hidden] { display:none !important; }
                .eh-operation-badge.due { background:#d94b55; }

                #eh-root.eh-profile-station .eh-body { padding:5px; }
                #eh-root.eh-profile-station .eh-route-quick { min-height:29px; padding:5px 6px; }
                #eh-root.eh-profile-station .eh-context-card { padding:6px; margin-bottom:6px; }
                #eh-wa-dock.eh-profile-station { grid-template-rows:40px minmax(104px,26%) minmax(0,1fr) auto auto auto; }
                #eh-wa-dock.eh-profile-station .eh-wa-chat { min-height:44px; padding:5px 7px; }
                #eh-wa-dock.eh-profile-station .eh-wa-avatar { width:29px; height:29px; }
                #eh-wa-dock.eh-profile-station .eh-wa-messages { padding:7px 6px 9px; }
                #eh-wa-dock.eh-profile-station .eh-wa-prepared { max-height:104px; }
                #eh-wa-dock.eh-profile-station .eh-wa-prepared-image { width:38px; height:38px; }
                #eh-wa-dock.eh-profile-station .eh-wa-prepared-text { max-height:48px; }
                .eh-operation-modal { width:min(720px,96vw); max-height:min(820px,94vh); }
                .eh-operation-tabs { display:flex; gap:4px; padding:8px 12px 0; border-bottom:1px solid #e2e6ec; background:#fafbfc; }
                .eh-operation-tabs button { padding:7px 11px; border:0; border-bottom:2px solid transparent; background:transparent; color:#667085; cursor:pointer; font-size:11px; font-weight:750; }
                .eh-operation-tabs button.active { color:#2f6fed; border-bottom-color:#2f6fed; }
                .eh-operation-content { max-height:calc(92vh - 104px); overflow:auto; }
                .eh-operation-pane { display:grid; gap:10px; }
                .eh-operation-pane[hidden] { display:none !important; }
                .eh-op-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
                .eh-op-span-2 { grid-column:1 / -1; }
                .eh-op-field { min-width:0; display:grid; gap:4px; color:#667085; font-size:9px; font-weight:700; }
                .eh-op-field input, .eh-op-field select, .eh-op-details-body select, .eh-boarding-editor select { width:100%; min-width:0; height:32px; padding:5px 8px; border:1px solid #dce1e8; border-radius:6px; background:#fff; color:#273142; font:10.5px "Segoe UI",Arial,sans-serif; outline:none; }
                .eh-op-field input:focus, .eh-op-field select:focus { border-color:#8fb0ea; box-shadow:0 0 0 2px rgba(47,111,237,.08); }
                .eh-op-primary, .eh-op-secondary { min-height:32px; padding:6px 10px; border:1px solid #d5dce5; border-radius:6px; background:#fff; color:#344054; cursor:pointer; font-size:10px; font-weight:750; }
                .eh-op-primary { border-color:#2f6fed; background:#2f6fed; color:#fff; }
                .eh-op-primary:disabled, .eh-op-secondary:disabled { opacity:.45; cursor:not-allowed; }
                .eh-op-status { min-height:16px; color:#667085; font-size:9.5px; line-height:1.4; }
                .eh-op-result { display:grid; gap:4px; padding:10px; border:1px solid #dbe3ee; border-radius:7px; background:#f8fafc; color:#344054; font-size:10px; line-height:1.4; }
                .eh-op-result[hidden] { display:none !important; }
                .eh-op-result strong { color:#1f2937; font-size:13px; }
                .eh-op-result small { color:#667085; }
                .eh-op-result button { justify-self:start; margin-top:4px; }
                .eh-op-details { border:1px solid #e1e5eb; border-radius:7px; background:#fff; overflow:hidden; }
                .eh-op-details > summary { padding:8px 10px; cursor:pointer; list-style:none; color:#475467; font-size:10px; font-weight:750; }
                .eh-op-details > summary::-webkit-details-marker { display:none; }
                .eh-op-details > summary::after { content:'＋'; float:right; color:#98a2b3; }
                .eh-op-details[open] > summary::after { content:'−'; }
                .eh-op-details-body { display:grid; gap:8px; padding:9px 10px 10px; border-top:1px solid #edf0f4; color:#667085; font-size:9.5px; }
                .eh-op-inline { display:flex; align-items:center; flex-wrap:wrap; gap:6px; }
                .eh-op-inline.compact button { min-height:26px; padding:4px 7px; border:1px solid #dce1e8; border-radius:5px; background:#fff; color:#475467; cursor:pointer; font-size:8.5px; }
                .eh-manual-rows { display:grid; gap:5px; }
                .eh-manual-row { display:grid; grid-template-columns:minmax(0,1fr) 100px 28px; gap:5px; }
                .eh-manual-row input { min-width:0; height:30px; padding:4px 7px; border:1px solid #dce1e8; border-radius:6px; font-size:10px; }
                .eh-manual-row button { border:0; background:#f1f3f5; border-radius:5px; color:#667085; cursor:pointer; }
                .eh-history-route { border-top:1px solid #eef1f4; }
                .eh-history-route:first-child { border-top:0; }
                .eh-history-route > summary { padding:6px 0; cursor:pointer; color:#475467; font-size:9px; }
                .eh-history-records { display:grid; gap:4px; padding-bottom:6px; }
                .eh-history-record { display:grid; grid-template-columns:minmax(0,1fr) 58px 26px 26px; align-items:center; gap:4px; }
                .eh-history-record span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
                .eh-history-record input { width:58px; height:26px; border:1px solid #dce1e8; border-radius:5px; font-size:9px; }
                .eh-history-record button { height:26px; border:1px solid #dce1e8; border-radius:5px; background:#fff; cursor:pointer; }
                .eh-boarding-editor { display:grid; gap:8px; padding:9px; border:1px solid #dbe3ee; border-radius:7px; background:#f8fafc; }
                .eh-boarding-editor[hidden] { display:none !important; }
                .eh-boarding-list { display:grid; gap:6px; }
                .eh-boarding-card { display:grid; gap:4px; padding:8px 9px; border:1px solid #e0e5eb; border-left:3px solid #d7a62a; border-radius:7px; background:#fff; color:#475467; font-size:9px; }
                .eh-boarding-card.pending { border-left-color:#d94b55; }
                .eh-boarding-card.notified { border-left-color:#d7a62a; }
                .eh-boarding-card.completed { border-left-color:#4da574; opacity:.72; }
                .eh-boarding-card.overdue { border-left-color:#d94b55; background:#fff8f8; }
                .eh-boarding-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
                .eh-boarding-head strong { color:#273142; font-size:10px; }
                .eh-boarding-head span { color:#667085; font-size:8px; }
                .eh-op-empty { padding:14px; text-align:center; color:#98a2b3; font-size:10px; }
                @media (max-width:680px) {
                    .eh-op-grid { grid-template-columns:1fr; }
                    .eh-op-span-2 { grid-column:auto; }
                    .eh-operation-modal { width:98vw; }
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
        detect() {
            if (EH.Payment?.isPage()) return 'pagamento';
            if (EH.Tickets?.isPassagensPage()) return 'passagens';
            if (EH.Utils.first(EH.Selectors.TABLE_HORARIOS)) return 'pesquisa';
            if (EH.Utils.first(EH.Selectors.MAPA_POLTRONAS) || EH.Utils.first(EH.Selectors.DADOS_RESERVA)) {
                return 'reserva';
            }
            return 'desconhecida';
        },
        update() {
            const page = this.detect();
            if (page !== this.current) {
                this.current = page;
                EH.Logger.debug('Página detectada:', page);
            }
            EH.UI.updateState(page);
            return page;
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
            const table = EH.Utils.first(EH.Selectors.TABLE_HORARIOS);

            const dados = {
                origem: EH.Utils.text(origemElement),
                destino: EH.Utils.text(destinoElement),
                data: EH.Utils.formatDate(dateElement ? dateElement.value : ''),
                horarios: []
            };

            if (!table) return dados;

            const groups = new Map();
            const rows = EH.Utils.all(EH.Selectors.TABLE_ROWS, table);

            rows.forEach(row => {
                const saida = EH.Utils.extractTime(EH.Utils.text(row.querySelector(EH.Selectors.CELULA_SAIDA)));
                const chegada = EH.Utils.extractTime(EH.Utils.text(row.querySelector(EH.Selectors.CELULA_CHEGADA)));
                const badge = EH.Utils.text(row.querySelector(EH.Selectors.CELULA_LINHA_BADGE));
                const lineCell = EH.Utils.text(row.querySelector(EH.Selectors.CELULA_LINHA));
                const linha = EH.Utils.mapLine(badge || lineCell);
                const valueCell = row.querySelector(EH.Selectors.CELULA_VALOR);
                const valueText = EH.Utils.text(valueCell);
                let precoNum = EH.Utils.parseMoney(valueText);
                let taxaAplicada = 0;
                let taxaOrigem = '';

                if (precoNum > 0 && EH.Config.APLICAR_TAXAS_ORIGEM) {
                    const taxaConfig = EH.Utils.getTaxaOrigem(dados.origem);
                    if (taxaConfig.valor > 0) {
                        taxaAplicada = taxaConfig.valor;
                        taxaOrigem = taxaConfig.nome;
                        precoNum += taxaAplicada;
                    }
                }

                const preco = precoNum > 0 ? EH.Utils.formatMoney(precoNum) : '';
                const typeElement = row.querySelector(EH.Selectors.CELULA_TIPO);
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
                        preco,
                        precoNum,
                        taxaAplicada,
                        taxaOrigem,
                        tipo,
                        andares: []
                    });
                }

                const item = groups.get(key);
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
            const origem = this.shortPlace(dados?.origem) || 'origem consultada';
            const destino = this.shortPlace(dados?.destino) || 'destino consultado';
            if (!horarios.length) {
                return dados?.data
                    ? `Para ${this.shortDate(dados.data)}, não encontrei horários de ${origem} para ${destino}.`
                    : `Não encontrei horários de ${origem} para ${destino}.`;
            }

            const prices = horarios.map(item => Math.round((Number(item.precoNum) || 0) * 100));
            const validPrices = prices.filter(value => value > 0);
            const samePrice = validPrices.length === horarios.length && new Set(validPrices).size === 1;
            const header = dados?.data
                ? `Para ${this.shortDate(dados.data)}, tenho de ${origem} para ${destino}:`
                : (samePrice
                    ? `Tenho todos os dias de ${origem} para ${destino}, às:`
                    : `Tenho de ${origem} para ${destino}:`);

            const lines = [header, ''];
            if (samePrice) {
                const times = EH.Utils.unique(horarios.map(item => item.saida).filter(Boolean));
                lines.push(`🕐 ${times.join(' | ')}`);
                lines.push(`💰 ${horarios[0].preco || EH.Utils.formatMoney(validPrices[0] / 100)}`);
            } else {
                const pairs = new Map();
                horarios.forEach(item => {
                    const value = item.preco || (item.precoNum > 0 ? EH.Utils.formatMoney(item.precoNum) : 'Consulte o valor');
                    const key = `${item.saida}|${value}`;
                    if (!pairs.has(key)) pairs.set(key, { time: item.saida, value });
                });
                pairs.forEach(item => lines.push(`🕐 ${item.time} — ${item.value}`));
            }
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
                if (item.preco) lines.push(`💰 ${item.preco}`);
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
                return { copied: false, reason: 'O E-Pass está em HTTP. A cópia binária de PNG é bloqueada pelo navegador; use “Preparar no WhatsApp” ou “Baixar PNG”.' };
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
    // PASSAGENS EMITIDAS — SELEÇÃO E CAPTURA DO CARTÃO ORIGINAL
    // ============================================================
    EH.Tickets = {
        active: false,
        cards: [],

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

        clearSelection() {
            this.active = false;
            document.querySelectorAll('.eh-ticket-pick-btn').forEach(button => button.remove());
            document.querySelectorAll('.eh-ticket-choice').forEach(card => {
                card.classList.remove('eh-ticket-choice');
                if (card.dataset.ehTicketOldPosition !== undefined) {
                    card.style.position = card.dataset.ehTicketOldPosition;
                    delete card.dataset.ehTicketOldPosition;
                }
            });
            this.cards = [];
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
                button.textContent = `📸 CAPTURAR ESTA ${index + 1}`;
                button.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    EH.UI.captureTicketCard(card);
                });
                card.appendChild(button);
            });

            cards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            EH.Toast.info(
                cards.length === 1
                    ? 'Uma passagem encontrada. Clique em “CAPTURAR ESTA”.'
                    : `${cards.length} passagens encontradas. Clique em “CAPTURAR ESTA” na passagem correta.`,
                6000
            );
        },

        extractTicketData(card) {
            if (!card || !document.contains(card)) {
                throw new Error('A passagem selecionada não está mais disponível na tela.');
            }

            const headerElement = card.querySelector('.dados-passagem .col-12 h6')
                || card.querySelector('.dados-passagem h6');
            if (!headerElement) throw new Error('Não foi possível localizar os dados principais da passagem.');

            const headerClone = headerElement.cloneNode(true);
            const badgeClone = headerClone.querySelector('.badge');
            const status = EH.Utils.clean(badgeClone?.textContent || '');
            badgeClone?.remove();
            const header = EH.Utils.clean(headerClone.textContent).replace(/\s*-\s*$/, '').trim();

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

            if (!tickets.length) throw new Error('Os bilhetes não foram encontrados dentro da passagem selecionada.');

            const summary = this.summary(card);
            const passenger = header
                .replace(/\s+-\s+[A-Z]{2}\s+X\s+.*$/i, '')
                .replace(/\s+-\s+[^-]+\s+X\s+[^-]+$/i, '')
                .trim();
            return {
                header,
                passenger,
                status: status || summary.status || 'PASSAGEM',
                seller,
                soldAt,
                seat: summary.seat || '',
                service: summary.service || '',
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
                    preco: item.preco || 'Consultar'
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
                runtime: {
                    listeners: EH.Runtime?.listeners?.size || 0,
                    intervals: EH.Runtime?.intervals?.size || 0,
                    timeouts: EH.Runtime?.timeouts?.size || 0,
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

            const titleCase = value => {
                const text = EH.Utils.clean(value);
                if (!text) return '';
                return text.toLocaleLowerCase('pt-BR')
                    .replace(/(^|[\s/–—-])([\p{L}])/gu, (_m, lead, letter) => `${lead}${letter.toLocaleUpperCase('pt-BR')}`)
                    .replace(/\b(Go|Mt|Df|To|Ba|Sp|Rj|Mg|Ma|Pi|Se|Al|Pe)\b/g, match => match.toUpperCase());
            };
            const valueOnly = (line, label) => EH.Utils.clean(String(line || '').replace(new RegExp(`^(?:${label})\\s*:\\s*`, 'i'), ''));
            const prettyLocation = value => {
                const raw = EH.Utils.clean(value);
                if (!raw) return '';
                const stateMatch = raw.match(/\s*-\s*([A-Z]{2})\s*$/i);
                const cityRaw = stateMatch ? raw.slice(0, stateMatch.index).trim() : raw;
                const canonical = EH.CityAliases?.canonicalize?.(cityRaw) || cityRaw;
                const city = titleCase(canonical);
                return `${city}${stateMatch ? ` - ${stateMatch[1].toUpperCase()}` : ''}`;
            };
            const parseRouteDate = routeDate => {
                const raw = EH.Utils.clean(routeDate);
                const dateMatch = raw.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
                const timeMatch = raw.match(/\b([01]\d|2[0-3]):[0-5]\d\b/);
                let routePart = raw;
                if (dateMatch) routePart = routePart.slice(0, dateMatch.index).replace(/\s*-\s*$/, '').trim();
                const routeMatch = routePart.match(/^(.*?)\s+(?:x|×|→)\s+(.*?)$/i);
                return {
                    origin: prettyLocation(routeMatch?.[1] || ''),
                    destination: prettyLocation(routeMatch?.[2] || ''),
                    date: dateMatch?.[1] || '',
                    time: timeMatch?.[0] || ''
                };
            };

            const parts = ['*CONFIRMAÇÃO DA VIAGEM 🚌*', ''];
            summary.cards.forEach((card, index) => {
                if (summary.cards.length > 1) {
                    parts.push(`*Passagem ${index + 1}*`);
                }

                const trip = parseRouteDate(card.routeDate);
                if (trip.origin && trip.destination) {
                    parts.push(`${trip.origin} → ${trip.destination}`);
                } else if (card.routeDate) {
                    parts.push(titleCase(card.routeDate));
                }
                if (trip.date) parts.push(`📅 ${trip.date}`);
                if (trip.time) parts.push(`🕐 ${trip.time}`);

                parts.push('');
                if (card.passenger) parts.push(`👤 Passageiro: ${titleCase(card.passenger)}`);
                if (card.seat) parts.push(`💺 Poltrona: ${card.seat}`);

                const tarifa = valueOnly(card.tarifa, 'TARIFA');
                const taxa = valueOnly(card.taxa, 'TAXA DE EMBARQUE');
                const pedagio = valueOnly(card.pedagio, 'PEDAGIO|PEDÁGIO');
                const beneficio = valueOnly(card.beneficio, 'BENEFÍCIO|BENEFICIO');
                const credito = valueOnly(card.credito, 'CRÉDITO|CREDITO');
                const total = valueOnly(card.total, 'TOTAL');

                parts.push('');
                if (tarifa) parts.push(`💰 Tarifa: ${tarifa}`);
                if (taxa) parts.push(`Taxa de embarque: ${taxa}`);
                if (pedagio) parts.push(`Pedágio: ${pedagio}`);
                if (beneficio && !/R\$\s*0[,.]00/.test(beneficio)) parts.push(`Benefício: ${beneficio}`);
                if (credito && !/R\$\s*0[,.]00/.test(credito)) parts.push(`Crédito: ${credito}`);
                if (total) {
                    parts.push('');
                    parts.push(`*Total: ${total}*`);
                }
                if (index < summary.cards.length - 1) parts.push('', '—', '');
            });

            const instruction = EH.Messages.get('resumo');
            if (instruction) {
                parts.push('');
                const lines = instruction
                    .replace(/\.\s+(?=Se\b)/i, '.\n')
                    .split(/\n+/)
                    .map(line => line.trim())
                    .filter(Boolean);
                parts.push(...lines);
            }
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
                '👇 *Para copiar o PIX:*',
                '',
                'Segure a próxima mensagem e toque em 📋 *Copiar*.',
                '',
                '⚠️ Não toque somente no trecho azul.'
            ].join('\n');
        },


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

    };

    // ============================================================
    // INTERFACE
    // ============================================================
    EH.UI = {
        root: null,
        body: null,
        statusText: null,
        statusDot: null,
        buttons: {},
        busy: false,

        init() {
            if (document.querySelector('#eh-root')) return;

            const firstDrawerUse = !EH.Storage.get('drawer523Initialized', false);
            if (firstDrawerUse) {
                EH.Storage.set('collapsed', true);
                EH.Storage.set('drawer523Initialized', true);
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

            const heading = document.createElement('strong');
            heading.className = 'eh-panel-heading';
            heading.textContent = 'Passagens';

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'eh-icon-btn';
            toggle.title = 'Recolher painel';
            toggle.setAttribute('aria-label', toggle.title);
            toggle.textContent = '‹';

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

            header.append(heading, toggle, settings);

            const body = document.createElement('div');
            body.className = 'eh-body';
            body.hidden = collapsed;

            const steps = document.createElement('div');
            steps.className = 'eh-steps';

            // O WhatsApp fica integrado na lateral direita e utiliza a conversa
            // selecionada. Não há telefone manual neste fluxo.

            const quickTitle = document.createElement('div');
            quickTitle.className = 'eh-dock-title';
            quickTitle.textContent = 'Rotas';
            const quickRoutes = document.createElement('div');
            quickRoutes.className = 'eh-quick-routes';

            const context = document.createElement('div');
            context.className = 'eh-context-card';

            const divider = document.createElement('div');
            divider.className = 'eh-tools-divider';
            const toolsTitle = document.createElement('div');
            toolsTitle.className = 'eh-dock-title';
            toolsTitle.textContent = 'Ações';

            const actions = document.createElement('div');
            actions.className = 'eh-actions eh-actions-primary';

            const horarios = this.createButton('🗓️', 'HORÁRIOS', '', () => this.captureAction('pesquisa'));
            const reserva = this.createButton('💺', 'POLTRONAS', '', () => this.captureAction('reserva'));
            const bilhete = this.createButton('🎫', 'BILHETE', '', () => EH.Tickets.activateSelection());
            const rotas = this.createButton('🧭', 'ROTAS', '', () => this.showRoutes());
            const historico = this.createButton('🕘', 'HISTÓRICO', '', () => this.showHistory());
            const resumo = this.createButton('📋', 'RESUMO', 'eh-primary', () => this.copyCurrentSummary());
            const detalhes = this.createButton('📄', 'DETALHES', '', () => this.copyCurrentDetails());

            horarios.id = 'eh-btn-horarios';
            reserva.id = 'eh-btn-reserva';
            bilhete.id = 'eh-btn-bilhete';
            rotas.id = 'eh-btn-rotas';
            historico.id = 'eh-btn-historico';
            resumo.id = 'eh-btn-resumo';
            detalhes.id = 'eh-btn-detalhes';
            // Ações mais usadas ficam visíveis. As demais continuam disponíveis,
            // porém agrupadas em “Mais opções” para reduzir ruído visual.
            actions.append(resumo, horarios, reserva, bilhete);
            const more = document.createElement('details');
            more.className = 'eh-more-tools';
            const moreSummary = document.createElement('summary');
            moreSummary.textContent = 'Mais';
            const secondaryActions = document.createElement('div');
            secondaryActions.className = 'eh-actions eh-actions-secondary';
            secondaryActions.append(rotas, historico, detalhes);
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
            flowSummary.textContent = 'Fluxo';
            flowSection.append(flowSummary, steps);

            body.append(flowSection, quickTitle, quickRoutes, context, divider, toolsTitle, actions, more);
            panel.append(header, body, footer);
            root.appendChild(panel);

            const launcher = document.createElement('button');
            launcher.type = 'button';
            launcher.id = 'eh-launcher';
            launcher.textContent = '›';
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
            this.buttons = { horarios, reserva, bilhete, rotas, historico, resumo, detalhes };
            this.steps = steps;
            this.quickRoutes = quickRoutes;
            this.contextBox = context;
            this.renderQuickRoutes();

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
            // ACKs de envio são tratados pelo WhatsAppDock, que é a única
            // camada responsável pelo composer integrado.

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

        async openWhatsApp(message = '', options = {}) {
            // Caminho principal único: sempre usar o painel integrado.
            // Não abre nova guia, não navega por telefone e não exige número manual.
            const imageDataUrl = String(options.imageDataUrl || '');
            const filename = String(options.filename || 'epass-atendimento.png');

            const state = await EH.WhatsAppBridge.ensureReady({
                requireConversation: true,
                verifyStale: true,
                context: imageDataUrl ? 'preparar-imagem-integrada' : 'preparar-mensagem-integrada'
            });
            if (!state.readyToSend) {
                EH.WhatsAppBridge.notifyUnavailable(state);
                return { mode: 'integrated', connected: Boolean(state.connected), readyToSend: false, state };
            }

            const typeMap = { pesquisa: 'schedules', reserva: 'seats', bilhete: 'ticket' };
            const prepared = EH.WhatsAppDock?.prepareContent?.({
                type: options.type || typeMap[options.captureType] || 'message',
                chatTitle: state.activeTitle,
                text: String(message || ''),
                message2: String(options.message2 || ''),
                attachment: imageDataUrl ? {
                    dataUrl: imageDataUrl,
                    filename,
                    mime: String(options.mime || 'image/png')
                } : null
            }, {
                replace: options.replace === true,
                silent: options.silent === true
            });

            return {
                mode: 'integrated',
                connected: true,
                readyToSend: true,
                prepared: Boolean(prepared?.ok),
                state
            };
        },

        async sendPixPairToWhatsApp(pix) {
            const payload = EH.Payment.payload(pix);
            if (!payload) {
                EH.Toast.warning('⚠️ Código PIX não encontrado.');
                return null;
            }
            const validation = pix?.validation || EH.Payment.validatePix(payload);
            if (!validation.valid) {
                EH.Toast.warning(`⚠️ O código PIX parece incompleto ou inválido. ${validation.reason || ''}`.trim());
                return null;
            }

            const state = await EH.WhatsAppBridge.ensureReady({
                requireConversation: true,
                verifyStale: true,
                context: 'preparar-pix'
            });
            if (!state.readyToSend) {
                EH.WhatsAppBridge.notifyUnavailable(state);
                return null;
            }

            const prepared = EH.WhatsAppDock?.prepareContent?.({
                type: 'pix',
                chatTitle: state.activeTitle,
                text: EH.Payment.formatPixInstruction(pix),
                // A segunda mensagem contém SOMENTE o payload original.
                message2: payload
            });
            if (prepared?.ok) {
                EH.Toast.info('PIX preparado no painel. Confira e pressione Enviar.');
            }
            return prepared;
        },

        async sendPixQrToWhatsApp(pix) {
            const payload = EH.Payment.payload(pix);
            const validation = pix?.validation || EH.Payment.validatePix(payload);
            if (!payload || !validation.valid) {
                EH.Toast.warning('O PIX precisa estar válido antes de enviar o QR Code.');
                return null;
            }
            let imageDataUrl = '';
            try {
                imageDataUrl = EH.Payment.getQrDataUrl(pix);
            } catch (error) {
                EH.Toast.error(`Não foi possível gerar o QR Code. ${error.message || ''}`.trim());
                return null;
            }
            return EH.WhatsAppDock?.prepareContent?.({
                type: 'qr',
                text: '',
                chatTitle: EH.WhatsAppBridge.getState().activeTitle || '',
                attachment: { dataUrl: imageDataUrl, filename: 'PIX-QR-CODE.png', mime: 'image/png' }
            });
        },

        async sendPixMonospaceToWhatsApp(pix) {
            const payload = EH.Payment.payload(pix);
            const validation = pix?.validation || EH.Payment.validatePix(payload);
            if (!payload || !validation.valid) {
                EH.Toast.warning('O PIX precisa estar válido antes do envio.');
                return null;
            }
            const state = await EH.WhatsAppBridge.ensureReady({
                requireConversation: true,
                verifyStale: true,
                context: 'preparar-pix-mono'
            });
            if (!state.readyToSend) {
                EH.WhatsAppBridge.notifyUnavailable(state);
                return null;
            }
            return EH.WhatsAppDock?.prepareContent?.({
                type: 'pix',
                chatTitle: state.activeTitle,
                text: EH.Payment.formatPixMonospace(pix)
            });
        },

        contextButton(label, cls, handler) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `eh-context-btn ${cls || ''}`.trim();
            btn.textContent = label;
            btn.addEventListener('click', handler);
            return btn;
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
                title.textContent = '1. Horários';
                const recent = this.lastCaptureState?.type === 'pesquisa' && (Date.now() - this.lastCaptureState.createdAt) < 90000;
                info.textContent = recent
                    ? 'Horários prontos.'
                    : 'Escolha uma rota ou gere a captura.';
                actions.append(this.contextButton('🗓️ Gerar horários agora', 'primary', () => this.captureAction('pesquisa')));
            } else if (page === 'reserva') {
                title.textContent = '2. Poltronas';
                info.textContent = 'Gere o mapa de poltronas.';
                actions.append(this.contextButton('💺 Gerar poltronas', 'primary', () => this.captureAction('reserva')));
            } else if (page === 'pagamento') {
                const summary = EH.Payment.parseSummary();
                const pix = EH.Payment.parsePix();
                if (pix) {
                    const validation = pix.validation || EH.Payment.validatePix(EH.Payment.payload(pix));
                    title.textContent = '4. PIX encontrado';
                    info.style.whiteSpace = 'pre-line';
                    const statusLines = [];
                    if (pix.value) statusLines.push(`💰 Valor: ${pix.value}`);
                    if (pix.expires) statusLines.push(`⏳ Expira: ${pix.expires}`);
                    statusLines.push(validation.valid ? '🟢 Código válido' : '🔴 PIX aparentemente incompleto ou inválido');
                    if (!validation.valid && validation.reason) statusLines.push(validation.reason);
                    if (pix.dynamic) {
                        statusLines.push('⚠️ PIX dinâmico detectado');
                        statusLines.push('WhatsApp: envio isolado ativado.');
                    }
                    info.textContent = statusLines.join('\n');

                    let localQr = '';
                    if (validation.valid) {
                        try { localQr = EH.Payment.getQrDataUrl(pix); } catch (error) { EH.Logger.warn('QR local:', error); }
                    }

                    const sendPix = this.contextButton('💬 Preparar no WhatsApp', 'primary', () => this.sendPixPairToWhatsApp(pix));
                    const copyPix = this.contextButton('📋 Copiar código PIX', '', () => EH.Payment.copyPixCode(pix));
                    [sendPix, copyPix].forEach(btn => { btn.disabled = !validation.valid; });
                    actions.append(sendPix, copyPix);
                    this.contextBox.append(title, info, actions);

                    const secondary = document.createElement('details');
                    secondary.className = 'eh-context-more';
                    const secondaryTitle = document.createElement('summary');
                    secondaryTitle.textContent = 'QR Code e alternativas';
                    secondary.appendChild(secondaryTitle);
                    if (localQr) {
                        const img = document.createElement('img');
                        img.className = 'eh-pix-mini';
                        img.src = localQr;
                        img.alt = 'QR Code PIX';
                        secondary.appendChild(img);
                    }
                    const extraActions = document.createElement('div');
                    extraActions.className = 'eh-context-actions eh-context-actions-secondary';
                    const copyQr = this.contextButton('🖼️ Copiar QR Code', '', () => EH.Payment.copyQrCode(pix));
                    const sendQr = this.contextButton('🖼️ Preparar QR no WhatsApp', '', () => this.sendPixQrToWhatsApp(pix));
                    const txt = this.contextButton('📄 PIX em arquivo', '', () => EH.Payment.downloadPixTxt(pix));
                    const mono = this.contextButton('` Monoespaçado (opcional)', '', () => this.sendPixMonospaceToWhatsApp(pix));
                    [copyQr, sendQr, txt, mono].forEach(btn => { btn.disabled = !validation.valid; });
                    extraActions.append(copyQr, sendQr, txt, mono);
                    secondary.appendChild(extraActions);
                    this.contextBox.appendChild(secondary);
                    return;
                }
                title.textContent = '3. Confirmar compra';
                info.textContent = summary?.cards?.length ? `${summary.cards[0].passenger || 'Passageiro'} • ${summary.cards[0].seat ? `poltrona ${summary.cards[0].seat}` : 'confira os dados'}` : 'Resumo ainda não encontrado.';
                const msg = EH.Payment.formatSummary(summary);
                actions.append(
                    this.contextButton('📋 Copiar confirmação', 'primary', async () => { if (!msg) return EH.Toast.warning('Resumo não encontrado.'); await EH.Clipboard.copyText(msg); EH.Toast.success('✓ Confirmação copiada'); }),
                    this.contextButton('💬 Preparar no WhatsApp', '', () => {
                        if (!msg) return EH.Toast.warning('Resumo não encontrado.');
                        EH.WhatsAppDock?.prepareContent?.({
                            type: 'reservation',
                            text: msg,
                            chatTitle: EH.WhatsAppBridge.getState().activeTitle || ''
                        });
                    }),
                    this.contextButton('✅ Cliente confirmou → Gerar PIX', 'success', () => EH.Payment.clientConfirmed())
                );
            } else if (page === 'passagens') {
                title.textContent = '5. Bilhete';
                info.textContent = 'Escolha o bilhete correto.';
                actions.append(this.contextButton('🎫 Escolher bilhete', 'primary', () => EH.Tickets.activateSelection()));
            } else {
                title.textContent = 'Atendimento';
                const waState = EH.WhatsAppBridge.getState();
                info.textContent = waState.state === 'ready'
                    ? 'WhatsApp conectado.'
                    : waState.state === 'no-chat'
                        ? 'Selecione uma conversa.'
                        : waState.state === 'loading'
                            ? 'Conectando ao WhatsApp…'
                            : 'WhatsApp desconectado.';
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
            const isPassagens = page === 'passagens';
            const isPagamento = page === 'pagamento';

            this.buttons.horarios.disabled = !isPesquisa || this.busy;
            this.buttons.reserva.disabled = !isReserva || this.busy;
            this.buttons.bilhete.disabled = !isPassagens || this.busy;
            this.buttons.rotas.disabled = this.busy;
            const hasHistory = EH.History.list().length > 0;
            this.buttons.historico.disabled = !hasHistory || this.busy;
            this.buttons.resumo.disabled = (!isPesquisa && !isReserva) || this.busy;
            this.buttons.detalhes.disabled = (!isPesquisa && !isReserva) || this.busy;

            this.statusDot.classList.toggle('active', isPesquisa || isReserva || isPassagens || isPagamento);
            this.statusText.textContent = isPesquisa
                ? 'Tela de horários'
                : isReserva
                    ? 'Mapa de poltronas'
                    : isPagamento
                        ? (EH.Payment.parsePix() ? 'PIX pronto' : 'Confirmar pagamento')
                        : isPassagens
                            ? 'Pesquisa de passagens'
                            : 'Aguardando pesquisa';
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
                EH.BoardingReminders.setTicketCandidate(prepared.data);

                const activeChatTitle = EH.WhatsAppBridge.getState().activeTitle || '';
                const waPreparedResult = activeChatTitle
                    ? EH.WhatsAppDock?.prepareContent?.({
                        type: 'ticket',
                        text: message,
                        chatTitle: activeChatTitle,
                        attachment: {
                            dataUrl,
                            filename: prepared.filename || 'bilhete-epass.png',
                            mime: 'image/png'
                        }
                    }, { silent: true })
                    : null;
                const waPrepared = Boolean(waPreparedResult?.ok);

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
                else if (waPrepared) EH.Toast.success('Bilhete preparado no painel do WhatsApp.');
                else EH.Toast.warning('Bilhete capturado. O navegador bloqueou o PNG no clipboard; use “Preparar no WhatsApp” ou “Baixar PNG”.', 5200);
            } catch (error) {
                if (prepared?.shell) EH.Capture.destroyShell(prepared.shell);
                EH.Logger.error('Falha na captura da passagem:', error);
                EH.Toast.error(error.message || 'Não foi possível capturar a passagem.', 5200);
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

                // O conteúdo é preparado no composer integrado, mas nunca enviado
                // automaticamente. A conversa atual fica registrada como destino.
                const activeChatTitle = EH.WhatsAppBridge.getState().activeTitle || '';
                const waPreparedResult = activeChatTitle
                    ? EH.WhatsAppDock?.prepareContent?.({
                        type: page === 'pesquisa' ? 'schedules' : 'seats',
                        text: message,
                        chatTitle: activeChatTitle,
                        attachment: {
                            dataUrl,
                            filename: capture.prepared.filename || `${page}-epass.png`,
                            mime: 'image/png'
                        }
                    }, { silent: true })
                    : null;
                const waPrepared = Boolean(waPreparedResult?.ok);

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
                    EH.Toast.success('✓ Imagem copiada');
                } else if (waPrepared) {
                    EH.Toast.success(opts.automatic
                        ? 'Horários prontos no painel do WhatsApp. Confira e pressione Enviar.'
                        : 'Conteúdo preparado no painel do WhatsApp.');
                } else {
                    EH.Toast.warning('Imagem criada, mas o navegador bloqueou o PNG no clipboard. Use “Preparar no WhatsApp” ou “Baixar PNG”.', 5600);
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
                const send = document.createElement('button');
                send.type = 'button';
                send.className = 'eh-mini-btn';
                send.textContent = 'WhatsApp';
                send.addEventListener('click', () => {
                    const entry = EH.History.get(meta.id);
                    if (!entry) return EH.Toast.error('A imagem não está mais disponível no histórico.');
                    const result = EH.WhatsAppDock?.prepareContent?.({
                        type: entry.type === 'pesquisa' ? 'schedules' : entry.type === 'reserva' ? 'seats' : entry.type === 'bilhete' ? 'ticket' : 'message',
                        text: entry.message || EH.Messages.get(entry.type) || '',
                        attachment: entry.dataUrl ? {
                            dataUrl: entry.dataUrl,
                            filename: entry.filename || 'epass-atendimento.png',
                            mime: 'image/png'
                        } : null
                    });
                    if (result?.ok) close();
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
                row.append(open, send, remove);
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
                    note.textContent = result.reason || 'O navegador bloqueou a cópia binária. Use “Preparar no WhatsApp” ou “Baixar PNG”.';
                    EH.Toast.error('Não foi possível copiar o PNG. Use “Preparar no WhatsApp” ou “Baixar PNG”.', 5200);
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
            sendWhatsApp.textContent = '💬 Preparar no WhatsApp';
            sendWhatsApp.addEventListener('click', () => {
                const result = EH.WhatsAppDock?.prepareContent?.({
                    type: captureType === 'pesquisa' ? 'schedules' : captureType === 'reserva' ? 'seats' : captureType === 'bilhete' ? 'ticket' : 'message',
                    text: automaticMessage,
                    chatTitle: EH.WhatsAppBridge.getState().activeTitle || '',
                    attachment: { dataUrl, filename: filename || 'epass.png', mime: 'image/png' }
                });
                if (result?.ok) close();
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

            const reminder = document.createElement('button');
            reminder.type = 'button';
            reminder.className = 'eh-modal-btn';
            reminder.textContent = '⏰ Lembrar embarque';
            reminder.hidden = captureType !== 'bilhete' || !EH.BoardingReminders.lastTicketCandidate;
            reminder.addEventListener('click', () => {
                close();
                EH.OperationPanel.open('boarding', EH.BoardingReminders.ticketPrefill());
            });

            const more = document.createElement('details');
            more.className = 'eh-modal-more';
            const moreSummary = document.createElement('summary');
            moreSummary.textContent = '⋯ Mais';
            const moreActions = document.createElement('div');
            moreActions.className = 'eh-modal-more-actions';
            moreActions.append(copyImage, download, copyText);
            more.append(moreSummary, moreActions);

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

            actions.append(copySummary, sendWhatsApp, reminder, more, closeBottom);
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
            modal.style.width = 'min(760px, 96vw)';

            const head = document.createElement('div');
            head.className = 'eh-modal-head';
            const title = document.createElement('div');
            title.className = 'eh-modal-title';
            title.textContent = 'Configurações e diagnóstico';
            const closeTop = document.createElement('button');
            closeTop.type = 'button';
            closeTop.className = 'eh-modal-close';
            closeTop.textContent = '✕';
            head.append(title, closeTop);

            const content = document.createElement('div');
            content.className = 'eh-modal-content';

            const grid = document.createElement('div');
            grid.className = 'eh-settings-grid';

            const taxaFields = {};
            const createFeeField = (key, labelText) => {
                const field = document.createElement('div');
                field.className = 'eh-field';
                const label = document.createElement('label');
                label.textContent = labelText;
                const input = document.createElement('input');
                input.type = 'number';
                input.min = '0';
                input.step = '0.01';
                input.value = Number(EH.Config.TAXAS_ORIGEM[key] || 0).toFixed(2);
                field.append(label, input);
                taxaFields[key] = input;
                return field;
            };

            const feeField = createFeeField('IPORA', 'Taxa saindo de Iporá');
            const feeFieldGoiania = createFeeField('GOIANIA', 'Taxa saindo de Goiânia');
            const feeFieldBarra = createFeeField('BARRA DO GARCAS', 'Taxa saindo de Barra do Garças');
            const feeFieldAragarcas = createFeeField('ARAGARCAS', 'Taxa saindo de Aragarças');
            const feeFieldSaoLuis = createFeeField('SAO LUIS DE MONTES BELOS', 'Taxa saindo de São Luís de Montes Belos');

            const scaleField = document.createElement('div');
            scaleField.className = 'eh-field';
            const scaleLabel = document.createElement('label');
            scaleLabel.textContent = 'Qualidade da captura (1 a 3)';
            const scaleInput = document.createElement('input');
            scaleInput.type = 'number';
            scaleInput.min = '1';
            scaleInput.max = '3';
            scaleInput.step = '0.25';
            scaleInput.value = String(EH.Config.CAPTURE_SCALE);
            scaleField.append(scaleLabel, scaleInput);

            const panelZoomField = document.createElement('div');
            panelZoomField.className = 'eh-field';
            const panelZoomLabel = document.createElement('label');
            panelZoomLabel.textContent = 'Zoom painel E-Pass (%)';
            const panelZoomInput = document.createElement('input');
            panelZoomInput.type = 'number';
            panelZoomInput.min = '75';
            panelZoomInput.max = '200';
            panelZoomInput.step = '5';
            panelZoomInput.value = String(Math.round(EH.Config.PANEL_ZOOM * 100));
            panelZoomField.append(panelZoomLabel, panelZoomInput);

            const waZoomField = document.createElement('div');
            waZoomField.className = 'eh-field';
            const waZoomLabel = document.createElement('label');
            waZoomLabel.textContent = 'Zoom painel WhatsApp (%)';
            const waZoomInput = document.createElement('input');
            waZoomInput.type = 'number';
            waZoomInput.min = '75';
            waZoomInput.max = '200';
            waZoomInput.step = '5';
            waZoomInput.value = String(Math.round(EH.Config.WHATSAPP_DOCK_ZOOM * 100));
            waZoomField.append(waZoomLabel, waZoomInput);

            const profileField = document.createElement('div');
            profileField.className = 'eh-field';
            const profileLabel = document.createElement('label');
            profileLabel.textContent = 'Perfil da interface';
            const profileSelect = document.createElement('select');
            profileSelect.innerHTML = '<option value="auto">Automático</option><option value="home">PC de Casa</option><option value="station">PC da Rodoviária</option>';
            profileSelect.value = EH.Config.INTERFACE_PROFILE;
            profileField.append(profileLabel, profileSelect);

            const panelSizeField = document.createElement('div');
            panelSizeField.className = 'eh-field';
            const panelSizeLabel = document.createElement('label');
            panelSizeLabel.textContent = 'Largura dos painéis';
            const panelSizeSelect = document.createElement('select');
            panelSizeSelect.innerHTML = '<option value="small">Pequeno</option><option value="medium">Médio</option><option value="large">Grande</option>';
            panelSizeSelect.value = EH.Config.PANEL_SIZE;
            panelSizeField.append(panelSizeLabel, panelSizeSelect);

            const ticketWidthField = document.createElement('div');
            ticketWidthField.className = 'eh-field';
            const ticketWidthLabel = document.createElement('label');
            ticketWidthLabel.textContent = 'Largura do print da passagem (360 a 520 px)';
            const ticketWidthInput = document.createElement('input');
            ticketWidthInput.type = 'number';
            ticketWidthInput.min = '360';
            ticketWidthInput.max = '520';
            ticketWidthInput.step = '10';
            ticketWidthInput.value = String(EH.Config.TICKET_CAPTURE_WIDTH);
            ticketWidthField.append(ticketWidthLabel, ticketWidthInput);

            grid.append(profileField, panelSizeField, feeField, feeFieldGoiania, feeFieldBarra, feeFieldAragarcas, feeFieldSaoLuis, scaleField, panelZoomField, waZoomField, ticketWidthField);

            const checkWrap = document.createElement('label');
            checkWrap.className = 'eh-check';
            checkWrap.style.marginTop = '13px';
            const check = document.createElement('input');
            check.type = 'checkbox';
            check.checked = EH.Config.APLICAR_TAXAS_ORIGEM;
            const checkText = document.createElement('span');
            checkText.textContent = 'Adicionar automaticamente a taxa conforme a origem configurada';
            checkWrap.append(check, checkText);

            const autoCopyWrap = document.createElement('label');
            autoCopyWrap.className = 'eh-check';
            autoCopyWrap.style.marginTop = '8px';
            const autoCopyCheck = document.createElement('input');
            autoCopyCheck.type = 'checkbox';
            autoCopyCheck.checked = EH.Config.AUTO_COPY_IMAGES;
            const autoCopyText = document.createElement('span');
            autoCopyText.textContent = 'Tentar copiar automaticamente o PNG quando o navegador permitir';
            autoCopyWrap.append(autoCopyCheck, autoCopyText);

            const autoRouteWrap = document.createElement('label');
            autoRouteWrap.className = 'eh-check';
            autoRouteWrap.style.marginTop = '8px';
            const autoRouteCheck = document.createElement('input');
            autoRouteCheck.type = 'checkbox';
            autoRouteCheck.checked = EH.Config.AUTO_ROUTE_CAPTURE;
            const autoRouteText = document.createElement('span');
            autoRouteText.textContent = 'Rota rápida: pesquisar, gerar horários e preparar a imagem automaticamente';
            autoRouteWrap.append(autoRouteCheck, autoRouteText);

            const messageSection = document.createElement('div');
            messageSection.className = 'eh-section-label';
            messageSection.textContent = 'Mensagens automáticas';

            const messageFields = {};
            const createMessageField = (key, labelText) => {
                const field = document.createElement('div');
                field.className = 'eh-field';
                field.style.marginTop = '9px';
                const label = document.createElement('label');
                label.textContent = labelText;
                const textarea = document.createElement('textarea');
                textarea.rows = 3;
                textarea.value = EH.Messages.get(key);
                field.append(label, textarea);
                messageFields[key] = textarea;
                return field;
            };
            const msgHorarios = createMessageField('pesquisa', 'Mensagem após gerar Horários');
            const msgReserva = createMessageField('reserva', 'Mensagem após gerar Reserva');
            const msgBilhete = createMessageField('bilhete', 'Mensagem após gerar Bilhete');
            const msgResumo = createMessageField('resumo', 'Mensagem de confirmação antes do pagamento');
            const msgPix = createMessageField('pix', 'Mensagem enviada junto com o PIX');

            const help = document.createElement('div');
            help.className = 'eh-help-box';
            help.textContent = 'O perfil Automático adapta somente os painéis do helper à tela disponível; a plataforma E-Pass não é deslocada nem redimensionada. O atendimento usa o WhatsApp integrado e a conversa selecionada no painel. Zoom padrão: painel E-Pass 150% e WhatsApp 110%. As preferências ficam salvas separadamente em cada navegador.';

            content.append(grid, checkWrap, autoCopyWrap, autoRouteWrap, messageSection, msgHorarios, msgReserva, msgBilhete, msgResumo, msgPix, help);

            const actions = document.createElement('div');
            actions.className = 'eh-modal-actions';

            const save = document.createElement('button');
            save.type = 'button';
            save.className = 'eh-modal-btn primary';
            save.textContent = 'Salvar configurações';
            save.addEventListener('click', () => {
                const taxas = {
                    IPORA: Math.max(0, Number(taxaFields.IPORA.value) || 0),
                    GOIANIA: Math.max(0, Number(taxaFields.GOIANIA.value) || 0),
                    'BARRA DO GARCAS': Math.max(0, Number(taxaFields['BARRA DO GARCAS'].value) || 0),
                    ARAGARCAS: Math.max(0, Number(taxaFields.ARAGARCAS.value) || 0),
                    'SAO LUIS DE MONTES BELOS': Math.max(0, Number(taxaFields['SAO LUIS DE MONTES BELOS'].value) || 0)
                };
                const scale = Math.min(3, Math.max(1, Number(scaleInput.value) || 2));
                const ticketWidth = Math.min(520, Math.max(360, Number(ticketWidthInput.value) || 430));
                const panelZoom = Math.min(2, Math.max(0.75, (Number(panelZoomInput.value) || 150) / 100));
                const whatsappDockZoom = Math.min(2, Math.max(0.75, (Number(waZoomInput.value) || 110) / 100));
                EH.Config.TAXAS_ORIGEM = taxas;
                EH.Config.CAPTURE_SCALE = scale;
                EH.Config.TICKET_CAPTURE_WIDTH = ticketWidth;
                EH.Config.PANEL_ZOOM = panelZoom;
                EH.Config.WHATSAPP_DOCK_ZOOM = whatsappDockZoom;
                EH.Config.INTERFACE_PROFILE = ['home', 'station'].includes(profileSelect.value) ? profileSelect.value : 'auto';
                EH.Config.PANEL_SIZE = ['small', 'large'].includes(panelSizeSelect.value) ? panelSizeSelect.value : 'medium';
                EH.Config.APLICAR_TAXAS_ORIGEM = check.checked;
                EH.Config.AUTO_COPY_IMAGES = autoCopyCheck.checked;
                EH.Config.AUTO_ROUTE_CAPTURE = autoRouteCheck.checked;
                EH.Messages.setAll({
                    pesquisa: messageFields.pesquisa.value.trim(),
                    reserva: messageFields.reserva.value.trim(),
                    bilhete: messageFields.bilhete.value.trim(),
                    resumo: messageFields.resumo.value.trim(),
                    pix: messageFields.pix.value.trim()
                });
                EH.Storage.set('taxasOrigem', taxas);
                EH.Storage.set('taxaIpora', taxas.IPORA);
                EH.Storage.set('captureScale', scale);
                EH.Storage.set('ticketCaptureWidth', ticketWidth);
                EH.Storage.set('panelZoom', panelZoom);
                EH.Storage.set('whatsappDockZoom', whatsappDockZoom);
                EH.Storage.set('interfaceProfile', EH.Config.INTERFACE_PROFILE);
                EH.Storage.set('panelSize', EH.Config.PANEL_SIZE);
                EH.Storage.set('aplicarTaxasOrigem', check.checked);
                EH.Storage.set('autoCopyImages', autoCopyCheck.checked);
                EH.Storage.set('autoRouteCapture', autoRouteCheck.checked);
                EH.Storage.set('aplicarTaxaIpora', check.checked);

                const savedScale = Number(EH.Storage.get('captureScale', 0));
                const savedTicketWidth = Number(EH.Storage.get('ticketCaptureWidth', 0));
                const savedPanelZoom = Number(EH.Storage.get('panelZoom', 0));
                const savedWaZoom = Number(EH.Storage.get('whatsappDockZoom', 0));
                const savedProfile = String(EH.Storage.get('interfaceProfile', 'auto'));
                const savedPanelSize = String(EH.Storage.get('panelSize', 'medium'));
                const savedTaxes = EH.Storage.get('taxasOrigem', null);
                const savedAutoTax = Boolean(EH.Storage.get('aplicarTaxasOrigem', false));
                const savedMessages = EH.Storage.get('messages', null);
                const savedAutoCopy = Boolean(EH.Storage.get('autoCopyImages', false));
                const savedAutoRoute = Boolean(EH.Storage.get('autoRouteCapture', false));
                const savedCorrectly = savedTaxes && savedMessages && savedScale === scale && savedTicketWidth === ticketWidth && Math.abs(savedPanelZoom - panelZoom) < 0.001 && Math.abs(savedWaZoom - whatsappDockZoom) < 0.001 && savedProfile === EH.Config.INTERFACE_PROFILE && savedPanelSize === EH.Config.PANEL_SIZE && savedAutoTax === check.checked && savedAutoCopy === autoCopyCheck.checked && savedAutoRoute === autoRouteCheck.checked;

                if (!savedCorrectly) {
                    EH.Toast.error('Não foi possível confirmar o salvamento. Tente novamente.');
                    return;
                }

                EH.Layout.sync();
                EH.Toast.success('Configurações salvas neste navegador.');
                close();
            });

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

            const resetPosition = document.createElement('button');
            resetPosition.type = 'button';
            resetPosition.className = 'eh-modal-btn';
            resetPosition.textContent = 'Mostrar painel lateral';
            resetPosition.addEventListener('click', () => {
                this.setPanelOpen(true);
                EH.Toast.success('Painel lateral exibido.');
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

            actions.append(save, diagnostic, copyHtml, resetPosition, closeBottom);
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
                EH.Layout?.sync?.();
                if (page !== 'passagens' && EH.Tickets.active) EH.Tickets.clearSelection();
            }, EH.Config.APP_OBSERVER_DEBOUNCE_MS);

            const isOwnMutation = mutation => {
                const target = mutation?.target instanceof Element ? mutation.target : mutation?.target?.parentElement;
                return Boolean(target?.closest?.('#eh-root, #eh-wa-dock, #eh-toast-area, .eh-overlay, .eh-capture-overlay'));
            };

            this.observer = new MutationObserver(mutations => {
                if (mutations?.length && mutations.every(isOwnMutation)) return;
                update();
            });
            const target = document.querySelector('app-root') || document.body;
            this.observer.observe(target, { childList: true, subtree: true });
            EH.Runtime.on('app-popstate', window, 'popstate', update);
            EH.Runtime.on('app-hashchange', window, 'hashchange', update);
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

            EH.Storage.loadSettings();

            // Na aba do WhatsApp Web o script funciona apenas como uma ponte silenciosa.
            // Nenhum painel do E-Pass é desenhado dentro do WhatsApp.
            if (EH.WhatsAppBridge.isWhatsAppHost()) {
                EH.WhatsAppBridge.initReceiver();
                EH.Logger.info(`EPass Helper ${EH.Config.VERSION}: ponte do WhatsApp Web ativa.`);
                return;
            }

            EH.Style.inject();
            EH.Toast.init();
            EH.UI.init();
            EH.BoardingReminders.init();
            EH.WhatsAppDock.init();
            EH.Layout.sync();
            EH.Runtime.on('app-resize', window, 'resize', EH.Utils.debounce(() => EH.Layout.sync(), 140));
            EH.Observer.start();
            EH.Pages.update();
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

            if (EH.Config.DEBUG) window.EPassHelper = EH;
            EH.Logger.info(`EPass Helper ${EH.Config.VERSION} iniciado.`);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => EH.Init.start(), { once: true });
    } else {
        EH.Init.start();
    }
})();
