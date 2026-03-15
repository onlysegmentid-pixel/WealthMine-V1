function toggleMenu() {
  const menu = document.getElementById("menu");
  if (menu) {
    menu.classList.toggle("active");
  }
}

const WM_KEYS = {
  REGISTERED_USER: "wm_registered_user",
  LOGGED_IN: "wm_logged_in",
  USER: "wm_user",
  SELECTED_MACHINE: "wm_selected_machine",
  SELECTED_PLAN: "wm_selected_plan"
};

function getCurrentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function formatMoney(amount) {
  const num = Number(amount || 0);
  return "$" + num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatCrypto(amount) {
  const num = Number(amount || 0);
  return num.toFixed(6) + " BTC";
}

function generateUserId() {
  return "WM-USER-" + Math.floor(10000 + Math.random() * 90000);
}

function generateTxnId(prefix) {
  return prefix + "-" + Date.now();
}

function getRegisteredUser() {
  const raw = localStorage.getItem(WM_KEYS.REGISTERED_USER);
  return raw ? JSON.parse(raw) : null;
}

function saveRegisteredUser(user) {
  localStorage.setItem(WM_KEYS.REGISTERED_USER, JSON.stringify(user));
}

function getLoggedInUser() {
  const raw = localStorage.getItem(WM_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

function saveAuthSession(user) {
  localStorage.setItem(WM_KEYS.LOGGED_IN, "true");
  localStorage.setItem(WM_KEYS.USER, JSON.stringify(user));
}

function isLoggedIn() {
  return localStorage.getItem(WM_KEYS.LOGGED_IN) === "true";
}

function logoutUser() {
  localStorage.removeItem(WM_KEYS.LOGGED_IN);
  localStorage.removeItem(WM_KEYS.USER);
}

function syncSessionUser() {
  const registered = getRegisteredUser();
  if (registered && isLoggedIn()) {
    saveAuthSession(registered);
  }
}

function ensureUserShape(user) {
  if (!user) return null;

  return {
    username: user.username || "Client",
    email: user.email || "",
    password: user.password || "",
    userId: user.userId || generateUserId(),
    balance: Number(user.balance || 0),
    totalDeposited: Number(user.totalDeposited || 0),
    totalWithdrawn: Number(user.totalWithdrawn || 0),
    miningProfit: Number(user.miningProfit || 0),
    totalBTCEarned: Number(user.totalBTCEarned || 0),
    activePlans: Array.isArray(user.activePlans) ? user.activePlans : [],
    machines: Array.isArray(user.machines) ? user.machines : [],
    depositHistory: Array.isArray(user.depositHistory) ? user.depositHistory : [],
    withdrawalHistory: Array.isArray(user.withdrawalHistory) ? user.withdrawalHistory : [],
    miningHistory: Array.isArray(user.miningHistory) ? user.miningHistory : [],
    createdAt: user.createdAt || new Date().toISOString()
  };
}

function initializeStoredUser() {
  const existing = getRegisteredUser();
  if (!existing) return;

  const normalized = ensureUserShape(existing);
  saveRegisteredUser(normalized);

  if (isLoggedIn()) {
    saveAuthSession(normalized);
  }
}

function updateStoredUser(updater) {
  const current = ensureUserShape(getRegisteredUser());
  if (!current) return null;

  const updated = ensureUserShape(updater({ ...current }));
  saveRegisteredUser(updated);

  if (isLoggedIn()) {
    saveAuthSession(updated);
  }

  return updated;
}

function getPortfolioValue(user) {
  const machineValue = user.machines.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const planValue = user.activePlans.reduce((sum, item) => sum + Number(item.price || 0), 0);
  return Number(user.balance || 0) + machineValue + planValue;
}

function getTodayProfit(user) {
  const machineProfit = user.machines.reduce((sum, item) => sum + Number(item.dailyProfit || 0), 0);
  const planProfit = user.activePlans.reduce((sum, item) => sum + Number(item.dailyProfit || 0), 0);
  return machineProfit + planProfit;
}

function getActivePlanCount(user) {
  return user.activePlans.length;
}

function getMachineCount(user) {
  return user.machines.length;
}

function protectPrivatePages() {
  const privatePages = [
    "dashboard.html",
    "machines.html",
    "machine-details.html",
    "shared-plans.html",
    "deposit.html",
    "withdraw.html",
    "mining-history.html",
    "my-machines.html",
    "transactions.html",
    "checkout.html",
    "support.html",
    "my-profile.html",
    "settings.html"
  ];

  const currentPage = getCurrentPage();

  if (privatePages.includes(currentPage) && !isLoggedIn()) {
    window.location.href = "login.html";
  }
}

function redirectLoggedInUsersFromAuthPages() {
  const authPages = ["login.html", "register.html"];
  const currentPage = getCurrentPage();

  if (authPages.includes(currentPage) && isLoggedIn()) {
    window.location.href = "dashboard.html";
  }
}

function attachLogoutButtons() {
  const logoutBtns = document.querySelectorAll("[data-logout]");

  logoutBtns.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      logoutUser();
      window.location.href = "index.html";
    });
  });
}

