const file = document.getElementById('file');
const customBtn = document.getElementById('customBtn');
const customText = document.getElementById('customText');
const submit = document.getElementById('submit');

customBtn.addEventListener('click', () => {
  file.click();
});

file.addEventListener('change', () => {
  if (file.value) {
    customText.innerText = file.value.split('\\')[
      file.value.split('\\').length - 1
    ];
  } else {
    customText.innerText = 'No file chosen';
  }
});

submit.addEventListener('click', async () => {
  if (file.value) {
    submit.innerText = 'Uploading...';
    const fileData = file.files[0];
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
