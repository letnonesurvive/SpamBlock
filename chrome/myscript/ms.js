new WOW().init();
var b = document.querySelector("#blackListButton");
b.setAttribute("disabled", "disabled");
let switchMenu = document.getElementById('fourPopup');
let strToShow = {};
var c = document.querySelector("#statsButton");
c.setAttribute("disabled", "disabled");
var current_token;//перменная для текущего токена
var message;//
//*****************************************************************************************************
function showLogOutScreen() {
	var elem = document.getElementsByTagName("button");
	document.getElementById('Main_text').innerHTML = 'Вы успешно зашли на свой аккаунт. Чтобы включить защиту нажмите на switch.';
	elem[0].style.display = 'none';
	elem[1].style.display = '';
	return;
}
//*****************************************************************************************************
function showLogInScreen() {
	var elem = document.getElementsByTagName("button");
	document.getElementById('Main_text').innerHTML = 'Данная программа предназначена для блокировки спама. Для того чтобы начать работу с расширением войдите в свой аккаунт или создайте новый.';
	elem[0].style.display = '';
	elem[1].style.display = 'none';
	return;
}
//*****************************************************************************************************
function Sample() {

	chrome.identity.getAuthToken({ interactive: false },
		function (token) {
			if (chrome.runtime.lastError) {
				showLogInScreen();
				switchMenu.style.display = "none";
			}
			else {
				current_token = token;
				if (current_token) {
					showLogOutScreen();
					switchMenu.style.display = "";
					chrome.storage.sync.get('flag1', function (result) {
						if (result.flag1 == "true") {
							document.getElementById("switch").innerText="Защита включена";
							j = document.getElementById('toggleButton').classList.toggle('active');
							b.removeAttribute("disabled");
							c.removeAttribute("disabled");
						}
					});
				}
			}
		}
	);

	document.querySelector('#signin').addEventListener('click', function () {
		chrome.identity.getAuthToken({ interactive: true }, function (token) {
			current_token = token;
			if (current_token) {
				chrome.storage.sync.set({ 'index': 0 }, function () {
					console.log("created index");
				});
				chrome.storage.sync.set({ 'spamNum': 0 }, function () {
					console.log("set spam messages number");
				});
				chrome.storage.sync.set({ 'usedMesNum': 0 }, function () {
					console.log("set messages number");
				});
				showLogOutScreen();
				switchMenu.style.display = "";
				chrome.storage.sync.set({ 'flag1': "false" }, function () { });
				if (document.getElementById('toggleButton').classList.contains("active")) {
					document.getElementById('toggleButton').classList.toggle('active');
				}
			}
			let xhr = new XMLHttpRequest();
			xhr.open("GET", "https://www.googleapis.com/gmail/v1/users/me/messages/", false);
			xhr.setRequestHeader('Authorization', 'Bearer ' + current_token);
			xhr.send();
			message = JSON.parse(xhr.responseText);//xhr.responseText хранит в виде строки данные полученные от сервера. Чтобы обрабатывать эти данные нужен метод JSON.parse., теперь можно обращаться к каждому полю json файла
		});
	});

	document.querySelector('#logout').addEventListener('click', function () {
		chrome.identity.getAuthToken({ 'interactive': false }, function (current_token) {
			chrome.storage.sync.set({ 'flag1': "false" }, function () { });
			if (!chrome.runtime.lastError) {
				document.getElementById("switch").innerText="Нажмите чтобы включить защиту";
				chrome.runtime.sendMessage("Switch off");
				switchMenu.style.display = "none";
				statsMenu.style.display = "none";
				c.setAttribute("disabled", "disabled");
				b.setAttribute("disabled", "disabled");
				chrome.identity.removeCachedAuthToken({ token: current_token }, function () { });//функция обуславливает logout из системы
				var xhr = new XMLHttpRequest();
				xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' + current_token);
				xhr.send();
			}
		});
		showLogInScreen();
	});
}
//*****************************************************************************************************
let contactMenu = document.getElementById('firstPopup'),
	contactMenuToggle = document.getElementById('contactButton'),
	contactMenuClose = document.querySelector('.close1');

contactMenuToggle.onclick = function () {
	if (contactMenu.style.display == 'block') {
		contactMenu.style.display = "none";
	}
	else {
		contactMenu.style.display = "block";
	}
};
//*****************************************************************************************************
let blackListMenu = document.getElementById('secondPopup'),
	blackListMenuToggle = document.getElementById('blackListButton'),
	blackListMenuClose = document.querySelector('.close2');

