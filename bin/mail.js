const nodemailer = require('nodemailer');

async function createTransporter() {
	let testAccount = await nodemailer.createTestAccount();

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
	  host: "smtp.ethereal.email",
	  port: 587,
	  secure: false, // true for 465, false for other ports
	  auth: {
		user: testAccount.user, // generated ethereal user
		pass: testAccount.pass // generated ethereal password
	  }
	});

	return transporter;
}

async function mail(options) {
	let transporter = await createTransporter();
	let info = await transporter.sendMail(options);

	console.log("Message sent: %s", info.messageId);
	console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

function mailValidate(email, name, validateUrl, token) {
	let info = {
		from: 'Jackson <jackson@camagru.com>', // sender address
		to: email,
		subject: 'Validate Camagru Email Address',
		html: `<a href=${validateUrl}?token=${token}>Click to validate</a>`
	}
	mail(info).catch(console.error);
}

// let info = {
// 	from: 'Jackson <jackson@camagru.com>', // sender address
// 	to: "bar@example.com",
// 	subject: "Welcome!",
// 	// text: "Hello world?",
// 	html: "<b>Hello world?</b>"
// };

// mail(info).catch(console.error);

module.exports = {mail, mailValidate};