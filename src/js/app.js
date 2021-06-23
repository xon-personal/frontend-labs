require('../scss/style.scss');
require('../css/app.css');

const {
  toFormatList, sortBy, findOne, validatePerson,
} = require('./data_helpers');

let teachCount = 10;
let reqParams = `results=${teachCount}`;

function createTopTeacherEntry(name, isFav, country, imURL, id, addStar = true) {
  let filling = '';
  if (!imURL) {
    const fullnameArray = name.split(' ');
    filling = `<p>${fullnameArray[0][0]}. ${fullnameArray[1] ? fullnameArray[1][0] : ''}.</p>`;
  } else {
    filling = `<img src="${imURL}" alt="Teacher pic" class="teach-pic"></img>`;
  }

  let star = '';
  if (addStar) {
    star = `<img class="star" src="./images/${isFav ? 'star.png' : 'star1.png'}" alt="favorite teacher">`;
  }

  const li = `
            <li class="teach-elem" data-id="${id}">
              ${star}
              <div class="comp-card">
                  ${filling}
              </div>
              <a href="#popup-teach-info" onclick="blur_background()" class="name-link">
                  <p class="top-name-big">${name}</p>
              </a>
              <p>${country}</p>
            </li>`;
  return li;
}

function fillPopup(teach) {
  if (!teach) {
    return;
  }
  const email = teach.email ? teach.email : '';
  const phone = teach.phone ? teach.phone : '';
  const popupTeach = document.getElementById('popup-teach-info');
  popupTeach.getElementsByClassName('card')[0].dataset.bgcolor = teach.bg_color;
  popupTeach.getElementsByTagName('img')[0].src = teach.picture_large ? teach.picture_large : './images/special-teacher.jpg';
  popupTeach.getElementsByClassName('personal-info')[0].innerHTML = `
    <div class="name-star">
      <p>${teach.full_name}</p>
      <img src="./images/${teach.favorite ? 'star.png' : 'star1.png'}" alt="favorite" class="star">
    </div>
    <p>${teach.city}, ${teach.country}</p>
    <p>${teach.age}, ${teach.gender[0].toUpperCase()}</p>
    <a href="mailto:${email}"><p>${email}</p></a>
    <a href="tel:${phone}"><p>${phone}</p></a>
  `;
  const otherInfo = popupTeach.getElementsByClassName('other-info')[0];
  otherInfo.getElementsByTagName('p')[0].innerText = teach.note ? teach.note : 'No comments';
}

function loadTopTeachers(teachers) {
  let html = '';
  teachers.forEach((teach) => {
    const li = createTopTeacherEntry(teach.full_name,
      teach.favorite,
      teach.country,
      teach.picture_large,
      teach.id);
    html += li;
  });

  const topList = document.getElementById('top-list');
  topList.innerHTML = html;
  return topList;
}

function applyFilters(teachers) {
  let filteredTeachers = teachers;
  if (document.getElementById('photo-filter').checked) {
    filteredTeachers = filteredTeachers.filter((p) => p.picture_large != null);
  }

  if (document.getElementById('fav-filter').checked) {
    filteredTeachers = filteredTeachers.filter((p) => p.favorite === true);
  }

  const country = document.getElementById('country-filter').selectedOptions[0].text;
  if (country !== 'All') {
    filteredTeachers = filteredTeachers.filter((p) => p.country === country);
  }

  if (document.getElementById('age-check-filter').checked) {
    filteredTeachers = filteredTeachers.filter((p) => p.age === parseInt(document.getElementById('age-filter').value, 10));
  }

  return filteredTeachers;
}

function fillStatTable(teachers) {
  const tableBody = document.getElementById('stat-table-body');
  tableBody.innerHTML = '';
  teachers.forEach((teach) => {
    const entry = document.createElement('tr');
    let child = {};
    ['full_name', 'age', 'gender', 'country'].forEach((key) => {
      child = document.createElement('td');
      child.innerText = teach[key];
      entry.appendChild(child);
    });
    tableBody.appendChild(entry);
  });
}

