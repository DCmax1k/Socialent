const searchBarLogo = document.querySelector('#searchBar i');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const allSearchResults = document.querySelectorAll('.search-result');

let savedSearchResults = [];
const lettersSearchFor = [];

const openURL = (url) => {
  window.location.href = url;
};

searchBarLogo.addEventListener('click', () => {
  searchInput.select();
});

const saveToSavedResults = (results) => {
  const tempResults = [ ...savedSearchResults, ...results ];
  savedSearchResults = Array.from(new Set(tempResults.map(a => a.username)))
  .map(username => {
    return tempResults.find(a => a.username === username)
  })
};

const renderSearchResults = (results, query) => {
  const parsedAccounts = results.map(account => {
    if (account.name) {
      if (account.name.toLowerCase().includes(query.toLowerCase()) || account.username.toLowerCase().includes(query.toLowerCase())) {
        return account;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }).filter(account => account !== null);
  parsedAccounts.sort((a, b) => {
    return b.score - a.score;
  });
  searchResults.innerHTML = '';
  parsedAccounts.forEach((account) => {
    const node = document.createElement('div');
    node.classList.add('search-result');
    node.setAttribute(
      'onclick',
      `openURL('/account/${account.username}?k=${userID}')`
    );
    let prefixHTML = ``;
    if (account.prefix.title) {
        if (account.rank === 'owner') {
          prefixHTML = `<p class="prefix owner">[${account.prefix.title}]</p>`
        } else if (account.rank === 'admin') {
          prefixHTML = `<p class="prefix admin">[${account.prefix.title}]</p>`
        } else {
          prefixHTML = `<p class="prefix">[${account.prefix.title}]</p>`;
        }
    }
    let verifiedHTML = '';
    if (account.verified) {
      verifiedHTML = `<img class="verified" height: 15px; width: 15px;" src="/images/verified.svg" alt="verifiedIcon"></img>`
    }
    node.innerHTML = `
      <div class="profileImagePlace">
          <img src="${
          account.profileImg === 'none'
            ? '/images/profilePlaceholder.svg'
            : account.profileImg
        }" alt="Profile Image" />
      </div>
      <div class="right-side">
          <span class="username">${prefixHTML} ${account.username} ${verifiedHTML}</span>
          <span class="name">${account.name}</span>
      </div>
        `;
    searchResults.appendChild(node);
  });
}

searchInput.addEventListener('input', async (e) => {
  try {
    if (e.target.value.length == 1 && !lettersSearchFor.includes(e.target.value)) {
      lettersSearchFor.push(e.target.value);
      const response = await fetch('/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: e.target.value,
          userID,
          device: window.navigator.userAgent,
        }),
      });
      const resJSON = await response.json();
      if (resJSON.status === 'wrong user') {
        window.location.href = '/login';
      } else if (resJSON.status === 'success') {
        const parsedAccounts = resJSON.searchedAccounts;
        saveToSavedResults(parsedAccounts);
        renderSearchResults(parsedAccounts, e.target.value);
      }
    } else if (e.target.value) {
      renderSearchResults(savedSearchResults, e.target.value);
    }
    else if (e.target.value.length == 0) {
      searchResults.innerHTML = '';
    }
  } catch (err) {
    console.error(err);
  }
});

