const file = document.getElementById('file');
const submit = document.getElementById('submit');
const dropbox = document.getElementById('dropbox');
let airFile;

// Drop box listeners
dropbox.addEventListener('click', () => {
  file.click();
});

dropbox.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropbox.classList.add('dragover');
});
dropbox.addEventListener('dragleave', (e) => {
  dropbox.classList.remove('dragover');
});

// Set air file
dropbox.addEventListener('drop', (e) => {
  e.preventDefault();
  dropbox.classList.remove('dragover');
  airFile = e.dataTransfer.files[0];
  dropbox.innerText = airFile.name;
});

file.addEventListener('change', () => {
  if (file.value) {
    airFile = file.files[0];
    dropbox.innerText = file.value.split('\\')[
      file.value.split('\\').length - 1
    ];
  } else {
    dropbox.innerText = 'Click to choose a file or drag it here.';
  }
});

submit.addEventListener('click', async () => {
  if (airFile) {
    submit.innerText = 'Uploading...';
    const fileData = airFile;
    const data = new FormData();
    data.append('file', fileData);
    data.append('upload_preset', 'thepreset');
    data.append('cloud_name', 'thecloudname');
    console.log(fileData.type.split('/')[0]);
    let uploadURL = '';
    let urlType = '';
    if (fileData.type.split('/')[0] == 'video') {
      uploadURL = 'https://api.cloudinary.com/v1_1/thecloudname/video/upload';
      urlType = 'video';
    } else if (fileData.type.split('/')[0] == 'image') {
      uploadURL = 'https://api.cloudinary.com/v1_1/thecloudname/image/upload';
      urlType = 'image';
    }
    try {
      const response = await fetch(uploadURL, {
        method: 'POST',
        body: data,
      });
      const resJSON = await response.json();
      const imgURL = resJSON.secure_url;
      const newResponse = await fetch('/create/createpost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: imgURL,
          urlType,
          description: description.value,
          userID,
        }),
      });
      const newResJSON = await newResponse.json();
      if (newResJSON.status === 'successful') {
        window.location.href = `/home?k=${userID}`;
        submit.innerText = 'Submit';
      }
    } catch (err) {
      console.error(err);
    }
  }
});