async function render() {
  try {
    const res = await fetch(`https://randomuser.me/api/?seed=oleg&${reqParams}`);
    const teachers = (await res.json()).results;
    const formatted = toFormatList(teachers);

    const teachersFiltered = applyFilters(formatted);
    const topList = loadTopTeachers(teachersFiltered);

    const favs = document.getElementById('fav-carousel');
    favs.innerHTML = '';

    const updateFavorites = function f() {
      favs.innerHTML = '';
      teachersFiltered.filter((teach) => teach.favorite).slice(0, 5).forEach(
        (fav) => {
          const li = document.createElement('li');
          li.innerHTML = createTopTeacherEntry(fav.full_name,
            fav.favorite,
            fav.country,
            fav.picture_large,
            fav.id,
            false);
          favs.appendChild(li);
        },
      );
    };
    if (topList.getAttribute('listener') !== 'true') {
      topList.addEventListener('click', (e) => {
        topList.setAttribute('listener', 'true');
        if (e.originalTarget.className === 'top-name-big') {
          fillPopup(
            formatted.find((p) => p.id === e.target.parentElement.parentElement.dataset.id),
          );
        }

        if (e.originalTarget.className === 'star' && e.target) {
          const person = formatted.find((p) => p.id === e.target.parentElement.dataset.id);
          if (person) {
            person.favorite = !person.favorite;
            e.originalTarget.src = `./images/${person.favorite ? 'star.png' : 'star1.png'}`;
            updateFavorites();
          }
        }
      });
    }

    if (document.getElementById('searchbar').getAttribute('listener') !== 'true') {
      document.getElementById('searchbar').addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('searchbar').setAttribute('listener', 'true');
        const searchData = e.target[0].value.split(':');
        let chosenOne;
        if (searchData[0] === 'note') {
          chosenOne = formatted
            .find((person) => person.note && person.note.includes(searchData[1]));
        } else {
          chosenOne = findOne(formatted, searchData[0], searchData[1]);
        }

        if (chosenOne) {
          fillPopup(chosenOne);
          window.location.replace('/#popup-teach-info');
        } else {
          window.alert('No teachers');
        }
      });
    }

    if (document.getElementById('nextBtn').getAttribute('listener') !== 'true') {
      document.getElementById('nextBtn').addEventListener('click', () => {
        document.getElementById('nextBtn').setAttribute('listener', 'true');
        teachCount += 10;
        reqParams = `results=${teachCount}`;
        render();
      });
    }

    if (document.getElementById('filters').getAttribute('listener') !== 'true') {
      document.getElementById('filters').addEventListener('change', () => {
        document.getElementById('filters').setAttribute('listener', 'true');
        reqParams = `results=${teachCount}`;
        if (document.getElementById('gender-check-filter').checked) {
          reqParams += `&gender=${document.getElementById('gender-filter').value}`;
        }
        render();
      });
    }
    if (document.getElementById('stat').getAttribute('listener') !== 'true') {
      document.getElementById('stat').addEventListener('click', (e) => {
        document.getElementById('stat').setAttribute('listener', 'true');
        if (e.target.nodeName === 'TH') {
          const sorted = sortBy(formatted, e.target.id.split('-')[1], 1);
          fillStatTable(sorted.slice(0, 5));
        }
      });
    }
    if (document.getElementsByClassName('fav-with-arrows')[0].getAttribute('listener') !== 'true') {
      document.getElementsByClassName('fav-with-arrows')[0]
        .addEventListener('click', (e) => {
          document.getElementsByClassName('fav-with-arrows')[0].setAttribute('listener', 'true');
          fillPopup(
            formatted.find((p) => p.id === e.originalTarget.parentElement.parentElement.dataset.id),
          );
        });
    }

    fillStatTable(formatted.slice(0, 5));
    const form = document.getElementById('teacherform');
    if (form.getAttribute('listener') !== 'true') {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('teacherform').setAttribute('listener', 'true');
        const newTeach = {
          id: Math.random().toString(36).substring(),
          favorite: false,
          course: '',
          bg_color: form.elements[8].value,
          gender: document.getElementById('teacherform').elements[6].checked ? 'Male' : 'Female',
          title: null,
          full_name: form.elements[0].value,
          city: form.elements[2].value,
          state: null,
          country: form.elements[1].selectedOptions[0].text,
          postcode: null,
          coordinates: null,
          timezone: null,
          email: form.elements[4].value,
          b_date: null,
          age: null,
          phone: form.elements[3].value,
          picture_large: null,
          picture_thumbnail: null,
          note: null,
        };
        if (validatePerson(newTeach)) {
          formatted.push(newTeach);
          loadTopTeachers(formatted);
          fetch('http://localhost:3000/teachers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTeach, null, 4),
          }).catch((err) => { console.log(err.message); });
        } else {
          alert('Bad data');
        }
      });
    }
  } catch (e) {
    console.log(`Pain: ${e.message}`);
  }
}

render();
