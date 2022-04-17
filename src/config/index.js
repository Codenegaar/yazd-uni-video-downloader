require('dotenv').config();

module.exports = {
  crawling: {
    loginPageUrl: process.env.LOGIN_PAGE_URL || 'https://el.yazd.ac.ir/sso/',
    
    captchaSelector: process.env.CAPTCHA_SELECTOR || '#captcha_img',
    captchaSavePath: process.env.CAPTCHA_SAVE_PATH || 'captcha.png',

    usernameFieldSelector: process.env.USERNAME_FIELD_SELECTOR || '#txt_uname.un',
    passwordFieldSelector: process.env.PASSWORD_FIELD_SELECTOR || '#txt_uname.pass',
    codeFieldSelector: process.env.CODE_FIELD_SELECTOR || '#txt_vcode.vcode',
    loginSubmitSelector: process.env.LOGIN_SUBMIT_SELECTOR || '#but_submit.submit',
  },

  linkSavePath: process.env.LINK_SAVE_PATH || './links.txt',
};
