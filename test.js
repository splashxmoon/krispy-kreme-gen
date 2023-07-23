const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
const { createObjectCsvWriter } = require('csv-writer');


const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

  puppeteer.use(
    RecaptchaPlugin({
      provider: {
        id: "2captcha",
        token: "6940ee9684a330e77492cb957a08643d", // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
      },
      visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
    })
  );

  


const name1 = 'input[id="ctl00_plcMain_txtFirstName"]';
const name2 = 'input[id="ctl00_plcMain_txtLastName"]';
const password1 = 'input[id="ctl00_plcMain_txtPassword"]';
const password2 = 'input[id="ctl00_plcMain_confirmPasswordTxt"]';

const email1 = 'input[id="ctl00_plcMain_txtEmail"]';
const zip1 = 'input[id="ctl00_plcMain_txtZipCode"]';

const phone1 = 'input[id="ctl00_plcMain_ucPhoneNumber_txt1st"]';
const phone2 = 'input[id="ctl00_plcMain_ucPhoneNumber_txt2nd"]';
const phone3 = 'input[id="ctl00_plcMain_ucPhoneNumber_txt3rd"]';
const signUp = 'input[id="btnSubmit"]';

const currentDate = new Date();
const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
const currentDay = currentDate.getDate().toString().padStart(2, '0');


async function sendWebhook(barcodeUrl, email, password) {
  const webhookUrl = 'https://discord.com/api/webhooks/1117641100895715459/9Eyd_CwlFb7nAnUSxmJQ3uwjjIFKoqDsxedUCKYtygIQLuDAYqK1bv82oJlaoF_cFSKO';

  try {
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = currentDate.getDate().toString().padStart(2, '0');

    const embed = {
      title: 'Krispy Kreme Account Info',
      description: 'New account has been created.',
      color: 5763719,
      fields: [
        {
          name: 'Email',
          value: `||${email}||`,
          inline: true,
        },
        {
          name: 'Password',
          value: `||${password}||`,
          inline: true,
        },
        {
          name: 'Date',
          value: `${currentMonth}/${currentDay}/23`,
          inline: true,
        },
      ],
      image: {
        url: `${barcodeUrl}`,
      },
    };

    const formData = new FormData();

    formData.append('payload_json', JSON.stringify({ embeds: [embed] }));
  

    const response = await axios.post(webhookUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('Webhook sent successfully');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}
async function saveBarcodeLink(barcodeUrl) {
  const csvPath = path.join(desktopPath, 'krispyaccountlogin.csv');

  const records = [{ email, password, barcodeUrl }];

  const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: 'email', title: 'Email' },
      { id: 'password', title: 'Password' },
      { id: 'barcodeUrl', title: 'Barcode URL' },
    ],
    append: true,
  });

  try {
    await csvWriter.writeRecords(records);
    console.log(`Barcode link saved to CSV file: ${csvPath}`);
  } catch (error) {
    console.error('Error saving barcode link to CSV:', error);
  }
}