function updateUIForAuthState() {
  const loggedIn = isLoggedIn();
  const user = ensureUserShape(getLoggedInUser() || getRegisteredUser());

  const guestOnly = document.querySelectorAll("[data-guest-only]");
  const authOnly = document.querySelectorAll("[data-auth-only]");
  const usernameTargets = document.querySelectorAll("[data-username]");
  const emailTargets = document.querySelectorAll("[data-user-email]");
  const userIdTargets = document.querySelectorAll("[data-user-id]");
  const startLinks = document.querySelectorAll("[data-start-link]");
  const dashboardLinks = document.querySelectorAll("[data-dashboard-link]");

  guestOnly.forEach(function (el) {
    el.style.display = loggedIn ? "none" : "";
  });

  authOnly.forEach(function (el) {
    el.style.display = loggedIn ? "" : "none";
  });

  usernameTargets.forEach(function (el) {
    el.textContent = user?.username || "Client";
  });

  emailTargets.forEach(function (el) {
    el.textContent = user?.email || "-";
  });

  userIdTargets.forEach(function (el) {
    el.textContent = user?.userId || "-";
  });

  startLinks.forEach(function (el) {
    el.setAttribute("href", loggedIn ? "dashboard.html" : "register.html");
  });

  dashboardLinks.forEach(function (el) {
    el.setAttribute("href", loggedIn ? "dashboard.html" : "login.html");
  });
}

function enhancePublicNav() {
  const currentPage = getCurrentPage();
  if (currentPage !== "index.html") return;

  const homeClientBtn = document.getElementById("homeClientBtn");
  const homeLoginBtn = document.getElementById("homeLoginBtn");

  if (isLoggedIn()) {
    if (homeClientBtn) {
      homeClientBtn.textContent = "Client Area";
      homeClientBtn.setAttribute("href", "dashboard.html");
    }

    if (homeLoginBtn) {
      homeLoginBtn.textContent = "Dashboard";
      homeLoginBtn.setAttribute("href", "dashboard.html");
    }
  }
}

function applyPrivateNavState() {
  const currentPage = getCurrentPage();
  const privatePages = [
    "dashboard.html",
    "machines.html",
    "shared-plans.html",
    "deposit.html",
    "withdraw.html",
    "mining-history.html",
    "my-machines.html",
    "support.html",
    "my-profile.html",
    "settings.html"
  ];

  if (!privatePages.includes(currentPage)) return;

  document.querySelectorAll('[data-private-home-link]').forEach(function (el) {
    el.remove();
  });
}

function handleRegister() {
  const registerForm = document.getElementById("registerForm");
  if (!registerForm) return;

  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("regUsername")?.value.trim();
    const email = document.getElementById("regEmail")?.value.trim().toLowerCase();
    const password = document.getElementById("regPassword")?.value;
    const confirmPassword = document.getElementById("regConfirmPassword")?.value;
    const termsChecked = document.getElementById("termsCheck")?.checked;

    if (!username || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Password and confirm password do not match.");
      return;
    }

    if (!termsChecked) {
      alert("Please accept Terms & Conditions.");
      return;
    }

    const user = ensureUserShape({
      username,
      email,
      password,
      userId: generateUserId(),
      balance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      miningProfit: 0,
      totalBTCEarned: 0,
      activePlans: [],
      machines: [],
      depositHistory: [],
      withdrawalHistory: [],
      miningHistory: [],
      createdAt: new Date().toISOString()
    });

    saveRegisteredUser(user);
    saveAuthSession(user);

    alert("Account created successfully. Your new account starts with $0.00 balance.");
    window.location.href = "dashboard.html";
  });
}

function handleLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail")?.value.trim().toLowerCase();
    const password = document.getElementById("loginPassword")?.value;

    const user = ensureUserShape(getRegisteredUser());

    if (!user) {
      alert("No registered account found. Please create an account first.");
      window.location.href = "register.html";
      return;
    }

    if (user.email !== email || user.password !== password) {
      alert("Invalid email or password.");
      return;
    }

    saveAuthSession(user);
    alert("Login successful.");
    window.location.href = "dashboard.html";
  });
}

