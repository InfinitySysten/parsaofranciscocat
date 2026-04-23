document.addEventListener('DOMContentLoaded', () => {

    const reader = document.getElementById('reader');
    const seletorEdicao = document.getElementById('seletor-edicao');
    const titulo = document.getElementById('titulo-edicao');
    const subtitulo = document.getElementById('subtitulo-edicao');

    let edicoes = [];
    let edicaoAtual = null;

    function initMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const nav = document.getElementById('nav');
        
        if (mobileMenuBtn && nav) {
            mobileMenuBtn.addEventListener('click', function() {
                this.classList.toggle('active');
                nav.classList.toggle('active');
            });
            
            // Fecha ao clicar fora
            document.addEventListener('click', function(e) {
                if (!nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    closeMobileMenu();
                }
            });
            
            // Fecha ao redimensionar
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    closeMobileMenu();
                }
            });
        }
    }

    function closeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const nav = document.getElementById('nav');
        
        if (mobileMenuBtn && nav) {
            mobileMenuBtn.classList.remove('active');
            nav.classList.remove('active');
        }
    }

    // -----------------------------
    // CARREGA ÍNDICE DE EDIÇÕES
    // -----------------------------
    async function carregarIndex() {
        try {
            const res = await fetch('../data/jornal/index.json');
            const data = await res.json();

            edicoes = data.edicoes || [];

            if (edicoes.length === 0) {
                reader.innerHTML = "<p>Nenhuma edição disponível.</p>";
                return;
            }

            preencherSeletor();
            carregarEdicao(edicoes[0].url);

        } catch (err) {
            console.error("Erro ao carregar índice:", err);
            reader.innerHTML = "<p>Erro ao carregar edições.</p>";
        }
    }

    // -----------------------------
    // POPULA SELECTOR
    // -----------------------------
    function preencherSeletor() {
        seletorEdicao.innerHTML = edicoes.map(e => `
            <option value="${e.url}">
                ${e.titulo}
            </option>
        `).join('');

        seletorEdicao.addEventListener('change', (e) => {
            carregarEdicao(e.target.value);
        });
    }

    // -----------------------------
    // CARREGA UMA EDIÇÃO
    // -----------------------------
    async function carregarEdicao(url) {
        try {
            reader.innerHTML = "<p>Carregando edição...</p>";

            const res = await fetch(url);
            edicaoAtual = await res.json();

            titulo.textContent = edicaoAtual.titulo || "Jornal da Paróquia";
            subtitulo.textContent = `Edição ${edicaoAtual.edicao || ''}`;

            renderizarPaginas(edicaoAtual.paginas || []);

        } catch (err) {
            console.error("Erro ao carregar edição:", err);
            reader.innerHTML = "<p>Erro ao carregar edição.</p>";
        }
    }

    // -----------------------------
    // RENDERIZA PÁGINAS JPG
    // -----------------------------
    function renderizarPaginas(paginas) {
        reader.innerHTML = '';

        if (!paginas.length) {
            reader.innerHTML = "<p>Sem páginas nesta edição.</p>";
            return;
        }

        paginas.forEach((img, index) => {
            const el = document.createElement('img');

            el.src = img;
            el.loading = 'lazy';
            el.alt = `Página ${index + 1}`;

            reader.appendChild(el);
        });
    }

    // -----------------------------
    // MOBILE UX (SWIPE SIMPLES OPCIONAL)
    // -----------------------------
    let startY = 0;

    reader.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    });

    reader.addEventListener('touchend', (e) => {
        const endY = e.changedTouches[0].clientY;
        const diff = startY - endY;

        // pequeno “efeito jornal”: scroll natural já funciona,
        // mas aqui você pode evoluir depois para navegação por página se quiser
    });

    // -----------------------------
    // INIT
    // -----------------------------
    async function init() {
        await carregarIndex();
    }

    init();
    initMobileMenu();
});