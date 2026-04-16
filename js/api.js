const BASE = "/api";

// Salva e lê o token JWT
const auth = {
  salvar:  (token, username) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("username", username);
  },
  token:    () => sessionStorage.getItem("token"),
  username: () => sessionStorage.getItem("username"),
  logado:   () => !!sessionStorage.getItem("token"),
  sair:     () => sessionStorage.clear()
};

// Cadastro
async function cadastrar(username, password) {
  const res = await fetch(`${BASE}/cadastro`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ username, password })
  });
  return res.json();
}

// Login
async function login(username, password) {
  const res = await fetch(`${BASE}/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ username, password })
  });
  return res.json();
}

// Ranking
async function getRanking() {
  const res = await fetch(`${BASE}/ranking`);
  return res.json();
}