function selectMachine(name, price, hashrate, profit, buyback) {
  const selectedMachine = {
    name,
    price: Number(price),
    hashrate,
    dailyProfit: Number(profit),
    buyback: Number(buyback),
    type: "Machine",
    status: "Online",
    purchasedAt: new Date().toISOString()
  };

  localStorage.setItem(WM_KEYS.SELECTED_MACHINE, JSON.stringify(selectedMachine));

  const user = ensureUserShape(getRegisteredUser());
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (user.balance < selectedMachine.price) {
    alert("Not enough balance. Please deposit funds first.");
    window.location.href = "deposit.html";
    return;
  }

  updateStoredUser(function (currentUser) {
    currentUser.balance -= selectedMachine.price;
    currentUser.machines.push(selectedMachine);
    currentUser.miningProfit = getTodayProfit(currentUser);
    currentUser.totalBTCEarned += selectedMachine.dailyProfit / 100000;

    currentUser.miningHistory.unshift({
      date: new Date().toISOString().slice(0, 10),
      source: selectedMachine.name,
      outputType: "Machine Output",
      yield: selectedMachine.dailyProfit,
      status: "Active"
    });

    return currentUser;
  });

  alert("Machine activated successfully.");
  window.location.href = "dashboard.html";
}

function selectPlan(name, price, duration, description, profit) {
  const selectedPlan = {
    name,
    price: Number(price),
    duration,
    description,
    dailyProfit: Number(profit),
    type: "Plan",
    status: "Running",
    activatedAt: new Date().toISOString()
  };

  localStorage.setItem(WM_KEYS.SELECTED_PLAN, JSON.stringify(selectedPlan));

  const user = ensureUserShape(getRegisteredUser());
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (user.balance < selectedPlan.price) {
    alert("Not enough balance. Please deposit funds first.");
    window.location.href = "deposit.html";
    return;
  }

  updateStoredUser(function (currentUser) {
    currentUser.balance -= selectedPlan.price;
    currentUser.activePlans.push(selectedPlan);
    currentUser.miningProfit = getTodayProfit(currentUser);
    currentUser.totalBTCEarned += selectedPlan.dailyProfit / 100000;

    currentUser.miningHistory.unshift({
      date: new Date().toISOString().slice(0, 10),
      source: selectedPlan.name,
      outputType: "Contract Output",
      yield: selectedPlan.dailyProfit,
      status: "Active"
    });

    return currentUser;
  });

  alert("Plan activated successfully.");
  window.location.href = "dashboard.html";
}

function handleDepositForm() {
  const depositForm = document.getElementById("depositForm");
  if (!depositForm) return;

  depositForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const method = document.getElementById("depositMethod")?.value || "USDT (TRC20)";
    const amount = Number(document.getElementById("depositAmount")?.value || 0);
    const reference = document.getElementById("depositReference")?.value.trim();

    if (!amount || amount <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }

    updateStoredUser(function (user) {
      user.balance += amount;
      user.totalDeposited += amount;

      user.depositHistory.unshift({
        txnId: generateTxnId("DEP"),
        method,
        amount,
        date: new Date().toISOString().slice(0, 10),
        status: "Completed",
        reference: reference || "Manual Deposit"
      });

      return user;
    });

    alert("Deposit successful.");
    window.location.href = "dashboard.html";
  });
}

function handleWithdrawForm() {
  const withdrawForm = document.getElementById("withdrawForm");
  if (!withdrawForm) return;

  withdrawForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const method = document.getElementById("withdrawMethod")?.value || "USDT (TRC20)";
    const amount = Number(document.getElementById("withdrawAmount")?.value || 0);
    const wallet = document.getElementById("withdrawWallet")?.value.trim();
    const pin = document.getElementById("withdrawPin")?.value.trim();

    if (!amount || amount <= 0) {
      alert("Please enter a valid withdrawal amount.");
      return;
    }

    if (!wallet) {
      alert("Please enter destination wallet / bank details.");
      return;
    }

    if (!pin) {
      alert("Please enter your security pin.");
      return;
    }

    const user = ensureUserShape(getRegisteredUser());

    if (amount > user.balance) {
      alert("Insufficient available balance.");
      return;
    }

    updateStoredUser(function (currentUser) {
      currentUser.balance -= amount;
      currentUser.totalWithdrawn += amount;

      currentUser.withdrawalHistory.unshift({
        txnId: generateTxnId("WDR"),
        method,
        amount,
        date: new Date().toISOString().slice(0, 10),
        status: "Completed",
        wallet
      });

      return currentUser;
    });

    alert("Withdrawal submitted successfully.");
    window.location.href = "dashboard.html";
  });
}