async function start() {
  console.log('Script is running');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    userDataDir: "C:/Users/Arun Dass/AppData/Local/Google/Chrome/User Data/Default",
    args: [
      '--verbose',
    ],
  });

  
  const page = await browser.newPage();



  await page.setViewport({
    width: 1020,
    height: 850,
    isMobile: false,
  });

 

  await page.goto('https://www.krispykreme.com/account/create-account', { timeout: 0 });

  try {
    await page.type(name1, firstName);
    console.log('Typed first name');
    await page.type(name2, lastName);
    console.log('Typed last name');
    await page.select('#ctl00_plcMain_ddlBirthdayMM', currentMonth);
    console.log('Selected month');
    await page.select('#ctl00_plcMain_ddlBirthdayDD', currentDay);
    console.log('Selected day');
    await page.type(password1, password);
    console.log('Typed password');
    await page.type(password2, password);
    console.log('Typed password confirmation');
    await page.type(phone1, randomAreaCode);
    console.log('Typed area code');
    await page.type(phone2, randompCode);
    console.log('Typed phone number');
    await page.type(phone3, randomp2Code);
    console.log('Typed phone number part 2');
    await page.type(email1, email);
    console.log('Typed email');
    await page.type(zip1, randomZipCode);
    console.log('Typed ZIP code');

    await page.click('#ctl00_plcMain_cbTermsOfUse');
    console.log('Clicked terms of use checkbox');

    await page.solveRecaptchas();
    console.log('Solved reCAPTCHA');
    
    await Promise.all([
      page.waitForNavigation({ timeout: 0 }),
      page.click('#main > section > div.kk-form > div.form-actions'),
    ]);
    console.log('Clicked sign up button');

    await page.goto('https://www.krispykreme.com/account/my-card');
    console.log('Navigated to account page');

    const numberFromImgSrc = await page.evaluate(() => {
      const imgElement = document.querySelector('#ctl00_plcMain_imgBarcode');
      const imgSrc = imgElement.getAttribute('src');
      const number = imgSrc.match(/cardNumber=(\d+)/i)[1];
      return number;
    });

    const barcodeUrl = `https://www.krispykreme.com/services/barcode.ashx?cardNumber=${numberFromImgSrc}`;
    console.log('Barcode URL:', barcodeUrl);

    await sendWebhook(barcodeUrl, email, password);
    await saveBarcodeLink(barcodeUrl);

    console.log('Sent webhook');
  } catch (error) {
    console.error('Error:', error);
  }

  await browser.close();
}

function generateRandomFirstName() {
  const firstNames = ['John', 'Michael', 'James', 'Bob', 'Brady', 'Dylan', 'Hunter', 'Joe', 'Alex', 'Travis', 'Billy'];
  const randomIndex = Math.floor(Math.random() * firstNames.length);
  return firstNames[randomIndex];
}

function generateRandomLastName() {
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Thomas', 'Williams', 'Miller'];
  const randomIndex = Math.floor(Math.random() * lastNames.length);
  return lastNames[randomIndex];
}

const firstName = generateRandomFirstName();
const lastName = generateRandomLastName();
console.log(`Random Name: ${firstName} ${lastName}`);

function generateRandomPassword() {
  const length = 7;
  const numbers = '0123456789';
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let password = '';
  const randomNumber = Math.floor(Math.random() * 10);
  password += numbers[randomNumber];

  for (let i = 1; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }

  return password;
}

const password = generateRandomPassword();
console.log(`Random Password: ${password}`);

function generateRandomAreaCode() {
  const minAreaCode = 200;
  const maxAreaCode = 999;
  const randomAreaCode = Math.floor(Math.random() * (maxAreaCode - minAreaCode + 1)) + minAreaCode;
  return randomAreaCode.toString();
}

const randomAreaCode = generateRandomAreaCode();
console.log(`Random Area Code: ${randomAreaCode}`);

function emailgen(length) {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

const randomString = emailgen(8);
const email = randomString + '@pkcooks.com';
console.log(email);

function generateRandomZipCode() {
  const minZipCode = 10000;
  const maxZipCode = 99999;
  const randomZipCode = Math.floor(Math.random() * (maxZipCode - minZipCode + 1)) + minZipCode;
  return randomZipCode.toString();
}

const randomZipCode = generateRandomZipCode();
console.log(`Random ZIP Code: ${randomZipCode}`);

function generateRandomPCode() {
  const minPCode = 200;
  const maxPCode = 999;
  const randompCode = Math.floor(Math.random() * (maxPCode - minPCode + 1)) + minPCode;
  return randompCode.toString();
}

const randompCode = generateRandomPCode();
console.log(`Area Code: ${randompCode}`);

function generateRandomP2Code() {
  const minP2Code = 2000;
  const maxP2Code = 9999;
  const randomp2Code = Math.floor(Math.random() * (maxP2Code - minP2Code + 1)) + minP2Code;
  return randomp2Code.toString();
}

const randomp2Code = generateRandomP2Code();
console.log(`Phone number part 1: ${randomp2Code}`);

const desktopPath = path.join(require('os').homedir(), 'Desktop');
const filePath = path.join(desktopPath, 'krispyaccountlogin.txt');


const content = `Email: ${email}\nPassword: ${password}`;

fs.writeFile(filePath, content, 'utf8', (err) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log(`Account login added: ${filePath}`);
});



module.exports = start;

start();



