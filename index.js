const nodemailer = require("nodemailer");
require("dotenv").config();
const __DEBUG__ = process.env.DEBUG === "true";

let persons = [{ name: "foo", email: "bar", id: "1", isSantaTo: null, hasASanta: false }];
persons.length = 0; /// well just to get some typings in VS Code :P
let requiredPersons = [];

const getSingleRandomId = () =>
  Math.random()
    .toString(36)
    .substr(2);

const generateRandomId = () => {
  return getSingleRandomId() + getSingleRandomId() + getSingleRandomId();
};

const createPerson = (name, email) => ({
  name,
  email,
  id: generateRandomId(),
  isSantaTo: null,
  hasASanta: false,
});

try {
  requiredPersons = require("./persons.json");
} catch (err) {
  requiredPersons = require("./persons.example.json");
}

requiredPersons.forEach(person => {
  const pInfo = person.split(",");
  persons.push(createPerson(pInfo[0], pInfo[1]));
});

const personsWithoutASantaExists = () => {
  return persons.some(person => person.hasASanta === false);
};

const randomPerson = () => persons[Math.floor(Math.random() * persons.length)];

while (personsWithoutASantaExists()) {
  const persons = {
    santa: randomPerson(),
    child: randomPerson(),
  };
  while (persons.santa.id === persons.child.id) {
    persons.child = randomPerson();
  }

  if (persons.santa.isSantaTo === null && persons.child.hasASanta === false) {
    persons.santa.isSantaTo = persons.child.id;
    persons.child.hasASanta = true;
  }
}

const sendMail = santa => {
  const santaTo = persons.filter(child => {
    return child.id === santa.isSantaTo;
  })[0];

  let transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const message = {
    from: process.env.EMAIL_FROM,
    to: santa.email,
    subject: process.env.EMAIL_SUBJECT.replace("*YEAR*", new Date().getFullYear()),
    text: process.env.EMAIL_MSG.replace("*FROM_NAME*", santa.name),
  };

  if (__DEBUG__) {
    console.log(message);
  } else {
    transport.sendMail(message, function(err, info) {
      if (err) {
        console.log(err);
        console.log(message);
      } else {
        console.log(`Successfully sent and email to ${santa.email}`);
      }
    });
  }
};

const delay = amount => {
  return new Promise(resolve => {
    setTimeout(resolve, amount);
  });
};

async function loop() {
  for (let i = 0; i < persons.length; i++) {
    sendMail(persons[i]);
    await delay(5000);
  }
}
loop();
