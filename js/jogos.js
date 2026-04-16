document.addEventListener('DOMContentLoaded', () => {
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

    // =========================
    // LOGIN UI
    // =========================
    function initAuthUI() {
        const loginBtn = document.getElementById("login-btn");
        const userMenu = document.getElementById("user-menu");
        const userAvatar = document.getElementById("user-avatar");

        const modal = document.getElementById("auth-modal");
        const inputUser = document.getElementById("auth-user");
        const inputPass = document.getElementById("auth-pass");
        const submitBtn = document.getElementById("auth-submit");
        const avatarOptions = document.querySelectorAll("#avatar-select img");

        if (!loginBtn || !userMenu || !userAvatar) return;

        let selectedAvatar = null;
        let user = null;

        // abrir modal
        loginBtn.addEventListener("click", () => {
            modal.style.display = "flex";
        });

        // selecionar avatar
        avatarOptions.forEach(img => {
            img.addEventListener("click", () => {
                avatarOptions.forEach(i => i.classList.remove("selected"));
                img.classList.add("selected");
                selectedAvatar = img.src;
            });
        });

        // confirmar cadastro/login
        submitBtn.addEventListener("click", async () => {
            const username = inputUser.value.trim();
            const password = inputPass.value;

            if (!username || !password || !selectedAvatar) return;

            try {
                const res = await cadastrar(username, password);

                // erro vindo da API
                if (res.erro) {
                    alert(res.erro);
                    return;
                }

                // sucesso → salva sessão
                auth.salvar(res.token, res.username);

                user = {
                    name: res.username,
                    avatar: selectedAvatar
                };

                modal.style.display = "none";
                loginBtn.style.display = "none";
                userMenu.style.display = "flex";
                userAvatar.src = user.avatar;

            } catch (e) {
                alert("Erro ao conectar com servidor");
            }
        });

        // fechar clicando fora
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });

        // logout
        userAvatar.addEventListener("click", () => {
            user = null;
            auth.sair();

            loginBtn.style.display = "block";
            userMenu.style.display = "none";
        });

        if (auth.logado()) {
            user = {
                name: auth.username(),
                avatar: "https://i.pravatar.cc/100" // temporário (não está no backend ainda)
            };

            loginBtn.style.display = "none";
            userMenu.style.display = "flex";
            userAvatar.src = user.avatar;
        }
    }

    // INIT
    initMobileMenu();
    initAuthUI();
});