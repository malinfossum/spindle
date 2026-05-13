function register() {
	const username = model.viewState.createProfile.username.trim();
	const password = model.viewState.createProfile.password;
	const repeatPassword = model.viewState.createProfile.repeatPassword;

	if (!username || !password || !repeatPassword) {
		setAuthMessage("Fyll inn alle feltene.");
		updateView();
		return;
	}

	if (password !== repeatPassword) {
		setAuthMessage("Passordene er ikke like.");
		updateView();
		return;
	}

	const usernameExists = model.data.users.some(
		(user) => user.username.toLowerCase() === username.toLowerCase(),
	);

	if (usernameExists) {
		setAuthMessage("Brukernavnet er allerede i bruk.");
		updateView();
		return;
	}

	const newUser = {
		id: rngUserId(),
		username,
		password,
	};

	model.data.users.push(newUser);
	model.app.loggedInID = newUser.id;

	clearRegisterForm();
	clearAuthMessage();
	changePage("homePage");
}

function rngUserId() {
	const number = Math.floor(Math.random() * 999999);

	for (let i = 0; i < model.data.users.length; i++) {
		if (model.data.users[i].id === number) return rngUserId();
	}

	return number;
}
