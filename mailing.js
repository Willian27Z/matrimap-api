const nodemailer = require('nodemailer');
const mailPassword = process.env.MAIL_PASSWORD;

const senderMail = "matrimap@yahoo.com";

const emailTransporter = nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    service:'yahoo',
    secure: false,
    auth: {
        user: senderMail,
        pass: mailPassword
    },
    logger: true
});


function getMailOptions(destinataire, subj, content) { // set the options and return them
  return {
    from: senderMail,
    to: destinataire,
    subject: subj,
    html: content
  };
}

module.exports = {
  sendHtmlMail: function(destinataire, subject, html) { // send an email
    emailTransporter.sendMail(getMailOptions(destinataire, subject, html), function(error, info) {
      if (error) {
        throw error;
      } else {
        console.log(info.response);
      }
    });
  }
};