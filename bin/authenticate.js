const crypto = require('crypto');
const base64url = require('base64url');

function signTokenString(rawToken, secret) {
	const hmac = crypto.createHmac('sha256', secret);

	hmac.update(rawToken);
	const signature = base64url.fromBase64(hmac.digest('base64'));
	return rawToken + '.' + signature
}

function signToken(dataObject, secret) {
	const header = {alg: 'HS256', typ:'JWT'};

	const tokenContent = [JSON.stringify(header), JSON.stringify(dataObject)];
	const rawToken = tokenContent.map(base64url).join('.');
	return signTokenString(rawToken, secret);
}

function verifyToken(token, secret) {
	const tokenArray = token.trim().split('.');
	return (signTokenString(tokenArray.slice(0,-1).join('.'), secret) === token);
}

function decodeToken(token) {
	const tokenArray = token.split('.').slice(0, 2);
	const rawToken = tokenArray.map(x => base64url.decode(x));
	const rawTokenArray = rawToken.map(JSON.parse);
	return {head: rawTokenArray[0],
			data: rawTokenArray[1]};
}

function generateJWT(email, expire, secret) {
	const ob = {
		'email': email,
		'expire': Date.now() + expire,
		'fn': 'auth'};
	return signToken(ob, secret);
}

function tokenIsCurrent(tokenData) {
	let now = Date.now();
	return tokenData.data.expire > now ? true : false;
}

function authJWT(secret) {
	return function (req, res, next) {
		let tokenData = undefined;
		if (req.cookies.JWT) {
			tokenData = decodeToken(req.cookies.JWT)
			// console.log(tokenData)
		}
		if (req.cookies.JWT && tokenData.data.fn === 'auth'
			&& tokenIsCurrent(tokenData)
			&& verifyToken(req.cookies.JWT, secret)) {
			req.user = tokenData.data.email;
		}
		next();
	}
}


// let token = signToken({sub:"1234567890",name:"John Doe",iat:1516239022}, 'secret');
// console.log(verifyToken(token, 'secret'));
// console.log(token)
// console.log(decodeToken(token));

module.exports = {signToken, verifyToken, decodeToken, generateJWT, authJWT}