blackListMenuToggle.onclick = function () {
	if (blackListMenu.style.display == 'block') {
		blackListMenu.style.display = "none";
	}
	else {
		blackListMenu.style.display = "block";
	}
};
//*****************************************************************************************************
let statsMenu = document.getElementById('thirdPopup'),
	statsMenuToggle = document.getElementById('statsButton'),
	statsMenuClose = document.querySelector('.close3');

statsMenuToggle.onclick = function () {
	chrome.storage.sync.get("spamNum", function (data) {
		document.getElementById('stats1_text').innerHTML = 'Добавлено сообщений в спам : ' + data.spamNum;
	});
	chrome.storage.sync.get("usedMesNum", function (data) {
		document.getElementById('stats2_text').innerHTML = 'Всего сообщений обработано : ' + data.usedMesNum;
	});
	if (statsMenu.style.display == 'block') {
		statsMenu.style.display = "none";
	}
	else {
		statsMenu.style.display = "block";
	}
};
//*****************************************************************************************************
document.getElementById('toggleButton').onclick = function () {
	chrome.storage.sync.get('flag1', function (result) {
		if (result.flag1 == "false") {
			chrome.storage.sync.set({ 'flag1': "true" }, function () {});
		}
		else {
			chrome.storage.sync.set({ 'flag1': "false" }, function () {});
		}
	});
	chrome.storage.sync.get('flag1', function (result) {
		console.log(result.flag1);
	});
	this.classList.toggle('active');
	if (b.getAttribute("disabled") == "disabled") {
		document.getElementById("switch").innerText="Защита включена";
		chrome.runtime.sendMessage("Switch on");
		b.removeAttribute("disabled");
		c.removeAttribute("disabled");
	}
	else {
		document.getElementById("switch").innerText="Нажмите чтобы включить защиту";
		chrome.runtime.sendMessage("Switch off");
		statsMenu.style.display = "none";
		blackListMenu.style.display = "none";
		b.setAttribute("disabled", "disabled");
		c.setAttribute("disabled", "disabled");
	}
}
//*****************************************************************************************************
document.getElementById('addBut').onclick = function () {
	let tmp = document.getElementById('add');
	var currentUser = tmp.value;
	if (currentUser != "") {
		tmp.value = "";
		chrome.storage.sync.set({ [currentUser]: currentUser }, function () { });
		chrome.storage.sync.get(function (result) {
			console.log(result);
		});
	}
}
//*****************************************************************************************************
document.getElementById('delBut').onclick = function () {
	let tmp1 = document.getElementById('delete');
	var currentUser = tmp1.value;
	if (currentUser != "") {
		tmp1.value = "";
		chrome.storage.sync.remove([currentUser]);
		chrome.storage.sync.get(function (result) {
			console.log(result);
		});
	}
}
//*****************************************************************************************************
document.getElementById('delButAll').onclick = function () {
	let list;
	chrome.storage.sync.get(function (data) {
		list = data;
		console.log(list);
		for (i in list) {
			if (i == 'flag1' || i == 'index' || i == 'startHistoryId' || i == 'spamNum' || i == 'usedMesNum')
				continue;
			chrome.storage.sync.remove([i]);
		}
	});
}
//*****************************************************************************************************
document.getElementById('showButAll').onclick = function () {
	let list;
	let len = 0;
	let strToShow = "Список занесенных в спам :\n";
	chrome.storage.sync.get(function (data) {
		list = data;
		console.log(list);
		for (i in list) {
			if (i == 'flag1' || i == 'index' || i == 'startHistoryId' || i == 'spamNum' || i == 'usedMesNum')
				continue;
			strToShow += i;
			strToShow += "\n";
			len++;
		}
		alert(strToShow);
	});
}

chrome.runtime.onMessage.addListener(function (data) {
	if (data === "changeStats") {
		chrome.storage.sync.get("spamNum", function (data) {
			document.getElementById('stats1_text').innerHTML = 'Добавлено сообщений в спам : ' + data.spamNum;
		});
		chrome.storage.sync.get("usedMesNum", function (data) {
			document.getElementById('stats2_text').innerHTML = 'Всего сообщений обработано : ' + data.usedMesNum;
		});
	}
});

window.onload = Sample;