function fillDashboard() {
  const currentPage = getCurrentPage();
  if (currentPage !== "dashboard.html") return;

  const user = ensureUserShape(getRegisteredUser());
  if (!user) return;

  const portfolioValue = getPortfolioValue(user);
  const todayProfit = getTodayProfit(user);

  const portfolioEl = document.getElementById("totalPortfolio");
  const balanceEl = document.getElementById("availableBalance");
  const profitEl = document.getElementById("profit24h");
  const btcEl = document.getElementById("totalBTCEarned");
  const machineCountEl = document.getElementById("machineCount");
  const historyCountEl = document.getElementById("historyCount");
  const planCountEl = document.getElementById("planCount");
  const summaryMachinesEl = document.getElementById("summaryMachines");
  const summaryPlansEl = document.getElementById("summaryPlans");
  const activeAssetsTable = document.getElementById("activeAssetsTable");
  const usernameEl = document.getElementById("dashboardUsername");

  if (portfolioEl) portfolioEl.textContent = formatMoney(portfolioValue);
  if (balanceEl) balanceEl.textContent = formatMoney(user.balance);
  if (profitEl) profitEl.textContent = formatMoney(todayProfit);
  if (btcEl) btcEl.textContent = formatCrypto(user.totalBTCEarned);
  if (machineCountEl) machineCountEl.textContent = String(getMachineCount(user)).padStart(2, "0");
  if (historyCountEl) historyCountEl.textContent = String(user.miningHistory.length).padStart(2, "0");
  if (planCountEl) planCountEl.textContent = String(getActivePlanCount(user)).padStart(2, "0");
  if (summaryMachinesEl) summaryMachinesEl.textContent = getMachineCount(user);
  if (summaryPlansEl) summaryPlansEl.textContent = getActivePlanCount(user);
  if (usernameEl) usernameEl.textContent = user.username;

  if (activeAssetsTable) {
    const assets = [
      ...user.machines.map(function (item) {
        return {
          asset: item.name,
          type: "Machine",
          performance: item.hashrate,
          profit: item.dailyProfit,
          status: item.status || "Online"
        };
      }),
      ...user.activePlans.map(function (item) {
        return {
          asset: item.name,
          type: "Shared Plan",
          performance: item.duration || "Capital Based",
          profit: item.dailyProfit,
          status: item.status || "Running"
        };
      })
    ];

    if (assets.length === 0) {
      activeAssetsTable.innerHTML = `
        <tr>
          <td colspan="5" class="text-muted center">No active machine or plan yet. Deposit first, then activate a machine or plan.</td>
        </tr>
      `;
    } else {
      activeAssetsTable.innerHTML = assets.map(function (item) {
        const statusClass =
          item.status.toLowerCase() === "online" || item.status.toLowerCase() === "running"
            ? "status-online"
            : "status-maintenance";

        return `
          <tr>
            <td>${item.asset}</td>
            <td>${item.type}</td>
            <td>${item.performance}</td>
            <td>${formatMoney(item.profit)}</td>
            <td class="${statusClass}">${item.status}</td>
          </tr>
        `;
      }).join("");
    }
  }

  renderProfitChart(todayProfit);
}

function renderProfitChart(todayProfit) {
  const chartEl = document.getElementById("profitChart");
  if (!chartEl || typeof Chart === "undefined") return;

  const base = Number(todayProfit || 0);

  new Chart(chartEl, {
    type: "line",
    data: {
      labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Today"],
      datasets: [{
        label: "Mining Profit ($)",
        data: [
          Math.max(0, base * 0.2),
          Math.max(0, base * 0.35),
          Math.max(0, base * 0.45),
          Math.max(0, base * 0.6),
          Math.max(0, base * 0.75),
          Math.max(0, base * 0.88),
          Math.max(0, base)
        ],
        borderColor: "#f7931a",
        backgroundColor: "rgba(247,147,26,0.18)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 5,
        pointBackgroundColor: "#f7931a"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "#dce8f8"
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#a8b6c9"
          },
          grid: {
            color: "rgba(255,255,255,.05)"
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#a8b6c9"
          },
          grid: {
            color: "rgba(255,255,255,.05)"
          }
        }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initializeStoredUser();
  syncSessionUser();
  protectPrivatePages();
  redirectLoggedInUsersFromAuthPages();
  handleRegister();
  handleLogin();
  handleDepositForm();
  handleWithdrawForm();
  attachLogoutButtons();
  updateUIForAuthState();
  enhancePublicNav();
  applyPrivateNavState();
  fillDashboard();
});