const searchBarLogo = document.querySelector('#searchBar i');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const allSearchResults = document.querySelectorAll('.search-result');

const openURL = (url) => {
  window.location.href = url;
};

searchBarLogo.addEventListener('click', () => {
  searchInput.select();
});

searchInput.addEventListener('input', async (e) => {
  try {
    if (e.target.value) {
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
          node.innerHTML = `
            <div class="profileImagePlace">
                <img src="${
                account.profileImg === 'none'
                  ? '/images/profilePlaceholder.svg'
                  : account.profileImg
              }" alt="Profile Image" />
            </div>
            <div class="right-side">
                <span class="username">${prefixHTML} ${account.username}</span>
                <span class="name">${account.name}</span>
            </div>
              `;
          searchResults.insertBefore(node, searchResults.childNodes[0]);
        });
      }
    } else {
      searchResults.innerHTML = '';
    }
  } catch (err) {
    console.error(err);
  }
});
