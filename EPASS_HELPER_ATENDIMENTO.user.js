// ==UserScript==
// @name         EPass Helper 5.1 - Atendimento
// @namespace    https://github.com/epass-helper
// @version      5.20.0
// @description  Atendimento ao cliente, horários organizados, mapa de poltronas e cópia para WhatsApp
// @author       EPass Helper
// @updateURL    https://raw.githubusercontent.com/xZHENO/epass-helper/main/EPASS_HELPER_ATENDIMENTO.user.js
// @downloadURL  https://raw.githubusercontent.com/xZHENO/epass-helper/main/EPASS_HELPER_ATENDIMENTO.user.js
// @match        http://www.epass.com.br/*
// @match        https://www.epass.com.br/*
// @match        http://epass.com.br/*
// @match        https://epass.com.br/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
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
        VERSION: '5.20.0',
        DEBUG: false,
        STORAGE_PREFIX: 'epassHelperV5.',
        TOAST_DURATION: 3400,
        CAPTURE_SCALE: 2,
        TICKET_CAPTURE_WIDTH: 430,
        MAX_CAPTURE_PIXELS: 26000000,
        HISTORY_LIMIT: 10,
        HISTORY_MAX_CHARS: 45000000,
        MESSAGES: {
            pesquisa: 'Escolha o horário desejado. Após isso, vou encaminhar as poltronas disponíveis.',
            reserva: 'Estas são as poltronas disponíveis. Informe o número da poltrona desejada.',
            bilhete: 'Passagem emitida com sucesso. Confira os dados da viagem no comprovante.'
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
        PANEL_POSITION: { x: 18, y: 18 },
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
        ]
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

        async apply(route) {
            if (!route) return;
            EH.Storage.set('pendingRoute', route);
            if (!this.isSearchPage()) {
                location.href = `${location.origin}/epass/vendas/pesquisa`;
                return;
            }

            await this.selectNgValue(EH.Selectors.ORIGEM_SELECT, route.origem);
            await this.selectNgValue(EH.Selectors.DESTINO_SELECT, route.destino);
            EH.Storage.remove('pendingRoute');
            EH.Toast.success(`${route.origem} → ${route.destino} preenchido.`);
            if (route.observacao) EH.Storage.set('lastRouteObservation', route.observacao);
        },

        async applyPending() {
            if (!this.isSearchPage()) return;
            const pending = EH.Storage.get('pendingRoute', null);
            if (!pending?.origem || !pending?.destino) return;
            try {
                await EH.Utils.sleep(450);
                await this.apply(pending);
            } catch (error) {
                EH.Logger.warn('Não foi possível aplicar a rota pendente:', error);
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
                    const finish = () => resolve();
                    image.addEventListener('load', finish, { once: true });
                    image.addEventListener('error', finish, { once: true });
                    setTimeout(finish, 4000);
                });
            }));
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
                }

                #eh-root, #eh-root * { box-sizing: border-box; }

                #eh-root {
                    position: fixed;
                    z-index: 2147483000;
                    left: 18px;
                    top: 18px;
                    width: 190px;
                    font-family: Inter, "Segoe UI", Arial, sans-serif;
                    color: var(--eh-text);
                    user-select: none;
                }

                #eh-root.eh-collapsed {
                    width: auto;
                }

                .eh-panel {
                    overflow: hidden;
                    border: 1px solid var(--eh-border);
                    border-radius: 13px;
                    background: rgba(23, 25, 31, .97);
                    box-shadow: 0 14px 40px rgba(0, 0, 0, .34);
                }

                .eh-header {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 4px;
                    min-height: 36px;
                    padding: 4px;
                    border-bottom: 1px solid var(--eh-border);
                    cursor: grab;
                    touch-action: none;
                }

                #eh-root.eh-collapsed .eh-header {
                    border-bottom: 0;
                }

                .eh-header:active { cursor: grabbing; }

                .eh-title {
                    display: none !important;
                }

                .eh-version {
                    display: none !important;
                }

                .eh-icon-btn {
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

                .eh-icon-btn:hover { background: var(--eh-bg-2); color: var(--eh-text); }

                .eh-body { padding: 9px; }
                .eh-body[hidden] { display: none !important; }
                #eh-root.eh-collapsed .eh-panel { border-radius: 10px; }

                .eh-actions {
                    display: grid;
                    gap: 7px;
                }

                .eh-btn {
                    width: 100%;
                    min-height: 38px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 9px;
                    padding: 8px 10px;
                    border: 1px solid var(--eh-border);
                    border-radius: 9px;
                    background: var(--eh-bg-2);
                    color: var(--eh-text);
                    cursor: pointer;
                    font: inherit;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: .3px;
                    text-align: left;
                    transition: transform .15s ease, border-color .15s ease, background .15s ease;
                }

                .eh-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    border-color: #4d5565;
                    background: #272b35;
                }

                .eh-btn:disabled { opacity: .38; cursor: not-allowed; }
                .eh-btn.eh-primary { border-color: rgba(61, 139, 253, .48); }
                .eh-btn.eh-success { border-color: rgba(53, 184, 121, .48); }
                .eh-btn-icon { width: 20px; text-align: center; font-size: 15px; }

                .eh-status {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid var(--eh-border);
                    color: var(--eh-muted);
                    font-size: 10px;
                }

                .eh-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: var(--eh-warning);
                    box-shadow: 0 0 0 3px rgba(231, 168, 58, .12);
                }

                .eh-dot.active {
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
                    #eh-root { width: 172px; }
                    .eh-settings-grid { grid-template-columns: 1fr; }
                    .eh-modal-actions { flex-direction: column; }
                    .eh-modal-btn { width: 100%; }
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

        formatPesquisa(dados) {
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

        formatForWhatsApp(data, page) {
            return page === 'reserva' ? this.formatReserva(data) : this.formatPesquisa(data);
        }
    };

    // ============================================================
    // CLIPBOARD
    // ============================================================
    EH.Clipboard = {
        async copyText(text) {
            const value = String(text || '');
            if (!value) throw new Error('Não há texto para copiar.');

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
                return Promise.resolve({ copied: false, reason: 'A página está em HTTP, não em HTTPS.' });
            }
            if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
                return Promise.resolve({ copied: false, reason: 'A cópia de imagens não está disponível neste navegador.' });
            }

            try {
                const item = new ClipboardItem({ 'image/png': blobPromise });
                return navigator.clipboard.write([item])
                    .then(() => ({ copied: true, method: 'clipboard' }))
                    .catch(error => ({ copied: false, reason: error.message || String(error) }));
            } catch (error) {
                return Promise.resolve({ copied: false, reason: error.message || String(error) });
            }
        },

        legacyCopyImageElement(image) {
            if (!image || !image.src) return false;
            const holder = document.createElement('div');
            holder.contentEditable = 'true';
            holder.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:.01;z-index:2147483647;';

            const clone = document.createElement('img');
            clone.src = image.src;
            holder.appendChild(clone);
            document.body.appendChild(holder);

            const range = document.createRange();
            range.selectNode(clone);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            let copied = false;
            try {
                copied = document.execCommand('copy');
            } catch (error) {
                EH.Logger.debug('Fallback antigo de imagem falhou:', error);
            }

            selection.removeAllRanges();
            holder.remove();
            return copied;
        },

        async copyImageBlob(blob) {
            if (!window.isSecureContext) {
                throw new Error('O E-Pass está aberto em HTTP. O navegador não permite copiar um PNG real para a área de transferência nessa página.');
            }
            if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
                throw new Error('Este navegador não liberou a cópia direta de imagens.');
            }
            try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                return 'clipboard';
            } catch (error) {
                EH.Logger.debug('Clipboard moderno de imagem bloqueado:', error);
                throw new Error('O navegador bloqueou a cópia da imagem. Verifique a permissão da área de transferência.');
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

        openImageForNativeCopy(dataUrl) {
            const popup = window.open('', '_blank');
            if (!popup) throw new Error('O navegador bloqueou a nova aba. Libere pop-ups para o E-Pass.');
            popup.document.title = 'Imagem do E-Pass';
            popup.document.body.style.cssText = 'margin:0;padding:22px;background:#eef1f5;font-family:Arial,sans-serif;text-align:center;';
            const note = popup.document.createElement('div');
            note.textContent = 'Clique com o botão direito na imagem e escolha “Copiar imagem”. Depois cole no WhatsApp com Ctrl + V.';
            note.style.cssText = 'max-width:760px;margin:0 auto 14px;padding:10px 12px;background:#fff;border-radius:8px;color:#263349;font-size:14px;';
            const image = popup.document.createElement('img');
            image.src = dataUrl;
            image.alt = 'Captura do E-Pass';
            image.style.cssText = 'display:block;max-width:100%;height:auto;margin:0 auto;background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.12);';
            popup.document.body.append(note, image);
            popup.focus();
            return popup;
        }
    };

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
                priceValue.textContent = item.preco || 'Consultar';
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
                    applyIporaFee: EH.Config.APLICAR_TAXA_IPORA,
                    iporaFee: EH.Config.TAXA_IPORA
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

            const savedPosition = EH.Storage.get('panelPosition', EH.Config.PANEL_POSITION);
            const collapsed = Boolean(EH.Storage.get('collapsed', true));

            const root = document.createElement('div');
            root.id = 'eh-root';
            root.classList.toggle('eh-collapsed', collapsed);
            root.style.left = `${Number(savedPosition.x) || 18}px`;
            root.style.top = `${Number(savedPosition.y) || 18}px`;

            const panel = document.createElement('div');
            panel.className = 'eh-panel';

            const header = document.createElement('div');
            header.className = 'eh-header';
            header.title = 'Arraste para mover';

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'eh-icon-btn';
            toggle.title = collapsed ? 'Expandir' : 'Recolher';
            toggle.setAttribute('aria-label', toggle.title);
            toggle.textContent = collapsed ? '▾' : '▴';

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

            header.append(toggle, settings);

            const body = document.createElement('div');
            body.className = 'eh-body';
            body.hidden = collapsed;

            const actions = document.createElement('div');
            actions.className = 'eh-actions';

            const horarios = this.createButton('🗓️', 'HORÁRIOS', 'eh-primary', () => this.captureAction('pesquisa'));
            const reserva = this.createButton('💺', 'RESERVA', 'eh-success', () => this.captureAction('reserva'));
            const bilhete = this.createButton('🎫', 'BILHETE', 'eh-primary', () => EH.Tickets.activateSelection());
            const rotas = this.createButton('🧭', 'ROTAS', '', () => this.showRoutes());
            const historico = this.createButton('🕘', 'HISTÓRICO', '', () => this.showHistory());
            const enviar = this.createButton('📤', 'ENVIAR', 'eh-success', () => this.showSend());
            const copiar = this.createButton('📋', 'COPIAR TEXTO', '', () => this.copyCurrentText());

            horarios.id = 'eh-btn-horarios';
            reserva.id = 'eh-btn-reserva';
            bilhete.id = 'eh-btn-bilhete';
            rotas.id = 'eh-btn-rotas';
            historico.id = 'eh-btn-historico';
            enviar.id = 'eh-btn-enviar';
            copiar.id = 'eh-btn-copiar';
            actions.append(horarios, reserva, bilhete, rotas, historico, enviar, copiar);

            const status = document.createElement('div');
            status.className = 'eh-status';
            const dot = document.createElement('span');
            dot.className = 'eh-dot';
            const statusText = document.createElement('span');
            statusText.textContent = 'Aguardando tela';
            status.append(dot, statusText);

            body.append(actions, status);
            panel.append(header, body);
            root.appendChild(panel);
            document.body.appendChild(root);

            this.root = root;
            this.body = body;
            this.statusText = statusText;
            this.statusDot = dot;
            this.buttons = { horarios, reserva, bilhete, rotas, historico, enviar, copiar };

            toggle.addEventListener('click', event => {
                event.stopPropagation();
                const isCollapsed = !body.hidden;
                body.hidden = isCollapsed;
                root.classList.toggle('eh-collapsed', isCollapsed);
                toggle.textContent = isCollapsed ? '▾' : '▴';
                toggle.title = isCollapsed ? 'Expandir' : 'Recolher';
                toggle.setAttribute('aria-label', toggle.title);
                EH.Storage.set('collapsed', isCollapsed);
                EH.Storage.set('minimized', isCollapsed);
                requestAnimationFrame(() => this.clampPosition(true));
            });

            this.enableDrag(header);
            window.addEventListener('resize', EH.Utils.debounce(() => this.clampPosition(), 100));
            this.clampPosition();
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

        enableDrag(handle) {
            let dragging = false;
            let offsetX = 0;
            let offsetY = 0;

            handle.addEventListener('pointerdown', event => {
                if (event.target.closest('button')) return;
                dragging = true;
                const rect = this.root.getBoundingClientRect();
                offsetX = event.clientX - rect.left;
                offsetY = event.clientY - rect.top;
                handle.setPointerCapture(event.pointerId);
                event.preventDefault();
            });

            handle.addEventListener('pointermove', event => {
                if (!dragging) return;
                this.root.style.left = `${event.clientX - offsetX}px`;
                this.root.style.top = `${event.clientY - offsetY}px`;
                this.clampPosition(false);
            });

            const finish = event => {
                if (!dragging) return;
                dragging = false;
                try { handle.releasePointerCapture(event.pointerId); } catch (error) {}
                this.clampPosition(true);
            };

            handle.addEventListener('pointerup', finish);
            handle.addEventListener('pointercancel', finish);
        },

        clampPosition(save = true) {
            if (!this.root) return;
            const rect = this.root.getBoundingClientRect();
            const maxX = Math.max(8, window.innerWidth - rect.width - 8);
            const maxY = Math.max(8, window.innerHeight - rect.height - 8);
            const x = Math.min(maxX, Math.max(8, Number.parseFloat(this.root.style.left) || 8));
            const y = Math.min(maxY, Math.max(8, Number.parseFloat(this.root.style.top) || 8));
            this.root.style.left = `${x}px`;
            this.root.style.top = `${y}px`;
            if (save) EH.Storage.set('panelPosition', { x, y });
        },

        updateState(page) {
            if (!this.root) return;
            const isPesquisa = page === 'pesquisa';
            const isReserva = page === 'reserva';
            const isPassagens = page === 'passagens';

            this.buttons.horarios.disabled = !isPesquisa || this.busy;
            this.buttons.reserva.disabled = !isReserva || this.busy;
            this.buttons.bilhete.disabled = !isPassagens || this.busy;
            this.buttons.rotas.disabled = this.busy;
            const hasHistory = EH.History.list().length > 0;
            this.buttons.historico.disabled = !hasHistory || this.busy;
            this.buttons.enviar.disabled = !hasHistory || this.busy;
            this.buttons.copiar.disabled = (!isPesquisa && !isReserva) || this.busy;

            this.statusDot.classList.toggle('active', isPesquisa || isReserva || isPassagens);
            this.statusText.textContent = isPesquisa
                ? 'Tela de horários'
                : isReserva
                    ? 'Mapa de poltronas'
                    : isPassagens
                        ? 'Pesquisa de passagens'
                        : 'Aguardando pesquisa';
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

        async copyCurrentText() {
            const page = EH.Pages.detect();
            if (page === 'desconhecida') {
                EH.Toast.warning('Abra a pesquisa de horários ou o mapa de poltronas.');
                return;
            }

            try {
                this.setBusy(true, 'Copiando texto…');
                const data = this.getCurrentData(page);
                const text = EH.Parser.formatForWhatsApp(data, page);
                await EH.Clipboard.copyText(text);
                EH.Toast.success('Texto copiado para o WhatsApp.');
            } catch (error) {
                EH.Logger.error(error);
                EH.Toast.error(error.message || 'Não foi possível copiar o texto.');
            } finally {
                this.setBusy(false);
            }
        },

        async captureTicketCard(card) {
            let prepared;
            try {
                this.setBusy(true, 'Capturando passagem…');
                prepared = EH.Tickets.prepareCapture(card);
                EH.Tickets.clearSelection();

                const canvasPromise = EH.Capture.renderTicket(prepared);
                const blobPromise = canvasPromise.then(canvas => EH.Clipboard.canvasToBlob(canvas));
                const autoCopyPromise = EH.Clipboard.tryAutoCopyImage(blobPromise);
                const [canvas, autoCopy] = await Promise.all([canvasPromise, autoCopyPromise]);
                const blob = await blobPromise;
                const dataUrl = canvas.toDataURL('image/png', 1);
                const message = EH.Messages.get('bilhete');
                const ticketNumber = prepared.data?.tickets?.[0]?.number || prepared.data?.summary?.ticket || '';
                const summary = `Bilhete${ticketNumber ? ` ${ticketNumber}` : ''}${prepared.data?.status ? ` • ${prepared.data.status}` : ''}`;
                const history = EH.History.add({
                    type: 'bilhete', dataUrl, message, text: prepared.text, filename: prepared.filename, summary
                });

                this.showPreview({
                    blob,
                    dataUrl,
                    text: prepared.text,
                    message,
                    filename: prepared.filename,
                    captureType: 'bilhete',
                    historyId: history?.id || '',
                    copied: autoCopy.copied,
                    reason: autoCopy.reason || ''
                });

                if (autoCopy.copied) {
                    EH.Toast.success('Passagem copiada. Cole no WhatsApp com Ctrl + V.');
                } else {
                    EH.Toast.warning(window.isSecureContext ? 'Passagem capturada. Use “Copiar imagem” na prévia.' : 'Passagem capturada. Use “Abrir imagem para copiar” na prévia.', 5200);
                }
            } catch (error) {
                if (prepared?.shell) EH.Capture.destroyShell(prepared.shell);
                EH.Logger.error('Falha na captura da passagem:', error);
                EH.Toast.error(error.message || 'Não foi possível capturar a passagem.', 5200);
            } finally {
                this.setBusy(false);
            }
        },

        async captureAction(expectedPage) {
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
                const text = EH.Parser.formatForWhatsApp(data, page);

                if (page === 'pesquisa' && !data.horarios.length) {
                    throw new Error('Nenhum horário foi encontrado na tabela.');
                }

                const capture = EH.Capture.start(page, data);
                const blobPromise = capture.canvasPromise.then(canvas => EH.Clipboard.canvasToBlob(canvas));
                const autoCopyPromise = EH.Clipboard.tryAutoCopyImage(blobPromise);

                const [canvas, autoCopy] = await Promise.all([
                    capture.canvasPromise,
                    autoCopyPromise
                ]);
                const blob = await blobPromise;
                const dataUrl = canvas.toDataURL('image/png', 1);
                const message = EH.Messages.get(page);
                const summary = page === 'pesquisa'
                    ? `Horários • ${[data.origem, data.destino].filter(Boolean).join(' → ')}${data.data ? ` • ${data.data}` : ''}`
                    : `Reserva • ${data.origemDestino || 'Mapa de poltronas'}${data.horaSaida ? ` • ${data.horaSaida}` : ''}`;
                const history = EH.History.add({
                    type: page, dataUrl, message, text, filename: capture.prepared.filename, summary
                });

                this.showPreview({
                    blob,
                    dataUrl,
                    text,
                    message,
                    filename: capture.prepared.filename,
                    captureType: page,
                    historyId: history?.id || '',
                    copied: autoCopy.copied,
                    reason: autoCopy.reason || ''
                });

                if (autoCopy.copied) {
                    EH.Toast.success('Imagem copiada. Agora cole no WhatsApp com Ctrl + V.');
                } else if (!window.isSecureContext) {
                    EH.Toast.warning('Imagem criada. Em HTTP, use “Abrir imagem para copiar” na prévia.', 5200);
                } else {
                    EH.Toast.warning('Imagem criada. Clique em “Copiar imagem” na prévia.', 4600);
                }
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
                            await EH.Routes.apply(route);
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
                        reason: window.isSecureContext ? '' : 'O E-Pass está em HTTP; para copiar a imagem, use “Abrir imagem para copiar”.'
                    });
                });
                const send = document.createElement('button');
                send.type = 'button';
                send.className = 'eh-mini-btn';
                send.textContent = 'Enviar';
                send.addEventListener('click', () => {
                    close();
                    this.showSend(meta.id);
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
            clipboardInfo.textContent = window.isSecureContext
                ? 'Ao abrir o WhatsApp, o script tentará deixar a imagem copiada para você colar com Ctrl + V.'
                : 'O E-Pass está em HTTP. Por segurança do navegador, um script não consegue colocar um PNG real na área de transferência. Use “Abrir imagem para copiar” e escolha “Copiar imagem” no menu do navegador.';

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
            openWhats.textContent = '📤 Abrir WhatsApp';
            openWhats.addEventListener('click', async () => {
                let digits = phone.value.replace(/\D/g, '');
                if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
                if (digits.length < 12) {
                    EH.Toast.warning('Informe o telefone com DDD.');
                    phone.focus();
                    return;
                }
                const target = window.open('about:blank', '_blank');
                if (!target) {
                    EH.Toast.error('O navegador bloqueou a nova aba do WhatsApp.');
                    return;
                }
                const message = finalMessage();
                if (window.isSecureContext) {
                    try {
                        const blob = EH.Clipboard.dataUrlToBlob(entry.dataUrl);
                        await EH.Clipboard.copyImageBlob(blob);
                        EH.Toast.success('Imagem copiada. Cole no WhatsApp com Ctrl + V.');
                    } catch (error) {
                        EH.Toast.warning(error.message || 'Não foi possível copiar a imagem.', 5200);
                    }
                }
                target.location.href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
                target.focus();
            });

            const imageButton = document.createElement('button');
            imageButton.type = 'button';
            imageButton.className = 'eh-modal-btn primary';
            imageButton.textContent = window.isSecureContext ? '📋 Copiar imagem' : '🖼️ Abrir imagem para copiar';
            imageButton.addEventListener('click', async () => {
                try {
                    if (window.isSecureContext) {
                        await EH.Clipboard.copyImageBlob(EH.Clipboard.dataUrlToBlob(entry.dataUrl));
                        EH.Toast.success('Imagem copiada.');
                    } else {
                        EH.Clipboard.openImageForNativeCopy(entry.dataUrl);
                    }
                } catch (error) {
                    EH.Toast.error(error.message || 'Não foi possível preparar a imagem.', 6000);
                }
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

        showPreview({ blob, dataUrl, text, message, filename, captureType, historyId, copied, reason }) {
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
            } else if (!window.isSecureContext) {
                note.textContent = 'O E-Pass está em HTTP. Use “Abrir imagem para copiar” para obter uma cópia real da imagem pelo navegador.';
            } else {
                note.textContent = reason || 'Clique em “Copiar imagem” para tentar novamente.';
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
            copyImage.textContent = window.isSecureContext ? '📋 Copiar imagem' : '🖼️ Abrir imagem para copiar';
            copyImage.addEventListener('click', async () => {
                try {
                    if (window.isSecureContext) {
                        await EH.Clipboard.copyImageBlob(blob);
                        title.textContent = 'Imagem copiada com sucesso';
                        note.textContent = 'Cole no WhatsApp com Ctrl + V.';
                        EH.Toast.success('Imagem copiada.');
                    } else {
                        EH.Clipboard.openImageForNativeCopy(dataUrl);
                        note.textContent = 'Na nova aba, clique com o botão direito na imagem e escolha “Copiar imagem”.';
                    }
                } catch (error) {
                    EH.Toast.error(error.message || 'A cópia foi bloqueada.', 6000);
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

            const copyMessage = document.createElement('button');
            copyMessage.type = 'button';
            copyMessage.className = 'eh-modal-btn';
            copyMessage.textContent = '💬 Copiar mensagem';
            copyMessage.disabled = !automaticMessage;
            copyMessage.addEventListener('click', async () => {
                try {
                    await EH.Clipboard.copyText(automaticMessage);
                    EH.Toast.success('Mensagem copiada.');
                } catch (error) {
                    EH.Toast.error(error.message || 'Não foi possível copiar a mensagem.');
                }
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
            copyText.textContent = '📝 Copiar detalhes';
            copyText.disabled = !String(text || '').trim();
            copyText.addEventListener('click', async () => {
                try {
                    await EH.Clipboard.copyText(text);
                    EH.Toast.success('Detalhes copiados.');
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

            actions.append(copyImage, download, copyMessage, send, copyText, closeBottom);
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

            grid.append(feeField, feeFieldGoiania, feeFieldBarra, feeFieldAragarcas, feeFieldSaoLuis, scaleField, ticketWidthField);

            const checkWrap = document.createElement('label');
            checkWrap.className = 'eh-check';
            checkWrap.style.marginTop = '13px';
            const check = document.createElement('input');
            check.type = 'checkbox';
            check.checked = EH.Config.APLICAR_TAXAS_ORIGEM;
            const checkText = document.createElement('span');
            checkText.textContent = 'Adicionar automaticamente a taxa conforme a origem configurada';
            checkWrap.append(check, checkText);

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

            const help = document.createElement('div');
            help.className = 'eh-help-box';
            help.textContent = window.isSecureContext
                ? 'As configurações, a posição e o estado recolhido ficam salvos neste navegador, mesmo depois de fechá-lo. A cópia direta de imagens depende da permissão da área de transferência.'
                : 'As configurações ficam salvas neste navegador. Como o E-Pass está em HTTP, o navegador bloqueia a cópia programática de PNG real. O script usa “Abrir imagem para copiar” como alternativa segura e mantém o botão de baixar PNG.';

            content.append(grid, checkWrap, messageSection, msgHorarios, msgReserva, msgBilhete, help);

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
                EH.Config.TAXAS_ORIGEM = taxas;
                EH.Config.CAPTURE_SCALE = scale;
                EH.Config.TICKET_CAPTURE_WIDTH = ticketWidth;
                EH.Config.APLICAR_TAXAS_ORIGEM = check.checked;
                EH.Messages.setAll({
                    pesquisa: messageFields.pesquisa.value.trim(),
                    reserva: messageFields.reserva.value.trim(),
                    bilhete: messageFields.bilhete.value.trim()
                });
                EH.Storage.set('taxasOrigem', taxas);
                EH.Storage.set('taxaIpora', taxas.IPORA);
                EH.Storage.set('captureScale', scale);
                EH.Storage.set('ticketCaptureWidth', ticketWidth);
                EH.Storage.set('aplicarTaxasOrigem', check.checked);
                EH.Storage.set('aplicarTaxaIpora', check.checked);

                const savedScale = Number(EH.Storage.get('captureScale', 0));
                const savedTicketWidth = Number(EH.Storage.get('ticketCaptureWidth', 0));
                const savedTaxes = EH.Storage.get('taxasOrigem', null);
                const savedAutoTax = Boolean(EH.Storage.get('aplicarTaxasOrigem', false));
                const savedMessages = EH.Storage.get('messages', null);
                const savedCorrectly = savedTaxes && savedMessages && savedScale === scale && savedTicketWidth === ticketWidth && savedAutoTax === check.checked;

                if (!savedCorrectly) {
                    EH.Toast.error('Não foi possível confirmar o salvamento. Tente novamente.');
                    return;
                }

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
            resetPosition.textContent = 'Restaurar posição';
            resetPosition.addEventListener('click', () => {
                this.root.style.left = `${EH.Config.PANEL_POSITION.x}px`;
                this.root.style.top = `${EH.Config.PANEL_POSITION.y}px`;
                this.clampPosition(true);
                EH.Toast.success('Posição restaurada.');
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
                if (page !== 'passagens' && EH.Tickets.active) EH.Tickets.clearSelection();
            }, 250);
            this.observer = new MutationObserver(update);
            this.observer.observe(document.body, { childList: true, subtree: true });
            window.addEventListener('popstate', update);
            window.addEventListener('hashchange', update);
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
            EH.Style.inject();
            EH.Toast.init();
            EH.UI.init();
            EH.Observer.start();
            EH.Pages.update();
            setTimeout(() => EH.Routes.applyPending(), 800);
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape' && EH.Tickets.active) {
                    EH.Tickets.clearSelection();
                    EH.Toast.info('Seleção de passagem cancelada.');
                }
            });

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
